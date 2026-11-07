'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChordAnchor, LyricLine, SongSettings } from '@/features/songs/song-types';
import { calculateLineChordLayout, ChordLayoutItem } from '@/features/chords/chord-layout';
import { mapCoordinateToOffset } from '@/features/layout/text-measurement';
import { mapChordsOnTextEdit } from '@/features/lyrics/position-mapping';
import { AlertCircle } from 'lucide-react';

export interface ActiveChordPopoverInfo {
  chordId?: string;
  symbol: string;
  anchorOffset: number;
  visualOffsetX: number;
  screenX: number;
  screenY: number;
}

interface LyricLineEditorProps {
  line: LyricLine;
  settings: SongSettings;
  isFirstLine?: boolean;
  selectedChordId: string | null;
  onSelectChord: (chordId: string | null) => void;
  onOpenPopover: (info: ActiveChordPopoverInfo) => void;
  onUpdateLine: (updated: LyricLine) => void;
  onSplitLine: (lineId: string, offset: number) => void;
  onMergeWithPrevious: (lineId: string) => void;
  onDeleteLine: (lineId: string) => void;
}

export const LyricLineEditor: React.FC<LyricLineEditorProps> = ({
  line,
  settings,
  isFirstLine = false,
  selectedChordId,
  onSelectChord,
  onOpenPopover,
  onUpdateLine,
  onSplitLine,
  onMergeWithPrevious,
  onDeleteLine,
}) => {
  const lineContainerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Hover indicator state
  const [hoverPosition, setHoverPosition] = useState<{ x: number; offset: number; affinity: 'before' | 'after' } | null>(null);

  // Dragging state
  const [draggingChordId, setDraggingChordId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; initialVisualOffset: number; chord: ChordAnchor } | null>(null);

  const lyricFont = `${settings.lyricFontSize}px ${settings.lyricFontFamily}`;

  // Layout calculations
  const chordLayout = calculateLineChordLayout(line.chords, line.text, settings);

  // Handle chord area mouse move for insertion indicator
  const handleChordAreaMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!lineContainerRef.current || draggingChordId) return;
      const rect = lineContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;

      const mapping = mapCoordinateToOffset(relativeX, line.text, lyricFont);
      setHoverPosition({
        x: mapping.snappedX,
        offset: mapping.anchorOffset,
        affinity: mapping.affinity,
      });
    },
    [line.text, lyricFont, draggingChordId]
  );

  const handleChordAreaMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  // Handle clicking chord area to create new chord
  const handleChordAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingChordId) return;
      if (!lineContainerRef.current) return;

      const rect = lineContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const mapping = mapCoordinateToOffset(relativeX, line.text, lyricFont);

      onOpenPopover({
        chordId: undefined,
        symbol: '',
        anchorOffset: mapping.anchorOffset,
        visualOffsetX: 0,
        screenX: rect.left + mapping.snappedX,
        screenY: rect.top - 40,
      });
    },
    [draggingChordId, line.text, lyricFont, onOpenPopover]
  );

  // Edit existing chord
  const handleEditChord = useCallback(
    (item: ChordLayoutItem, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!lineContainerRef.current) return;
      const rect = lineContainerRef.current.getBoundingClientRect();

      onOpenPopover({
        chordId: item.chord.id,
        symbol: item.chord.symbol,
        anchorOffset: item.chord.anchorOffset,
        visualOffsetX: item.chord.visualOffsetX,
        screenX: rect.left + item.x,
        screenY: rect.top - 40,
      });
      onSelectChord(item.chord.id);
    },
    [onOpenPopover, onSelectChord]
  );

  // Delete chord
  const handleDeleteChord = useCallback(
    (chordId: string) => {
      const updated = line.chords.filter((c) => c.id !== chordId);
      onUpdateLine({ ...line, chords: updated });
      onSelectChord(null);
    },
    [line, onUpdateLine, onSelectChord]
  );

  // Chord Dragging
  const handleChordPointerDown = (chord: ChordAnchor, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectChord(chord.id);
    setDraggingChordId(chord.id);

    dragStartRef.current = {
      startX: e.clientX,
      initialVisualOffset: chord.visualOffsetX || 0,
      chord,
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!dragStartRef.current || !lineContainerRef.current) return;
      const deltaX = moveEv.clientX - dragStartRef.current.startX;
      const newVisualOffset = dragStartRef.current.initialVisualOffset + deltaX;

      // Update dragging visual in line
      const updatedChords = line.chords.map((c) =>
        c.id === chord.id ? { ...c, visualOffsetX: newVisualOffset } : c
      );
      onUpdateLine({ ...line, chords: updatedChords });
    };

    const handlePointerUp = () => {
      setDraggingChordId(null);
      dragStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Keyboard navigation on selected chord
  useEffect(() => {
    if (!selectedChordId) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const activeChord = line.chords.find((c) => c.id === selectedChordId);
      if (!activeChord) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const updated = line.chords.map((c) =>
          c.id === selectedChordId ? { ...c, visualOffsetX: (c.visualOffsetX || 0) - step } : c
        );
        onUpdateLine({ ...line, chords: updated });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const updated = line.chords.map((c) =>
          c.id === selectedChordId ? { ...c, visualOffsetX: (c.visualOffsetX || 0) + step } : c
        );
        onUpdateLine({ ...line, chords: updated });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedChordId) {
          handleDeleteChord(selectedChordId);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const layoutItem = chordLayout.items.find((it) => it.chord.id === selectedChordId);
        if (layoutItem) {
          handleEditChord(layoutItem, e as any);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChordId, line, chordLayout.items, onUpdateLine, handleDeleteChord, handleEditChord]);

  // Handle lyric text input typing & keys
  const handleLyricKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursor = input.selectionStart || 0;

    if (e.key === 'Enter') {
      e.preventDefault();
      onSplitLine(line.id, cursor);
    } else if (e.key === 'Backspace' && cursor === 0 && (input.selectionEnd || 0) === 0) {
      if (!isFirstLine) {
        e.preventDefault();
        onMergeWithPrevious(line.id);
      }
    }
  };

  const handleLyricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    const oldText = line.text;

    // Detect single point edit delta
    let editIndex = 0;
    while (editIndex < oldText.length && editIndex < newText.length && oldText[editIndex] === newText[editIndex]) {
      editIndex++;
    }

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;
    while (oldEnd >= editIndex && newEnd >= editIndex && oldText[oldEnd] === newText[newEnd]) {
      oldEnd--;
      newEnd--;
    }

    const deletedCount = Math.max(0, oldEnd - editIndex + 1);
    const insertedCount = Math.max(0, newEnd - editIndex + 1);

    // If entire line text is deleted, delete all associated chords
    if (!newText.trim()) {
      onUpdateLine({
        ...line,
        text: newText,
        chords: [],
      });
      return;
    }

    const mappedChords = mapChordsOnTextEdit(line.chords, editIndex, deletedCount, insertedCount, newText);

    onUpdateLine({
      ...line,
      text: newText,
      chords: mappedChords,
    });
  };

  const chordAreaHeight = Math.max(22, chordLayout.totalChordHeight);

  return (
    <div
      ref={lineContainerRef}
      className="relative group mb-1 hover:bg-slate-50/50 rounded transition-colors"
      style={{
        lineHeight: `${settings.lineSpacing}`,
      }}
    >
      {/* Single Chord Area above lyric */}
      <div
        className="relative cursor-crosshair select-none overflow-visible"
        style={{ height: `${chordAreaHeight}px` }}
        onMouseMove={handleChordAreaMouseMove}
        onMouseLeave={handleChordAreaMouseLeave}
        onClick={handleChordAreaClick}
        title="Click anywhere to place a chord"
      >
        {/* Subtle hover insertion indicator */}
        {hoverPosition && (
          <div
            className="absolute pointer-events-none z-10 flex flex-col items-center"
            style={{
              left: `${hoverPosition.x}px`,
              top: 0,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm opacity-80"
              style={{ backgroundColor: settings.chordColor }}
            >
              + Chord
            </div>
            <div
              className="w-0.5 h-6 opacity-60"
              style={{ backgroundColor: settings.chordColor }}
            />
          </div>
        )}

        {/* Positioned Chords in single horizontal row */}
        {chordLayout.items.map((item) => {
          const isSelected = selectedChordId === item.chord.id;
          const isDragging = draggingChordId === item.chord.id;

          return (
            <div
              key={item.chord.id}
              onPointerDown={(e) => handleChordPointerDown(item.chord, e)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectChord(item.chord.id);
                handleEditChord(item, e);
              }}
              onDoubleClick={(e) => handleEditChord(item, e)}
              className={`absolute cursor-grab active:cursor-grabbing font-bold font-mono tracking-wide px-1.5 py-0.5 rounded transition-all select-none group/chord ${
                isSelected
                  ? 'ring-2 ring-blue-500 shadow-md bg-white z-20'
                  : 'hover:bg-slate-100 z-10'
              }`}
              style={{
                left: `${item.x}px`,
                top: `0px`,
                color: settings.chordColor,
                fontSize: `${settings.chordFontSize}px`,
                fontFamily: settings.chordFontFamily,
                opacity: isDragging ? 0.75 : 1,
              }}
              title={`${item.chord.symbol} (Click to edit, Drag to move)`}
            >
              <div className="flex items-center gap-1">
                <span>{item.chord.symbol}</span>
                {item.isColliding && (
                  <span title="Overlapping chord collision">
                    <AlertCircle className="w-3 h-3 text-amber-500 inline-block" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lyric Line Input */}
      <div className="relative">
        <input
          ref={textInputRef}
          type="text"
          value={line.text}
          onChange={handleLyricChange}
          onKeyDown={handleLyricKeyDown}
          placeholder={isFirstLine && !line.text ? 'Type lyrics here or paste full song...' : ''}
          className="w-full bg-transparent border-none outline-none p-0 m-0 text-slate-800 focus:ring-0 placeholder:text-slate-300 transition-colors"
          style={{
            fontSize: `${settings.lyricFontSize}px`,
            fontFamily: settings.lyricFontFamily,
            lineHeight: settings.lineSpacing,
          }}
        />
      </div>
    </div>
  );
};
