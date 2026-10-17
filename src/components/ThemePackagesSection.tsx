import React, { useState, useMemo } from 'react';
import {
  Palette,
  Check,
  Copy,
  Sparkles,
  Download,
  Search,
  Star,
  Eye,
  Sliders,
  Terminal,
  Code,
  X,
  Layers,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { OmarchyTheme, OmarchyThemeKey } from '../types';
import { OMARCHY_THEMES } from '../themes';

interface ThemePackagesSectionProps {
  currentTheme: OmarchyTheme;
  onSelectTheme: (key: OmarchyThemeKey) => void;
  onNotify?: (title: string, message: string) => void;
}

type CategoryFilter = 'All' | 'Popular' | 'Pastel & Soft' | 'Retro & Vintage' | 'Cyber & Neon' | 'High Contrast';

export const ThemePackagesSection: React.FC<ThemePackagesSectionProps> = ({
  currentTheme,
  onSelectTheme,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectTheme, setInspectTheme] = useState<OmarchyTheme | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const categories: CategoryFilter[] = [
    'All',
    'Popular',
    'Pastel & Soft',
    'Retro & Vintage',
    'Cyber & Neon',
    'High Contrast',
  ];

  const allThemesList = useMemo(() => Object.values(OMARCHY_THEMES), []);

  const filteredThemes = useMemo(() => {
    return allThemesList.filter((theme) => {
      const matchesCategory =
        selectedCategory === 'All' || theme.category === selectedCategory;
      const matchesSearch =
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        theme.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allThemesList, selectedCategory, searchQuery]);

  const handleCopyCli = (theme: OmarchyTheme) => {
    const cmd = `omastack theme apply ${theme.key}`;
    navigator.clipboard.writeText(cmd);
    setCopiedKey(theme.key);
    setTimeout(() => setCopiedKey(null), 2000);
    if (onNotify) {
      onNotify('Command Copied', `Copied to clipboard: "${cmd}"`);
    }
  };

  const generateThemeJson = (theme: OmarchyTheme) => {
    return JSON.stringify(
      {
        schemaVersion: 1,
        id: `omarchy.theme.${theme.key}`,
        name: theme.name,
        author: theme.author,
        category: theme.category,
        colors: {
          background: theme.bg,
          card: theme.cardBg,
          foreground: theme.fg,
          primary: theme.primary,
          secondary: theme.secondary,
          accent: theme.accent,
          border: theme.border,
          waybarBackground: theme.waybarBg,
          hyprlandBorder: theme.hyprlandBorder || theme.primary,
        },
        integrations: {
          hyprland: true,
          waybar: true,
          walker: true,
          quickshell: true,
          omastack: true,
        },
      },
      null,
      2
    );
  };

  const handleDownloadTheme = (theme: OmarchyTheme) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(generateThemeJson(theme));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `omarchy-theme-${theme.key}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onNotify) {
      onNotify('Theme Package Downloaded', `Saved omarchy-theme-${theme.key}.json`);
    }
  };

  return (
    <section id="themes" className="space-y-6 pt-4">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/10">
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border shadow-sm"
            style={{
              backgroundColor: `${currentTheme.primary}15`,
              borderColor: `${currentTheme.primary}30`,
              color: currentTheme.primary,
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Omarchy Theme Packages &amp; Palettes</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Curated Theme Suites. Synced Across Desktop &amp; Terminal.
          </h2>

          <p className="text-xs sm:text-sm text-white/75 max-w-2xl leading-relaxed">
            One-click apply to preview the full Omarchy aesthetic. Every theme package configures Hyprland active borders,
            Waybar modules, Walker launcher colors, Charmbracelet <code className="font-mono text-white/90">gum</code> prompts, and OmaStack sandboxes in real time.
          </p>
        </div>

        {/* Quick Shortcut Info */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono shrink-0"
          style={{ backgroundColor: `${currentTheme.cardBg}80`, borderColor: currentTheme.border }}
        >
          <span className="text-white/60">Cycle anytime:</span>
          <kbd
            className="px-2 py-0.5 rounded font-bold shadow border"
            style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.accent }}
          >
            Press T
          </kbd>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All'
                ? allThemesList.length
                : allThemesList.filter((t) => t.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                  isSelected ? 'shadow-sm font-bold' : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isSelected ? currentTheme.cardBg : 'transparent',
                  borderColor: isSelected ? currentTheme.primary : 'transparent',
                  color: isSelected ? currentTheme.primary : currentTheme.fg,
                }}
              >
                <span>{cat}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-mono"
                  style={{
                    backgroundColor: isSelected ? `${currentTheme.primary}25` : 'rgba(255,255,255,0.08)',
                    color: isSelected ? currentTheme.primary : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search theme packages..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs bg-black/30 placeholder-white/40 focus:outline-none transition-colors font-mono"
            style={{
              borderColor: currentTheme.border,
              color: currentTheme.fg,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Theme Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredThemes.map((theme) => {
          const isActive = currentTheme.key === theme.key;

          return (
            <div
              key={theme.key}
              className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${
                isActive ? 'ring-2 shadow-xl scale-[1.01]' : 'hover:border-white/30 hover:shadow-lg hover:-translate-y-0.5'
              }`}
              style={{
                backgroundColor: theme.bg,
                borderColor: isActive ? theme.primary : `${theme.border}80`,
                boxShadow: isActive ? `0 0 25px ${theme.primary}25` : undefined,
              }}
            >
              {/* Active Pulse Glow Indicator */}
              {isActive && (
                <div
                  className="absolute top-0 right-0 w-24 h-24 blur-2xl pointer-events-none opacity-20"
                  style={{ backgroundColor: theme.primary }}
                />
              )}

              {/* Top Row: Title, Category & Active Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/20"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <h3 className="font-bold text-base tracking-tight" style={{ color: theme.fg }}>
                        {theme.name}
                      </h3>
                    </div>
                    <div className="text-[11px] font-mono text-white/50">
                      by {theme.author}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border"
                        style={{
                          backgroundColor: `${theme.primary}15`,
                          borderColor: `${theme.primary}30`,
                          color: theme.primary,
                        }}
                      >
                        {theme.category}
                      </span>
                    )}

                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                      <span>★ {theme.rating.toFixed(1)}</span>
                      <span>•</span>
                      <span>{theme.downloads}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {theme.description}
                </p>

                {/* Live Palette Swatches Ribbon */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                    <span>Palette Swatches</span>
                    <span className="text-white/30">Hex Accent: {theme.primary}</span>
                  </div>

                  <div className="grid grid-cols-6 h-6 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                    <div
                      className="h-full flex items-center justify-center text-[9px] font-mono font-bold opacity-0 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: theme.bg, color: theme.fg }}
                      title={`Background: ${theme.bg}`}
                    >
                      bg
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[9px] font-mono font-bold opacity-0 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: theme.cardBg, color: theme.fg }}
                      title={`Card: ${theme.cardBg}`}
                    >
                      card
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[9px] font-mono font-bold opacity-0 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: theme.primary, color: '#000000' }}
                      title={`Primary: ${theme.primary}`}
                    >
                      pri
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[9px] font-mono font-bold opacity-0 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: theme.secondary, color: '#000000' }}
                      title={`Secondary: ${theme.secondary}`}
                    >
                      sec
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[9px] font-mono font-bold opacity-0 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: theme.accent, color: '#000000' }}
                      title={`Accent: ${theme.accent}`}
                    >
                      acc
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[9px] font-mono font-bold opacity-0 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: theme.border, color: '#ffffff' }}
                      title={`Border: ${theme.border}`}
                    >
                      bor
                    </div>
                  </div>
                </div>

                {/* Simulated Desktop Preview Box */}
                <div
                  className="rounded-xl border p-2.5 space-y-2 select-none shadow-sm font-mono text-[11px]"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: `${theme.primary}40`,
                  }}
                >
                  {/* Mini Waybar Pill & Hyprland Window */}
                  <div className="flex items-center justify-between border-b pb-1.5 border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                      <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                      <span className="text-[10px] font-semibold text-white/70 ml-1">Hyprland Active</span>
                    </div>

                    {/* Mini Waybar Chip */}
                    <div
                      className="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 shadow-sm"
                      style={{
                        backgroundColor: theme.waybarBg,
                        borderColor: theme.border,
                        color: theme.primary,
                      }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>⚡ 3 active</span>
                    </div>
                  </div>

                  {/* Terminal Prompt Mockup */}
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <span style={{ color: theme.secondary }}>anas@omarchy</span>
                      <span className="text-white/40">:~#</span>
                      <span style={{ color: theme.accent }}>omastack up</span>
                    </div>
                    <div className="text-[9px] text-emerald-400 pl-3">
                      ✔ laravel-stack ready [http://app.oma.local]
                    </div>
                  </div>
                </div>

                {/* Supported Tool Tags */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {theme.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded font-mono border"
                      style={{
                        backgroundColor: `${theme.cardBg}90`,
                        borderColor: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.65)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-4 mt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => onSelectTheme(theme.key)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                    isActive ? 'opacity-90 cursor-default' : 'hover:brightness-110 active:scale-98'
                  }`}
                  style={{
                    backgroundColor: theme.primary,
                    color: '#08090f',
                  }}
                  title={isActive ? 'Theme currently active' : `Switch dashboard to ${theme.name}`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Active Theme</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Theme</span>
                    </>
                  )}
                </button>

                {/* Copy CLI Command */}
                <button
                  onClick={() => handleCopyCli(theme)}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-colors cursor-pointer bg-black/20"
                  title="Copy terminal command: omastack theme apply <name>"
                >
                  {copiedKey === theme.key ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Terminal className="w-4 h-4" />
                  )}
                </button>

                {/* Inspect / Export Package */}
                <button
                  onClick={() => setInspectTheme(theme)}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-colors cursor-pointer bg-black/20"
                  title="Inspect theme package JSON & configuration"
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Theme Package Modal */}
      {inspectTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            style={{
              backgroundColor: inspectTheme.bg,
              borderColor: inspectTheme.primary,
              color: inspectTheme.fg,
            }}
          >
            {/* Modal Header */}
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: inspectTheme.cardBg,
                borderColor: inspectTheme.border,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full border border-black/30"
                  style={{ backgroundColor: inspectTheme.primary }}
                />
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>{inspectTheme.name} Theme Package</span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: `${inspectTheme.primary}15`,
                        borderColor: `${inspectTheme.primary}30`,
                        color: inspectTheme.primary,
                      }}
                    >
                      {inspectTheme.category}
                    </span>
                  </h3>
                  <div className="text-xs text-white/50 font-mono">
                    Package ID: omarchy.theme.{inspectTheme.key}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectTheme(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto font-mono text-xs">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-white/80 uppercase">Theme Description</div>
                <p className="text-white/60 font-sans text-xs">
                  {inspectTheme.description}
                </p>
              </div>

              {/* Color Specs Table */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-white/80 uppercase">Color Tokens</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded border border-white/10 bg-black/20 space-y-1">
                    <span className="text-white/50 block text-[10px]">Background</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: inspectTheme.bg }} />
                      <span className="font-bold">{inspectTheme.bg}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-white/10 bg-black/20 space-y-1">
                    <span className="text-white/50 block text-[10px]">Card Surface</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: inspectTheme.cardBg }} />
                      <span className="font-bold">{inspectTheme.cardBg}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-white/10 bg-black/20 space-y-1">
                    <span className="text-white/50 block text-[10px]">Primary Accent</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: inspectTheme.primary }} />
                      <span className="font-bold">{inspectTheme.primary}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-white/10 bg-black/20 space-y-1">
                    <span className="text-white/50 block text-[10px]">Secondary Accent</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: inspectTheme.secondary }} />
                      <span className="font-bold">{inspectTheme.secondary}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package JSON Code Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white/80 uppercase">
                    Omarchy colors.json Definition
                  </span>
                  <span className="text-white/40">~/.config/omarchy/current/theme/colors.json</span>
                </div>
                <pre
                  className="p-3 rounded-xl border border-white/10 overflow-x-auto text-[11px] leading-relaxed shadow-inner"
                  style={{ backgroundColor: `${inspectTheme.cardBg}95` }}
                >
                  {generateThemeJson(inspectTheme)}
                </pre>
              </div>

              {/* Hyprland config snippet */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-white/80 uppercase">
                  Hyprland Active Border Hook
                </div>
                <pre
                  className="p-3 rounded-xl border border-white/10 overflow-x-auto text-[11px] text-white/80"
                  style={{ backgroundColor: `${inspectTheme.cardBg}95` }}
                >
{`# ${inspectTheme.name} Hyprland Window Border Settings
general {
    col.active_border = rgb(${inspectTheme.primary.replace('#', '')}) rgb(${inspectTheme.secondary.replace('#', '')}) 45deg
    col.inactive_border = rgba(${inspectTheme.border.replace('#', '')}aa)
}`}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: inspectTheme.cardBg,
                borderColor: inspectTheme.border,
              }}
            >
              <button
                onClick={() => {
                  onSelectTheme(inspectTheme.key);
                  setInspectTheme(null);
                }}
                className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                style={{
                  backgroundColor: inspectTheme.primary,
                  color: '#08090f',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply This Theme Now</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateThemeJson(inspectTheme));
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="px-3 py-2 rounded-lg border border-white/20 hover:border-white/40 flex items-center gap-1.5 transition-colors cursor-pointer text-white/80 hover:text-white"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>

                <button
                  onClick={() => handleDownloadTheme(inspectTheme)}
                  className="px-3 py-2 rounded-lg border border-white/20 hover:border-white/40 flex items-center gap-1.5 transition-colors cursor-pointer text-white/80 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
