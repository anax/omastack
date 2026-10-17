import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec, execFile } from 'child_process';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const OMASTACK_BIN = path.join(process.cwd(), 'omastack', 'bin', 'omastack');
const HOME_DIR = process.env.HOME || '/root';
const STATE_DIR = path.join(HOME_DIR, '.local', 'share', 'omastack', 'state');
const CADDYFILE_PATH = path.join(HOME_DIR, '.local', 'share', 'omastack', 'Caddyfile');
const TEMPLATES_DIR = path.join(process.cwd(), 'omastack', 'templates');

const EXEC_OPTIONS = {
  cwd: process.cwd(),
  env: process.env,
  timeout: 30_000,
  maxBuffer: 1024 * 1024,
};

// Safe argv-based execution helper
function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    execFile('bash', [OMASTACK_BIN, ...args], EXEC_OPTIONS, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
      });
    });
  });
}

// Fallback helper for internal fixed scripts
function runShell(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    exec(cmd, EXEC_OPTIONS, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
      });
    });
  });
}

// Verify on Linux that a loopback TCP connection originates from the same OS user UID
function verifyLocalSocketOwner(req: express.Request): boolean {
  if (typeof process.getuid !== 'function') return true;
  const remotePort = req.socket?.remotePort;
  if (!remotePort) return true;

  const myUid = process.getuid();
  const portHex = remotePort.toString(16).toUpperCase().padStart(4, '0');

  for (const procFile of ['/proc/net/tcp', '/proc/net/tcp6']) {
    try {
      if (!fs.existsSync(procFile)) continue;
      const lines = fs.readFileSync(procFile, 'utf-8').split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        // Format: sl local_address rem_address st tx_queue:rx_queue tr:tm->when retrnsmt uid ...
        if (parts.length >= 8 && parts[3] === '01' && parts[1].toUpperCase().endsWith(`:${portHex}`)) {
          const socketUid = parseInt(parts[7], 10);
          if (!isNaN(socketUid) && socketUid !== myUid) {
            return false;
          }
        }
      }
    } catch (_) {
      // Ignore if /proc/net/tcp is unavailable
    }
  }
  return true;
}

// Redact sensitive values from .env content so secrets are never exposed over HTTP
function redactEnvContent(raw: string): string {
  if (!raw) return '';
  const SAFE_KEY_RE = /^(?:PORT_[A-Z0-9_]+|[A-Z0-9_]+_PORT|[A-Z0-9_]+_HOST|DB_CONNECTION|MAIL_MAILER|OMASTACK_ACTIVE)$/;
  const SAFE_VAL_RE = /^(?:\d{1,5}|127\.0\.0\.1|localhost|mysql|pgsql|postgres|smtp|true|false)$/;

  return raw
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return '# [redacted line]';
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (SAFE_KEY_RE.test(key) && SAFE_VAL_RE.test(val)) {
        return `${key}=${val}`;
      }
      return `${key}=<redacted>`;
    })
    .join('\n');
}

const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', 'omastack.local']);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Global Host header validation to prevent DNS rebinding attacks
  app.use((req, res, next) => {
    const rawHost = (req.headers.host || '').trim().toLowerCase();
    if (rawHost) {
      const hostname = rawHost.startsWith('[')
        ? rawHost.slice(0, rawHost.indexOf(']') + 1)
        : rawHost.split(':')[0];
      if (!ALLOWED_HOSTS.has(hostname)) {
        return res.status(403).json({ error: 'Forbidden: Invalid Host header' });
      }
    }
    next();
  });

  let effectiveStateDir = STATE_DIR;
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
    fs.chmodSync(STATE_DIR, 0o700);
  } catch (e) {
    effectiveStateDir = path.join(process.cwd(), '.omastack', 'state');
    try {
      fs.mkdirSync(effectiveStateDir, { recursive: true, mode: 0o700 });
      fs.chmodSync(effectiveStateDir, 0o700);
    } catch (_) {}
  }

  // Generate or load owner-only API token stored with 0600 permissions
  const tokenFilePath = path.join(effectiveStateDir, 'api.token');
  const ownerApiToken = (() => {
    const envToken = process.env.OMASTACK_API_TOKEN?.trim();
    if (envToken && envToken.length >= 32) {
      return envToken;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(tokenFilePath, `${generated}\n`, { mode: 0o600 });
      fs.chmodSync(tokenFilePath, 0o600);
    } catch (_) {}
    return generated;
  })();

  const isOwnerAuthenticated = (req: express.Request): boolean => {
    if (!verifyLocalSocketOwner(req)) return false;
    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite && secFetchSite === 'cross-site') return false;

    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const headerToken = typeof req.headers['x-omastack-token'] === 'string' ? req.headers['x-omastack-token'].trim() : '';
    const providedToken = headerToken || bearerToken;
    if (!providedToken) return false;

    const providedBuf = Buffer.from(providedToken, 'utf-8');
    const expectedBuf = Buffer.from(ownerApiToken, 'utf-8');
    return providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf);
  };

  // Owner authentication middleware for sensitive & mutating endpoints
  const requireOwnerAuth: express.RequestHandler = (req, res, next) => {
    if (!verifyLocalSocketOwner(req)) {
      return res.status(403).json({ error: 'Forbidden: Connection originates from a different local OS user' });
    }

    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite && secFetchSite === 'cross-site') {
      return res.status(403).json({ error: 'Forbidden: Cross-site requests are not allowed' });
    }

    if (!isOwnerAuthenticated(req)) {
      return res.status(401).json({
        error: 'Unauthorized: Valid owner API token required (stored in ~/.local/share/omastack/state/api.token with 0600 permissions)',
      });
    }

    next();
  };

  // Serve raw install script or downloadable file
  app.get('/install.sh', (req, res) => {
    const rootPath = path.join(process.cwd(), 'install.sh');
    const subPath = path.join(process.cwd(), 'omastack', 'install.sh');
    const installPath = fs.existsSync(rootPath) ? rootPath : subPath;
    if (fs.existsSync(installPath)) {
      res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
      if (req.query.download === '1' || req.headers.accept?.includes('text/html')) {
        res.setHeader('Content-Disposition', 'attachment; filename="install.sh"');
      }
      res.send(fs.readFileSync(installPath, 'utf-8'));
    } else {
      res.status(404).send('# Installer not found');
    }
  });

  // Serve OmaStore manifest
  app.get('/omastore.toml', (req, res) => {
    const manifestPath = path.join(process.cwd(), 'omastack', 'omastore.toml');
    if (fs.existsSync(manifestPath)) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(manifestPath, 'utf-8'));
    } else {
      res.status(404).send('# Manifest not found');
    }
  });

  // Serve Omarchy Quattro manifest.json
  app.get('/manifest.json', (req, res) => {
    const rootPath = path.join(process.cwd(), 'manifest.json');
    const subPath = path.join(process.cwd(), 'omastack', 'manifest.json');
    const p = fs.existsSync(rootPath) ? rootPath : subPath;
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).json({ error: 'manifest.json not found' });
    }
  });

  // Serve Omarchy Quattro BarWidget.qml
  app.get('/BarWidget.qml', (req, res) => {
    const rootPath = path.join(process.cwd(), 'BarWidget.qml');
    const subPath = path.join(process.cwd(), 'omastack', 'BarWidget.qml');
    const p = fs.existsSync(rootPath) ? rootPath : subPath;
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).send('// BarWidget.qml not found');
    }
  });

  // Serve Omarchy Quattro Panel.qml
  app.get('/Panel.qml', (req, res) => {
    const rootPath = path.join(process.cwd(), 'Panel.qml');
    const subPath = path.join(process.cwd(), 'omastack', 'Panel.qml');
    const p = fs.existsSync(rootPath) ? rootPath : subPath;
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).send('// Panel.qml not found');
    }
  });

  // Serve repository LICENSE
  app.get('/LICENSE', (req, res) => {
    const p = path.join(process.cwd(), 'LICENSE');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).send('LICENSE not found');
    }
  });

  // Serve installable packages (.pkg.tar.zst, .run, .tar.gz)
  app.get('/api/download/pkg', (req, res) => {
    const pkgPath = path.join(process.cwd(), 'dist', 'omastack-1.0.0-1-any.pkg.tar.zst');
    if (fs.existsSync(pkgPath)) {
      res.setHeader('Content-Type', 'application/zstd');
      res.setHeader('Content-Disposition', 'attachment; filename="omastack-1.0.0-1-any.pkg.tar.zst"');
      res.sendFile(pkgPath);
    } else {
      res.status(404).json({ error: 'Package file not built yet. Run ./package.sh to build it.' });
    }
  });

  app.get('/api/download/run', (req, res) => {
    const runPath = path.join(process.cwd(), 'dist', 'omastack-installer.run');
    if (fs.existsSync(runPath)) {
      res.setHeader('Content-Type', 'application/x-executable');
      res.setHeader('Content-Disposition', 'attachment; filename="omastack-installer.run"');
      res.sendFile(runPath);
    } else {
      res.status(404).json({ error: 'Installer file not found' });
    }
  });

  app.get('/api/download/tarball', (req, res) => {
    const tarPath = path.join(process.cwd(), 'dist', 'omastack-1.0.0-linux.tar.gz');
    if (fs.existsSync(tarPath)) {
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="omastack-1.0.0-linux.tar.gz"');
      res.sendFile(tarPath);
    } else {
      res.status(404).json({ error: 'Tarball file not found' });
    }
  });

  app.get('/dist/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(process.cwd(), 'dist', safeName);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).send('File not found in dist/');
    }
  });

  // API: Get real templates dynamically parsed from omastack/templates
  app.get('/api/templates', (req, res) => {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      return res.json([]);
    }

    const items = fs.readdirSync(TEMPLATES_DIR);
    const result = items.map((templateId) => {
      const templatePath = path.join(TEMPLATES_DIR, templateId);
      const confPath = path.join(templatePath, 'stack.conf');
      const composePath = path.join(templatePath, 'docker-compose.yml');

      let conf = '';
      let compose = '';

      if (fs.existsSync(confPath)) {
        conf = fs.readFileSync(confPath, 'utf-8');
      }
      if (fs.existsSync(composePath)) {
        compose = fs.readFileSync(composePath, 'utf-8');
      }

      // Parse stack.conf for metadata
      let name = templateId;
      let description = '';
      const services: Array<{ name: string; defaultPort: number }> = [];
      const domains: Array<{ domain: string; portVar: string }> = [];

      conf.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('STACK_NAME=')) {
          name = trimmed.replace('STACK_NAME=', '').replace(/"/g, '');
        } else if (trimmed.startsWith('STACK_DESCRIPTION=')) {
          description = trimmed.replace('STACK_DESCRIPTION=', '').replace(/"/g, '');
        } else if (trimmed.startsWith('PORT_')) {
          const [key, val] = trimmed.split('=');
          const serviceName = key.replace('PORT_', '').toLowerCase();
          const port = parseInt(val, 10);
          if (!isNaN(port)) {
            services.push({ name: serviceName, defaultPort: port });
          }
        } else if (trimmed.startsWith('DOMAIN_')) {
          const [_, val] = trimmed.split('=');
          if (val) {
            const cleanVal = val.replace(/"/g, '');
            const [dom, portVar] = cleanVal.split(':');
            domains.push({ domain: dom, portVar });
          }
        }
      });

      return {
        id: templateId,
        name,
        description,
        services,
        domains,
        confContent: conf,
        composeContent: compose,
      };
    });

    res.json(result);
  });

  // API: Get REAL active stacks from state directory
  app.get('/api/stacks', (req, res) => {
    const stacks: any[] = [];
    const authed = isOwnerAuthenticated(req);
    try {
      const targetDir = fs.existsSync(STATE_DIR) ? STATE_DIR : effectiveStateDir;
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const content = fs.readFileSync(path.join(targetDir, file), 'utf-8');
              const data = JSON.parse(content);
              const templateId = file.replace('.json', '');

              // Only expose rendered compose file content to authenticated owner
              const composeFile = path.join(targetDir, `${templateId}-compose.yml`);
              const composeContent =
                authed && fs.existsSync(composeFile)
                  ? fs.readFileSync(composeFile, 'utf-8')
                  : '';

              stacks.push({
                id: templateId,
                templateId,
                name: data.name || templateId,
                status: data.status || 'running',
                startedAt: data.started_at || new Date().toISOString(),
                ramUsageMB: data.ram_mb || 180,
                ports: data.ports || {},
                composeContent,
              });
            } catch (e) {
              // Ignore corrupted json
            }
          }
        }
      }
    } catch (e) {
      // Ignore directory access errors
    }
    res.json(stacks);
  });

  // API: Launch stack with real CLI execution (Owner-authenticated)
  app.post('/api/stacks/up', requireOwnerAuth, async (req, res) => {
    const { templateId } = req.body;
    if (!templateId || typeof templateId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(templateId)) {
      return res.status(400).json({ error: 'Valid alphanumeric templateId required' });
    }

    const { stdout, stderr, code } = await runCli(['up', templateId]);
    res.json({
      success: code === 0,
      stdout,
      stderr,
      code,
    });
  });

  // API: Teardown stack with real CLI execution (Owner-authenticated, preserves volumes)
  app.post('/api/stacks/down', requireOwnerAuth, async (req, res) => {
    const { templateId } = req.body;
    if (templateId && (typeof templateId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(templateId))) {
      return res.status(400).json({ error: 'Invalid templateId format' });
    }

    const args = templateId ? ['down', templateId] : ['down', '--all'];
    const { stdout, stderr, code } = await runCli(args);
    res.json({
      success: code === 0,
      stdout,
      stderr,
      code,
    });
  });

  // API: Restart stack with real CLI execution (Owner-authenticated)
  app.post('/api/stacks/restart', requireOwnerAuth, async (req, res) => {
    const { templateId } = req.body;
    if (!templateId || typeof templateId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(templateId)) {
      return res.status(400).json({ error: 'Valid alphanumeric templateId required' });
    }

    const { stdout, stderr, code } = await runCli(['restart', templateId]);
    res.json({
      success: code === 0,
      stdout,
      stderr,
      code,
    });
  });

  // API: Init project stack configuration (Owner-authenticated)
  app.post('/api/stacks/init', requireOwnerAuth, async (req, res) => {
    const { stdout, stderr, code } = await runCli(['init']);
    res.json({
      success: code === 0,
      stdout,
      stderr,
      code,
    });
  });

  // API: Real Waybar JSON execution
  app.get('/api/waybar', async (req, res) => {
    const { stdout } = await runCli(['status', '--waybar']);
    try {
      const parsed = JSON.parse(stdout.trim());
      res.json(parsed);
    } catch {
      res.json({
        text: '⚡ 0',
        tooltip: '⚡ OmaStack: No active sandboxes',
        class: 'idle',
      });
    }
  });

  // API: OmaStack Widget Panel JSON execution
  app.get('/api/widget', async (req, res) => {
    const { stdout } = await runCli(['widget', '--json']);
    try {
      const parsed = JSON.parse(stdout.trim());
      res.json(parsed);
    } catch {
      res.json({
        active_count: 0,
        total_ram: '0MB',
        status_class: 'idle',
        active_stacks: [],
        templates: [
          'ai-rag-stack',
          'automation-hub',
          'clickhouse-analytics',
          'directus-cms',
          'django-celery',
          'golang-microservices',
          'keycloak-iam',
          'laravel-stack',
          'mern-mongo',
          'nextjs-postgres',
          'observability-lgtm',
          'rails-kamal',
          'supabase-lite',
          'web3-node',
          'wordpress-mariadb',
        ],
        shortcuts: {
          menu: 'SUPER + ALT + SPACE',
          widget_panel: 'SUPER + ALT + W',
        },
      });
    }
  });

  const ALLOWED_OMASTACK_SUBCOMMANDS = new Set([
    'up',
    'down',
    'restart',
    'init',
    'list',
    'ls',
    'status',
    'widget',
    'panel',
    'proxy',
    'logs',
    'theme',
    'update',
    'upgrade',
    'version',
    '--version',
    '-v',
  ]);
  const ALLOWED_OMARCHY_SUBCOMMANDS = new Set([
    'version',
    '--version',
    '-v',
    'list',
    'status',
    'plugin',
    'update',
    'upgrade',
  ]);

  // API: Execute real omastack CLI command from terminal (Owner-authenticated, allowlisted)
  app.post('/api/cli', requireOwnerAuth, async (req, res) => {
    const { command } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string required' });
    }

    // Prohibit shell chaining and injection metacharacters
    if (/[;&|`$><]/.test(command)) {
      return res.status(400).json({
        error: 'Shell metacharacters (;, &, |, `, $, >, <) are forbidden.',
        code: 1,
      });
    }

    const tokens = command.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return res.status(400).json({ error: 'Empty command' });
    }

    const mainBin = tokens[0];
    const subArgs = tokens.slice(1);

    // Block volume-purging and blocking-stream flags via the web API
    if (subArgs.some((arg) => arg === '--purge' || arg === '--volumes' || arg === '-f' || arg === '--follow' || (subArgs[0] === 'down' && arg === '-v'))) {
      return res.status(400).json({
        error: 'Volume deletion and blocking stream flags (--purge, --volumes, -f, --follow) are disabled over the web API.',
        code: 1,
      });
    }

    // Validate all argument tokens contain only safe characters (including safe repo URLs)
    if (subArgs.some((arg) => !/^[a-zA-Z0-9_./:@-]+$/.test(arg))) {
      return res.status(400).json({
        error: 'Invalid argument characters detected.',
        code: 1,
      });
    }

    if (mainBin === 'omastack') {
      const subCmd = subArgs[0] || 'list';
      if (!ALLOWED_OMASTACK_SUBCOMMANDS.has(subCmd)) {
        return res.status(400).json({
          error: `Subcommand '${subCmd}' is not allowed in the web CLI. Allowed: ${Array.from(ALLOWED_OMASTACK_SUBCOMMANDS).join(', ')}`,
          code: 1,
        });
      }
      const { stdout, stderr, code } = await runCli(subArgs);
      return res.json({ stdout, stderr, code });
    } else if (mainBin === 'omarchy') {
      const subCmd = subArgs[0] || 'version';
      if (!ALLOWED_OMARCHY_SUBCOMMANDS.has(subCmd)) {
        return res.status(400).json({
          error: `Subcommand '${subCmd}' is not allowed over the web CLI.`,
          code: 1,
        });
      }
      const omarchyBin = path.join(process.cwd(), 'omastack', 'bin', 'omarchy');
      const { stdout, stderr, code } = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
        execFile('bash', [omarchyBin, ...subArgs], EXEC_OPTIONS, (err, stdout, stderr) => {
          resolve({ stdout: stdout || '', stderr: stderr || '', code: err ? (typeof err.code === 'number' ? err.code : 1) : 0 });
        });
      });
      return res.json({ stdout, stderr, code });
    } else {
      return res.status(400).json({
        error: 'Only omastack and omarchy commands are allowed in CLI simulator.',
        code: 1,
      });
    }
  });

  // API: Real system open port scan
  app.get('/api/system/ports', async (req, res) => {
    const authed = isOwnerAuthenticated(req);
    const { stdout } = await runShell('ss -tuln 2>/dev/null || netstat -tuln 2>/dev/null || true');
    const lines = stdout.split('\n');
    const openPorts: Array<{ protocol: string; port: number; address: string }> = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && (parts[0].startsWith('tcp') || parts[0].startsWith('udp'))) {
        const localAddr = parts[4];
        const lastColon = localAddr.lastIndexOf(':');
        if (lastColon !== -1) {
          const port = parseInt(localAddr.slice(lastColon + 1), 10);
          const addr = localAddr.slice(0, lastColon);
          if (!isNaN(port) && !openPorts.some((p) => p.port === port && p.protocol === parts[0].toUpperCase())) {
            openPorts.push({ protocol: parts[0].toUpperCase(), port, address: addr || '0.0.0.0' });
          }
        }
      }
    }

    res.json({
      raw: authed ? stdout : '',
      openPorts,
    });
  });

  // API: Real system memory & specs
  app.get('/api/system/stats', (req, res) => {
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus().length;
    const uptimeSec = os.uptime();

    res.json({
      totalMemMB: totalMem,
      usedMemMB: usedMem,
      freeMemMB: freeMem,
      cpuCount: cpus,
      uptimeSeconds: uptimeSec,
      platform: os.platform(),
      arch: os.arch(),
    });
  });

  // API: Get real Caddyfile content (Owner-authenticated)
  app.get('/api/caddyfile', requireOwnerAuth, (req, res) => {
    try {
      if (fs.existsSync(CADDYFILE_PATH)) {
        return res.json({ content: fs.readFileSync(CADDYFILE_PATH, 'utf-8') });
      }
    } catch (e) {
      // Permission or read error
    }
    res.json({ content: '# Caddyfile has not been generated yet. Launch a stack to initialize.' });
  });

  // API: Redacted .env inspection & injection (Owner-authenticated, secrets redacted)
  app.get('/api/env', requireOwnerAuth, (req, res) => {
    const envPath = path.join(process.cwd(), '.env');
    const bakPath = path.join(process.cwd(), '.env.omastack.bak');

    let currentRaw = '';
    let backupRaw = '';
    try {
      if (fs.existsSync(envPath)) {
        currentRaw = fs.readFileSync(envPath, 'utf-8');
      }
      if (fs.existsSync(bakPath)) {
        backupRaw = fs.readFileSync(bakPath, 'utf-8');
      }
    } catch (_) {}

    res.json({
      currentEnv: redactEnvContent(currentRaw),
      backupEnv: redactEnvContent(backupRaw),
      exists: fs.existsSync(envPath),
      redacted: true,
    });
  });

  app.post('/api/env/inject', requireOwnerAuth, async (req, res) => {
    const { stdout, stderr, code } = await runCli(['inject']);
    res.json({
      success: code === 0,
      stdout,
      stderr,
    });
  });

  // API: Export complete omastack repo as ZIP
  app.get('/api/export-zip', async (req, res) => {
    try {
      const zip = new JSZip();
      const omaStackDir = path.join(process.cwd(), 'omastack');

      function addDirectoryToZip(dirPath: string, zipFolder: JSZip) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const fullPath = path.join(dirPath, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            addDirectoryToZip(fullPath, zipFolder.folder(file)!);
          } else {
            zipFolder.file(file, fs.readFileSync(fullPath));
          }
        }
      }

      if (fs.existsSync(omaStackDir)) {
        addDirectoryToZip(omaStackDir, zip);
      }

      const content = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="omastack-omarchy.zip"');
      res.send(content);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        allowedHosts: ['localhost', '127.0.0.1', 'omastack.local'],
      },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`⚡ OmaStack Live Server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
