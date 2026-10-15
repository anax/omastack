# OmaStack (`omastack`)

> **Native, zero-bloat, keyboard-first ephemeral full-stack sandbox launcher and Docker environment manager built specifically for Omarchy Linux.**

[![Omarchy Linux](https://img.shields.io/badge/OS-Omarchy%20Linux%20(Arch%20%2B%20Hyprland)-1793d1?logo=arch-linux)](https://github.com/anax/omastack)
[![Docker Compose v2](https://img.shields.io/badge/Containers-Docker%20Compose%20v2-2496ed?logo=docker)](https://github.com/anax/omastack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ⚡ Quick Start & Installation

### Option 1: Omarchy Plugin Manager (Recommended)
Install OmaStack with a single command via the native Omarchy plugin manager:

```bash
omarchy plugin add https://github.com/anax/omastack
```

### Option 2: 1-Line Curl Installer
```bash
curl -fsSL https://raw.githubusercontent.com/anax/omastack/main/install.sh | bash
```

### Option 3: Manual Clone
```bash
git clone https://github.com/anax/omastack.git ~/.local/share/omastack
mkdir -p ~/.local/bin
ln -sf ~/.local/share/omastack/bin/omastack ~/.local/bin/omastack
chmod +x ~/.local/bin/omastack
```

---

## 🚀 Key Features

* **Ephemeral Curated Stacks:** Spin up multi-service stacks (`alpine`-based where possible) in seconds.
* **Zero Port Conflicts (`ss -tuln`):** Automatically scans host sockets before launching. If a port (e.g., `5432` or `3306`) is in use, OmaStack dynamically rebinds to an available port without manual tweaking.
* **Wayland Clipboard & `.env` Sync:** Formats connection strings (`DATABASE_URL`, `REDIS_URL`, etc.) and copies them immediately to the Wayland clipboard via `wl-copy`. Safely backs up `.env` to `.env.omastack.bak` before merging.
* **Local Trusted HTTPS (`*.oma.local`):** Automatically provisions trusted SSL certificates using `mkcert` and routes local hostnames (`https://mail.oma.local`, `https://n8n.oma.local`, `https://db.oma.local`) through an embedded Caddy reverse proxy.
* **Omarchy Desktop Integration:**
  * **Widget Panel Shortcut:** Press <kbd>Super</kbd> + <kbd>Alt</kbd> + <kbd>W</kbd> to open the live sandbox Widget Panel (`omastack widget` / `omastack panel`).
  * **Hyprland Shortcut:** Press <kbd>Super</kbd> + <kbd>Alt</kbd> + <kbd>Space</kbd> to open the Walker/Rofi launcher anywhere.
  * **Waybar Module:** Real-time status indicator (`{"text": "⚡ 2", "tooltip": "...", "class": "active"}`). Left-click opens the menu; right-click tears down all active stacks to free RAM instantly.
  * **Theme Synchronization:** Adapts colors dynamically to your current Omarchy palette (Tokyo Night, Catppuccin Mocha, Gruvbox, Rosé Pine, Nordic, Cyberpunk).

---

## 📦 Pre-Configured Stack Templates

Templates are stored in `~/.local/share/omastack/templates/`:

| Template ID | Included Services | Default Ports | Local HTTPS Domain |
| :--- | :--- | :--- | :--- |
| **`laravel-stack`** | MySQL 8.0, Redis Alpine, Mailpit (SMTP), Meilisearch | `3306`, `6379`, `8025`, `7700` | `https://mail.oma.local`<br>`https://search.oma.local` |
| **`supabase-lite`** | PostgreSQL 16 (`pgvector`), PostgREST, PgAdmin | `5432`, `3000`, `5051` | `https://supabase.oma.local`<br>`https://api.supabase.oma.local` |
| **`nextjs-postgres`** | PostgreSQL 16, Redis Alpine, Adminer UI | `5432`, `6379`, `8080` | `https://db.oma.local` |
| **`automation-hub`** | n8n Workflow Automation, PostgreSQL 16, Redis Queue | `5678`, `5432`, `6379` | `https://n8n.oma.local` |
| **`web3-node`** | EVM RPC Proxy (Anvil/Hardhat), PostgreSQL 16, Redis | `8545`, `5432`, `6379` | `https://rpc.oma.local` |

---

## ⌨️ CLI Usage

```bash
# Spin up a stack template
omastack up laravel-stack

# Stop a specific running stack
omastack down laravel-stack

# Teardown all running sandboxes and immediately free system RAM
omastack down --all

# List active sandboxes, memory usage, and port allocations
omastack list

# Launch interactive keyboard menu (Walker / Rofi / fzf / gum)
omastack menu

# Launch live Omarchy Widget Panel
omastack widget
omastack widget --json
omastack panel

# Output Waybar single-line JSON module payload
omastack status --waybar

# Inject connection strings into current directory .env (with .env.omastack.bak backup)
omastack inject

# Tail real-time container logs
omastack logs laravel-stack

# Reload Caddy reverse proxy mappings
omastack proxy
```

---

## 🖥️ Waybar Integration

Add this module to your `~/.config/waybar/config.jsonc`:

```jsonc
"custom/omastack": {
    "format": "{}",
    "exec": "omastack status --waybar",
    "return-type": "json",
    "interval": 5,
    "on-click": "omastack menu",
    "on-click-right": "omastack down --all",
    "tooltip": true
}
```

Add styling to your `~/.config/waybar/style.css`:

```css
#custom-omastack.active {
    color: #7dcfff;
    background-color: rgba(125, 207, 255, 0.15);
    border-radius: 8px;
    padding: 0 10px;
}

#custom-omastack.idle {
    color: #565f89;
}
```

---

## 🗂️ Repository Structure

```text
omastack/
├── bin/
│   ├── omastack                  # Main executable CLI & menu dispatcher
│   └── omarchy                   # Omarchy System & Plugin Manager
├── lib/
│   ├── core.sh                   # Logging, dependency checks, state tracking
│   ├── docker.sh                 # Compose wrappers, healthchecks, RAM stats, port scanner
│   ├── env.sh                    # .env parser, injector, and wl-copy formatter
│   ├── proxy.sh                  # Caddy + mkcert *.oma.local domain manager
│   ├── theme.sh                  # Reads Omarchy active theme colors for fzf/gum
│   └── ui.sh                     # Walker/Rofi dmenu mode & terminal TUI menus
├── templates/
│   ├── laravel-stack/
│   │   ├── docker-compose.yml
│   │   └── stack.conf
│   ├── supabase-lite/
│   ├── nextjs-postgres/
│   ├── automation-hub/
│   └── web3-node/
├── omastore.toml                 # OmaStore 1-click manifest
├── install.sh                    # Self-installer script
└── README.md
```

---

## 📄 License & Credits

Built for **Omarchy Linux** by the Omarchy DevOps Team.  
Repository: [https://github.com/anax/omastack](https://github.com/anax/omastack)  
Licensed under the [MIT License](LICENSE).
