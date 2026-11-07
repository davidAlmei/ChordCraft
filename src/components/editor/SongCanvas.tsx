'use client';

import React, { useState, useCallback } from 'react';
import { SongDocument, SongSection, LyricLine, ChordAnchor } from '@/features/songs/song-types';
import { LyricLineEditor, ActiveChordPopoverInfo } from './LyricLineEditor';
import { ChordEntryPopover } from '../chord-picker/ChordEntryPopover';
import { splitLine, mergeLines } from '@/features/lyrics/position-mapping';
import { computeSongLayout, MM_TO_PX } from '@/features/layout/song-layout';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface SongCanvasProps {
  song: SongDocument;
  onUpdateSong: (updated: SongDocument) => void;
  zoom: number;
}

interface ActivePopoverState extends ActiveChordPopoverInfo {
  sectionId: string;
  lineId: string;
}

export const SongCanvas: React.FC<SongCanvasProps> = ({
  song,
  onUpdateSong,
  zoom,
}) => {
  const settings = song.settings;
  const layout = computeSongLayout(song);
  const dims = layout.pageDimensions;

  // Single global popover state across the entire song
  const [activePopover, setActivePopover] = useState<ActivePopoverState | null>(null);
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);

  // Update a single line inside a section
  const handleUpdateLine = useCallback(
    (sectionId: string, updatedLine: LyricLine) => {
      const newSections = song.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          lines: sec.lines.map((ln) => (ln.id === updatedLine.id ? updatedLine : ln)),
        };
      });
      onUpdateSong({ ...song, sections: newSections });
    },
    [song, onUpdateSong]
  );

  // Split line (Enter key)
  const handleSplitLine = useCallback(
    (sectionId: string, lineId: string, offset: number) => {
      const newSections = song.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const lineIdx = sec.lines.findIndex((l) => l.id === lineId);
        if (lineIdx === -1) return sec;

        const currentLine = sec.lines[lineIdx];
        const { line1, line2 } = splitLine(currentLine, offset);

        const newLines = [...sec.lines];
        newLines.splice(lineIdx, 1, line1, line2);

        return { ...sec, lines: newLines };
      });
      onUpdateSong({ ...song, sections: newSections });
    },
    [song, onUpdateSong]
  );

  // Merge line with previous line (Backspace at beginning)
  const handleMergeWithPrevious = useCallback(
    (sectionId: string, lineId: string) => {
      const newSections = song.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const lineIdx = sec.lines.findIndex((l) => l.id === lineId);
        if (lineIdx <= 0) return sec;

        const prevLine = sec.lines[lineIdx - 1];
        const currentLine = sec.lines[lineIdx];
        const merged = mergeLines(prevLine, currentLine);

        const newLines = [...sec.lines];
        newLines.splice(lineIdx - 1, 2, merged);

        return { ...sec, lines: newLines };
      });
      onUpdateSong({ ...song, sections: newSections });
    },
    [song, onUpdateSong]
  );

  // Delete line
  const handleDeleteLine = useCallback(
    (sectionId: string, lineId: string) => {
      const newSections = song.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        if (sec.lines.length <= 1) {
          // If only 1 line, clear text and chords instead of removing line
          return {
            ...sec,
            lines: [{ id: lineId, text: '', chords: [] }],
          };
        }
        return {
          ...sec,
          lines: sec.lines.filter((l) => l.id !== lineId),
        };
      });
      onUpdateSong({ ...song, sections: newSections });
    },
    [song, onUpdateSong]
  );

  // Add line to section
  const handleAddLine = useCallback(
    (sectionId: string) => {
      const newSections = song.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          lines: [
            ...sec.lines,
            {
              id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              text: '',
              chords: [],
            },
          ],
        };
      });
      onUpdateSong({ ...song, sections: newSections });
    },
    [song, onUpdateSong]
  );

  // Add new section
  const handleAddSection = useCallback(
    (label = 'Verse') => {
      const newSec: SongSection = {
        id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        label,
        lines: [
          {
            id: `line_${Date.now()}_0`,
            text: '',
            chords: [],
          },
        ],
      };
      onUpdateSong({
        ...song,
        sections: [...song.sections, newSec],
      });
    },
    [song, onUpdateSong]
  );

  // Delete section
  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      if (song.sections.length <= 1) {
        onUpdateSong({
          ...song,
          sections: [
            {
              id: `sec_${Date.now()}_0`,
              label: 'Verse 1',
              lines: [{ id: `line_${Date.now()}_0`, text: '', chords: [] }],
            },
          ],
        });
        return;
      }
      onUpdateSong({
        ...song,
        sections: song.sections.filter((s) => s.id !== sectionId),
      });
    },
    [song, onUpdateSong]
  );

  // Reorder sections
  const handleMoveSection = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= song.sections.length) return;

      const newSections = [...song.sections];
      const [moved] = newSections.splice(index, 1);
      newSections.splice(targetIdx, 0, moved);

      onUpdateSong({ ...song, sections: newSections });
    },
    [song, onUpdateSong]
  );

  // Open Popover (immediately replaces any previous popover, ensuring only 1 is open)
  const handleOpenPopover = useCallback(
    (sectionId: string, lineId: string, info: ActiveChordPopoverInfo) => {
      setActivePopover({
        ...info,
        sectionId,
        lineId,
      });
    },
    []
  );

  // Confirm Chord from popover
  const handleConfirmChord = useCallback(
    (symbol: string, _row: number, visualOffsetX: number) => {
      if (!activePopover) return;
      const { sectionId, lineId, chordId, anchorOffset } = activePopover;

      const newSections = song.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          lines: sec.lines.map((ln) => {
            if (ln.id !== lineId) return ln;

            if (chordId) {
              // Update existing chord
              return {
                ...ln,
                chords: ln.chords.map((c) =>
                  c.id === chordId ? { ...c, symbol, visualOffsetX, row: 0 } : c
                ),
              };
            } else {
              // Create new chord on single row
              const newChord: ChordAnchor = {
                id: `chord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                symbol,
                anchorOffset,
                affinity: 'before',
                visualOffsetX,
                row: 0,
              };
              return {
                ...ln,
                chords: [...ln.chords, newChord],
              };
            }
          }),
        };
      });

      onUpdateSong({ ...song, sections: newSections });
      setActivePopover(null);
    },
    [activePopover, song, onUpdateSong]
  );

  // Delete Chord from popover
  const handleDeleteChord = useCallback(() => {
    if (!activePopover?.chordId) return;
    const { sectionId, lineId, chordId } = activePopover;

    const newSections = song.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        lines: sec.lines.map((ln) => {
          if (ln.id !== lineId) return ln;
          return {
            ...ln,
            chords: ln.chords.filter((c) => c.id !== chordId),
          };
        }),
      };
    });

    onUpdateSong({ ...song, sections: newSections });
    setSelectedChordId(null);
    setActivePopover(null);
  }, [activePopover, song, onUpdateSong]);

  // Duplicate Chord from popover
  const handleDuplicateChord = useCallback(() => {
    if (!activePopover?.chordId) return;
    const { sectionId, lineId, chordId } = activePopover;

    const newSections = song.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        lines: sec.lines.map((ln) => {
          if (ln.id !== lineId) return ln;
          const source = ln.chords.find((c) => c.id === chordId);
          if (!source) return ln;
          const dup: ChordAnchor = {
            ...source,
            id: `chord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            anchorOffset: Math.min(ln.text.length, source.anchorOffset + 1),
            visualOffsetX: (source.visualOffsetX || 0) + 15,
            row: 0,
          };
          return {
            ...ln,
            chords: [...ln.chords, dup],
          };
        }),
      };
    });

    onUpdateSong({ ...song, sections: newSections });
    setActivePopover(null);
  }, [activePopover, song, onUpdateSong]);

  return (
    <div
      className="flex-1 py-10 px-4 flex flex-col items-center min-h-[calc(100vh-3.5rem)] bg-slate-100 overflow-x-auto"
      onClick={() => {
        // Clicking outside closes the popover and deselects chords
        if (activePopover) setActivePopover(null);
        if (selectedChordId) setSelectedChordId(null);
      }}
    >
      {/* Printable Sheet Canvas */}
      <div
        className="bg-white shadow-xl rounded-sm border border-slate-200 transition-transform origin-top print:shadow-none print:border-none print:m-0"
        style={{
          width: `${dims.widthPx}px`,
          minHeight: `${dims.heightPx}px`,
          paddingTop: `${settings.margins.top * MM_TO_PX}px`,
          paddingBottom: `${settings.margins.bottom * MM_TO_PX}px`,
          paddingLeft: `${settings.margins.left * MM_TO_PX}px`,
          paddingRight: `${settings.margins.right * MM_TO_PX}px`,
          transform: `scale(${zoom})`,
          marginBottom: `${(zoom - 1) * dims.heightPx * 0.5 + 40}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Song Header */}
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h1
            className="text-2xl font-black text-slate-900 tracking-tight"
            style={{ fontFamily: settings.lyricFontFamily }}
          >
            {song.title || 'Untitled Song'}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
            {song.artist && <span>{song.artist}</span>}
            {song.key && <span>• Key of {song.key}</span>}
            {song.tempo && <span>• {song.tempo} BPM</span>}
            {song.timeSignature && <span>• {song.timeSignature} Beat</span>}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {song.sections.map((section, sIdx) => (
            <div
              key={section.id}
              className="group/sec relative p-3 -mx-3 rounded-lg hover:bg-slate-50/70 transition-colors"
              style={{ marginBottom: `${settings.sectionSpacing}px` }}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={section.label || ''}
                  onChange={(e) => {
                    const newSections = song.sections.map((s) =>
                      s.id === section.id ? { ...s, label: e.target.value } : s
                    );
                    onUpdateSong({ ...song, sections: newSections });
                  }}
                  placeholder="Section Label (e.g. Verse 1, Chorus)"
                  className="text-xs uppercase font-bold tracking-wider text-slate-500 bg-transparent hover:bg-white focus:bg-white px-2 py-0.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition w-48"
                />

                {/* Section Action Controls */}
                <div className="opacity-0 group-hover/sec:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => handleMoveSection(sIdx, 'up')}
                    disabled={sIdx === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded hover:bg-slate-200 transition"
                    title="Move Section Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveSection(sIdx, 'down')}
                    disabled={sIdx === song.sections.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded hover:bg-slate-200 transition"
                    title="Move Section Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                    title="Delete Section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Section Lyric Lines */}
              <div className="space-y-1">
                {section.lines.map((line, lIdx) => (
                  <LyricLineEditor
                    key={line.id}
                    line={line}
                    settings={settings}
                    isFirstLine={sIdx === 0 && lIdx === 0}
                    selectedChordId={selectedChordId}
                    onSelectChord={setSelectedChordId}
                    onOpenPopover={(info) => handleOpenPopover(section.id, line.id, info)}
                    onUpdateLine={(up) => handleUpdateLine(section.id, up)}
                    onSplitLine={(lId, off) => handleSplitLine(section.id, lId, off)}
                    onMergeWithPrevious={(lId) => handleMergeWithPrevious(section.id, lId)}
                    onDeleteLine={(lId) => handleDeleteLine(section.id, lId)}
                  />
                ))}
              </div>

              {/* Add line button */}
              <div className="pt-2 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                <button
                  onClick={() => handleAddLine(section.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add line</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Section Controls */}
        <div className="mt-8 pt-4 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">+ Add Section:</span>
          {['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro'].map((label) => (
            <button
              key={label}
              onClick={() => handleAddSection(label)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 transition"
            >
              + {label}
            </button>
          ))}
        </div>

        {/* Page Footer indicator */}
        <div className="mt-12 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Page 1 of {layout.totalPages} • {settings.pageSize} ({settings.orientation})
        </div>
      </div>

      {/* Exactly ONE global Chord Entry Popover across the entire editor */}
      {activePopover && (
        <ChordEntryPopover
          isOpen={true}
          initialSymbol={activePopover.symbol}
          visualOffsetX={activePopover.visualOffsetX}
          position={{ x: activePopover.screenX, y: activePopover.screenY }}
          onConfirm={handleConfirmChord}
          onCancel={() => setActivePopover(null)}
          onDelete={activePopover.chordId ? handleDeleteChord : undefined}
          onDuplicate={activePopover.chordId ? handleDuplicateChord : undefined}
        />
      )}
    </div>
  );
};
