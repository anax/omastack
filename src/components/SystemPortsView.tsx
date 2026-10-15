import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield, HardDrive, Cpu, Terminal, FileText, Check, AlertCircle } from 'lucide-react';
import { OmarchyTheme, SystemPort, SystemStats } from '../types';

interface SystemPortsViewProps {
  currentTheme: OmarchyTheme;
  systemPorts: SystemPort[];
  systemStats: SystemStats | null;
  onRefresh: () => void;
}

export const SystemPortsView: React.FC<SystemPortsViewProps> = ({
  currentTheme,
  systemPorts,
  systemStats,
  onRefresh,
}) => {
  const [caddyfile, setCaddyfile] = useState<string>('');
  const [envData, setEnvData] = useState<{ currentEnv: string; backupEnv: string; exists: boolean }>({
    currentEnv: '',
    backupEnv: '',
    exists: false,
  });
  const [activeSubTab, setActiveSubTab] = useState<'ports' | 'caddy' | 'env' | 'hardware'>('ports');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [caddyRes, envRes] = await Promise.all([
        fetch('/api/caddyfile').then((r) => r.json()),
        fetch('/api/env').then((r) => r.json()),
      ]);
      setCaddyfile(caddyRes.content || '');
      setEnvData(envRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div
        className="p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        }}
      >
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: currentTheme.primary }}>
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Host Network, Caddyfile & .env Inspector (Live)</span>
          </h2>
          <p className="text-xs opacity-70">
            Real host sockets scanned via `ss -tuln`, dynamic Caddy reverse proxy rules, and synced .env files.
          </p>
        </div>

        <button
          onClick={() => {
            onRefresh();
            loadData();
          }}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg font-bold border flex items-center gap-2 transition-all hover:bg-black/30"
          style={{ borderColor: currentTheme.border, color: currentTheme.accent }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live State</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: currentTheme.border }}>
        <button
          onClick={() => setActiveSubTab('ports')}
          className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
            activeSubTab === 'ports' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeSubTab === 'ports' ? currentTheme.cardBg : 'transparent',
            color: activeSubTab === 'ports' ? currentTheme.accent : currentTheme.fg,
          }}
        >
          Active Host Ports (`ss -tuln`) [{systemPorts.length}]
        </button>
        <button
          onClick={() => setActiveSubTab('caddy')}
          className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
            activeSubTab === 'caddy' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeSubTab === 'caddy' ? currentTheme.cardBg : 'transparent',
            color: activeSubTab === 'caddy' ? currentTheme.accent : currentTheme.fg,
          }}
        >
          Live Caddyfile Rules (*.oma.local)
        </button>
        <button
          onClick={() => setActiveSubTab('env')}
          className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
            activeSubTab === 'env' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeSubTab === 'env' ? currentTheme.cardBg : 'transparent',
            color: activeSubTab === 'env' ? currentTheme.accent : currentTheme.fg,
          }}
        >
          Disk .env & Backup Diff
        </button>
        <button
          onClick={() => setActiveSubTab('hardware')}
          className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
            activeSubTab === 'hardware' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeSubTab === 'hardware' ? currentTheme.cardBg : 'transparent',
            color: activeSubTab === 'hardware' ? currentTheme.accent : currentTheme.fg,
          }}
        >
          System Resources & OS
        </button>
      </div>

      {/* Tab: Ports */}
      {activeSubTab === 'ports' && (
        <div
          className="rounded-xl border overflow-hidden shadow-lg"
          style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border }}
        >
          <div className="p-4 border-b flex justify-between items-center bg-black/20" style={{ borderColor: currentTheme.border }}>
            <span className="font-bold opacity-80 uppercase tracking-wider">
              Real TCP/UDP Listening Sockets Detected on Host
            </span>
            <span className="text-emerald-400 font-bold">● Active Scanning</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-black/40 opacity-70" style={{ borderColor: currentTheme.border }}>
                  <th className="p-3">PROTOCOL</th>
                  <th className="p-3">LOCAL PORT</th>
                  <th className="p-3">BIND ADDRESS</th>
                  <th className="p-3">OMASTACK CONFLICT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {systemPorts.map((p, idx) => {
                  const isConflictCandidate = [3306, 5432, 6379, 80, 443, 3000, 8080].includes(p.port);
                  return (
                    <tr key={`${p.port}-${idx}`} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 font-bold" style={{ color: currentTheme.primary }}>
                        {p.protocol}
                      </td>
                      <td className="p-3 font-bold text-amber-300">:{p.port}</td>
                      <td className="p-3 opacity-80">{p.address}</td>
                      <td className="p-3">
                        {isConflictCandidate ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Occupied - Auto Increment Triggered
                          </span>
                        ) : (
                          <span className="opacity-60">System Listening</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Caddyfile */}
      {activeSubTab === 'caddy' && (
        <div
          className="rounded-xl border overflow-hidden shadow-lg p-4 space-y-3"
          style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border }}
        >
          <div className="font-bold text-sm flex items-center justify-between" style={{ color: currentTheme.primary }}>
            <span>Dynamic Caddyfile (~/.local/share/omastack/Caddyfile)</span>
            <span className="text-[10px] text-cyan-300">Managed automatically by `lib/proxy.sh`</span>
          </div>
          <pre className="p-4 rounded-lg bg-black/60 border border-white/10 overflow-x-auto leading-relaxed text-xs">
            {caddyfile}
          </pre>
        </div>
      )}

      {/* Tab: .env */}
      {activeSubTab === 'env' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="rounded-xl border p-4 space-y-2 shadow-lg"
            style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border }}
          >
            <div className="font-bold text-sm flex items-center justify-between" style={{ color: currentTheme.primary }}>
              <span>Current .env in Project</span>
              <span className="text-[10px] opacity-60">{envData.exists ? 'Found on disk' : 'Not created'}</span>
            </div>
            <pre className="p-3 rounded-lg bg-black/60 border border-white/10 overflow-x-auto text-[11px] min-h-[220px]">
              {envData.currentEnv || '# .env is currently empty. Run `omastack inject` or launch a stack.'}
            </pre>
          </div>

          <div
            className="rounded-xl border p-4 space-y-2 shadow-lg"
            style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border }}
          >
            <div className="font-bold text-sm flex items-center justify-between" style={{ color: currentTheme.secondary }}>
              <span>Backup .env.omastack.bak</span>
              <span className="text-[10px] opacity-60">Created before injection</span>
            </div>
            <pre className="p-3 rounded-lg bg-black/60 border border-white/10 overflow-x-auto text-[11px] min-h-[220px]">
              {envData.backupEnv || '# No backup created yet. Backups are made prior to injecting variables.'}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: Hardware */}
      {activeSubTab === 'hardware' && systemStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="p-4 rounded-xl border space-y-1 shadow-md"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="opacity-70 text-[11px]">TOTAL SYSTEM MEMORY</div>
            <div className="text-xl font-bold" style={{ color: currentTheme.primary }}>
              {systemStats.totalMemMB} MB
            </div>
            <div className="text-[10px] opacity-60">Physical RAM</div>
          </div>

          <div
            className="p-4 rounded-xl border space-y-1 shadow-md"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="opacity-70 text-[11px]">ACTIVE USED MEMORY</div>
            <div className="text-xl font-bold text-amber-300">{systemStats.usedMemMB} MB</div>
            <div className="text-[10px] opacity-60">Free: {systemStats.freeMemMB} MB</div>
          </div>

          <div
            className="p-4 rounded-xl border space-y-1 shadow-md"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="opacity-70 text-[11px]">CPU THREADS</div>
            <div className="text-xl font-bold" style={{ color: currentTheme.accent }}>
              {systemStats.cpuCount} Cores
            </div>
            <div className="text-[10px] opacity-60">{systemStats.arch}</div>
          </div>

          <div
            className="p-4 rounded-xl border space-y-1 shadow-md"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}
          >
            <div className="opacity-70 text-[11px]">SYSTEM PLATFORM</div>
            <div className="text-xl font-bold text-emerald-400">{systemStats.platform}</div>
            <div className="text-[10px] opacity-60">Uptime: {Math.floor(systemStats.uptimeSeconds / 60)} min</div>
          </div>
        </div>
      )}
    </div>
  );
};
