import React, { useState } from 'react';
import { X, Play, Square, Copy, Terminal, Shield, Cpu, RefreshCw, RotateCw, Sparkles, Layers, ExternalLink, Code2 } from 'lucide-react';
import { OmarchyTheme, ActiveStack, StackTemplate, WidgetPayload, WaybarPayload } from '../types';

interface WidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: OmarchyTheme;
  activeStacks: ActiveStack[];
  templates: StackTemplate[];
  widgetData: WidgetPayload | null;
  waybarStatus: WaybarPayload | null;
  onLaunchStack: (templateId: string) => void;
  onStopStack: (templateId: string) => void;
  onRestartStack?: (templateId: string) => void;
  onInitProject?: () => void;
  onStopAllStacks: () => void;
  onInjectEnv: () => void;
  onCopySnippet: (text: string) => void;
}

export const WidgetPanel: React.FC<WidgetPanelProps> = ({
  isOpen,
  onClose,
  currentTheme,
  activeStacks,
  templates,
  widgetData,
  waybarStatus,
  onLaunchStack,
  onStopStack,
  onRestartStack,
  onInitProject,
  onStopAllStacks,
  onInjectEnv,
  onCopySnippet,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quick-launch' | 'json'>('overview');
  const [templateFilter, setTemplateFilter] = useState<string>('');

  if (!isOpen) return null;

  const totalRam = activeStacks.reduce((acc, s) => acc + (s.ramUsageMB || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all font-mono select-none"
        style={{
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
          color: currentTheme.fg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: currentTheme.cardBg,
            borderColor: currentTheme.border,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md"
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.bg,
              }}
            >
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm" style={{ color: currentTheme.accent }}>
                  OmaStack Widget Panel
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/20 bg-white/5 opacity-80">
                  Omarchy
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-70">
                <span>Shortcut:</span>
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[10px]">Super</kbd>+
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[10px]">Alt</kbd>+
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[10px]">W</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Widget Panel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 text-xs px-4 pt-2 gap-2 bg-black/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all ${
              activeTab === 'overview' ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'overview' ? currentTheme.primary : 'transparent',
              color: activeTab === 'overview' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('quick-launch')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all ${
              activeTab === 'quick-launch' ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'quick-launch' ? currentTheme.primary : 'transparent',
              color: activeTab === 'quick-launch' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Quick Launch ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all ${
              activeTab === 'json' ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'json' ? currentTheme.primary : 'transparent',
              color: activeTab === 'json' ? currentTheme.accent : currentTheme.fg,
            }}
          >
            Widget JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'overview' && (
            <>
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm"
                  style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                >
                  <span className="text-[10px] opacity-70 mb-0.5">Sandboxes</span>
                  <span className="font-bold text-base" style={{ color: currentTheme.primary }}>
                    {activeStacks.length} Active
                  </span>
                </div>

                <div
                  className="p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm"
                  style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                >
                  <span className="text-[10px] opacity-70 mb-0.5">Sandbox RAM</span>
                  <span className="font-bold text-base" style={{ color: currentTheme.secondary }}>
                    {totalRam} MB
                  </span>
                </div>

                <div
                  className="p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm"
                  style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                >
                  <span className="text-[10px] opacity-70 mb-0.5">Local HTTPS</span>
                  <span className="font-bold text-xs flex items-center gap-1" style={{ color: currentTheme.accent }}>
                    <Shield className="w-3 h-3" /> *.oma.local
                  </span>
                </div>
              </div>

              {/* Active Sandboxes List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" style={{ color: currentTheme.primary }} />
                    Active Sandboxes
                  </h4>
                  {activeStacks.length > 0 && (
                    <button
                      onClick={onStopAllStacks}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      Stop All
                    </button>
                  )}
                </div>

                {activeStacks.length === 0 ? (
                  <div
                    className="p-4 rounded-xl border border-dashed text-center opacity-60 text-xs"
                    style={{ borderColor: currentTheme.border }}
                  >
                    No sandboxes active right now. Launch one below!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeStacks.map((stk) => (
                      <div
                        key={stk.id}
                        className="p-3 rounded-xl border flex items-center justify-between gap-3 shadow-sm"
                        style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="font-bold truncate text-xs">{stk.name}</span>
                            <span className="text-[10px] opacity-70">({stk.ramUsageMB || 0} MB)</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Array.isArray(stk.ports)
                              ? stk.ports.map((p: any) => (
                                  <span
                                    key={p.service || p.port}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono"
                                  >
                                    {p.service ? `${p.service}:` : ''}{p.port}
                                  </span>
                                ))
                              : typeof stk.ports === 'object' && stk.ports !== null
                              ? Object.entries(stk.ports).map(([srv, port]) => (
                                  <span
                                    key={srv}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono"
                                  >
                                    {srv}:{String(port)}
                                  </span>
                                ))
                              : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onRestartStack && (
                            <button
                              onClick={() => onRestartStack(stk.id)}
                              className="p-1.5 rounded hover:bg-white/10 text-cyan-400 transition-colors"
                              title="Restart sandbox"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {stk.generatedEnvSnippet && (
                            <button
                              onClick={() => onCopySnippet(stk.generatedEnvSnippet!)}
                              className="p-1.5 rounded hover:bg-white/10 transition-colors"
                              title="Copy connection strings"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onStopStack(stk.id)}
                            className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Teardown stack"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Action Tools */}
              <div className="pt-2 border-t border-white/10">
                <h4 className="font-bold text-xs uppercase tracking-wider opacity-80 mb-2">Widget Quick Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={onInitProject || (() => onCopySnippet('omastack init'))}
                    className="p-2.5 rounded-xl border text-left flex items-center gap-2 hover:brightness-110 transition-all"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-[11px]">Init Project</div>
                      <div className="text-[9px] opacity-60">Auto .omastack.conf</div>
                    </div>
                  </button>

                  <button
                    onClick={onInjectEnv}
                    className="p-2.5 rounded-xl border text-left flex items-center gap-2 hover:brightness-110 transition-all"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                  >
                    <Code2 className="w-4 h-4" style={{ color: currentTheme.accent }} />
                    <div>
                      <div className="font-bold text-[11px]">Inject .env</div>
                      <div className="text-[9px] opacity-60">Sync variables</div>
                    </div>
                  </button>

                  <button
                    onClick={() => onCopySnippet('omastack proxy sync')}
                    className="p-2.5 rounded-xl border text-left flex items-center gap-2 hover:brightness-110 transition-all"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                  >
                    <Shield className="w-4 h-4" style={{ color: currentTheme.primary }} />
                    <div>
                      <div className="font-bold text-[11px]">HTTPS Proxy</div>
                      <div className="text-[9px] opacity-60">*.oma.local</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'quick-launch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Filter templates (e.g. laravel, supabase, web3)..."
                  value={templateFilter}
                  onChange={(e) => setTemplateFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border bg-black/40 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary"
                  style={{ borderColor: currentTheme.border }}
                />
                {templateFilter && (
                  <button
                    onClick={() => setTemplateFilter('')}
                    className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-[11px] opacity-70">
                Click any template to instantly spin up isolated Docker containers with dynamic zero-collision ports:
              </div>

              {templates
                .filter((tpl) => !templateFilter || tpl.name.toLowerCase().includes(templateFilter.toLowerCase()) || tpl.description.toLowerCase().includes(templateFilter.toLowerCase()))
                .map((tpl) => {
                const isRunning = activeStacks.some((s) => s.id === tpl.id);
                return (
                  <div
                    key={tpl.id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-3 shadow-sm hover:border-primary/50 transition-all"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>{tpl.name}</span>
                        {isRunning && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            RUNNING
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-70 truncate mt-0.5">{tpl.description}</div>
                    </div>

                    <div>
                      {isRunning ? (
                        <div className="flex items-center gap-1.5">
                          {onRestartStack && (
                            <button
                              onClick={() => onRestartStack(tpl.id)}
                              className="p-1 rounded text-cyan-400 hover:bg-white/10 transition-colors"
                              title="Restart"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onStopStack(tpl.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          >
                            <Square className="w-3 h-3" /> Stop
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onLaunchStack(tpl.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                          style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                        >
                          <Play className="w-3 h-3 fill-current" /> Up
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] opacity-70">Raw Widget Payload (`omastack widget --json`):</span>
                <button
                  onClick={() => onCopySnippet(JSON.stringify(widgetData || waybarStatus, null, 2))}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy JSON
                </button>
              </div>
              <pre
                className="p-3 rounded-xl border text-[10px] overflow-x-auto max-h-80 leading-relaxed font-mono"
                style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
              >
                {JSON.stringify(widgetData || waybarStatus || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className="p-3 border-t text-[10px] flex items-center justify-between opacity-80"
          style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
        >
          <span>Omarchy Linux Widget Module</span>
          <span className="text-emerald-400">● Connected</span>
        </div>
      </div>
    </div>
  );
};
