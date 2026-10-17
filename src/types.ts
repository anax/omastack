export type OmarchyThemeKey =
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'gruvbox-dark'
  | 'rose-pine'
  | 'nordic'
  | 'cyberpunk'
  | 'dracula'
  | 'one-dark'
  | 'kanagawa'
  | 'synthwave-84'
  | 'monokai-pro'
  | 'solarized-dark';

export interface OmarchyTheme {
  key: OmarchyThemeKey;
  name: string;
  category: 'Popular' | 'Pastel & Soft' | 'Retro & Vintage' | 'Cyber & Neon' | 'High Contrast';
  description: string;
  author: string;
  downloads: string;
  rating: number;
  tags: string[];
  bg: string;
  cardBg: string;
  fg: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  waybarBg: string;
  hyprlandBorder?: string;
}

export interface ServiceDetail {
  name: string;
  image?: string;
  defaultPort: number;
  assignedPort?: number;
  status?: string;
}

export interface StackTemplate {
  id: string;
  name: string;
  description: string;
  services: ServiceDetail[];
  domains: { domain: string; portVar: string }[];
  confContent: string;
  composeContent: string;
}

export interface ActiveStack {
  id: string;
  templateId: string;
  name: string;
  status: 'running' | 'starting' | 'stopped';
  ramUsageMB: number;
  startedAt: string;
  ports: Record<string, number> | any;
  domains?: { url: string; port: number }[];
  composeContent?: string;
  envSnippet?: string;
  generatedEnvSnippet?: string;
}

export interface SystemPort {
  protocol: string;
  port: number;
  address: string;
}

export interface SystemStats {
  totalMemMB: number;
  usedMemMB: number;
  freeMemMB: number;
  cpuCount: number;
  uptimeSeconds: number;
  platform: string;
  arch: string;
}

export interface TerminalLog {
  id: string;
  type: 'cmd' | 'info' | 'success' | 'warn' | 'error' | 'raw';
  text: string;
  timestamp: string;
}

export interface WaybarPayload {
  text: string;
  tooltip: string;
  class: string;
}

export interface WidgetPayload {
  active_count: number;
  total_ram: string;
  status_class: string;
  active_stacks: Array<{
    id: string;
    name: string;
    status: string;
    ram: string;
  }>;
  templates: string[];
  shortcuts: {
    menu: string;
    widget_panel: string;
  };
}
