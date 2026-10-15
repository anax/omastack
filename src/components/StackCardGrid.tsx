import React, { useState } from 'react';
import { Play, Layers, Globe, Server, Check, AlertTriangle, Code, Shield } from 'lucide-react';
import { OmarchyTheme, StackTemplate, ActiveStack } from '../types';

interface StackCardGridProps {
  currentTheme: OmarchyTheme;
  templates: StackTemplate[];
  activeStacks: ActiveStack[];
  onLaunchStack: (templateId: string, simulatePortConflict?: boolean) => void;
  onStopStack: (stackId: string) => void;
  onInspectStack: (stackId: string) => void;
}

export const StackCardGrid: React.FC<StackCardGridProps> = ({
  currentTheme,
  templates,
  activeStacks,
  onLaunchStack,
  onStopStack,
  onInspectStack,
}) => {
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<StackTemplate | null>(null);
  const [simulatePortConflict, setSimulatePortConflict] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: currentTheme.primary }}>
            <Layers className="w-5 h-5" />
            <span>Curated Docker Stack Templates</span>
          </h2>
          <p className="text-xs opacity-70">
            Ephemeral, alpine-based multi-service environments ready for 1-click execution.
          </p>
        </div>

        {/* Port Conflict Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-xs bg-black/20 p-2 rounded border border-white/10 hover:bg-black/30 transition-colors">
          <input
            type="checkbox"
            checked={simulatePortConflict}
            onChange={(e) => setSimulatePortConflict(e.target.checked)}
            className="rounded accent-purple-500"
          />
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Simulate Port Conflict (Triggers Dynamic Port Scanner `ss -tuln`)</span>
        </label>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-[#300px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tmpl) => {
          const activeInstance = activeStacks.find((s) => s.templateId === tmpl.id);
          const isRunning = !!activeInstance;

          return (
            <div
              key={tmpl.id}
              className="rounded-xl border shadow-lg overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.01] font-mono text-xs"
              style={{
                backgroundColor: currentTheme.bg,
                borderColor: isRunning ? currentTheme.accent : currentTheme.border,
              }}
            >
              {/* Card Header */}
              <div
                className="p-4 border-b flex items-start justify-between"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                }}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-2" style={{ color: currentTheme.primary }}>
                    <Server className="w-4 h-4" />
                    <span>{tmpl.name}</span>
                  </div>
                  <div className="text-[11px] opacity-70 mt-1">{tmpl.id}</div>
                </div>

                {isRunning ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Running
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] opacity-60 bg-black/30 border border-white/10">
                    Idle
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1">
                <p className="opacity-80 leading-relaxed text-xs">{tmpl.description}</p>

                {/* Services Pills */}
                <div>
                  <div className="text-[10px] font-bold opacity-60 mb-1.5 uppercase tracking-wider">
                    Services Included ({tmpl.services.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tmpl.services.map((svc) => (
                      <span
                        key={svc.name}
                        className="px-2 py-1 rounded bg-black/30 border border-white/10 text-[11px] flex items-center gap-1"
                      >
                        <span className="font-bold opacity-90">{svc.name}</span>
                        <span className="opacity-50 text-[10px]">({svc.defaultPort})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* HTTPS Domains */}
                {tmpl.domains.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold opacity-60 mb-1 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>Local HTTPS Domain (*.oma.local)</span>
                    </div>
                    <div className="space-y-1">
                      {tmpl.domains.map((d) => (
                        <div key={d.domain} className="text-[11px] font-bold" style={{ color: currentTheme.accent }}>
                          https://{d.domain}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div
                className="p-3 border-t flex items-center justify-between gap-2"
                style={{
                  backgroundColor: currentTheme.cardBg,
                  borderColor: currentTheme.border,
                }}
              >
                <button
                  onClick={() => setSelectedTemplateForModal(tmpl)}
                  className="px-2.5 py-1.5 rounded border opacity-80 hover:opacity-100 transition-all flex items-center gap-1"
                  style={{ borderColor: currentTheme.border }}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Config</span>
                </button>

                {isRunning ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onInspectStack(activeInstance.id)}
                      className="px-2.5 py-1.5 rounded font-bold transition-all"
                      style={{ backgroundColor: currentTheme.cardBg, color: currentTheme.accent, border: `1px solid ${currentTheme.accent}` }}
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => onStopStack(activeInstance.id)}
                      className="px-3 py-1.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onLaunchStack(tmpl.id, simulatePortConflict)}
                    className="px-4 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all shadow-md hover:brightness-110"
                    style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Stack</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Code Modal for inspecting stack.conf and docker-compose.yml */}
      {selectedTemplateForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[85vh]"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.border,
              color: currentTheme.fg,
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
            >
              <div className="font-bold text-sm" style={{ color: currentTheme.primary }}>
                Template Configuration: {selectedTemplateForModal.name}
              </div>
              <button
                onClick={() => setSelectedTemplateForModal(null)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <div className="font-bold opacity-70 mb-1" style={{ color: currentTheme.accent }}>
                  📄 stack.conf
                </div>
                <pre className="p-3 rounded bg-black/40 border border-white/10 overflow-x-auto">
                  {selectedTemplateForModal.confContent}
                </pre>
              </div>

              <div>
                <div className="font-bold opacity-70 mb-1" style={{ color: currentTheme.accent }}>
                  🐳 docker-compose.yml
                </div>
                <pre className="p-3 rounded bg-black/40 border border-white/10 overflow-x-auto text-[11px]">
                  {selectedTemplateForModal.composeContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
