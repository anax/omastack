import React, { useState, useEffect } from 'react';
import { Search, Play, Square, List, Key, Shield, FileText, Trash2, X, Terminal } from 'lucide-react';
import { OmarchyTheme, StackTemplate, ActiveStack } from '../types';

interface WalkerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: OmarchyTheme;
  templates: StackTemplate[];
  activeStacks: ActiveStack[];
  onLaunchStack: (templateId: string) => void;
  onStopStack: (stackId: string) => void;
  onStopAllStacks: () => void;
  onInjectEnv: () => void;
  onViewLogs: (stackId: string) => void;
}

export const WalkerMenuModal: React.FC<WalkerMenuModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  templates,
  activeStacks,
  onLaunchStack,
  onStopStack,
  onStopAllStacks,
  onInjectEnv,
  onViewLogs,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Menu items list
  const menuItems = [
    ...templates.map((t) => ({
      type: 'launch',
      id: t.id,
      label: `Up ${t.name}`,
      subLabel: t.description,
      icon: Play,
      action: () => {
        onLaunchStack(t.id);
        onClose();
      },
    })),
    ...activeStacks.map((s) => ({
      type: 'stop',
      id: s.id,
      label: `Down ${s.name}`,
      subLabel: `Stop stack and free ${s.ramUsageMB}MB RAM`,
      icon: Square,
      action: () => {
        onStopStack(s.id);
        onClose();
      },
    })),
    {
      type: 'inject',
      id: 'inject-env',
      label: 'Inject .env to current directory',
      subLabel: 'Back up existing .env to .env.omastack.bak & append connection strings',
      icon: Key,
      action: () => {
        onInjectEnv();
        onClose();
      },
    },
    {
      type: 'stop-all',
      id: 'stop-all',
      label: 'Teardown All Stacks',
      subLabel: 'Stop all running containers & free memory immediately',
      icon: Trash2,
      action: () => {
        onStopAllStacks();
        onClose();
      },
    },
  ];

  const filteredItems = menuItems.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.subLabel.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation for Walker (Up/Down arrow, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden flex flex-col font-mono text-sm animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
          color: currentTheme.fg,
        }}
      >
        {/* Search Header */}
        <div
          className="p-4 border-b flex items-center gap-3"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg }}
        >
          <Search className="w-5 h-5 opacity-70" style={{ color: currentTheme.accent }} />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search OmaStack commands or templates... (Super + Alt + Space)"
            className="w-full bg-transparent border-none outline-none font-medium placeholder:opacity-40"
            style={{ color: currentTheme.fg }}
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Instructions Bar */}
        <div className="px-4 py-1.5 text-[11px] opacity-60 flex justify-between border-b border-white/5">
          <span>Navigate: <kbd className="px-1 rounded bg-black/30 border border-white/20">↑</kbd> <kbd className="px-1 rounded bg-black/30 border border-white/20">↓</kbd></span>
          <span>Execute: <kbd className="px-1 rounded bg-black/30 border border-white/20">Enter</kbd></span>
          <span>Close: <kbd className="px-1 rounded bg-black/30 border border-white/20">Esc</kbd></span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center opacity-50">No matching commands found.</div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComponent = item.icon;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                    isSelected ? 'shadow-md scale-[1.01]' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? currentTheme.cardBg : 'transparent',
                    borderLeft: isSelected ? `4px solid ${currentTheme.accent}` : '4px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-md"
                      style={{
                        backgroundColor: isSelected ? currentTheme.primary : 'rgba(255,255,255,0.05)',
                        color: isSelected ? currentTheme.bg : currentTheme.accent,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: isSelected ? currentTheme.primary : currentTheme.fg }}>
                        {item.label}
                      </div>
                      <div className="text-xs opacity-60 line-clamp-1">{item.subLabel}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}>
                      Run
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="p-2.5 px-4 text-[11px] flex justify-between items-center opacity-70 border-t"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg }}
        >
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>Omarchy Walker dmenu v1.0</span>
          </div>
          <span style={{ color: currentTheme.accent }}>*.oma.local HTTPS ready</span>
        </div>
      </div>
    </div>
  );
};
