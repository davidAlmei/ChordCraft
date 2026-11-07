'use client';

import React from 'react';
import { SongSettings } from '@/features/songs/song-types';
import { X, Sliders, Type, Layout, AlignLeft, Palette } from 'lucide-react';

interface FormattingSidebarProps {
  settings: SongSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: SongSettings) => void;
  zoom: number;
  onUpdateZoom: (zoom: number) => void;
}

const FONT_FAMILIES = [
  { name: 'Modern Sans (Default)', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { name: 'Monospace (Courier/Consolas)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { name: 'Editorial Serif (Georgia/Times)', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Clean Sans (Arial/Helvetica)', value: 'Arial, Helvetica, sans-serif' },
];

const CHORD_COLORS = [
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Deep Indigo', value: '#4f46e5' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Crimson', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Charcoal', value: '#334155' },
];

export const FormattingSidebar: React.FC<FormattingSidebarProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
  zoom,
  onUpdateZoom,
}) => {
  if (!isOpen) return null;

  const update = (partial: Partial<SongSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const updateMargins = (key: keyof SongSettings['margins'], val: number) => {
    onUpdateSettings({
      ...settings,
      margins: {
        ...settings.margins,
        [key]: Math.max(0, Math.min(80, val)),
      },
    });
  };

  return (
    <aside className="fixed top-14 right-0 bottom-0 w-84 bg-white border-l border-slate-200 shadow-xl z-40 overflow-y-auto p-5 text-slate-800 transition-all select-none">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-sm tracking-wide text-slate-800">Formatting & Page Layout</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Page Setup */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          <Layout className="w-3.5 h-3.5" />
          <span>Paper & Orientation</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paper Size</label>
            <select
              value={settings.pageSize}
              onChange={(e) => update({ pageSize: e.target.value as any })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">US Letter (8.5 × 11 in)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Orientation</label>
            <select
              value={settings.orientation}
              onChange={(e) => update({ orientation: e.target.value as any })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        {/* Margins */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Margins (mm)</label>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <div key={side} className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400 font-bold">{side}</span>
                <input
                  type="number"
                  min={0}
                  max={80}
                  step={1}
                  value={settings.margins[side]}
                  onChange={(e) => updateMargins(side, parseInt(e.target.value) || 0)}
                  className="w-full text-center text-xs font-bold bg-transparent focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          <Type className="w-3.5 h-3.5" />
          <span>Typography & Fonts</span>
        </div>

        {/* Chord Font & Size */}
        <div className="mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Chord Font</label>
          <select
            value={settings.chordFontFamily}
            onChange={(e) => update({ chordFontFamily: e.target.value })}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium mb-2.5"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5">
            <span className="font-semibold">Chord Size:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={8}
                max={36}
                step={0.5}
                value={settings.chordFontSize}
                onChange={(e) => update({ chordFontSize: parseFloat(e.target.value) || 12 })}
                className="w-14 text-right px-1.5 py-0.5 font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-medium">px</span>
            </div>
          </div>
          <input
            type="range"
            min={8}
            max={36}
            step={0.5}
            value={settings.chordFontSize}
            onChange={(e) => update({ chordFontSize: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>

        {/* Lyric Font & Size */}
        <div className="mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lyric Font</label>
          <select
            value={settings.lyricFontFamily}
            onChange={(e) => update({ lyricFontFamily: e.target.value })}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium mb-2.5"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5">
            <span className="font-semibold">Lyric Size:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={9}
                max={40}
                step={0.5}
                value={settings.lyricFontSize}
                onChange={(e) => update({ lyricFontSize: parseFloat(e.target.value) || 14 })}
                className="w-14 text-right px-1.5 py-0.5 font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-medium">px</span>
            </div>
          </div>
          <input
            type="range"
            min={9}
            max={40}
            step={0.5}
            value={settings.lyricFontSize}
            onChange={(e) => update({ lyricFontSize: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>

        {/* Chord Color */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>Chord Color</span>
          </div>
          <div className="flex items-center gap-2">
            {CHORD_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => update({ chordColor: c.value })}
                className={`w-6 h-6 rounded-full transition-transform ${
                  settings.chordColor === c.value ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
            <input
              type="color"
              value={settings.chordColor}
              onChange={(e) => update({ chordColor: e.target.value })}
              className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
              title="Custom Color"
            />
          </div>
        </div>
      </div>

      {/* Spacing Controls - Highly Adjustable with wider range & fine steps */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Line & Section Spacing</span>
        </div>

        {/* Line Spacing Slider + Direct Number Input */}
        <div className="mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5">
            <span className="font-semibold">Line Spacing:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1.0}
                max={4.0}
                step={0.05}
                value={settings.lineSpacing}
                onChange={(e) => update({ lineSpacing: parseFloat(e.target.value) || 1.6 })}
                className="w-14 text-right px-1.5 py-0.5 font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-medium">×</span>
            </div>
          </div>
          <input
            type="range"
            min={1.0}
            max={4.0}
            step={0.05}
            value={settings.lineSpacing}
            onChange={(e) => update({ lineSpacing: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Tight (1.0×)</span>
            <span>Normal (1.6×)</span>
            <span>Spacious (4.0×)</span>
          </div>
        </div>

        {/* Section Spacing Slider + Direct Number Input */}
        <div className="mb-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5">
            <span className="font-semibold">Section Gap:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={settings.sectionSpacing}
                onChange={(e) => update({ sectionSpacing: parseInt(e.target.value) || 0 })}
                className="w-14 text-right px-1.5 py-0.5 font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-medium">px</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.sectionSpacing}
            onChange={(e) => update({ sectionSpacing: parseInt(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0px</span>
            <span>24px</span>
            <span>100px</span>
          </div>
        </div>
      </div>

      {/* Canvas View Zoom */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5">
          <span className="font-semibold">Canvas Zoom:</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onUpdateZoom(Math.max(0.4, Number((zoom - 0.05).toFixed(2))))}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700"
          >
            -
          </button>
          <input
            type="range"
            min={0.4}
            max={2.0}
            step={0.05}
            value={zoom}
            onChange={(e) => onUpdateZoom(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <button
            onClick={() => onUpdateZoom(Math.min(2.0, Number((zoom + 0.05).toFixed(2))))}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700"
          >
            +
          </button>
        </div>
        <div className="flex gap-1.5">
          {[0.75, 1.0, 1.25, 1.5].map((z) => (
            <button
              key={z}
              onClick={() => onUpdateZoom(z)}
              className={`flex-1 py-1 rounded text-[11px] font-semibold border ${
                zoom === z ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
