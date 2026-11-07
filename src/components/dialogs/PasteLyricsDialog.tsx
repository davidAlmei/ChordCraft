'use client';

import React, { useState } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { SongSection } from '@/features/songs/song-types';

interface PasteLyricsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sections: SongSection[], replace: boolean) => void;
}

export const PasteLyricsDialog: React.FC<PasteLyricsDialogProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [text, setText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);

  if (!isOpen) return null;

  const handleParseAndImport = () => {
    if (!text.trim()) {
      onClose();
      return;
    }

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const sections: SongSection[] = [];
    let currentSection: SongSection = {
      id: `sec_${Date.now()}_0`,
      label: 'Verse 1',
      lines: [],
    };

    let sectionCount = 1;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      // Check if line looks like a section header, e.g. [Verse 1], Chorus:, (Bridge)
      const sectionMatch = trimmed.match(/^\[(.*?)\]$|^(Verse\s*\d*|Chorus\s*\d*|Bridge|Intro|Outro|Pre-Chorus|Tag|Interlude):?$/i);

      if (sectionMatch) {
        if (currentSection.lines.length > 0) {
          sections.push(currentSection);
        }
        const label = sectionMatch[1] || sectionMatch[2] || `Section ${++sectionCount}`;
        currentSection = {
          id: `sec_${Date.now()}_${sections.length}`,
          label,
          lines: [],
        };
      } else if (trimmed === '') {
        // Blank line marks new section if current has lines
        if (currentSection.lines.length > 0) {
          sections.push(currentSection);
          currentSection = {
            id: `sec_${Date.now()}_${sections.length}`,
            label: `Section ${++sectionCount}`,
            lines: [],
          };
        }
      } else {
        currentSection.lines.push({
          id: `line_${Date.now()}_${currentSection.lines.length}_${Math.random().toString(36).substring(2, 6)}`,
          text: rawLine,
          chords: [],
        });
      }
    }

    if (currentSection.lines.length > 0) {
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({
        id: `sec_${Date.now()}_0`,
        label: 'Verse 1',
        lines: [{ id: `line_${Date.now()}_0`, text: '', chords: [] }],
      });
    }

    onImport(sections, replaceExisting);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Paste Song Lyrics</h3>
              <p className="text-xs text-slate-500">Paste plain text. Blank lines create new sections automatically.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={`[Verse 1]\nAmazing grace, how sweet the sound\nThat saved a wretch like me\n\n[Chorus]\nMy chains are gone, I've been set free\nMy God, my Savior has ransomed me`}
            className="w-full text-sm font-sans p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Replace current lyrics
          </label>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleParseAndImport}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              Import Lyrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
