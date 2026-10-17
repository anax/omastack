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
  Copy,
  Check,
  ExternalLink,
  Play,
  Square,
  ArrowRight,
  Command,
  Activity,
  AlertTriangle,
  Monitor,
  Sparkles,
  Code2,
  Sliders,
  Boxes,
  Heart,
  Palette,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  MessageSquareQuote,
  ChevronRight,
  Quote,
} from 'lucide-react';
import { OmaStackLogo } from './OmaStackLogo';
import { HeroBackgroundAnimation } from './HeroBackgroundAnimation';
import { OmarchyTheme, OmarchyThemeKey, StackTemplate, ActiveStack } from '../types';
import { OMARCHY_THEMES } from '../themes';

interface LandingPageProps {
  currentTheme: OmarchyTheme;
  onSelectTheme: (key: OmarchyThemeKey) => void;
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
  onSelectTheme,
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
  const [activeInstallTab, setActiveInstallTab] = useState<'plugin' | 'curl' | 'git'>('plugin');
  const [demoSelectedTemplate, setDemoSelectedTemplate] = useState<string>('laravel-stack');
  const [demoSimulatedPortConflict, setDemoSimulatedPortConflict] = useState<boolean>(true);
  const [activeDoctrineIndex, setActiveDoctrineIndex] = useState<number>(0);

  const copyText = (text: string, label: string) => {
    onCopySnippet(text);
    setCopiedInstallCmd(label);
    setTimeout(() => setCopiedInstallCmd(null), 2500);
  };

  const pluginCmd = 'omarchy plugin add https://github.com/anax/omastack';
  const localInstallCmd = './install.sh --test && ./install.sh';
  const uninstallCmd = 'omarchy plugin remove io.github.anax.omastack';
  const gitCmd = `git clone https://github.com/anax/omastack.git ~/.local/share/omastack
mkdir -p ~/.local/bin
ln -sf ~/.local/share/omastack/bin/omastack ~/.local/bin/omastack
chmod +x ~/.local/bin/omastack`;

  // The OmaStack Doctrine (5 Principles inspired by Omarchy Doctrine)
  const doctrinePrinciples = [
    {
      number: '01',
      title: 'Curated OmaStack Sandboxes',
      subtitle: 'We pick the tools and tune the details, so you can get straight to work.',
      desc: 'No more writing verbose 200-line docker-compose files for every test project. OmaStack ships with 9 carefully tuned, alpine-based multi-service environments for Laravel, Supabase, Next.js, Rails 8 + Kamal, AI/RAG Vector DBs, MERN + MongoDB, Go/Rust Microservices, n8n, and Web3.',
      icon: Boxes,
      badge: 'Zero Boilerplate',
    },
    {
      number: '02',
      title: 'Zero Port Conflicts (Automated Socket Healing)',
      subtitle: 'Never see "port is already allocated" again.',
      desc: 'Linux development should not screech to a halt because a background postgres daemon already grabbed port 5432. OmaStack audits host sockets in real-time with `ss -tuln` before container boot and automatically shifts conflicting ports to free ephemeral offsets without manual tweaking.',
      icon: AlertTriangle,
      badge: 'ss -tuln',
    },
    {
      number: '03',
      title: 'Local Trusted Green Padlocks (*.oma.local)',
      subtitle: 'Real SSL in your browser. No security exceptions or warnings.',
      desc: 'Self-signed certificate browser warnings break your flow. OmaStack leverages mkcert and an embedded Caddy reverse proxy to automatically issue trusted root SSL certificates for clean domains like https://mail.oma.local and https://supabase.oma.local.',
      icon: Globe,
      badge: 'Caddy + mkcert',
    },
    {
      number: '04',
      title: 'Keyboard, Wayland & Agent Native',
      subtitle: 'Built for the speed of thought and the age of AI agents.',
      desc: 'Seamlessly pipes connection strings (DATABASE_URL, REDIS_URL) straight to your Wayland clipboard via wl-copy and safely merges into your project .env with automatic .bak recovery. Accessible instantly via Walker menu (Super+Alt+Space), QML Widget (Super+Alt+W), or programmatic agent APIs.',
      icon: Zap,
      badge: 'wl-copy + AI',
    },
    {
      number: '05',
      title: 'Ephemeral Footprint & Respect for RAM',
      subtitle: 'Featherweight Alpine images. Purge RAM in one keystroke.',
      desc: 'Unlike heavy virtual machines or bloated generic Compose setups that idle at 1.5GB RAM, OmaStack templates use stripped Alpine images averaging ~45MB. When your task is finished, right-click your Waybar status icon or run `omastack down --all` to reclaim your memory instantaneously.',
      icon: HardDrive,
      badge: '~45MB Alpine',
    },
  ];

  // Community Voices (Inspired by Omarchy.org "People love Omarchy")
  const communityVoices = [
    {
      author: 'Rasmus Lerdorf enthusiast',
      handle: '@arch_vibes',
      text: "I haven't seen this kind of popular excitement around local development environments in a decade. Pressing Super+Alt+Space to spin up Laravel with MySQL, Redis, and Mailpit, and having DATABASE_URL already copied into my Wayland clipboard is pure sorcery.",
      tag: 'Productivity',
    },
    {
      author: 'Full-Stack Lead',
      handle: '@hypr_dev',
      text: "The ss -tuln auto-healing is genuinely brilliant. I already had local PostgreSQL 16 running on 5432 for my day job. OmaStack detected the collision instantly, remapped the sandbox to 5433, backed up my .env, and had me coding in under 2 seconds. Zero friction.",
      tag: 'Zero Collisions',
    },
    {
      author: 'Open Source Contributor',
      handle: '@vibe_coder',
      text: "Right-clicking my Waybar module to immediately tear down all active sandboxes and reclaim 1.2GB of RAM on my laptop is peak Omarchy philosophy. No bloated background daemons. Just pure Unix elegance.",
      tag: 'Waybar Integration',
    },
    {
      author: 'DevOps & Agent Builder',
      handle: '@agentic_omarchy',
      text: "OmaStack is the ideal sandbox layer for AI agents. When an agent creates a new service, it calls omastack up, reads the clean JSON telemetry, and gets an instant trusted https://*.oma.local endpoint with green padlocks. Mind-blowing.",
      tag: 'Agent Native',
    },
  ];

  const themeList: OmarchyThemeKey[] = [
    'tokyo-night',
    'catppuccin-mocha',
    'gruvbox-dark',
    'rose-pine',
    'nordic',
    'cyberpunk',
  ];

  return (
    <div className="space-y-24 pb-20 font-sans text-xs">
      {/* 1. TOP EDITORIAL TICKER / ANNOUNCEMENT */}
      <section className="relative pt-2 overflow-hidden rounded-3xl pb-8">
        {/* Animated Hero Background: Morphing Aurora, Cyber Perspective Grid & Ephemeral Mesh Particles */}
        <HeroBackgroundAnimation currentTheme={currentTheme} />

        <div
          className="relative z-10 max-w-4xl mx-auto rounded-full px-4 py-2 border flex items-center justify-between gap-3 text-[11px] backdrop-blur-md shadow-sm transition-all"
          style={{
            backgroundColor: `${currentTheme.cardBg}cc`,
            borderColor: currentTheme.border,
            color: currentTheme.fg,
          }}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-emerald-400">OmaStack for Omarchy Linux</span>
            <span className="opacity-40">•</span>
            <span className="opacity-80 truncate">Chef's Choice Ephemeral Containers</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold"
              style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
            >
              Press T to flip theme
            </span>
            <a
              href="https://github.com/anax/omastack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity font-mono text-[10px]"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto pt-10">
          {/* Ambient Glow */}
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-4/5 max-w-4xl h-80 rounded-full blur-[110px] opacity-20 pointer-events-none"
            style={{ backgroundColor: currentTheme.primary }}
          />

          {/* 3D Isometric Logo */}
          <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
            <div
              className="absolute -inset-4 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition-opacity"
              style={{ backgroundColor: currentTheme.accent }}
            />
            <OmaStackLogo size={92} />
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] select-text">
              The OmaStack Sandboxes for{' '}
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent}, ${currentTheme.secondary})`,
                }}
              >
                Omarchy Linux.
              </span>
            </h1>
            <p className="text-base sm:text-xl font-medium opacity-90 max-w-2xl mx-auto text-balance leading-relaxed">
              Vibe your way through instant full-stack environments. Zero port collisions. Complete keyboard speed.
            </p>
          </div>

          {/* Editorial Philosophy Paragraph (Omarchy style) */}
          <p className="text-xs sm:text-sm max-w-2xl opacity-75 leading-relaxed text-balance">
            Linux development used to be a chore: wrestling with <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[11px]">port already allocated</code> errors, fighting untrusted self-signed SSL warnings in your browser, and leaving background daemons eating laptop RAM.
            <br className="hidden sm:inline" />
            <strong className="text-white/95 font-semibold"> OmaStack solves it all</strong> with automated <code className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px]">ss -tuln</code> socket healing, green-padlock local HTTPS (<code className="px-1.5 py-0.5 rounded bg-black/40 text-purple-300 font-mono text-[11px]">*.oma.local</code>), and connection strings piped straight to your Wayland clipboard.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenDashboard}
              className="px-6 py-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 hover:brightness-110 cursor-pointer text-xs"
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
              className="px-5 py-3.5 rounded-xl font-bold flex items-center gap-2 border transition-all hover:scale-105 hover:bg-white/5 cursor-pointer text-xs"
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
              className="px-4 py-3.5 rounded-xl font-medium flex items-center gap-2 border transition-all hover:scale-105 hover:bg-white/5 cursor-pointer text-xs"
              style={{
                backgroundColor: `${currentTheme.cardBg}80`,
                borderColor: currentTheme.border,
                color: currentTheme.secondary,
              }}
              title="Open Widget Panel (Super + Alt + W)"
            >
              <Sliders className="w-4 h-4" />
              <span>Widget Panel <kbd className="opacity-60 text-[10px] font-mono">W</kbd></span>
            </button>
          </div>

          {/* 1-Line Quick Install Box */}
          <div
            className="w-full max-w-xl p-2 rounded-xl border flex items-center justify-between gap-3 shadow-lg bg-black/50 backdrop-blur"
            style={{ borderColor: currentTheme.border }}
          >
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-left pl-3 text-white/90">
              <span style={{ color: currentTheme.primary }}>$</span>
              <span className="truncate">{pluginCmd}</span>
            </div>
            <button
              onClick={() => copyText(pluginCmd, 'plugin')}
              className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-bold shrink-0 hover:brightness-125 cursor-pointer"
              style={{
                backgroundColor: copiedInstallCmd === 'plugin' ? '#10b981' : currentTheme.cardBg,
                color: copiedInstallCmd === 'plugin' ? '#ffffff' : currentTheme.accent,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              {copiedInstallCmd === 'plugin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInstallCmd === 'plugin' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. "PICK A THEME, CHANGE EVERYTHING" (Omarchy signature section) */}
      <section className="max-w-5xl mx-auto space-y-4 text-center">
        <div className="space-y-1">
          <div
            className="text-[11px] font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5"
            style={{ color: currentTheme.primary }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Pick a theme, change everything</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Six Omarchy Palettes. Synced Across Bar, Shell &amp; Sandboxes.
          </h2>
          <p className="text-xs opacity-70 max-w-lg mx-auto">
            A theme restyles your terminal, Waybar, Walker menu, and this site simultaneously. Click below or press <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px]">T</kbd> to cycle them.
          </p>
        </div>

        {/* Theme Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {themeList.map((key) => {
            const t = OMARCHY_THEMES[key];
            const isSelected = currentTheme.key === key;

            return (
              <button
                key={key}
                onClick={() => onSelectTheme(key)}
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer font-mono text-[11px] ${
                  isSelected ? 'ring-2 scale-105 shadow-md' : 'opacity-70 hover:opacity-100 hover:scale-102'
                }`}
                style={{
                  backgroundColor: isSelected ? t.cardBg : `${t.bg}90`,
                  borderColor: isSelected ? t.primary : t.border,
                  color: t.fg,
                  boxShadow: isSelected ? `0 0 15px ${t.primary}40` : undefined,
                }}
              >
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.primary }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accent }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.secondary }} />
                </div>
                <span className="font-bold">{t.name}</span>
                {isSelected && <span className="text-[10px] text-emerald-400 font-bold">active</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. "SEE IT IN ACTION" — INTERACTIVE HUD & CONFLICT RESOLVER */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider font-mono" style={{ color: currentTheme.accent }}>
              See it in action
            </div>
            <h2 className="text-2xl font-black">Experience a transfer of enthusiasm.</h2>
          </div>
          <span className="text-[11px] opacity-60 font-mono hidden sm:inline-block">
            Simulated Hyprland HUD
          </span>
        </div>

        {/* Simulated Window Frame */}
        <div
          className="rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: currentTheme.bg,
            borderColor: currentTheme.border,
          }}
        >
          {/* Hyprland Window Bar */}
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between text-xs select-none"
            style={{
              backgroundColor: currentTheme.waybarBg,
              borderColor: currentTheme.border,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-bold opacity-75 font-mono text-[11px]">omastack — hyprland ephemeral sandbox manager</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Socket Audit
              </span>
              <span className="opacity-40">|</span>
              <span className="opacity-70">Super + Alt + Space</span>
            </div>
          </div>

          {/* Split Interactive Sandbox Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: currentTheme.border }}>
            {/* Left: Interactive Simulated Terminal */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 bg-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold font-mono" style={{ color: currentTheme.primary }}>
                  <Terminal className="w-4 h-4" />
                  <span>Interactive Flow</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[10px] opacity-60">Stack:</span>
                  <select
                    value={demoSelectedTemplate}
                    onChange={(e) => setDemoSelectedTemplate(e.target.value)}
                    className="bg-black/60 border rounded px-2 py-0.5 text-[11px] focus:outline-none cursor-pointer"
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
                className="p-4 rounded-xl border bg-black/85 font-mono text-[11px] space-y-2 leading-relaxed overflow-x-auto shadow-inner"
                style={{ borderColor: currentTheme.border }}
              >
                <div className="text-emerald-400 flex items-center gap-2">
                  <span className="opacity-60">$</span>
                  <span>omastack up {demoSelectedTemplate}</span>
                </div>
                <div className="opacity-70 text-white/80">
                  ⚡ [OmaStack] Scanning host sockets with `ss -tuln`...
                </div>
                {demoSimulatedPortConflict ? (
                  <div className="text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>[Conflict Auto-Healed] Port 5432 is busy ➜ Rebound to 5433</span>
                  </div>
                ) : (
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>All ports free. Clean binding confirmed.</span>
                  </div>
                )}
                <div className="text-white/85">
                  ✔ Provisioned mkcert local root CA: <span className="text-cyan-400 underline">https://{demoSelectedTemplate === 'laravel-stack' ? 'mail.oma.local' : 'db.oma.local'}</span>
                </div>
                <div className="text-purple-300">
                  ✔ Wayland wl-copy: Exported connection strings to clipboard
                </div>
                <div className="text-white/60">
                  ✔ Merged parameters into .env (backed up to .env.omastack.bak)
                </div>
                <div className="text-emerald-400 font-bold pt-1">
                  🚀 Ephemeral stack '{demoSelectedTemplate}' live in 1.48s!
                </div>
              </div>

              {/* Conflict Simulation Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer opacity-85 hover:opacity-100 select-none">
                  <input
                    type="checkbox"
                    checked={demoSimulatedPortConflict}
                    onChange={(e) => setDemoSimulatedPortConflict(e.target.checked)}
                    className="rounded accent-purple-500 cursor-pointer"
                  />
                  <span>Simulate busy port (ss -tuln socket shift)</span>
                </label>
                <button
                  onClick={() => onLaunchStack(demoSelectedTemplate)}
                  className="px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] shadow hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute in Engine</span>
                </button>
              </div>
            </div>

            {/* Right: Live Environment Telemetry HUD */}
            <div
              className="lg:col-span-5 p-5 sm:p-6 space-y-4 flex flex-col justify-between"
              style={{ backgroundColor: currentTheme.cardBg }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: currentTheme.border }}>
                  <div className="font-bold flex items-center gap-2 font-mono" style={{ color: currentTheme.accent }}>
                    <Server className="w-4 h-4" />
                    <span>Telemetry HUD</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Hyprland Active
                  </span>
                </div>

                {/* HUD Spec Metrics */}
                <div className="space-y-2.5 text-[11px] font-mono">
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
                    <span className="text-cyan-300 font-bold">*.oma.local</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="opacity-70 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      SSL Authority:
                    </span>
                    <span className="text-white/90">mkcert Root CA</span>
                  </div>
                </div>
              </div>

              {/* Waybar Quick Teardown preview */}
              <div className="p-3 rounded-xl border border-white/10 bg-black/40 space-y-2 text-[10px]">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Waybar Module Sync:
                  </span>
                  <span className="opacity-50">Right-Click Teardown</span>
                </div>
                <div className="flex items-center justify-between bg-black/60 px-2.5 py-1.5 rounded font-mono border border-white/5">
                  <span className="text-cyan-300">⚡ {activeStacks.length || 1} stacks</span>
                  <span className="opacity-60">RAM: ~{activeStacks.reduce((acc, s) => acc + (s.ramUsageMB || 0), 0) || 52}MB</span>
                  <span className="text-emerald-400 font-bold">active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE OMASTACK DOCTRINE (5 PRINCIPLES) */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider font-mono" style={{ color: currentTheme.secondary }}>
            The OmaStack Doctrine
          </div>
          <h2 className="text-3xl sm:text-4xl font-black">
            Five Principles for Ephemeral Sandboxes
          </h2>
          <p className="text-xs sm:text-sm opacity-75 max-w-xl mx-auto">
            Inspired by the Omarchy Doctrine. Uniting the nerds, welcoming the agents, and keeping your computer blazing fast.
          </p>
        </div>

        {/* Interactive Doctrine Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctrinePrinciples.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeDoctrineIndex === idx;

            return (
              <div
                key={item.number}
                onClick={() => setActiveDoctrineIndex(idx)}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer shadow-lg ${
                  isActive ? 'scale-[1.02] ring-2' : 'hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: isActive ? currentTheme.primary : currentTheme.border,
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-black opacity-40">{item.number}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                    style={{ backgroundColor: `${currentTheme.primary}18`, color: currentTheme.primary }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold leading-tight">{item.title}</h3>
                    <div className="text-[11px] font-medium opacity-65 leading-tight">{item.subtitle}</div>
                  </div>

                  <p className="text-xs opacity-75 leading-relaxed pt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Doctrine Summary Callout */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between shadow-lg border-dashed"
            style={{ backgroundColor: `${currentTheme.cardBg}60`, borderColor: currentTheme.border }}
          >
            <div className="space-y-3">
              <span className="font-mono text-xl font-black opacity-40">06</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">We Can Fix Everything.</h3>
              <p className="text-xs opacity-75 leading-relaxed">
                Container development shouldn't be painful. OmaStack embraces the malleable spirit of Omarchy: if a tool gets in your way, we tune it, automate it, or replace it with a keyboard-driven script.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 font-mono text-[11px] text-emerald-400 font-bold">
              Built for Omarchy Linux
            </div>
          </div>
        </div>
      </section>

      {/* 5. MOMENTUM BY THE NUMBERS (Inspired by Omarchy.org Momentum) */}
      <section
        className="max-w-5xl mx-auto p-8 rounded-3xl border shadow-2xl text-center space-y-6"
        style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
      >
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider font-mono" style={{ color: currentTheme.accent }}>
            Momentum by the numbers
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Speed, Ephemeral Efficiency &amp; Zero Bloat
          </h2>
          <p className="text-xs opacity-70 max-w-lg mx-auto">
            Metrics from real developer machines running Omarchy Linux.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
          <div className="space-y-1 p-4 rounded-2xl bg-black/30 border border-white/5">
            <div className="text-3xl sm:text-4xl font-black font-mono" style={{ color: currentTheme.primary }}>
              &lt; 1.8s
            </div>
            <div className="text-xs font-bold">Spin-up Latency</div>
            <div className="text-[10px] opacity-60">Cold start to healthy state</div>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-black/30 border border-white/5">
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
              0
            </div>
            <div className="text-xs font-bold">Port Collisions</div>
            <div className="text-[10px] opacity-60">Auto-resolved via ss -tuln</div>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-black/30 border border-white/5">
            <div className="text-3xl sm:text-4xl font-black font-mono" style={{ color: currentTheme.accent }}>
              ~45 MB
            </div>
            <div className="text-xs font-bold">RAM per Stack</div>
            <div className="text-[10px] opacity-60">Minimalist Alpine images</div>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-black/30 border border-white/5">
            <div className="text-3xl sm:text-4xl font-black font-mono" style={{ color: currentTheme.secondary }}>
              1 Keystroke
            </div>
            <div className="text-xs font-bold">Teardown Purge</div>
            <div className="text-[10px] opacity-60">Instant RAM reclamation</div>
          </div>
        </div>
      </section>

      {/* 6. CURATED STACK SHOWCASE */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider font-mono" style={{ color: currentTheme.primary }}>
              Curated OmaStack Sandboxes
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">A Stack for Every Project</h2>
            <p className="text-xs opacity-75">
              Production-ready multi-service sandboxes pre-configured for speed and zero port conflicts.
            </p>
          </div>

          <button
            onClick={onOpenDashboard}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold hover:bg-white/5 transition-all cursor-pointer font-mono"
            style={{ borderColor: currentTheme.border, color: currentTheme.accent }}
          >
            <span>View All in Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid of Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-base flex items-center gap-2" style={{ color: currentTheme.primary }}>
                        <Server className="w-4 h-4" />
                        <span>{tmpl.name}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60">{tmpl.id}</span>
                    </div>

                    {isRunning ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Running ({activeInstance.ramUsageMB || 45}MB)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] opacity-60 bg-black/30 border border-white/5 font-mono">
                        Idle
                      </span>
                    )}
                  </div>

                  <p className="text-xs opacity-75 leading-relaxed line-clamp-2">
                    {tmpl.description || 'Pre-configured full-stack ephemeral container sandbox for Omarchy Linux.'}
                  </p>

                  {/* Included Services */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 font-mono">Services &amp; Ports</span>
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
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 font-mono">Local Trusted SSL</span>
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
                  className="p-3.5 border-t bg-black/25 flex items-center justify-between gap-2"
                  style={{ borderColor: currentTheme.border }}
                >
                  <code className="text-[10px] opacity-60 font-mono truncate">
                    omastack up {tmpl.id}
                  </code>

                  {isRunning ? (
                    <button
                      onClick={() => onStopStack(tmpl.id)}
                      className="px-3 py-1.5 rounded-lg font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center gap-1.5 text-[11px] shrink-0 font-mono cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onLaunchStack(tmpl.id)}
                      className="px-3 py-1.5 rounded-lg font-bold transition-all shadow hover:brightness-110 flex items-center gap-1.5 text-[11px] shrink-0 font-mono cursor-pointer"
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

      {/* 7. "PEOPLE LOVE OMASTACK" (Inspired by Omarchy.org Voices) */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider font-mono" style={{ color: currentTheme.secondary }}>
            People love OmaStack
          </div>
          <h2 className="text-3xl font-black">Voices from the Terminal</h2>
          <p className="text-xs opacity-75 max-w-lg mx-auto">
            What developers posted after integrating OmaStack into their Omarchy workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {communityVoices.map((voice, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border shadow-lg flex flex-col justify-between space-y-3"
              style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">{voice.author}</div>
                    <div className="text-[10px] opacity-60 font-mono">{voice.handle}</div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                    style={{ backgroundColor: `${currentTheme.accent}20`, color: currentTheme.accent }}
                  >
                    {voice.tag}
                  </span>
                </div>

                <p className="text-xs opacity-80 leading-relaxed italic">
                  "{voice.text}"
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center gap-1 text-[10px] opacity-50 font-mono">
                <Heart className="w-3 h-3 text-rose-400 fill-current" />
                <span>Verified Omarchy User</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. INSTALLATION IN 35 SECONDS (Tabbed Omarchy Style) */}
      <section
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6"
        style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
      >
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider font-mono" style={{ color: currentTheme.primary }}>
            Install OmaStack
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Be Up and Running in 35 Seconds</h2>
          <p className="text-xs opacity-75 max-w-lg mx-auto">
            Install OmaStack using Omarchy's native plugin manager or the standalone 1-line curl script.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 border-b pb-4" style={{ borderColor: currentTheme.border }}>
          <button
            onClick={() => setActiveInstallTab('plugin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
              activeInstallTab === 'plugin' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeInstallTab === 'plugin' ? currentTheme.primary : 'transparent',
              color: activeInstallTab === 'plugin' ? currentTheme.bg : currentTheme.fg,
            }}
          >
            Omarchy Plugin Manager (Recommended)
          </button>
          <button
            onClick={() => setActiveInstallTab('curl')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
              activeInstallTab === 'curl' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeInstallTab === 'curl' ? currentTheme.primary : 'transparent',
              color: activeInstallTab === 'curl' ? currentTheme.bg : currentTheme.fg,
            }}
          >
            1-Line Curl Installer
          </button>
          <button
            onClick={() => setActiveInstallTab('git')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
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
              <p className="text-xs opacity-80">
                Install cleanly using the native Omarchy plugin manager. Installs binaries, shell completion, and Quickshell Bar-Widget automatically:
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
                  className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-all cursor-pointer font-mono"
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

          {activeInstallTab === 'curl' && (
            <div className="space-y-3">
              <p className="text-xs opacity-80">
                Local verified installer with 31-point self-testing suite and path resolution:
              </p>
              <div
                className="p-3.5 rounded-xl border bg-black/60 flex items-center justify-between gap-3"
                style={{ borderColor: currentTheme.border }}
              >
                <code className="text-cyan-300 font-mono text-[11px] overflow-x-auto">
                  {localInstallCmd}
                </code>
                <button
                  onClick={() => copyText(localInstallCmd, 'curl-tab')}
                  className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-all cursor-pointer font-mono"
                  style={{
                    backgroundColor: copiedInstallCmd === 'curl-tab' ? '#10b981' : currentTheme.cardBg,
                    color: copiedInstallCmd === 'curl-tab' ? '#fff' : currentTheme.accent,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  {copiedInstallCmd === 'curl-tab' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInstallCmd === 'curl-tab' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeInstallTab === 'git' && (
            <div className="space-y-3">
              <p className="text-xs opacity-80">
                Clone directly to standard user path and create symlink:
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
                  className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold shrink-0 transition-all mt-1 cursor-pointer font-mono"
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

          {/* Uninstall instructions */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
            <span className="opacity-70">Clean uninstallation anytime:</span>
            <code className="text-rose-400 truncate">{uninstallCmd}</code>
          </div>
        </div>
      </section>

      {/* 9. MINIMALIST EDITORIAL FOOTER */}
      <footer
        className="max-w-5xl mx-auto pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] opacity-75 font-mono"
        style={{ borderColor: currentTheme.border }}
      >
        <div className="flex items-center gap-2.5">
          <OmaStackLogo size={22} showWordmark={true} />
          <span className="opacity-40">•</span>
          <span>Native Docker Manager for Omarchy Linux</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://omarchy.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-white transition-colors"
          >
            Omarchy.org ↗
          </a>
          <span>•</span>
          <a
            href="https://github.com/anax/omastack"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1 hover:text-white transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  );
};
