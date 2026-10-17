import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { WaybarHeader } from './components/WaybarHeader';
import { WalkerMenuModal } from './components/WalkerMenuModal';
import { WidgetPanel } from './components/WidgetPanel';
import { TerminalSimulator } from './components/TerminalSimulator';
import { StackCardGrid } from './components/StackCardGrid';
import { ActiveStackInspector } from './components/ActiveStackInspector';
import { SystemPortsView } from './components/SystemPortsView';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { NotificationToast, ToastNotification } from './components/NotificationToast';
import { OMARCHY_THEMES } from './themes';
import {
  OmarchyThemeKey,
  ActiveStack,
  StackTemplate,
  TerminalLog,
  WaybarPayload,
  WidgetPayload,
  SystemPort,
  SystemStats,
} from './types';

export default function App() {
  const [themeKey, setThemeKey] = useState<OmarchyThemeKey>('tokyo-night');
  const currentTheme = OMARCHY_THEMES[themeKey];

  const [activeTab, setActiveTab] = useState<'landing' | 'dashboard' | 'terminal' | 'templates' | 'codebase' | 'system'>('landing');
  const [isWalkerOpen, setIsWalkerOpen] = useState(false);
  const [isWidgetPanelOpen, setIsWidgetPanelOpen] = useState(false);

  // Live state from backend
  const [templates, setTemplates] = useState<StackTemplate[]>([]);
  const [activeStacks, setActiveStacks] = useState<ActiveStack[]>([]);
  const [waybarStatus, setWaybarStatus] = useState<WaybarPayload | null>(null);
  const [widgetData, setWidgetData] = useState<WidgetPayload | null>(null);
  const [systemPorts, setSystemPorts] = useState<SystemPort[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      type: 'info',
      text: '⚡ [OmaStack] Omarchy Linux Native Ephemeral Environment Connected.',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'raw',
      text: 'Type "omastack up laravel-stack" or press Super + Alt + Space to launch the Omarchy menu.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const addLog = (type: TerminalLog['type'], text: string) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type,
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const addNotification = (title: string, message: string, urgency: ToastNotification['urgency'] = 'normal') => {
    const id = Math.random().toString();
    setNotifications((prev) => [...prev, { id, title, message, urgency }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  // Fetch real data from server
  const fetchLiveState = async () => {
    try {
      const fetchJson = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        } catch {
          return null;
        }
      };

      const [tplRes, stksRes, waybarRes, widgetRes, portsRes, statsRes] = await Promise.all([
        fetchJson('/api/templates'),
        fetchJson('/api/stacks'),
        fetchJson('/api/waybar'),
        fetchJson('/api/widget'),
        fetchJson('/api/system/ports'),
        fetchJson('/api/system/stats'),
      ]);

      if (Array.isArray(tplRes)) setTemplates(tplRes);
      if (Array.isArray(stksRes)) setActiveStacks(stksRes);
      if (waybarRes && typeof waybarRes === 'object') setWaybarStatus(waybarRes);
      if (widgetRes && typeof widgetRes === 'object') setWidgetData(widgetRes);
      if (portsRes?.openPorts) setSystemPorts(portsRes.openPorts);
      if (statsRes) setSystemStats(statsRes);
    } catch (err) {
      console.error('Failed to sync state:', err);
    }
  };

  useEffect(() => {
    fetchLiveState();
    const interval = setInterval(fetchLiveState, 3000);
    return () => clearInterval(interval);
  }, []);

  // Global Omarchy shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Super+Alt+W or press W outside inputs to toggle Widget Panel
      if (!isInput && (e.key === 'w' || e.key === 'W')) {
        setIsWidgetPanelOpen((prev) => !prev);
      } else if (!isInput && (e.key === 't' || e.key === 'T')) {
        // Omarchy signature: Press T to flip through themes
        const themeKeys: OmarchyThemeKey[] = ['tokyo-night', 'catppuccin-mocha', 'gruvbox-dark', 'rose-pine', 'nordic', 'cyberpunk'];
        setThemeKey((prev) => {
          const idx = themeKeys.indexOf(prev);
          const next = themeKeys[(idx + 1) % themeKeys.length];
          addNotification('Theme Changed', `Switched to ${OMARCHY_THEMES[next].name}`);
          return next;
        });
      } else if (e.key === 'Escape') {
        setIsWidgetPanelOpen(false);
        setIsWalkerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Launch stack with real CLI execution on backend
  const handleLaunchStack = async (templateId: string) => {
    addLog('cmd', `omastack up ${templateId}`);
    addLog('info', `⚡ [OmaStack] Launching ${templateId}...`);

    try {
      const res = await fetch('/api/stacks/up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();

      if (data.stdout) {
        addLog('raw', data.stdout);
      }
      if (data.stderr) {
        addLog('warn', data.stderr);
      }

      if (data.success) {
        addNotification('OmaStack Ready!', `🚀 ${templateId} is active!`, 'success');
      } else {
        addNotification('OmaStack Alert', `Launched ${templateId} with notices. Check logs.`, 'warn');
      }

      await fetchLiveState();
    } catch (err: any) {
      addLog('error', `✖ Failed to launch: ${err.message}`);
    }
  };

  // Teardown stack with real CLI execution
  const handleStopStack = async (stackId: string) => {
    addLog('cmd', `omastack down ${stackId}`);
    try {
      const res = await fetch('/api/stacks/down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: stackId }),
      });
      const data = await res.json();

      if (data.stdout) addLog('raw', data.stdout);
      if (data.stderr) addLog('warn', data.stderr);

      addNotification('OmaStack Teardown', `Stopped ${stackId}.`);
      await fetchLiveState();
    } catch (err: any) {
      addLog('error', `✖ Failed to stop: ${err.message}`);
    }
  };

  // Teardown all stacks with real CLI execution
  const handleStopAllStacks = async () => {
    addLog('cmd', `omastack down --all`);
    try {
      const res = await fetch('/api/stacks/down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (data.stdout) addLog('raw', data.stdout);
      if (data.stderr) addLog('warn', data.stderr);

      addNotification('OmaStack Cleared', 'All active sandboxes stopped and RAM freed.');
      await fetchLiveState();
    } catch (err: any) {
      addLog('error', `✖ Failed to stop all: ${err.message}`);
    }
  };

  // Restart active stack
  const handleRestartStack = async (stackId: string) => {
    addLog('cmd', `omastack restart ${stackId}`);
    try {
      const res = await fetch('/api/stacks/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: stackId }),
      });
      const data = await res.json();
      if (data.stdout) addLog('raw', data.stdout);
      if (data.stderr) addLog('warn', data.stderr);
      addNotification('OmaStack Restarted', `Restarted ${stackId} sandbox.`, 'success');
      await fetchLiveState();
    } catch (err: any) {
      addLog('error', `✖ Failed to restart: ${err.message}`);
    }
  };

  // Initialize project config
  const handleInitProject = async () => {
    addLog('cmd', 'omastack init');
    try {
      const res = await fetch('/api/stacks/init', { method: 'POST' });
      const data = await res.json();
      if (data.stdout) addLog('raw', data.stdout);
      if (data.stderr) addLog('warn', data.stderr);
      addNotification('OmaStack Init', 'Generated local .omastack.conf configuration.', 'success');
      await fetchLiveState();
    } catch (err: any) {
      addLog('error', `✖ Failed to init: ${err.message}`);
    }
  };

  // Inject .env with real CLI execution
  const handleInjectEnv = async () => {
    addLog('cmd', `omastack inject`);
    try {
      const res = await fetch('/api/env/inject', { method: 'POST' });
      const data = await res.json();
      if (data.stdout) addLog('raw', data.stdout);
      if (data.stderr) addLog('warn', data.stderr);
      addNotification('OmaStack .env Injected', 'Injected connection strings into .env.');
    } catch (err: any) {
      addLog('error', `✖ Failed to inject .env: ${err.message}`);
    }
  };

  // Execute arbitrary command in live CLI simulator
  const handleExecuteCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setTerminalLogs([]);
      return;
    }

    addLog('cmd', `omarchy ➜ ${trimmed}`);

    if (trimmed === 'omastack menu' || trimmed === 'omastack ui') {
      setIsWalkerOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });
      const data = await res.json();

      if (data.stdout) {
        addLog('raw', data.stdout);
      }
      if (data.stderr) {
        addLog('warn', data.stderr);
      }
      if (!data.stdout && !data.stderr && data.code !== 0) {
        addLog('error', `Exit code: ${data.code}`);
      }

      await fetchLiveState();
    } catch (err: any) {
      addLog('error', `Failed to execute: ${err.message}`);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200 select-none"
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.fg,
      }}
    >
      {/* Waybar Header */}
      <WaybarHeader
        currentTheme={currentTheme}
        onSelectTheme={(key) => setThemeKey(key)}
        activeStacks={activeStacks}
        waybarStatus={waybarStatus}
        systemStats={systemStats}
        onOpenWalkerMenu={() => setIsWalkerOpen(true)}
        onOpenWidgetPanel={() => setIsWidgetPanelOpen(true)}
        onStopAllStacks={handleStopAllStacks}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'landing' && (
          <LandingPage
            currentTheme={currentTheme}
            onSelectTheme={(key) => setThemeKey(key)}
            templates={templates}
            activeStacks={activeStacks}
            onLaunchStack={handleLaunchStack}
            onStopStack={handleStopStack}
            onOpenDashboard={() => setActiveTab('dashboard')}
            onOpenTerminal={() => setActiveTab('terminal')}
            onOpenWalkerMenu={() => setIsWalkerOpen(true)}
            onOpenWidgetPanel={() => setIsWidgetPanelOpen(true)}
            onCopySnippet={(text) => {
              navigator.clipboard.writeText(text);
              addNotification('Copied to Clipboard', 'Text copied successfully.');
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <ActiveStackInspector
              currentTheme={currentTheme}
              activeStacks={activeStacks}
              onStopStack={handleStopStack}
              onInjectEnv={handleInjectEnv}
              onCopySnippet={(text) => {
                navigator.clipboard.writeText(text);
                addNotification('Copied to Clipboard', 'Connection variables ready.');
              }}
            />

            <StackCardGrid
              currentTheme={currentTheme}
              templates={templates}
              activeStacks={activeStacks}
              onLaunchStack={handleLaunchStack}
              onStopStack={handleStopStack}
              onInspectStack={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-[calc(100vh-140px)]">
            <TerminalSimulator
              currentTheme={currentTheme}
              templates={templates}
              activeStacks={activeStacks}
              logs={terminalLogs}
              onExecuteCommand={handleExecuteCommand}
              onClearLogs={() => setTerminalLogs([])}
            />
          </div>
        )}

        {activeTab === 'templates' && (
          <StackCardGrid
            currentTheme={currentTheme}
            templates={templates}
            activeStacks={activeStacks}
            onLaunchStack={handleLaunchStack}
            onStopStack={handleStopStack}
            onInspectStack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'system' && (
          <SystemPortsView
            currentTheme={currentTheme}
            systemPorts={systemPorts}
            systemStats={systemStats}
            onRefresh={fetchLiveState}
          />
        )}

        {activeTab === 'codebase' && (
          <CodebaseExplorer
            currentTheme={currentTheme}
            onCopyText={(text) => {
              navigator.clipboard.writeText(text);
              addNotification('Copied', 'Code content copied to clipboard.');
            }}
          />
        )}
      </main>

      {/* Walker Menu Modal */}
      <WalkerMenuModal
        isOpen={isWalkerOpen}
        onClose={() => setIsWalkerOpen(false)}
        currentTheme={currentTheme}
        templates={templates}
        activeStacks={activeStacks}
        onLaunchStack={handleLaunchStack}
        onStopStack={handleStopStack}
        onStopAllStacks={handleStopAllStacks}
        onInjectEnv={handleInjectEnv}
        onViewLogs={() => setActiveTab('terminal')}
      />

      {/* Widget Panel */}
      <WidgetPanel
        isOpen={isWidgetPanelOpen}
        onClose={() => setIsWidgetPanelOpen(false)}
        currentTheme={currentTheme}
        activeStacks={activeStacks}
        templates={templates}
        widgetData={widgetData}
        waybarStatus={waybarStatus}
        onLaunchStack={handleLaunchStack}
        onStopStack={handleStopStack}
        onRestartStack={handleRestartStack}
        onInitProject={handleInitProject}
        onStopAllStacks={handleStopAllStacks}
        onInjectEnv={handleInjectEnv}
        onCopySnippet={(text) => {
          navigator.clipboard.writeText(text);
          addNotification('Copied to Clipboard', 'Connection variables ready.');
        }}
      />

      {/* Toast Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        currentTheme={currentTheme}
      />
    </div>
  );
}
