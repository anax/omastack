import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Palette,
  ChevronDown,
  Layers,
  Search,
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
}> = [
  { id: 'landing', label: 'Overview' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'templates', label: 'Templates' },
  { id: 'system', label: 'Ports' },
  { id: 'codebase', label: 'Code' },
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
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLanding = activeTab === 'landing';

  return (
    <header
      className={`w-full h-12 px-4 transition-all duration-300 flex items-center justify-between text-xs font-mono select-none sticky top-0 z-40 backdrop-blur-md ${
        isLanding
          ? 'border-b border-white/[0.06]'
          : 'border-b border-white/10'
      }`}
      style={{
        backgroundColor: isLanding
          ? `${currentTheme.bg}40`
          : `${currentTheme.waybarBg}e6`,
        borderColor: isLanding ? `${currentTheme.border}26` : `${currentTheme.border}66`,
        color: currentTheme.fg,
      }}
    >
      {/* 1. LEFT: Brand & Quick Walker Search */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          title="OmaStack"
        >
          <OmaStackLogo size={20} showWordmark={true} />
        </div>

        <button
          onClick={onOpenWalkerMenu}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-white/75 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          title="Search sandboxes & commands (Super + Alt + Space)"
        >
          <Search className="w-3 h-3 text-white/80" />
          <span className="text-[10px] text-white/80">Search...</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-white/15 text-white/90 ml-0.5">⌘K</kbd>
        </button>
      </div>

      {/* 2. CENTER: Clean Minimalist Nav Tabs */}
      <nav className="flex items-center gap-1">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'font-bold text-white bg-white/15 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              style={{
                color: isActive ? currentTheme.primary : undefined,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 3. RIGHT: Clean Controls (Panel / Theme / Clock) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sandbox Panel Trigger */}
        <button
          onClick={onOpenWidgetPanel}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-white/85 hover:text-white hover:bg-white/10 transition-all border border-white/10 cursor-pointer"
          title="OmaStack Widget Panel (Super + Alt + W)"
        >
          <Layers className="w-3.5 h-3.5" />
          {activeStacks.length > 0 ? (
            <span
              className="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
              style={{ backgroundColor: `${currentTheme.primary}25`, color: currentTheme.primary }}
            >
              {activeStacks.length}
            </span>
          ) : (
            <span className="hidden md:inline text-[11px] text-white/85">Panel</span>
          )}
        </button>

        {/* Minimal Theme Switcher */}
        <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white/85 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-white/10">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <span className="hidden sm:inline text-[11px] font-semibold truncate max-w-[90px]">
            {currentTheme.name}
          </span>
          <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />

          <select
            value={currentTheme.key}
            onChange={(e) => onSelectTheme(e.target.value as OmarchyThemeKey)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Switch Theme (Press T)"
          >
            {Object.values(OMARCHY_THEMES).map((t) => (
              <option key={t.key} value={t.key} className="bg-gray-900 text-white">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clean Clock */}
        <span className="hidden lg:inline text-[11px] text-white/70 pl-1 font-mono font-medium">
          {time}
        </span>
      </div>
    </header>
  );
};
