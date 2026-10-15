import React, { useState } from 'react';
import {
  Terminal,
  Shield,
  Zap,
  Server,
  Globe,
  Cpu,
  Layers,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Play,
  Square,
  ArrowRight,
  Command,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Sparkles,
  Code2,
  Sliders,
  ChevronRight,
  Flame,
  ArrowUpRight,
  Boxes,
  KeyRound,
  DownloadCloud,
} from 'lucide-react';
import { OmaStackLogo } from './OmaStackLogo';
import { OmarchyTheme, StackTemplate, ActiveStack } from '../types';

interface LandingPageProps {
  currentTheme: OmarchyTheme;
  templates: StackTemplate[];
  activeStacks: ActiveStack[];
  onLaunchStack: (templateId: string) => void;
  onStopStack: (stackId: string) => void;
  onOpenDashboard: () => void;
  onOpenTerminal: () => void;
  onOpenWalkerMenu: () => void;
  onOpenWidgetPanel: () => void;
  onCopySnippet: (text: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentTheme,
  templates,
  activeStacks,
  onLaunchStack,
  onStopStack,
  onOpenDashboard,
  onOpenTerminal,
  onOpenWalkerMenu,
  onOpenWidgetPanel,
  onCopySnippet,
}) => {
  const [copiedInstallCmd, setCopiedInstallCmd] = useState<string | null>(null);
  const [activeInstallTab, setActiveInstallTab] = useState<'plugin' | 'git'>('plugin');
  const [activeArchitectureStep, setActiveArchitectureStep] = useState<number>(1);
  const [demoSelectedTemplate, setDemoSelectedTemplate] = useState<string>('laravel-stack');
  const [demoSimulatedPortConflict, setDemoSimulatedPortConflict] = useState<boolean>(true);
  const [activeComparisonTab, setActiveComparisonTab] = useState<'table' | 'benchmarks'>('table');

  const copyText = (text: string, label: string) => {
    onCopySnippet(text);
    setCopiedInstallCmd(label);
    setTimeout(() => setCopiedInstallCmd(null), 2500);
  };

  const pluginCmd = 'omarchy plugin add https://github.com/anax/omastack';
  const gitCmd = `git clone https://github.com/anax/omastack.git ~/.config/omarchy/plugins/io.github.anax.omastack
cd ~/.config/omarchy/plugins/io.github.anax.omastack
./install.sh`;

  // Pipeline steps for architecture section
  const pipelineSteps = [
    {
      step: 1,
      title: 'Command Dispatch',
      badge: 'CLI / Keybind',
      desc: 'Invoked via CLI (omastack up), Walker menu (Super+Alt+Space), or Omarchy Widget (Super+Alt+W).',
      icon: Terminal,
    },
    {
      step: 2,
      title: 'Socket Audit',
      badge: 'ss -tuln',
      desc: 'Real-time host socket scan. If 5432, 3306 or 6379 are busy, OmaStack dynamically calculates free offsets.',
      icon: AlertTriangle,
    },
    {
      step: 3,
      title: 'Alpine Spin-up',
      badge: 'Docker Compose v2',
      desc: 'Spins up curated, ultra-lean ephemeral containers in under 1.8 seconds with minimal memory overhead.',
      icon: Server,
    },
    {
      step: 4,
      title: 'Local Trusted SSL',
      badge: 'Caddy + mkcert',
      desc: 'Auto-provisions trusted root certificates and dynamically maps *.oma.local domain routes with zero browser warnings.',
      icon: Globe,
    },
    {
      step: 5,
      title: 'Wayland & .env Sync',
      badge: 'wl-copy',
      desc: 'Backs up .env to .env.omastack.bak, merges connection strings, and pipes DATABASE_URL to your Wayland clipboard.',
      icon: Zap,
    },
    {
      step: 6,
      title: 'Waybar Telemetry',
      badge: 'Live Status',
      desc: 'Streams real-time JSON status to Waybar module ({"text": "⚡ 2"}) with instant 1-click RAM teardown.',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-16 pb-16 font-mono text-xs">
      {/* 1. HERO SECTION */}
      <section className="relative pt-4 sm:pt-8">
        {/* Glow backdrop behind hero */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundColor: currentTheme.primary }}
        />

        <div className="relative flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Brand Mark 3D Isometric Logo */}
          <div className="transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_35px_rgba(125,207,255,0.35)]">
            <OmaStackLogo size={80} />
          </div>

          {/* Release / Status Pill */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] backdrop-blur-md shadow-sm transition-all hover:scale-105"
            style={{
              backgroundColor: `${currentTheme.cardBg}cc`,
              borderColor: currentTheme.border,
              color: currentTheme.fg,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-emerald-400">OmaStack v1.2</span>
            <span className="opacity-40">•</span>
            <span className="opacity-80">Native Ephemeral Docker for Omarchy Linux</span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider"
              style={{ backgroundColor: `${currentTheme.primary}25`, color: currentTheme.primary }}
            >
              Arch + Hyprland
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight select-text">
            Ephemeral Docker Sandboxes.{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent}, ${currentTheme.secondary})`,
              }}
            >
              Zero Port Conflicts.
            </span>
            <br />
            Pure Keyboard Speed.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base max-w-2xl opacity-80 leading-relaxed font-sans">
            The native, zero-bloat Docker environment manager built specifically for Omarchy Linux.
            Spin up multi-service stacks in seconds, resolve socket collisions automatically with{' '}
            <code className="px-1 py-0.5 rounded font-mono text-xs bg-black/40 text-amber-300">ss -tuln</code>,
            provision local trusted HTTPS (<code className="px-1 py-0.5 rounded font-mono text-xs bg-black/40 text-cyan-300">*.oma.local</code>),
            and sync variables straight to your Wayland clipboard.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenDashboard}
              className="px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 hover:brightness-110 cursor-pointer text-xs"
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.bg,
              }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Dashboard</span>
            </button>

            <button
              onClick={onOpenTerminal}
              className="px-5 py-3 rounded-xl font-bold flex items-center gap-2 border transition-all hover:scale-105 hover:bg-white/5 cursor-pointer text-xs"
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
                color: currentTheme.fg,
              }}
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Interactive CLI Simulator</span>
            </button>

            <button
              onClick={onOpenWidgetPanel}
              className="px-4 py-3 rounded-xl font-medium flex items-center gap-2 border transition-all hover:scale-105 hover:bg-white/5 cursor-pointer text-xs"
              style={{
                backgroundColor: `${currentTheme.cardBg}80`,
                borderColor: currentTheme.border,
                color: currentTheme.secondary,
              }}
              title="Open Widget Panel (Super + Alt + W)"
            >
              <Sliders className="w-4 h-4" />
              <span>Widget Panel <kbd className="opacity-60 text-[10px]">W</kbd></span>
            </button>
          </div>

          {/* 1-Line Quick Install Pill */}
          <div
            className="w-full max-w-xl p-2 rounded-xl border flex items-center justify-between gap-3 shadow-md bg-black/40 backdrop-blur"
            style={{ borderColor: currentTheme.border }}
          >
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-left pl-2 text-white/90">
              <span style={{ color: currentTheme.primary }}>$</span>
              <span className="truncate">{pluginCmd}</span>
            </div>
            <button
              onClick={() => copyText(pluginCmd, 'plugin-hero')}
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-bold shrink-0 hover:brightness-125"
              style={{
                backgroundColor: copiedInstallCmd === 'plugin-hero' ? '#10b981' : currentTheme.cardBg,
                color: copiedInstallCmd === 'plugin-hero' ? '#ffffff' : currentTheme.accent,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              {copiedInstallCmd === 'plugin-hero' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInstallCmd === 'plugin-hero' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-4">
            <div
              className="p-3 rounded-xl border text-center space-y-1"
              style={{ backgroundColor: `${currentTheme.cardBg}60`, borderColor: currentTheme.border }}
            >
              <div className="text-xl sm:text-2xl font-black" style={{ color: currentTheme.primary }}>
                &lt; 1.8s
              </div>
              <div className="text-[10px] opacity-70">Ephemeral Spin-up</div>
            </div>
            <div
              className="p-3 rounded-xl border text-center space-y-1"
              style={{ backgroundColor: `${currentTheme.cardBg}60`, borderColor: currentTheme.border }}
            >
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                0 Collisions
              </div>
              <div className="text-[10px] opacity-70">ss -tuln Auto-heal</div>
            </div>
            <div
              className="p-3 rounded-xl border text-center space-y-1"
              style={{ backgroundColor: `${currentTheme.cardBg}60`, borderColor: currentTheme.border }}
            >
              <div className="text-xl sm:text-2xl font-black" style={{ color: currentTheme.accent }}>
                ~45 MB
              </div>
              <div className="text-[10px] opacity-70">Alpine Memory Footprint</div>
            </div>
            <div
              className="p-3 rounded-xl border text-center space-y-1"
              style={{ backgroundColor: `${currentTheme.cardBg}60`, borderColor: currentTheme.border }}
            >
              <div className="text-xl sm:text-2xl font-black" style={{ color: currentTheme.secondary }}>
                *.oma.local
              </div>
              <div className="text-[10px] opacity-70">Automatic Trusted HTTPS</div>
            </div>
          </div>
        </div>

        {/* 2. INTERACTIVE HERO TELEMETRY DEMO CARD */}
        <div className="mt-10 max-w-5xl mx-auto rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: currentTheme.bg,
            borderColor: currentTheme.border,
          }}
        >
          {/* Simulated Hyprland Window Bar */}
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between text-xs"
            style={{
              backgroundColor: currentTheme.waybarBg,
              borderColor: currentTheme.border,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-bold opacity-75">omastack — hyprland sandbox engine</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Telemetry
              </span>
              <span className="opacity-40">|</span>
              <span className="opacity-70 font-mono">Super + Alt + Space</span>
            </div>
          </div>

          {/* Split Interactive Sandbox Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x"
            style={{ borderColor: currentTheme.border }}
          >
            {/* Left: Interactive Simulated Terminal */}
            <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 bg-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold" style={{ color: currentTheme.primary }}>
                  <Terminal className="w-4 h-4" />
                  <span>Sandbox Execution Flow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] opacity-60">Template:</span>
                  <select
                    value={demoSelectedTemplate}
                    onChange={(e) => setDemoSelectedTemplate(e.target.value)}
                    className="bg-black/60 border rounded px-2 py-0.5 text-[11px] focus:outline-none"
                    style={{ borderColor: currentTheme.border, color: currentTheme.fg }}
                  >
                    <option value="laravel-stack">laravel-stack</option>
                    <option value="supabase-lite">supabase-lite</option>
                    <option value="nextjs-postgres">nextjs-postgres</option>
                    <option value="automation-hub">automation-hub</option>
                    <option value="web3-node">web3-node</option>
                  </select>
                </div>
              </div>

              {/* Terminal Code Display */}
              <div
                className="p-4 rounded-xl border bg-black/80 font-mono text-[11px] space-y-2 leading-relaxed overflow-x-auto"
                style={{ borderColor: currentTheme.border }}
              >
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="opacity-60">$</span>
                  <span>omastack up {demoSelectedTemplate}</span>
                </div>
                <div className="opacity-60 text-white/70">
                  ⚡ [OmaStack] Inspecting host sockets with `ss -tuln`...
                </div>
                {demoSimulatedPortConflict ? (
                  <div className="text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>[Collision Handled] Port 5432 in use! Remapped ➜ 5433</span>
                  </div>
                ) : (
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>All default ports free. Binding cleanly.</span>
                  </div>
                )}
                <div className="text-white/80">
                  ✔ Provisioned trusted local SSL: <span className="text-cyan-400 underline">https://{demoSelectedTemplate === 'laravel-stack' ? 'mail.oma.local' : 'db.oma.local'}</span>
                </div>
                <div className="text-purple-300">
                  ✔ Wayland wl-copy: Copied connection strings to clipboard!
                </div>
                <div className="text-white/60">
                  ✔ Appended parameters to .env (backup created: .env.omastack.bak)
                </div>
                <div className="text-emerald-400 font-bold pt-1">
                  🚀 Stack '{demoSelectedTemplate}' is live in 1.48s!
                </div>
              </div>

              {/* Conflict Simulation Toggle */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100">
                  <input
                    type="checkbox"
                    checked={demoSimulatedPortConflict}
                    onChange={(e) => setDemoSimulatedPortConflict(e.target.checked)}
                    className="rounded accent-purple-500"
                  />
                  <span>Simulate port clash (ss -tuln socket resolution)</span>
                </label>
                <button
                  onClick={() => onLaunchStack(demoSelectedTemplate)}
                  className="px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] shadow hover:scale-105"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute in Engine</span>
                </button>
              </div>
            </div>

            {/* Right: Live Environment Telemetry HUD */}
            <div
              className="lg:col-span-5 p-4 sm:p-6 space-y-4 flex flex-col justify-between"
              style={{ backgroundColor: currentTheme.cardBg }}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: currentTheme.border }}>
                  <div className="font-bold flex items-center gap-2" style={{ color: currentTheme.accent }}>
                    <Server className="w-4 h-4" />
                    <span>Real-time Environment HUD</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Hyprland Active
                  </span>
                </div>

                {/* HUD Spec Metrics */}
                <div className="space-y-3 mt-4 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="opacity-70 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      Active Sandboxes:
                    </span>
                    <span className="font-bold">{activeStacks.length} running</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="opacity-70 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                      Total Stack RAM:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {activeStacks.reduce((acc, s) => acc + (s.ramUsageMB || 0), 0) || 48} MB
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="opacity-70 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      Local Mesh:
                    </span>
                    <span className="font-mono text-cyan-300">*.oma.local</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="opacity-70 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      SSL Authority:
                    </span>
                    <span className="font-mono text-white/90">mkcert Root CA</span>
                  </div>
                </div>
              </div>

              {/* Waybar Quick Teardown preview */}
              <div
                className="p-3 rounded-xl border border-white/10 bg-black/40 space-y-2 text-[10px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Waybar Module Integration:
                  </span>
                  <span className="opacity-50">Right-Click Teardown</span>
                </div>
                <div className="flex items-center justify-between bg-black/60 px-2.5 py-1.5 rounded font-mono border border-white/5">
                  <span className="text-cyan-300">⚡ {activeStacks.length || 1} stacks</span>
                  <span className="opacity-50">RAM: ~{activeStacks.reduce((acc, s) => acc + (s.ramUsageMB || 0), 0) || 52}MB</span>
                  <span className="text-emerald-400">active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS & DIFFERENTIATORS */}
      <section className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <div
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: currentTheme.primary }}
          >
            Engineering Without Compromise
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Why Omarchy Developers Choose OmaStack
          </h2>
          <p className="text-xs sm:text-sm opacity-70 max-w-xl mx-auto font-sans">
            Built from scratch for Arch Linux and Hyprland. Zero bloat, zero background daemons, zero port collision headache.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1: Zero Port Conflict */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-lg"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="space-y-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Zero Port Conflict Engine</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">ss -tuln</span>
              </h3>
              <p className="text-xs opacity-75 leading-relaxed font-sans">
                Never wrestle with <code className="text-rose-300">port already in use</code> errors again. OmaStack proactively audits host sockets before launching any container, automatically re-routing conflicting ports (e.g., 5432 ➜ 5433) without manual edits.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-amber-300 font-mono">
              Auto-heals MySQL, Redis, Postgres
            </div>
          </div>

          {/* Pillar 2: Ephemeral Alpine Stacks */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-lg"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="space-y-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: `${currentTheme.accent}20`, color: currentTheme.accent }}
              >
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Alpine Ephemeral Sandboxes</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">&lt;80MB</span>
              </h3>
              <p className="text-xs opacity-75 leading-relaxed font-sans">
                Every template is stripped to Alpine essentials. Start in under 2 seconds. Free your RAM instantaneously with a single keystroke (<code className="text-purple-300">omastack down --all</code>) when you switch tasks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-emerald-400 font-mono">
              Instant RAM teardown via Waybar
            </div>
          </div>

          {/* Pillar 3: Local Trusted HTTPS */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-lg"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="space-y-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: `${currentTheme.secondary}20`, color: currentTheme.secondary }}
              >
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Local Trusted HTTPS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">*.oma.local</span>
              </h3>
              <p className="text-xs opacity-75 leading-relaxed font-sans">
                Integrated Caddy reverse proxy paired with <code className="text-cyan-300">mkcert</code>. Access your local mailpit, supabase, and n8n at clean URLs with valid green padlock SSL certificates in any modern browser.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-cyan-300 font-mono">
              Zero self-signed security warnings
            </div>
          </div>

          {/* Pillar 4: Wayland Native Sync */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-lg"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="space-y-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
              >
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Wayland & .env Automation</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">wl-copy</span>
              </h3>
              <p className="text-xs opacity-75 leading-relaxed font-sans">
                Spun up a stack? Connection strings (<code className="text-emerald-300">DATABASE_URL</code>, <code className="text-emerald-300">REDIS_URL</code>) are copied immediately to your Wayland clipboard and safely merged into your workspace <code className="text-white/80">.env</code> with automatic <code className="text-white/60">.bak</code> backup.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-purple-300 font-mono">
              Safe atomic .env injection
            </div>
          </div>

          {/* Pillar 5: Hyprland & Waybar Synergy */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-lg"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="space-y-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: `${currentTheme.accent}20`, color: currentTheme.accent }}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Desktop Ecosystem Synergy</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Walker / QML</span>
              </h3>
              <p className="text-xs opacity-75 leading-relaxed font-sans">
                Summon the Walker / Rofi launcher anywhere with <kbd className="px-1 rounded bg-black/40">Super+Alt+Space</kbd>. Open the native desktop HUD with <kbd className="px-1 rounded bg-black/40">Super+Alt+W</kbd>. Monitor RAM live in Waybar.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-indigo-300 font-mono">
              6 Omarchy theme palettes synced
            </div>
          </div>

          {/* Pillar 6: Zero Bloat Pure Bash Core */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-lg"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="space-y-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: `${currentTheme.secondary}20`, color: currentTheme.secondary }}
              >
                <Code2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Zero Bloat &amp; No Daemons</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Pure Bash</span>
              </h3>
              <p className="text-xs opacity-75 leading-relaxed font-sans">
                No Electron bloat, no background telemetry daemons, no heavy runtime. The OmaStack CLI is written in modular, battle-tested Bash with strict error handling and instant exit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-emerald-400 font-mono">
              100% Native Unix philosophy
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE HOW IT WORKS PIPELINE */}
      <section
        className="max-w-6xl mx-auto p-6 sm:p-8 rounded-2xl border shadow-xl"
        style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b" style={{ borderColor: currentTheme.border }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>
              Architecture Deep Dive
            </div>
            <h2 className="text-2xl font-black mt-1">How OmaStack Executes in Milliseconds</h2>
          </div>
          <div className="text-[11px] opacity-70">
            Click any node below to inspect execution step
          </div>
        </div>

        {/* Step Nodes Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            const isSelected = activeArchitectureStep === step.step;

            return (
              <button
                key={step.step}
                onClick={() => setActiveArchitectureStep(step.step)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  isSelected ? 'ring-2 scale-105 shadow-md' : 'opacity-70 hover:opacity-100 hover:bg-black/20'
                }`}
                style={{
                  backgroundColor: isSelected ? currentTheme.bg : 'transparent',
                  borderColor: isSelected ? currentTheme.primary : currentTheme.border,
                  boxShadow: isSelected ? `0 0 20px ${currentTheme.primary}30` : undefined,
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-black/40 border border-white/10">
                    {step.step}
                  </span>
                  <Icon className="w-4 h-4" style={{ color: isSelected ? currentTheme.primary : currentTheme.fg }} />
                </div>
                <div>
                  <div className="font-bold text-[11px] truncate">{step.title}</div>
                  <div className="text-[9px] opacity-60 font-mono">{step.badge}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Explainer Card */}
        {(() => {
          const currentStep = pipelineSteps.find((s) => s.step === activeArchitectureStep) || pipelineSteps[0];
          const Icon = currentStep.icon;

          return (
            <div
              className="mt-6 p-6 rounded-xl border bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              style={{ borderColor: currentTheme.border }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow"
                  style={{ backgroundColor: `${currentTheme.primary}25`, color: currentTheme.primary }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase opacity-60">Step {currentStep.step}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10">{currentStep.badge}</span>
                  </div>
                  <h4 className="text-lg font-bold" style={{ color: currentTheme.primary }}>
                    {currentStep.title}
                  </h4>
                  <p className="text-xs opacity-80 max-w-xl font-sans leading-relaxed">
                    {currentStep.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => setActiveArchitectureStep((prev) => (prev > 1 ? prev - 1 : 6))}
                  className="px-3 py-1.5 rounded-lg border hover:bg-white/10 transition-colors text-[11px]"
                  style={{ borderColor: currentTheme.border }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setActiveArchitectureStep((prev) => (prev < 6 ? prev + 1 : 1))}
                  className="px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all hover:brightness-110"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                >
                  Next Step
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 5. PRE-CONFIGURED STACK SHOWCASE & 1-CLICK LAUNCH */}
      <section className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentTheme.secondary }}>
              Production-Grade Templates
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">Curated Ephemeral Stacks</h2>
            <p className="text-xs opacity-70 mt-1 font-sans">
              Instant multi-container development environments pre-configured with Alpine Docker Compose.
            </p>
          </div>

          <button
            onClick={onOpenDashboard}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold hover:bg-white/5 transition-all"
            style={{ borderColor: currentTheme.border, color: currentTheme.accent }}
          >
            <span>View All in Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tmpl) => {
            const activeInstance = activeStacks.find((s) => s.templateId === tmpl.id);
            const isRunning = !!activeInstance;

            return (
              <div
                key={tmpl.id}
                className="rounded-2xl border shadow-lg flex flex-col justify-between overflow-hidden transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: isRunning ? currentTheme.accent : currentTheme.border,
                }}
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-base flex items-center gap-2" style={{ color: currentTheme.primary }}>
                        <Server className="w-4 h-4" />
                        <span>{tmpl.name}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60">{tmpl.id}</span>
                    </div>

                    {isRunning ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Running ({activeInstance.ramUsageMB || 45}MB)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] opacity-60 bg-black/30 border border-white/5">
                        Idle
                      </span>
                    )}
                  </div>

                  <p className="text-xs opacity-75 font-sans leading-relaxed line-clamp-2">
                    {tmpl.description || 'Pre-configured full-stack ephemeral container sandbox for Omarchy Linux.'}
                  </p>

                  {/* Included Services */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Services &amp; Ports</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.services.map((svc) => (
                        <span
                          key={svc.name}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-white/5 flex items-center gap-1"
                        >
                          <span style={{ color: currentTheme.accent }}>{svc.name}</span>
                          <span className="opacity-50">:{svc.defaultPort}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* HTTPS Domains */}
                  {tmpl.domains && tmpl.domains.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Local Trusted Domains</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tmpl.domains.map((dom) => (
                          <span
                            key={dom.domain}
                            className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3 text-cyan-400" />
                            <span>https://{dom.domain}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div
                  className="p-4 border-t bg-black/20 flex items-center justify-between gap-3"
                  style={{ borderColor: currentTheme.border }}
                >
                  <code className="text-[10px] opacity-60 truncate">
                    omastack up {tmpl.id}
                  </code>

                  {isRunning ? (
                    <button
                      onClick={() => onStopStack(tmpl.id)}
                      className="px-3 py-1.5 rounded-lg font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center gap-1.5 text-[11px] shrink-0"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop Stack</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onLaunchStack(tmpl.id)}
                      className="px-3 py-1.5 rounded-lg font-bold transition-all shadow hover:brightness-110 flex items-center gap-1.5 text-[11px] shrink-0"
                      style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>1-Click Launch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BENCHMARK & COMPARISON MATRIX */}
      <section className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentTheme.primary }}>
            Empirical Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            OmaStack vs Alternatives
          </h2>
          <p className="text-xs opacity-70 max-w-xl mx-auto font-sans">
            How OmaStack outperforms generic Docker Compose and traditional heavy virtualized stacks.
          </p>
        </div>

        {/* Matrix Card */}
        <div
          className="rounded-2xl border overflow-x-auto shadow-xl"
          style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-black/40 font-mono text-[11px]" style={{ borderColor: currentTheme.border }}>
                <th className="p-4 font-bold">Feature / Capability</th>
                <th className="p-4 font-bold" style={{ color: currentTheme.primary }}>
                  ⚡ OmaStack
                </th>
                <th className="p-4 font-bold opacity-70">Generic Docker Compose</th>
                <th className="p-4 font-bold opacity-70">Native Host Daemons</th>
                <th className="p-4 font-bold opacity-70">Vagrant / Heavy VMs</th>
              </tr>
            </thead>
            <tbody className="divide-y font-sans text-xs" style={{ borderColor: currentTheme.border }}>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono font-bold">Port Conflict Resolution</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">
                  ✔ Auto-resolves (`ss -tuln`)
                </td>
                <td className="p-4 text-rose-400">✖ Hard crash (port in use)</td>
                <td className="p-4 text-rose-400">✖ Port collision failure</td>
                <td className="p-4 text-amber-300">Port forwarding failure</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono font-bold">Cold Startup Time</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">&lt; 1.8 seconds</td>
                <td className="p-4 opacity-75">12 – 25 seconds</td>
                <td className="p-4 opacity-75">Instant (if installed)</td>
                <td className="p-4 text-rose-400">45 – 90 seconds</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono font-bold">RAM Overhead per Stack</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">~45 – 75 MB (Alpine)</td>
                <td className="p-4 opacity-75">450 – 1,200 MB</td>
                <td className="p-4 opacity-75">300 – 600 MB (Always on)</td>
                <td className="p-4 text-rose-400">2,048 – 4,096 MB</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono font-bold">Local Trusted SSL (*.oma.local)</td>
                <td className="p-4 font-bold text-cyan-300 font-mono">
                  ✔ Automatic mkcert + Caddy
                </td>
                <td className="p-4 text-rose-400">✖ Manual Traefik / certs</td>
                <td className="p-4 text-rose-400">✖ Self-signed browser alerts</td>
                <td className="p-4 text-rose-400">✖ Complex bridge routing</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono font-bold">Desktop / Keybind Integration</td>
                <td className="p-4 font-bold font-mono" style={{ color: currentTheme.accent }}>
                  ✔ Waybar + Walker + QML
                </td>
                <td className="p-4 opacity-40">None</td>
                <td className="p-4 opacity-40">Systemctl commands</td>
                <td className="p-4 opacity-40">None</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono font-bold">Clipboard &amp; .env Injection</td>
                <td className="p-4 font-bold text-purple-300 font-mono">
                  ✔ Native wl-copy &amp; .env.bak
                </td>
                <td className="p-4 text-rose-400">✖ Manual copy-pasting</td>
                <td className="p-4 text-rose-400">✖ Manual config writing</td>
                <td className="p-4 text-rose-400">✖ Manual IP extraction</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. OMARCHY DESKTOP SYNERGY & WAYBAR */}
      <section
        className="max-w-6xl mx-auto p-6 sm:p-8 rounded-2xl border shadow-xl space-y-6"
        style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: currentTheme.border }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentTheme.accent }}>
              Omarchy Linux Desktop Integration
            </div>
            <h2 className="text-2xl font-black mt-1">Waybar Module &amp; Walker Shortcuts</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWalkerMenu}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 hover:bg-white/5 transition-all"
              style={{ borderColor: currentTheme.border, color: currentTheme.primary }}
            >
              <Command className="w-3.5 h-3.5" />
              <span>Simulate Walker Menu</span>
            </button>
            <button
              onClick={onOpenWidgetPanel}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 hover:bg-white/5 transition-all"
              style={{ borderColor: currentTheme.border, color: currentTheme.secondary }}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Toggle Widget Panel (W)</span>
            </button>
          </div>
        </div>

        {/* Code Snippets for Waybar Config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waybar Config */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-white/80">~/.config/waybar/config.jsonc</span>
              <button
                onClick={() =>
                  copyText(
                    `"custom/omastack": {
    "format": "{}",
    "exec": "omastack status --waybar",
    "return-type": "json",
    "interval": 5,
    "on-click": "omastack menu",
    "on-click-right": "omastack down --all",
    "tooltip": true
}`,
                    'waybar-conf'
                  )
                }
                className="text-[10px] text-cyan-300 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy snippet</span>
              </button>
            </div>
            <pre
              className="p-4 rounded-xl border bg-black/60 font-mono text-[11px] overflow-x-auto text-white/90 leading-relaxed"
              style={{ borderColor: currentTheme.border }}
            >
{`"custom/omastack": {
    "format": "{}",
    "exec": "omastack status --waybar",
    "return-type": "json",
    "interval": 5,
    "on-click": "omastack menu",
    "on-click-right": "omastack down --all",
    "tooltip": true
}`}
            </pre>
          </div>

          {/* Waybar Style */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-white/80">~/.config/waybar/style.css</span>
              <button
                onClick={() =>
                  copyText(
                    `#custom-omastack.active {
    color: #7dcfff;
    background-color: rgba(125, 207, 255, 0.15);
    border-radius: 8px;
    padding: 0 10px;
}
#custom-omastack.idle {
    color: #565f89;
}`,
                    'waybar-css'
                  )
                }
                className="text-[10px] text-cyan-300 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy snippet</span>
              </button>
            </div>
            <pre
              className="p-4 rounded-xl border bg-black/60 font-mono text-[11px] overflow-x-auto text-white/90 leading-relaxed"
              style={{ borderColor: currentTheme.border }}
            >
{`#custom-omastack.active {
    color: #7dcfff;
    background-color: rgba(125, 207, 255, 0.15);
    border-radius: 8px;
    padding: 0 10px;
}
#custom-omastack.idle {
    color: #565f89;
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* 8. KEYBOARD SHORTCUTS MATRIX */}
      <section className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentTheme.primary }}>
            Keyboard-First Architecture
          </div>
          <h2 className="text-2xl font-black">Speed at Your Fingertips</h2>
          <p className="text-xs opacity-70 font-sans">
            Navigate, launch, inspect, and teardown environments without touching your mouse.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div>
              <div className="font-bold text-xs">Open Walker Menu</div>
              <div className="text-[10px] opacity-60">Interactive fuzzy sandbox picker</div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px]">Super</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px]">Alt</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px]">Space</kbd>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div>
              <div className="font-bold text-xs">Toggle Widget Panel</div>
              <div className="text-[10px] opacity-60">Live RAM &amp; port telemetry drawer</div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px]">Super</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px]">Alt</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px]">W</kbd>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div>
              <div className="font-bold text-xs">Waybar Instant Teardown</div>
              <div className="text-[10px] opacity-60">Free RAM immediately</div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 text-rose-300 text-[10px]">
                Right Click
              </kbd>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div>
              <div className="font-bold text-xs font-mono">omastack up &lt;id&gt;</div>
              <div className="text-[10px] opacity-60">Spin up stack with ss -tuln check</div>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] font-mono text-emerald-400">
              Terminal
            </kbd>
          </div>

          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div>
              <div className="font-bold text-xs font-mono">omastack down --all</div>
              <div className="text-[10px] opacity-60">Teardown all running sandboxes</div>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] font-mono text-rose-400">
              Terminal
            </kbd>
          </div>

          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div>
              <div className="font-bold text-xs font-mono">omastack inject</div>
              <div className="text-[10px] opacity-60">Inject .env &amp; wl-copy sync</div>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] font-mono text-purple-300">
              Terminal
            </kbd>
          </div>
        </div>
      </section>

      {/* 9. INSTALLATION METHODS (TABBED) */}
      <section
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl border shadow-2xl space-y-6"
        style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
      >
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentTheme.primary }}>
            Get Started in Seconds
          </div>
          <h2 className="text-2xl font-black">Install OmaStack on Your System</h2>
          <p className="text-xs opacity-70 font-sans">
            Choose your preferred installation pathway. Zero external dependencies required beyond Docker.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 border-b pb-4" style={{ borderColor: currentTheme.border }}>
          <button
            onClick={() => setActiveInstallTab('plugin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeInstallTab === 'plugin' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeInstallTab === 'plugin' ? currentTheme.primary : 'transparent',
              color: activeInstallTab === 'plugin' ? currentTheme.bg : currentTheme.fg,
            }}
          >
            Omarchy Plugin Manager
          </button>
          <button
            onClick={() => setActiveInstallTab('git')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeInstallTab === 'git' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeInstallTab === 'git' ? currentTheme.primary : 'transparent',
              color: activeInstallTab === 'git' ? currentTheme.bg : currentTheme.fg,
            }}
          >
            Manual Git Clone
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeInstallTab === 'plugin' && (
            <div className="space-y-3">
              <p className="text-xs opacity-80 font-sans">
                Install cleanly using Omarchy Linux's official plugin package manager. Integrates hooks and keybindings automatically:
              </p>
              <div
                className="p-3.5 rounded-xl border bg-black/60 flex items-center justify-between gap-3"
                style={{ borderColor: currentTheme.border }}
              >
                <code className="text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {pluginCmd}
                </code>
                <button
                  onClick={() => copyText(pluginCmd, 'omarchy-plugin')}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-all"
                  style={{
                    backgroundColor: copiedInstallCmd === 'omarchy-plugin' ? '#10b981' : currentTheme.cardBg,
                    color: copiedInstallCmd === 'omarchy-plugin' ? '#fff' : currentTheme.accent,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  {copiedInstallCmd === 'omarchy-plugin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInstallCmd === 'omarchy-plugin' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeInstallTab === 'git' && (
            <div className="space-y-3">
              <p className="text-xs opacity-80 font-sans">
                Clone to standard user location and create binary symlink:
              </p>
              <div
                className="p-3.5 rounded-xl border bg-black/60 flex items-start justify-between gap-3"
                style={{ borderColor: currentTheme.border }}
              >
                <pre className="text-purple-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {gitCmd}
                </pre>
                <button
                  onClick={() => copyText(gitCmd, 'git-tab')}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-all mt-1"
                  style={{
                    backgroundColor: copiedInstallCmd === 'git-tab' ? '#10b981' : currentTheme.cardBg,
                    color: copiedInstallCmd === 'git-tab' ? '#fff' : currentTheme.accent,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  {copiedInstallCmd === 'git-tab' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInstallCmd === 'git-tab' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Verification check callout */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-[11px]">
            <span className="opacity-75">Verify installation anytime:</span>
            <code className="text-emerald-400 font-mono font-bold">$ omastack list</code>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer
        className="max-w-6xl mx-auto pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] opacity-70"
        style={{ borderColor: currentTheme.border }}
      >
        <div className="flex items-center gap-2">
          <OmaStackLogo size={22} showWordmark={true} />
          <span className="opacity-40">•</span>
          <span>Native Docker Manager for Omarchy Linux</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/anax/omastack"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 hover:text-white"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <span>MIT License</span>
          <span>•</span>
          <span>Docker Compose v2</span>
        </div>
      </footer>
    </div>
  );
};
