import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Copy, Check, CornerDownLeft, Trash2 } from 'lucide-react';
import { OmarchyTheme, TerminalLog, StackTemplate, ActiveStack } from '../types';

interface TerminalSimulatorProps {
  currentTheme: OmarchyTheme;
  templates: StackTemplate[];
  activeStacks: ActiveStack[];
  logs: TerminalLog[];
  onExecuteCommand: (cmd: string) => void;
  onClearLogs: () => void;
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  currentTheme,
  templates,
  activeStacks,
  logs,
  onExecuteCommand,
  onClearLogs,
}) => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onExecuteCommand(input.trim());
    setInput('');
  };

  const handleQuickCommand = (cmd: string) => {
    onExecuteCommand(cmd);
  };

  const copyLogs = () => {
    const text = logs.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="w-full h-full rounded-xl border shadow-xl flex flex-col font-mono text-xs overflow-hidden"
      style={{
        backgroundColor: currentTheme.bg,
        borderColor: currentTheme.border,
        color: currentTheme.fg,
      }}
    >
      {/* Window Titlebar */}
      <div
        className="px-4 py-2 border-b flex items-center justify-between"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-xs font-bold" style={{ color: currentTheme.primary }}>
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>omarchy@archlinux: ~/.local/share/omastack</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyLogs}
            className="p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1 opacity-80 hover:opacity-100"
            title="Copy Terminal Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onClearLogs}
            className="p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1 opacity-80 hover:opacity-100"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="px-4 py-2 border-b flex flex-wrap gap-2 items-center bg-black/20" style={{ borderColor: currentTheme.border }}>
        <span className="opacity-60 text-[11px]">Quick Run:</span>
        <button
          onClick={() => handleQuickCommand('omarchy plugin add https://github.com/anax/omastack')}
          className="px-2 py-0.5 rounded border text-[11px] font-bold hover:brightness-125 transition-all"
          style={{ borderColor: currentTheme.accent, backgroundColor: currentTheme.cardBg, color: currentTheme.accent }}
        >
          omarchy plugin add
        </button>
        <button
          onClick={() => handleQuickCommand('omastack up laravel-stack')}
          className="px-2 py-0.5 rounded border text-[11px] hover:brightness-125 transition-all"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg, color: currentTheme.primary }}
        >
          omastack up laravel-stack
        </button>
        <button
          onClick={() => handleQuickCommand('omastack up supabase-lite')}
          className="px-2 py-0.5 rounded border text-[11px] hover:brightness-125 transition-all"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg, color: currentTheme.primary }}
        >
          omastack up supabase-lite
        </button>
        <button
          onClick={() => handleQuickCommand('omastack list')}
          className="px-2 py-0.5 rounded border text-[11px] hover:brightness-125 transition-all"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg, color: currentTheme.accent }}
        >
          omastack list
        </button>
        <button
          onClick={() => handleQuickCommand('omastack status --waybar')}
          className="px-2 py-0.5 rounded border text-[11px] hover:brightness-125 transition-all"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg, color: currentTheme.secondary }}
        >
          omastack status --waybar
        </button>
        <button
          onClick={() => handleQuickCommand('omastack menu')}
          className="px-2 py-0.5 rounded border text-[11px] hover:brightness-125 transition-all"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg, color: currentTheme.fg }}
        >
          omastack menu
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1 select-text">
        {logs.map((log) => {
          let textStyle = { color: currentTheme.fg };
          if (log.type === 'cmd') textStyle = { color: currentTheme.primary };
          else if (log.type === 'info') textStyle = { color: currentTheme.accent };
          else if (log.type === 'success') textStyle = { color: '#4ade80' };
          else if (log.type === 'warn') textStyle = { color: '#fbbf24' };
          else if (log.type === 'error') textStyle = { color: '#f87171' };

          return (
            <div key={log.id} className="whitespace-pre-wrap leading-relaxed font-mono" style={textStyle}>
              {log.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t flex items-center gap-2"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <span className="font-bold flex items-center gap-1" style={{ color: currentTheme.accent }}>
          <span>omarchy</span>
          <span style={{ color: currentTheme.primary }}>➜</span>
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type omastack command... (e.g. omastack up laravel-stack, omastack list, help)"
          className="flex-1 bg-transparent border-none outline-none font-mono"
          style={{ color: currentTheme.fg }}
        />
        <button
          type="submit"
          className="p-1.5 rounded hover:brightness-110 transition-all flex items-center gap-1 font-bold"
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};
