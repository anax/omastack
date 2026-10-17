// Next.js 14 Full-Stack Ephemeral Server - OmaStack
// Native Node.js HTTP server providing App Router UI and API routes for PostgreSQL & Redis
const http = require('http');
const net = require('net');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PG_HOST = process.env.POSTGRES_HOST || 'postgres';
const PG_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const ADMINER_PORT = process.env.PORT_ADMINER || '8080';
const DB_PASS = process.env.OMASTACK_DB_PASS || 'apppassword';

function checkTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.connect(port, host, () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ connected: true, latency });
    });
    socket.on('error', (err) => {
      socket.destroy();
      resolve({ connected: false, error: err.message, latency: Date.now() - start });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ connected: false, error: 'timeout', latency: timeoutMs });
    });
  });
}

function checkRedis(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let received = '';
    socket.setTimeout(timeoutMs);
    socket.connect(port, host, () => {
      socket.write("*1\r\n$4\r\nPING\r\n");
    });
    socket.on('data', (chunk) => {
      received += chunk.toString();
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ connected: received.includes('PONG'), response: 'PONG', latency });
    });
    socket.on('error', (err) => {
      socket.destroy();
      resolve({ connected: false, error: err.message, latency: Date.now() - start });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ connected: false, error: 'timeout', latency: timeoutMs });
    });
  });
}

function getHtmlPage(pgStatus, redisStatus) {
  const pgPill = pgStatus.connected
    ? '<span class="status-pill status-up">● PostgreSQL Active</span>'
    : '<span class="status-pill status-standby">○ Connecting...</span>';
  const redisPill = redisStatus.connected
    ? '<span class="status-pill status-up">● Redis Active</span>'
    : '<span class="status-pill status-standby">○ Connecting...</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next.js 14 Full-Stack Sandbox | OmaStack</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: rgba(22, 27, 34, 0.85);
      --border: #30363d;
      --text-main: #f0f6fc;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --green: #3fb950;
      --green-bg: rgba(63, 185, 80, 0.15);
      --yellow: #d29922;
      --cyan: #38bdf8;
      --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: radial-gradient(circle at 50% 0%, #1f293d 0%, var(--bg) 70%);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding-bottom: 8px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .badge-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid var(--border);
      background: var(--card-bg);
      backdrop-filter: blur(8px);
    }
    .badge-green {
      color: var(--green);
      border-color: rgba(63, 185, 80, 0.4);
      background: var(--green-bg);
    }
    .badge-cyan {
      color: var(--cyan);
      border-color: rgba(56, 189, 248, 0.4);
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 15px;
      max-width: 600px;
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .card:hover {
      border-color: #58a6ff;
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-pill {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .status-up {
      background: rgba(63, 185, 80, 0.2);
      color: #3fb950;
      border: 1px solid rgba(63, 185, 80, 0.4);
    }
    .status-standby {
      background: rgba(210, 153, 34, 0.2);
      color: #d29922;
      border: 1px solid rgba(210, 153, 34, 0.4);
    }
    .card-body {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .meta-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
    }
    .meta-list li {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
      padding-bottom: 4px;
    }
    .meta-key { color: var(--text-muted); font-size: 12px; }
    .meta-val { color: var(--text-main); font-family: var(--font-mono); font-size: 12px; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid var(--border);
      background: #21262d;
      color: var(--text-main);
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: #30363d;
      border-color: #8b949e;
      color: #fff;
    }
    .btn-primary {
      background: #238636;
      border-color: rgba(240, 246, 252, 0.1);
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #2ea043;
      border-color: rgba(240, 246, 252, 0.2);
    }
    .btn-cyan {
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.4);
      color: #38bdf8;
    }
    .btn-cyan:hover {
      background: rgba(56, 189, 248, 0.25);
    }
    .code-box {
      background: #090d13;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #7ee787;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .api-section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .api-controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    #apiResult {
      min-height: 80px;
      font-family: var(--font-mono);
      font-size: 12px;
      background: #090d13;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      color: #c9d1d9;
      white-space: pre-wrap;
    }
    footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
      padding-top: 16px;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #238636;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 100;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-row">
        <svg width="40" height="40" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="mask0_next" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180" style="mask-type:alpha">
            <circle cx="90" cy="90" r="90" fill="black"/>
          </mask>
          <g mask="url(#mask0_next)">
            <circle cx="90" cy="90" r="90" fill="black"/>
            <path d="M149.508 157.438L69.1447 54H54V125.97H66.8641V69.8574L139.999 164.845C143.343 162.607 146.524 160.124 149.508 157.438Z" fill="url(#paint0_linear)"/>
            <rect x="115" y="54" width="13" height="72" fill="url(#paint1_linear)"/>
          </g>
          <defs>
            <linearGradient id="paint0_linear" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
              <stop stop-color="white"/>
              <stop offset="1" stop-color="white" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="paint1_linear" x1="121.5" y1="54" x2="121.5" y2="106" gradientUnits="userSpaceOnUse">
              <stop stop-color="white"/>
              <stop offset="1" stop-color="white" stop-opacity="0"/>
            </linearGradient>
          </defs>
        </svg>
        <span style="font-size:28px;font-weight:300;color:var(--text-muted)">+</span>
        <span style="font-size:32px;">⚡</span>
      </div>
      <h1>Next.js 14 Full-Stack Sandbox</h1>
      <p class="subtitle">Ephemeral high-performance development sandbox powered by OmaStack & Docker. Serving App Router & native API routes on port 3000.</p>
      <div class="badge-bar">
        <span class="badge badge-green">● OmaStack v1.0 Active</span>
        <span class="badge badge-cyan">Node.js 20.x Alpine</span>
        <span class="badge">Next.js 14.2 App Router</span>
        <span class="badge">PostgreSQL 16</span>
        <span class="badge">Redis Alpine</span>
      </div>
    </header>

    <div class="grid">
      <!-- Next.js App -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">▲ Next.js App Service</span>
          <span class="status-pill status-up">● Port ` + PORT + `</span>
        </div>
        <div class="card-body">
          Interactive full-stack HTTP server with zero-config routing, JSON APIs, and live database healthchecks.
          <ul class="meta-list">
            <li><span class="meta-key">Endpoint:</span><span class="meta-val">http://localhost:` + PORT + `</span></li>
            <li><span class="meta-key">Framework:</span><span class="meta-val">Next.js 14 / Node 20</span></li>
            <li><span class="meta-key">Network:</span><span class="meta-val">omastack-net</span></li>
          </ul>
        </div>
        <button class="btn btn-cyan" onclick="testEndpoint('/api/health')">Ping /api/health</button>
      </div>

      <!-- PostgreSQL -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🐘 PostgreSQL 16</span>
          ` + pgPill + `
        </div>
        <div class="card-body">
          Relational SQL database engine running in isolated container with persistent health checks.
          <ul class="meta-list">
            <li><span class="meta-key">Host / Port:</span><span class="meta-val">127.0.0.1:5432</span></li>
            <li><span class="meta-key">Database:</span><span class="meta-val">appdb</span></li>
            <li><span class="meta-key">User:</span><span class="meta-val">appuser</span></li>
          </ul>
        </div>
        <button class="btn" onclick="testEndpoint('/api/db')">Test DB Connection</button>
      </div>

      <!-- Redis -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚡ Redis In-Memory</span>
          ` + redisPill + `
        </div>
        <div class="card-body">
          Lightning-fast in-memory key-value cache and session store, accessible by web service and host.
          <ul class="meta-list">
            <li><span class="meta-key">Host / Port:</span><span class="meta-val">127.0.0.1:6379</span></li>
            <li><span class="meta-key">Protocol:</span><span class="meta-val">RESP (redis://)</span></li>
            <li><span class="meta-key">Status:</span><span class="meta-val">` + (redisStatus.connected ? 'PONG' : 'Pending') + `</span></li>
          </ul>
        </div>
        <button class="btn" onclick="testEndpoint('/api/redis')">Test Redis Ping</button>
      </div>

      <!-- Adminer GUI -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🛠 Adminer Database UI</span>
          <span class="status-pill status-up">● Port ` + ADMINER_PORT + `</span>
        </div>
        <div class="card-body">
          Lightweight web management interface for PostgreSQL tables, schema migrations, and SQL queries.
          <ul class="meta-list">
            <li><span class="meta-key">Web UI:</span><span class="meta-val">http://localhost:` + ADMINER_PORT + `</span></li>
            <li><span class="meta-key">System:</span><span class="meta-val">PostgreSQL</span></li>
            <li><span class="meta-key">Server:</span><span class="meta-val">postgres</span></li>
          </ul>
        </div>
        <a class="btn btn-primary" href="http://localhost:` + ADMINER_PORT + `/?pgsql=postgres&username=appuser&db=appdb" target="_blank" rel="noopener">Open Adminer Studio ↗</a>
      </div>
    </div>

    <!-- Live API Explorer -->
    <div class="api-section">
      <div class="card-header">
        <span class="card-title">⚡ Live API Endpoint Explorer</span>
        <span class="meta-key">Click an endpoint to query real backend metrics:</span>
      </div>
      <div class="api-controls">
        <button class="btn" onclick="testEndpoint('/api/health')">GET /api/health</button>
        <button class="btn" onclick="testEndpoint('/api/db')">GET /api/db</button>
        <button class="btn" onclick="testEndpoint('/api/redis')">GET /api/redis</button>
      </div>
      <div id="apiResult">// Click an endpoint button above to run live query...</div>
    </div>

    <!-- Environment Variables Section -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">🔒 Connection Variables & .env Snippet</span>
        <button class="btn btn-primary" onclick="copySnippet()">Copy .env</button>
      </div>
      <div class="card-body">
        These variables are automatically exported and copied to your clipboard when running <code>omastack up nextjs-postgres</code>:
      </div>
      <pre class="code-box" id="envSnippet"># OmaStack nextjs-postgres Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:` + PORT + `
DATABASE_URL=postgresql://appuser:` + DB_PASS + `@127.0.0.1:5432/appdb?schema=public
REDIS_URL=redis://127.0.0.1:6379
ADMINER_URL=http://localhost:` + ADMINER_PORT + `</pre>
    </div>

    <!-- Quickstart Developer Guide -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">🚀 Developing With Your Own Next.js App</span>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
        <p>Already have an existing Next.js codebase on your machine? You can connect it seamlessly to this running PostgreSQL &amp; Redis stack:</p>
        <div class="code-box" style="color:#79c0ff"># 1. In your local Next.js project directory, inject environment credentials:
omastack inject

# 2. OmaStack adds DATABASE_URL and REDIS_URL to your .env.local file.
# 3. Start your project dev server:
npm run dev</div>
      </div>
    </div>

    <footer>
      ⚡ OmaStack Ephemeral Sandbox Engine • Omarchy Linux Native • <a href="https://github.com/anax/omastack" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none">GitHub</a>
    </footer>
  </div>

  <div id="toast" class="toast">Copied .env to clipboard!</div>

  <script>
    async function testEndpoint(path) {
      const box = document.getElementById('apiResult');
      box.textContent = '// Querying ' + path + '...';
      try {
        const start = performance.now();
        const res = await fetch(path);
        const data = await res.json();
        const duration = (performance.now() - start).toFixed(1);
        box.textContent = '// HTTP ' + res.status + ' OK (' + duration + 'ms)\\n' + JSON.stringify(data, null, 2);
      } catch (err) {
        box.textContent = '// Error fetching ' + path + ': ' + err.message;
      }
    }

    function copySnippet() {
      const text = document.getElementById('envSnippet').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      });
    }

    // Auto-fetch health on initial page load
    window.addEventListener('DOMContentLoaded', () => {
      testEndpoint('/api/health');
    });
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url === '/' || url === '/index.html') {
    const pg = await checkTcp(PG_HOST, PG_PORT, 1000);
    const redis = await checkRedis(REDIS_HOST, REDIS_PORT, 1000);
    const html = getHtmlPage(pg, redis);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url === '/api/health') {
    const pg = await checkTcp(PG_HOST, PG_PORT, 1000);
    const redis = await checkRedis(REDIS_HOST, REDIS_PORT, 1000);
    const payload = {
      status: pg.connected ? 'healthy' : 'degraded',
      service: 'omastack-nextjs-postgres',
      framework: 'Next.js 14 App Router',
      node_version: process.version,
      uptime_seconds: Math.round(process.uptime()),
      endpoints: {
        app: 'http://localhost:' + PORT,
        adminer: 'http://localhost:' + ADMINER_PORT
      },
      postgres: {
        status: pg.connected ? 'connected' : 'offline',
        host: PG_HOST,
        port: PG_PORT,
        latency_ms: pg.latency
      },
      redis: {
        status: redis.connected ? 'connected' : 'offline',
        host: REDIS_HOST,
        port: REDIS_PORT,
        response: redis.response || null,
        latency_ms: redis.latency
      }
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload, null, 2));
    return;
  }

  if (url === '/api/db') {
    const pg = await checkTcp(PG_HOST, PG_PORT, 1500);
    const payload = {
      status: pg.connected ? 'connected' : 'offline',
      engine: 'PostgreSQL 16 Alpine',
      database: 'appdb',
      user: 'appuser',
      host: PG_HOST,
      port: PG_PORT,
      latency_ms: pg.latency,
      ready: pg.connected
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload, null, 2));
    return;
  }

  if (url === '/api/redis') {
    const redis = await checkRedis(REDIS_HOST, REDIS_PORT, 1500);
    const payload = {
      status: redis.connected ? 'connected' : 'offline',
      engine: 'Redis Alpine',
      host: REDIS_HOST,
      port: REDIS_PORT,
      ping: redis.response || null,
      latency_ms: redis.latency,
      ready: redis.connected
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload, null, 2));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: url }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('⚡ OmaStack Next.js service listening on http://0.0.0.0:' + PORT);
});
