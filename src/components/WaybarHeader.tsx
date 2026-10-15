import React, { useState, useEffect } from 'react';
import { Terminal, HardDrive, Palette, Power, RefreshCw, Cpu, Activity } from 'lucide-react';
import { OmarchyTheme, OmarchyThemeKey, ActiveStack, WaybarPayload, SystemStats } from '../types';
import { OMARCHY_THEMES } from '../themes';

interface WaybarHeaderProps {
  currentTheme: OmarchyTheme;
  onSelectTheme: (key: OmarchyThemeKey) => void;
  activeStacks: ActiveStack[];
  waybarStatus: WaybarPayload | null;
  systemStats: SystemStats | null;
  onOpenWalkerMenu: () => void;
  onStopAllStacks: () => void;
  activeTab: 'dashboard' | 'terminal' | 'templates' | 'codebase' | 'system';
  setActiveTab: (tab: 'dashboard' | 'terminal' | 'templates' | 'codebase' | 'system') => void;
}

export const WaybarHeader: React.FC<WaybarHeaderProps> = ({
  currentTheme,
  onSelectTheme,
  activeStacks,
  waybarStatus,
  systemStats,
  onOpenWalkerMenu,
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

  return (
    <header
      className="w-full border-b transition-colors duration-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono select-none"
      style={{
        backgroundColor: currentTheme.waybarBg,
        borderColor: currentTheme.border,
        color: currentTheme.fg,
      }}
    >
      {/* Left: Waybar Hyprland Workspace & Omarchy Launcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenWalkerMenu}
          className="px-2.5 py-1 rounded font-bold flex items-center gap-1.5 transition-all shadow-sm hover:brightness-110"
          style={{
            backgroundColor: currentTheme.primary,
            color: currentTheme.bg,
          }}
          title="Open Omarchy Walker Menu (Super + Alt + Space)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Omarchy</span>
        </button>

        {/* Workspaces */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded border border-white/10">
          <span className="w-5 h-5 flex items-center justify-center rounded font-bold text-white bg-white/20">1</span>
          <span className="w-5 h-5 flex items-center justify-center rounded text-white/50 hover:bg-white/10 cursor-pointer">2</span>
          <span className="w-5 h-5 flex items-center justify-center rounded text-white/50 hover:bg-white/10 cursor-pointer">3</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'dashboard' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'dashboard' ? currentTheme.cardBg : 'transparent',
              color: activeTab === 'dashboard' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'terminal' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'terminal' ? currentTheme.cardBg : 'transparent',
              color: activeTab === 'terminal' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Live CLI
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'templates' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'templates' ? currentTheme.cardBg : 'transparent',
              color: activeTab === 'templates' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'system' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'system' ? currentTheme.cardBg : 'transparent',
              color: activeTab === 'system' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Ports & Caddy
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'codebase' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'codebase' ? currentTheme.cardBg : 'transparent',
              color: activeTab === 'codebase' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Codebase & Install
          </button>
        </div>
      </div>

      {/* Center: Live Waybar OmaStack JSON Status Pill directly from `omastack status --waybar` */}
      <div className="flex items-center gap-3">
        <div
          className="group relative flex items-center gap-2 px-3.5 py-1 rounded-full border shadow-sm transition-all cursor-pointer"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: activeStacks.length > 0 ? currentTheme.accent : currentTheme.border,
          }}
          onClick={onOpenWalkerMenu}
          onContextMenu={(e) => {
            e.preventDefault();
            onStopAllStacks();
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeStacks.length > 0 ? 'bg-emerald-400' : 'bg-gray-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                activeStacks.length > 0 ? 'bg-emerald-500' : 'bg-gray-500'
              }`}
            ></span>
          </span>
          <span className="font-bold" style={{ color: currentTheme.accent }}>
            {waybarStatus?.text || `⚡ ${activeStacks.length}`}
          </span>
          {activeStacks.length > 0 && (
            <span className="opacity-70 border-l border-white/20 pl-2 text-[10px]">
              {activeStacks.reduce((acc, s) => acc + (s.ramUsageMB || 0), 0)} MB
            </span>
          )}

          {/* Real Tooltip from omastack status --waybar */}
          <div
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-72 p-3 rounded-lg shadow-2xl border text-[11px] backdrop-blur-md pointer-events-none"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.border,
              color: currentTheme.fg,
            }}
          >
            <div className="font-bold mb-1 flex items-center justify-between" style={{ color: currentTheme.primary }}>
              <span>Waybar Module Tooltip (Live)</span>
              <span className="text-[10px] opacity-70">class: {waybarStatus?.class || 'idle'}</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono opacity-90 text-[10px] my-1">
              {waybarStatus?.tooltip || '⚡ OmaStack: No active sandboxes\n\n[Left-Click] Open Menu\n[Right-Click] Stop All Stacks'}
            </pre>
          </div>
        </div>
      </div>

      {/* Right: Theme Selector, System Stats & Clock */}
      <div className="flex items-center gap-3">
        {/* Real System RAM from OS */}
        {systemStats && (
          <div className="hidden lg:flex items-center gap-1.5 opacity-80" title={`OS: ${systemStats.platform} (${systemStats.arch})`}>
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>RAM: {systemStats.usedMemMB}/{systemStats.totalMemMB}MB</span>
          </div>
        )}

        {/* Theme Picker */}
        <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/10">
          <Palette className="w-3.5 h-3.5 opacity-70" />
          <select
            value={currentTheme.key}
            onChange={(e) => onSelectTheme(e.target.value as OmarchyThemeKey)}
            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer font-bold"
            style={{ color: currentTheme.primary }}
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
          className="px-2 py-1 rounded font-bold tracking-wider"
          style={{ backgroundColor: currentTheme.cardBg, color: currentTheme.fg }}
        >
          {time}
        </div>
      </div>
    </header>
  );
};
