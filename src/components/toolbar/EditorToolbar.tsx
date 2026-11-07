'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  FileDown,
  Sliders,
  Maximize2,
  Minimize2,
  FileText,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { SongDocument } from '@/features/songs/song-types';

interface EditorToolbarProps {
  song: SongDocument;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateSong: (partial: Partial<SongDocument>) => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onOpenPasteDialog: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isDistractionFree: boolean;
  onToggleDistractionFree: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  song,
  saveStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onUpdateSong,
  onExportPdf,
  onExportJson,
  onOpenPasteDialog,
  isSidebarOpen,
  onToggleSidebar,
  isDistractionFree,
  onToggleDistractionFree,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-2 flex items-center justify-between text-slate-800 shadow-xs">
      {/* Left section: Navigation & Song Title/Artist */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="Back to Song Library"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Library</span>
        </Link>

        <div className="h-5 w-px bg-slate-200" />

        {/* Title & Artist Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={song.title}
            onChange={(e) => onUpdateSong({ title: e.target.value })}
            placeholder="Song Title"
            className="text-sm font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-all w-40 sm:w-56"
          />

          {!isDistractionFree && (
            <input
              type="text"
              value={song.artist || ''}
              onChange={(e) => onUpdateSong({ artist: e.target.value })}
              placeholder="Artist / Composer"
              className="hidden md:inline-block text-xs text-slate-500 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-all w-36"
            />
          )}
        </div>

        {/* Key and Tempo chips */}
        {!isDistractionFree && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600">
            <div className="flex items-center bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">KEY:</span>
              <input
                type="text"
                value={song.key || 'C'}
                onChange={(e) => onUpdateSong({ key: e.target.value })}
                className="w-8 font-bold bg-transparent text-center focus:outline-none uppercase"
              />
            </div>
            <div className="flex items-center bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">BPM:</span>
              <input
                type="number"
                value={song.tempo || 120}
                onChange={(e) => onUpdateSong({ tempo: parseInt(e.target.value) || 120 })}
                className="w-10 font-bold bg-transparent text-center focus:outline-none"
              />
            </div>
            <div className="flex items-center bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">BEAT:</span>
              <input
                type="text"
                value={song.timeSignature || '4/4'}
                onChange={(e) => onUpdateSong({ timeSignature: e.target.value })}
                placeholder="4/4"
                className="w-10 font-bold bg-transparent text-center focus:outline-none"
                title="Time Signature / Beat (e.g. 4/4, 3/4, 6/8)"
              />
            </div>
          </div>
        )}
      </div>

      {/* Center: Live Save Status & Undo/Redo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Save Status Badge */}
        <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500">
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 hidden sm:inline">Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span className="text-blue-700 hidden sm:inline">Saving...</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-700 hidden sm:inline">Unsaved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-rose-700 hidden sm:inline">Save error</span>
            </>
          )}
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenPasteDialog}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          title="Paste raw lyrics text"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Paste Lyrics</span>
        </button>

        <button
          onClick={onToggleDistractionFree}
          className={`p-1.5 rounded-lg border transition ${
            isDistractionFree ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
          title={isDistractionFree ? 'Exit Distraction-Free' : 'Distraction-Free Mode'}
        >
          {isDistractionFree ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
            isSidebarOpen ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title="Toggle Formatting Sidebar"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Format</span>
        </button>

        <button
          onClick={onExportJson}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          title="Download Backup JSON"
        >
          <FileDown className="w-4 h-4" />
        </button>

        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition"
          title="Export Print-Ready PDF (Ctrl+Shift+E)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </button>
      </div>
    </header>
  );
};
