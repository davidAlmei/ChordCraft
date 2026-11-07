'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Trash2, Copy } from 'lucide-react';

interface ChordEntryPopoverProps {
  initialSymbol?: string;
  initialRow?: number;
  visualOffsetX?: number;
  isOpen: boolean;
  position: { x: number; y: number };
  onConfirm: (symbol: string, row: number, visualOffsetX: number) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const COMMON_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const COMMON_ACCIDENTALS = ['#', 'b'];
const COMMON_QUALITIES = ['m', '7', 'maj7', 'm7', 'sus4', 'dim', 'add9'];
const COMMON_BASS = ['/E', '/G', '/B', '/F#'];

export const ChordEntryPopover: React.FC<ChordEntryPopoverProps> = ({
  initialSymbol = '',
  initialRow = 0,
  visualOffsetX = 0,
  isOpen,
  position,
  onConfirm,
  onCancel,
  onDelete,
  onDuplicate,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [row] = useState(initialRow);
  const [nudgeX, setNudgeX] = useState(visualOffsetX);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSymbol(initialSymbol);
      setNudgeX(visualOffsetX);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    }
  }, [isOpen, initialSymbol, visualOffsetX]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (symbol.trim()) {
          onConfirm(symbol.trim(), row, nudgeX);
        } else if (onDelete) {
          onDelete();
        } else {
          onCancel();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, symbol, row, nudgeX, onConfirm, onCancel, onDelete]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 w-76 text-slate-800 transition-all text-xs"
      style={{
        left: `${Math.max(10, Math.min(window.innerWidth - 320, position.x))}px`,
        top: `${Math.max(10, position.y)}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <span className="font-bold text-slate-800 text-xs tracking-wide">
          {initialSymbol ? 'Edit Chord' : 'Place Chord'}
        </span>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100 transition"
          title="Cancel (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main input */}
      <div className="relative mb-2.5">
        <input
          ref={inputRef}
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g. Am7, C#dim, G/B"
          className="w-full text-base font-bold text-blue-600 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wide"
        />
      </div>

      {/* Quick Root Palette */}
      <div className="mb-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Root</div>
        <div className="flex gap-1 flex-wrap">
          {COMMON_ROOTS.map((root) => (
            <button
              key={root}
              type="button"
              onClick={() => {
                const currentRest = symbol.replace(/^[A-G][#b]?/, '');
                setSymbol(root + currentRest);
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded text-xs font-bold font-mono border border-slate-200 transition"
            >
              {root}
            </button>
          ))}
          {COMMON_ACCIDENTALS.map((acc) => (
            <button
              key={acc}
              type="button"
              onClick={() => {
                setSymbol((prev) => prev + acc);
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 rounded text-xs font-bold font-mono border border-slate-200 transition"
            >
              {acc}
            </button>
          ))}
        </div>
      </div>

      {/* Qualities Palette */}
      <div className="mb-2.5">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Quality</div>
        <div className="flex gap-1 flex-wrap">
          {COMMON_QUALITIES.map((qual) => (
            <button
              key={qual}
              type="button"
              onClick={() => {
                setSymbol((prev) => prev + qual);
                inputRef.current?.focus();
              }}
              className="px-1.5 py-0.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-600 rounded text-[11px] font-mono border border-slate-200 transition"
            >
              {qual}
            </button>
          ))}
          {COMMON_BASS.map((bass) => (
            <button
              key={bass}
              type="button"
              onClick={() => {
                setSymbol((prev) => prev + bass);
                inputRef.current?.focus();
              }}
              className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded text-[11px] font-mono border border-slate-200 transition"
            >
              {bass}
            </button>
          ))}
        </div>
      </div>

      {/* Ultra-Smooth Chord Position Slider */}
      <div className="mb-3 pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2 rounded-xl border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-700">Position Slider:</span>
          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
            {nudgeX >= 0 ? `+${nudgeX}` : nudgeX}px
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNudgeX((prev) => prev - 1)}
            className="px-1.5 py-0.5 hover:bg-slate-200 rounded font-bold text-slate-600 text-[10px] border border-slate-300"
            title="Step Left 1px"
          >
            -1
          </button>
          <input
            type="range"
            min={-80}
            max={80}
            step={1}
            value={nudgeX}
            onChange={(e) => setNudgeX(parseInt(e.target.value) || 0)}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setNudgeX((prev) => prev + 1)}
            className="px-1.5 py-0.5 hover:bg-slate-200 rounded font-bold text-slate-600 text-[10px] border border-slate-300"
            title="Step Right 1px"
          >
            +1
          </button>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
          <span>← Slide Left</span>
          <button
            type="button"
            onClick={() => setNudgeX(0)}
            className="hover:text-blue-600 font-medium underline text-[10px]"
          >
            Reset 0px
          </button>
          <span>Slide Right →</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex gap-1">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
              title="Delete Chord"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              title="Duplicate Chord (Place another right beside)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (symbol.trim()) {
                onConfirm(symbol.trim(), row, nudgeX);
              }
            }}
            disabled={!symbol.trim()}
            className="flex items-center gap-1 px-3.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm transition"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
