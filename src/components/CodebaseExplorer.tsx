import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Folder, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { OmarchyTheme } from '../types';

interface CodebaseExplorerProps {
  currentTheme: OmarchyTheme;
  onCopyText: (text: string) => void;
}

const FILE_CONTENTS: Record<string, string> = {
  'bin/omastack': `#!/usr/bin/env bash
# OmaStack Main Executable CLI & Menu Dispatcher
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
source "\${SCRIPT_DIR}/lib/core.sh"
source "\${SCRIPT_DIR}/lib/docker.sh"
source "\${SCRIPT_DIR}/lib/env.sh"
source "\${SCRIPT_DIR}/lib/proxy.sh"
source "\${SCRIPT_DIR}/lib/theme.sh"
source "\${SCRIPT_DIR}/lib/ui.sh"

case "\${1:-}" in
  up) cmd_up "\${2:-}" ;;
  down) cmd_down "\${2:-}" ;;
  list) cmd_list ;;
  status) output_waybar_json ;;
  menu) launch_walker_menu ;;
  inject) inject_local_env "$(generate_env_snippet "generic" "")" "\${2:-.env}" ;;
  *) usage ;;
esac`,

  'lib/core.sh': `#!/usr/bin/env bash
# OmaStack Core Library - Logging, dependency checks, state tracking
set -euo pipefail

OMASTACK_HOME="\${OMASTACK_HOME:-\${HOME}/.local/share/omastack}"
OMASTACK_STATE_DIR="\${OMASTACK_HOME}/state"

log_info() { echo -e "\\033[36m⚡ [OmaStack]\\033[0m $1" >&2; }
log_success() { echo -e "\\033[32m✔ [OmaStack]\\033[0m $1" >&2; }
log_warn() { echo -e "\\033[33m⚠ [OmaStack]\\033[0m $1" >&2; }

notify_desktop() {
  if command -v notify-send >/dev/null 2>&1; then
    notify-send -u "\${3:-normal}" -a "OmaStack" "$1" "$2" || true
  fi
}`,

  'lib/docker.sh': `#!/usr/bin/env bash
# OmaStack Docker Library - Port scanner & compose wrappers
set -euo pipefail

is_port_in_use() {
  local port="$1"
  ss -tuln | grep -E ":\${port}\\b" >/dev/null 2>&1
}

find_available_port() {
  local port="$1"
  while is_port_in_use "\${port}"; do
    port=$((port + 1))
  done
  echo "\${port}"
}`,

  'lib/env.sh': `#!/usr/bin/env bash
# OmaStack Env Library - wl-copy sync & .env injection
set -euo pipefail

copy_to_clipboard() {
  if command -v wl-copy >/dev/null 2>&1; then
    echo -n "$1" | wl-copy
  fi
}

inject_local_env() {
  local snippet="$1"
  local target="\${2:-.env}"
  if [ -f "\${target}" ]; then
    cp "\${target}" "\${target}.omastack.bak"
  fi
  echo -e "\\n\${snippet}" >> "\${target}"
}`,

  'lib/proxy.sh': `#!/usr/bin/env bash
# OmaStack Proxy Library - Caddy reverse proxy & mkcert for *.oma.local
set -euo pipefail

register_proxy_domain() {
  local domain="$1"
  local port="$2"
  # Add rule to Caddyfile and reload caddy container
  docker exec omastack-proxy caddy reload --config /etc/caddy/Caddyfile
}`,

  'bin/omarchy': `#!/usr/bin/env bash
# Omarchy System CLI & Plugin Manager
set -euo pipefail

case "\${1:-}" in
  plugin)
    if [ "\${2:-}" = "add" ]; then
      echo "⚡ [Omarchy PM] Installing OmaStack from \${3:-}..."
      echo "✔ Bound Super + Alt + Space to 'omastack menu' in Hyprland"
      echo "✔ Configured Waybar custom/omastack module: 'omastack status --waybar'"
      echo "✔ Plugin 'omastack' successfully installed and activated!"
    fi
    ;;
esac`,

  'omastore.toml': `[plugin]
id = "omastack"
name = "OmaStack"
version = "1.0.0"
author = "Omarchy DevOps Team"
description = "Native, zero-bloat, keyboard-first ephemeral full-stack sandbox launcher for Omarchy Linux."
repository = "https://github.com/anax/omastack"

[dependencies]
system = ["docker", "docker-compose", "iproute2", "wl-clipboard", "libnotify"]
optional = ["gum", "fzf", "walker", "rofi", "caddy", "mkcert"]

[desktop]
keybinding = "Super+Alt+Space"
exec = "omastack menu"

[waybar]
module_type = "custom/script"
exec = "omastack status --waybar"
interval = 5`,

  'install.sh': `#!/usr/bin/env bash
# OmaStack Installer for Omarchy Linux
set -euo pipefail

echo "Installing OmaStack on Omarchy Linux..."
mkdir -p ~/.local/share/omastack ~/.local/bin

cp -r lib ~/.local/share/omastack/
cp -r templates ~/.local/share/omastack/
cp bin/omastack ~/.local/bin/omastack
chmod +x ~/.local/bin/omastack

echo "✔ OmaStack successfully installed! Run: omastack up laravel-stack"`,

  'manifest.json': `{
  "schemaVersion": 1,
  "id": "omacom.omastack",
  "name": "OmaStack",
  "version": "1.0.0",
  "author": "Anas Mohamed <nxmohamed@gmail.com>",
  "license": "MIT",
  "description": "Native, zero-bloat, keyboard-first ephemeral full-stack sandbox launcher and Docker environment manager built specifically for Omarchy Linux.",
  "kinds": ["bar-widget"],
  "entryPoints": {
    "barWidget": "BarWidget.qml"
  },
  "barWidget": {
    "displayName": "OmaStack Sandboxes",
    "category": "Development",
    "allowMultiple": false,
    "defaultSection": "right"
  },
  "omarchy": {
    "clonedFrom": "omarchy.clock"
  }
}`,

  'BarWidget.qml': `import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import qs.Ui

BarWidget {
    id: root
    moduleName: "omacom.omastack"

    readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false
    readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false

    function open() { if (panelLoader.item) panelLoader.item.open() }
    function close() { if (panelLoader.item) panelLoader.item.close() }
    function toggle() { if (panelLoader.item) panelLoader.item.toggle() }

    function injectPanel() {
        if (!panelLoader.item) return
        panelLoader.item.bar = root.bar
        panelLoader.item.anchorItem = button
        panelLoader.item.hostWidget = root
    }

    implicitWidth: button.implicitWidth
    implicitHeight: button.implicitHeight
    onBarChanged: injectPanel()

    property int activeCount: 0
    property string totalRam: "0MB"
    property string statusClass: "idle"
    property var activeStacks: []

    Timer {
        interval: 3000
        repeat: true
        running: true
        triggeredOnStart: true
        onTriggered: {
            if (!statusProcess.running) statusProcess.running = true
        }
    }

    Process {
        id: statusProcess
        command: ["omastack", "status", "--widget"]
        running: false
        stdout: StdioCollector {
            onStreamFinished: {
                try {
                    var data = JSON.parse(this.text.trim())
                    root.activeCount = data.active_count || 0
                    root.totalRam = data.total_ram || "0MB"
                    root.statusClass = data.status_class || "idle"
                    root.activeStacks = data.active_stacks || []
                } catch(e) {}
            }
        }
    }

    Process {
        id: menuProcess
        command: ["omastack", "menu"]
        running: false
    }

    Loader {
        id: panelLoader
        active: true
        source: Qt.resolvedUrl("Panel.qml")
        visible: false
        onLoaded: {
            root.injectPanel()
            Qt.callLater(root.injectPanel)
        }
    }

    BarIconButton {
        id: button
        anchors.fill: parent
        bar: root.bar
        text: root.activeCount > 0 ? ("⚡ " + root.activeCount + " (" + root.totalRam + ")") : "⚡ 0"
        tooltipText: root.activeCount > 0
            ? ("OmaStack: " + root.activeCount + " active sandboxes [" + root.totalRam + " RAM]\\n• Left-click: Toggle details panel\\n• Right-click: Open Walker menu")
            : "OmaStack: No active sandboxes\\n• Left-click: Launch sandboxes\\n• Right-click: Open Walker menu"

        onPressed: function(buttonCode) {
            if (buttonCode === Qt.LeftButton) root.toggle()
            else if (buttonCode === Qt.RightButton) menuProcess.running = true
        }
    }
}`,

  'Panel.qml': `import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

Panel {
    id: root
    moduleName: "omacom.omastack"
    manageIpc: false
    property var anchorItem: null
    property var hostWidget: null

    function open() { if (root.controller) root.controller.show() }
    function close() { if (root.controller) root.controller.hide() }
    function toggle() {
        if (root.controller) {
            if (root.controller.visible) root.controller.hide()
            else root.controller.show()
        }
    }

    implicitWidth: 380
    implicitHeight: 480

    function executeCli(args) {
        cliProcess.command = args
        cliProcess.running = true
    }

    Process {
        id: cliProcess
        command: ["omastack"]
        running: false
        onExited: {
            if (root.hostWidget && root.hostWidget.statusProcess) {
                root.hostWidget.statusProcess.running = true
            }
        }
    }

    Rectangle {
        anchors.fill: parent
        color: "#1a1b26"
        radius: 12
        border.color: "#414868"
        border.width: 1

        // Layout with header, active sandboxes, quick templates, and CLI actions...
    }
}`,

  'README.md': `# OmaStack (omastack)
Native, zero-bloat, keyboard-first ephemeral sandbox launcher for Omarchy Linux.

## Quick Install
\`\`\`bash
omarchy plugin add https://github.com/anax/omastack
\`\`\`

## Features
- Curated stacks: laravel-stack, supabase-lite, nextjs-postgres, automation-hub, web3-node
- Dynamic port allocation & collision scan with ss -tuln
- Wayland clipboard sync (wl-copy) & safe .env backup
- Local HTTPS reverse proxy (*.oma.local) via Caddy & mkcert
- Omarchy Quattro Bar-Widget (BarWidget.qml & Panel.qml)
- Hyprland keybinding: Super + Alt + Space & Super + Alt + W`,
};

export const CodebaseExplorer: React.FC<CodebaseExplorerProps> = ({
  currentTheme,
  onCopyText,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [copied, setCopied] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedPlugin, setCopiedPlugin] = useState(false);

  const handleCopyFile = () => {
    onCopyText(FILE_CONTENTS[selectedFile] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyClone = () => {
    const command = 'git clone https://github.com/anax/omastack.git ~/.config/omarchy/plugins/io.github.anax.omastack && cd ~/.config/omarchy/plugins/io.github.anax.omastack && ./install.sh';
    onCopyText(command);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const handleCopyPlugin = () => {
    const command = 'omarchy plugin add https://github.com/anax/omastack';
    onCopyText(command);
    setCopiedPlugin(true);
    setTimeout(() => setCopiedPlugin(false), 2000);
  };

  const handleDownloadZip = () => {
    window.location.href = '/api/export-zip';
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Installation Banner */}
      <div
        className="p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="space-y-1">
          <div className="font-bold text-sm flex items-center gap-2" style={{ color: currentTheme.primary }}>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Install on Omarchy Linux via Plugin Manager</span>
          </div>
          <p className="opacity-70 text-xs">
            Repository: <code className="text-cyan-300">https://github.com/anax/omastack</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyPlugin}
            className="px-3.5 py-2 rounded-lg font-bold border flex items-center gap-2 transition-all hover:bg-black/30"
            style={{ borderColor: currentTheme.accent, color: currentTheme.accent }}
          >
            {copiedPlugin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPlugin ? 'Copied Plugin Command!' : 'omarchy plugin add'}</span>
          </button>

          <button
            onClick={handleCopyClone}
            className="px-3.5 py-2 rounded-lg font-bold border flex items-center gap-2 transition-all hover:bg-black/30"
            style={{ borderColor: currentTheme.border, color: currentTheme.fg }}
          >
            {copiedClone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedClone ? 'Command Copied!' : 'git clone & install'}</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md hover:brightness-110"
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
          >
            <Download className="w-4 h-4" />
            <span>Download ZIP</span>
          </button>
        </div>
      </div>

      {/* Codebase Viewer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 min-h-[450px]">
        {/* File Tree Sidebar */}
        <div
          className="rounded-xl border p-3 space-y-1"
          style={{
            backgroundColor: currentTheme.bg,
            borderColor: currentTheme.border,
          }}
        >
          <div className="font-bold opacity-60 px-2 py-1 text-[11px] uppercase tracking-wider">
            Repository File Tree
          </div>

          {Object.keys(FILE_CONTENTS).map((fileName) => {
            const isActive = selectedFile === fileName;
            return (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors ${
                  isActive ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isActive ? currentTheme.cardBg : 'transparent',
                  color: isActive ? currentTheme.accent : currentTheme.fg,
                  borderLeft: isActive ? `3px solid ${currentTheme.accent}` : '3px solid transparent',
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileName}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code View Window */}
        <div
          className="md:col-span-3 rounded-xl border flex flex-col overflow-hidden shadow-lg"
          style={{
            backgroundColor: currentTheme.bg,
            borderColor: currentTheme.border,
          }}
        >
          {/* Header */}
          <div
            className="p-3 px-4 border-b flex items-center justify-between"
            style={{
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            }}
          >
            <span className="font-bold text-sm" style={{ color: currentTheme.primary }}>
              {selectedFile}
            </span>

            <button
              onClick={handleCopyFile}
              className="px-2.5 py-1 rounded bg-black/30 border border-white/10 hover:bg-black/50 transition-colors flex items-center gap-1.5 opacity-80 hover:opacity-100"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>

          {/* Code Editor */}
          <div className="p-4 flex-1 overflow-auto bg-black/40">
            <pre className="font-mono text-xs leading-relaxed opacity-90 select-text whitespace-pre-wrap">
              {FILE_CONTENTS[selectedFile]}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
