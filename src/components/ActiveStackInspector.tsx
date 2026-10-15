import React, { useState } from 'react';
import { Copy, Check, ExternalLink, HardDrive, Shield, RefreshCw, Key, FileDiff, Trash2, Power } from 'lucide-react';
import { OmarchyTheme, ActiveStack } from '../types';

interface ActiveStackInspectorProps {
  currentTheme: OmarchyTheme;
  activeStacks: ActiveStack[];
  onStopStack: (stackId: string) => void;
  onInjectEnv: () => void;
  onCopySnippet: (text: string) => void;
}

export const ActiveStackInspector: React.FC<ActiveStackInspectorProps> = ({
  currentTheme,
  activeStacks,
  onStopStack,
  onInjectEnv,
  onCopySnippet,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEnvDiff, setShowEnvDiff] = useState(false);

  const handleCopy = (text: string, id: string) => {
    onCopySnippet(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (activeStacks.length === 0) {
    return (
      <div
        className="p-12 rounded-xl border text-center font-mono space-y-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
          color: currentTheme.fg,
        }}
      >
        <HardDrive className="w-12 h-12 mx-auto opacity-40" style={{ color: currentTheme.primary }} />
        <div className="font-bold text-base">No Active Sandboxes</div>
        <p className="text-xs opacity-70 max-w-md mx-auto">
          Spin up a stack from the Templates tab or run <code className="px-1.5 py-0.5 rounded bg-black/40">omastack up laravel-stack</code> in the CLI simulator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/10">
        <div>
          <h2 className="text-base font-bold" style={{ color: currentTheme.primary }}>
            Active Sandbox Inspector & Health Monitor
          </h2>
          <p className="text-xs opacity-70">
            Real-time RAM stats, port allocations, local HTTPS reverse proxy domains & Wayland clipboard sync.
          </p>
        </div>

        <button
          onClick={onInjectEnv}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md hover:brightness-110"
          style={{ backgroundColor: currentTheme.accent, color: currentTheme.bg }}
        >
          <Key className="w-4 h-4" />
          <span>Inject .env into CWD</span>
        </button>
      </div>

      <div className="space-y-6">
        {activeStacks.map((stack) => (
          <div
            key={stack.id}
            className="rounded-xl border overflow-hidden shadow-lg"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.border,
            }}
          >
            {/* Header */}
            <div
              className="p-4 border-b flex flex-wrap items-center justify-between gap-4"
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                <div>
                  <div className="font-bold text-sm" style={{ color: currentTheme.primary }}>
                    {stack.name}
                  </div>
                  <div className="text-[11px] opacity-60">Started at: {stack.startedAt}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/30 border border-white/10">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold">{stack.ramUsageMB} MB RAM</span>
                </div>

                <button
                  onClick={() => onStopStack(stack.id)}
                  className="px-3 py-1.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center gap-1"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Teardown</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Ports Table */}
              <div className="space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Allocated Ports (Conflict Scan Active)</span>
                </div>

                <div className="rounded-lg border overflow-hidden bg-black/20" style={{ borderColor: currentTheme.border }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-black/30 opacity-70" style={{ borderColor: currentTheme.border }}>
                        <th className="p-2">SERVICE PORT</th>
                        <th className="p-2">HOST BINDING</th>
                        <th className="p-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stack.ports).map(([key, val]) => (
                        <tr key={key} className="border-b border-white/5">
                          <td className="p-2 font-bold" style={{ color: currentTheme.primary }}>
                            {key}
                          </td>
                          <td className="p-2 opacity-90">127.0.0.1:{val}</td>
                          <td className="p-2">
                            <span className="text-emerald-400 font-bold">● Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Local HTTPS Domain Links */}
                {stack.domains && stack.domains.length > 0 && (
                  <div className="pt-2">
                    <div className="font-bold text-xs uppercase tracking-wider opacity-70 mb-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Caddy Local HTTPS Domains (*.oma.local)</span>
                    </div>

                    <div className="space-y-1.5">
                      {stack.domains.map((d) => (
                        <a
                          key={d.url}
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded bg-black/30 border border-white/10 flex items-center justify-between hover:border-cyan-400 transition-colors"
                        >
                          <span className="font-bold text-cyan-300">{d.url}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wayland Clipboard Snippet */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider opacity-70">
                    Wayland Clipboard Snippet (wl-copy)
                  </span>
                  <button
                    onClick={() => handleCopy(stack.envSnippet || `# oma stack env for ${stack.id}`, stack.id)}
                    className="px-2.5 py-1 rounded bg-black/30 border border-white/10 hover:bg-black/50 transition-colors flex items-center gap-1"
                  >
                    {copiedId === stack.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === stack.id ? 'Copied to Clipboard' : 'Copy Block'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg border bg-black/50 overflow-x-auto text-[11px] leading-relaxed" style={{ borderColor: currentTheme.border }}>
                  {stack.envSnippet || `# Real Active Stack: ${stack.name}\nOMASTACK_STATE=running\nSTARTED_AT=${stack.startedAt}\nRAM_USAGE=${stack.ramUsageMB}MB`}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
