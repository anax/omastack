import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
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

// Safe argv-based execution helper
function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    execFile('bash', [OMASTACK_BIN, ...args], { cwd: process.cwd(), env: process.env }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: error ? (error.code || 1) : 0,
      });
    });
  });
}

// Fallback helper for internal fixed scripts
function runShell(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    exec(cmd, { cwd: process.cwd(), env: process.env }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: error ? (error.code || 1) : 0,
      });
    });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure directories exist
  fs.mkdirSync(STATE_DIR, { recursive: true });

  // Serve raw install script
  app.get('/install.sh', (req, res) => {
    const installPath = path.join(process.cwd(), 'omastack', 'install.sh');
    if (fs.existsSync(installPath)) {
      res.setHeader('Content-Type', 'text/plain');
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
    const p = path.join(process.cwd(), 'omastack', 'manifest.json');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).json({ error: 'manifest.json not found' });
    }
  });

  // Serve Omarchy Quattro BarWidget.qml
  app.get('/BarWidget.qml', (req, res) => {
    const p = path.join(process.cwd(), 'omastack', 'BarWidget.qml');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).send('// BarWidget.qml not found');
    }
  });

  // Serve Omarchy Quattro Panel.qml
  app.get('/Panel.qml', (req, res) => {
    const p = path.join(process.cwd(), 'omastack', 'Panel.qml');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(p, 'utf-8'));
    } else {
      res.status(404).send('// Panel.qml not found');
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
    if (fs.existsSync(STATE_DIR)) {
      const files = fs.readdirSync(STATE_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(STATE_DIR, file), 'utf-8');
            const data = JSON.parse(content);
            const templateId = file.replace('.json', '');

            // Check if compose exists
            const composeFile = path.join(STATE_DIR, `${templateId}-compose.yml`);
            const composeContent = fs.existsSync(composeFile)
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
    res.json(stacks);
  });

  // API: Launch stack with real CLI execution
  app.post('/api/stacks/up', async (req, res) => {
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

  // API: Teardown stack with real CLI execution
  app.post('/api/stacks/down', async (req, res) => {
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
        templates: ['automation-hub', 'laravel-stack', 'nextjs-postgres', 'supabase-lite', 'web3-node'],
        shortcuts: {
          menu: 'SUPER + ALT + SPACE',
          widget_panel: 'SUPER + ALT + W',
        },
      });
    }
  });

  // API: Execute real omastack CLI command from terminal
  app.post('/api/cli', async (req, res) => {
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

    if (mainBin === 'omastack') {
      const { stdout, stderr, code } = await runCli(subArgs);
      return res.json({ stdout, stderr, code });
    } else if (mainBin === 'omarchy') {
      const omarchyBin = path.join(process.cwd(), 'omastack', 'bin', 'omarchy');
      const { stdout, stderr, code } = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
        execFile('bash', [omarchyBin, ...subArgs], { cwd: process.cwd(), env: process.env }, (err, stdout, stderr) => {
          resolve({ stdout: stdout || '', stderr: stderr || '', code: err ? (err.code || 1) : 0 });
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
      raw: stdout,
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

  // API: Get real Caddyfile content
  app.get('/api/caddyfile', (req, res) => {
    if (fs.existsSync(CADDYFILE_PATH)) {
      res.json({ content: fs.readFileSync(CADDYFILE_PATH, 'utf-8') });
    } else {
      res.json({ content: '# Caddyfile has not been generated yet. Launch a stack to initialize.' });
    }
  });

  // API: Real .env inspection & injection
  app.get('/api/env', (req, res) => {
    const envPath = path.join(process.cwd(), '.env');
    const bakPath = path.join(process.cwd(), '.env.omastack.bak');

    res.json({
      currentEnv: fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '',
      backupEnv: fs.existsSync(bakPath) ? fs.readFileSync(bakPath, 'utf-8') : '',
      exists: fs.existsSync(envPath),
    });
  });

  app.post('/api/env/inject', async (req, res) => {
    const { stdout, stderr, code } = await runShell(`bash "${OMASTACK_BIN}" inject`);
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
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
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
