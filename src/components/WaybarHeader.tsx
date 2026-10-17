import React, { useState, useEffect } from 'react';
import {
  Terminal,
  HardDrive,
  Palette,
  Layers,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { OmarchyTheme, OmarchyThemeKey, ActiveStack, WaybarPayload, SystemStats } from '../types';
import { OMARCHY_THEMES } from '../themes';
import { OmaStackLogo } from './OmaStackLogo';

interface WaybarHeaderProps {
  currentTheme: OmarchyTheme;
  onSelectTheme: (key: OmarchyThemeKey) => void;
  activeStacks: ActiveStack[];
  waybarStatus: WaybarPayload | null;
  systemStats: SystemStats | null;
  onOpenWalkerMenu: () => void;
  onOpenWidgetPanel: () => void;
  onStopAllStacks: () => void;
  activeTab: 'landing' | 'dashboard' | 'terminal' | 'templates' | 'codebase' | 'system';
  setActiveTab: (tab: 'landing' | 'dashboard' | 'terminal' | 'templates' | 'codebase' | 'system') => void;
}

const NAV_TABS: Array<{
  id: 'landing' | 'dashboard' | 'terminal' | 'templates' | 'system' | 'codebase';
  label: string;
  shortLabel?: string;
  hasSparkle?: boolean;
}> = [
  { id: 'landing', label: 'Overview', hasSparkle: true },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'terminal', label: 'Live CLI', shortLabel: 'CLI' },
  { id: 'templates', label: 'Templates' },
  { id: 'system', label: 'Ports & Caddy', shortLabel: 'Ports' },
  { id: 'codebase', label: 'Codebase & Install', shortLabel: 'Install' },
];

export const WaybarHeader: React.FC<WaybarHeaderProps> = ({
  currentTheme,
  onSelectTheme,
  activeStacks,
  waybarStatus,
  systemStats,
  onOpenWalkerMenu,
  onOpenWidgetPanel,
  onStopAllStacks,
  activeTab,
  setActiveTab,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalRamUsed = activeStacks.reduce((acc, s) => acc + (s.ramUsageMB || 0), 0);

  return (
    <header
      className="w-full h-13 px-3 sm:px-4 border-b transition-colors duration-200 flex flex-nowrap items-center justify-between text-xs font-mono select-none sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: `${currentTheme.waybarBg}f5`,
        borderColor: currentTheme.border,
        color: currentTheme.fg,
      }}
    >
      {/* 1. LEFT: Brand, Walker Menu & Hyprland Workspaces */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          title="OmaStack — Ephemeral Sandboxes for Omarchy Linux"
        >
          <OmaStackLogo size={22} showWordmark={true} />
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <button
          onClick={onOpenWalkerMenu}
          className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:brightness-110 shrink-0"
          style={{
            backgroundColor: currentTheme.primary,
            color: currentTheme.bg,
          }}
          title="Open Omarchy Walker Menu (Super + Alt + Space)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Omarchy</span>
        </button>

        {/* Workspaces Pill */}
        <div className="hidden lg:flex items-center gap-0.5 bg-black/30 p-0.5 rounded border border-white/10 text-[11px]">
          <span className="w-5 h-5 flex items-center justify-center rounded font-bold text-white bg-white/20">1</span>
          <span className="w-5 h-5 flex items-center justify-center rounded text-white/50 hover:bg-white/10 cursor-pointer">2</span>
          <span className="w-5 h-5 flex items-center justify-center rounded text-white/50 hover:bg-white/10 cursor-pointer">3</span>
        </div>
      </div>

      {/* 2. CENTER: Clean Segmented Navigation Tabs */}
      <nav className="flex items-center gap-0.5 sm:gap-1 bg-black/25 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mx-1.5 sm:mx-2 shrink min-w-0 max-w-fit">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive ? 'font-bold shadow-sm' : 'opacity-70 hover:opacity-100 hover:bg-white/5'
              }`}
              style={{
                backgroundColor: isActive ? currentTheme.cardBg : 'transparent',
                color: isActive ? currentTheme.accent : currentTheme.fg,
              }}
            >
              {tab.hasSparkle && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
              <span className="hidden xl:inline">{tab.label}</span>
              <span className="xl:hidden">{tab.shortLabel || tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. RIGHT: Unified Sandbox Status, RAM Gauge, Theme Switcher & Clock */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative z-30">
        {/* Unified Sandbox Status & Widget Panel Toggle (Official OmaStack Logo) */}
        <div
          className="group relative flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm transition-all cursor-pointer hover:border-white/30 shrink-0 z-20"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: activeStacks.length > 0 ? currentTheme.accent : currentTheme.border,
          }}
          onClick={onOpenWidgetPanel}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenWidgetPanel();
          }}
          title="Click to open OmaStack Panel Menu (Super + Alt + W)"
        >
          <OmaStackLogo size={16} />

          {activeStacks.length > 0 && (
            <span className="font-bold text-xs" style={{ color: currentTheme.accent }}>
              {activeStacks.length}
            </span>
          )}

          {activeStacks.length > 0 && totalRamUsed > 0 && (
            <span className="hidden sm:inline opacity-70 text-[10px]">
              {totalRamUsed}MB
            </span>
          )}

          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <span className="hidden sm:inline text-[11px] font-medium opacity-80">Panel</span>
            <kbd className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-white/10 opacity-60">W</kbd>
          </div>

          {/* Hover Tooltip */}
          <div
            className="absolute top-full mt-2.5 right-0 hidden group-hover:block z-50 w-72 p-3 rounded-lg shadow-2xl border text-[11px] backdrop-blur-md pointer-events-none"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.border,
              color: currentTheme.fg,
            }}
          >
            <div className="font-bold mb-1 flex items-center justify-between" style={{ color: currentTheme.primary }}>
              <span>OmaStack Bar Module</span>
              <span className="text-[10px] opacity-70">class: {waybarStatus?.class || 'idle'}</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono opacity-90 text-[10px] my-1">
              {`⚡ OmaStack: ${activeStacks.length} active sandbox${activeStacks.length === 1 ? '' : 'es'} [${totalRamUsed}MB RAM]\n\n• Left-Click: Toggle details panel\n• Right-Click: Display panel\n• Super + Alt + W: Widget shortcut`}
            </pre>
          </div>
        </div>

        {/* Real System RAM Chip (Desktop only) */}
        {systemStats && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-black/25 border border-white/10 text-[11px] opacity-80"
            title={`OS: ${systemStats.platform} (${systemStats.arch}) — ${systemStats.usedMemMB}/${systemStats.totalMemMB}MB`}
          >
            <HardDrive className="w-3 h-3 text-cyan-400" />
            <span>{Math.round((systemStats.usedMemMB / systemStats.totalMemMB) * 100)}% RAM</span>
          </div>
        )}

        {/* Styled Theme Selector Pill */}
        <div className="relative flex items-center gap-1.5 bg-black/30 hover:bg-black/50 px-2 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <span className="text-xs font-bold max-w-[70px] sm:max-w-none truncate" style={{ color: currentTheme.primary }}>
            {currentTheme.name}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
          <kbd className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-white/10 opacity-60">T</kbd>

          <select
            value={currentTheme.key}
            onChange={(e) => onSelectTheme(e.target.value as OmarchyThemeKey)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Change Theme (Press T to cycle)"
          >
            {Object.values(OMARCHY_THEMES).map((t) => (
              <option key={t.key} value={t.key} className="bg-gray-900 text-white">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clock */}
        <div
          className="hidden sm:block px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider border border-white/5"
          style={{ backgroundColor: currentTheme.cardBg, color: currentTheme.fg }}
        >
          {time}
        </div>
      </div>
    </header>
  );
};
