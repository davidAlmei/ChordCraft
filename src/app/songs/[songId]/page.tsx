'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SongDocument, SongSection, SongSettings } from '@/features/songs/song-types';
import { getSongById, saveSong, exportSongToJson } from '@/features/songs/song-store';
import { exportSongToPdf } from '@/features/pdf/pdf-exporter';
import { EditorToolbar } from '@/components/toolbar/EditorToolbar';
import { SongCanvas } from '@/components/editor/SongCanvas';
import { FormattingSidebar } from '@/components/formatting/FormattingSidebar';
import { PasteLyricsDialog } from '@/components/dialogs/PasteLyricsDialog';

function SongEditorContent() {
  const params = useParams();
  const router = useRouter();
  const songId = params?.songId as string;

  const [song, setSong] = useState<SongDocument | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  // Undo / Redo history
  const undoStackRef = useRef<SongDocument[]>([]);
  const redoStackRef = useRef<SongDocument[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Debounced autosave ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSongRef = useRef<SongDocument | null>(null);

  // Load song from IndexedDB on mount
  useEffect(() => {
    async function load() {
      if (!songId) return;
      const loaded = await getSongById(songId);
      if (loaded) {
        setSong(loaded);
        latestSongRef.current = loaded;
      } else {
        // Song not found, redirect to library
        router.push('/');
      }
    }
    load();
  }, [songId, router]);

  // Push state to undo stack when document changes
  const applySongUpdate = useCallback((newSong: SongDocument, recordHistory = true) => {
    if (recordHistory && latestSongRef.current) {
      undoStackRef.current.push(JSON.parse(JSON.stringify(latestSongRef.current)));
      // Limit history to 50 steps
      if (undoStackRef.current.length > 50) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }

    setSong(newSong);
    latestSongRef.current = newSong;
    setSaveStatus('unsaved');

    // Debounced autosave after 800ms
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await saveSong(newSong);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, 800);
  }, []);

  // Update partial song metadata
  const handleUpdateSongMetadata = useCallback((partial: Partial<SongDocument>) => {
    if (!latestSongRef.current) return;
    const updated = { ...latestSongRef.current, ...partial };
    applySongUpdate(updated, true);
  }, [applySongUpdate]);

  // Update formatting settings
  const handleUpdateSettings = useCallback((newSettings: SongSettings) => {
    if (!latestSongRef.current) return;
    const updated = { ...latestSongRef.current, settings: newSettings };
    applySongUpdate(updated, true);
  }, [applySongUpdate]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0 || !latestSongRef.current) return;
    const previous = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(latestSongRef.current)));

    setSong(previous);
    latestSongRef.current = previous;
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    saveSong(previous);
  }, []);

  // Redo action
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0 || !latestSongRef.current) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(latestSongRef.current)));

    setSong(next);
    latestSongRef.current = next;
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    saveSong(next);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (modKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (latestSongRef.current) {
          setSaveStatus('saving');
          saveSong(latestSongRef.current).then(() => setSaveStatus('saved'));
        }
      } else if (modKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (latestSongRef.current) {
          exportSongToPdf(latestSongRef.current);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Export PDF
  const handleExportPdf = useCallback(() => {
    if (!song) return;
    exportSongToPdf(song);
  }, [song]);

  // Export JSON
  const handleExportJson = useCallback(() => {
    if (!song) return;
    const jsonStr = exportSongToJson(song);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title || 'song'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [song]);

  // Paste Lyrics Handler
  const handleImportLyrics = useCallback(
    (sections: SongSection[], replace: boolean) => {
      if (!song) return;
      const updatedSections = replace ? sections : [...song.sections, ...sections];
      applySongUpdate({ ...song, sections: updatedSections }, true);
    },
    [song, applySongUpdate]
  );

  if (!song) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading song editor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 select-text">
      {/* Top Toolbar */}
      <EditorToolbar
        song={song}
        saveStatus={saveStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onUpdateSong={handleUpdateSongMetadata}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        onOpenPasteDialog={() => setIsPasteDialogOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isDistractionFree={isDistractionFree}
        onToggleDistractionFree={() => setIsDistractionFree((prev) => !prev)}
      />

      {/* Main Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <SongCanvas
          song={song}
          onUpdateSong={(up) => applySongUpdate(up, true)}
          zoom={zoom}
        />

        {/* Formatting Sidebar */}
        <FormattingSidebar
          settings={song.settings}
          isOpen={isSidebarOpen && !isDistractionFree}
          onClose={() => setIsSidebarOpen(false)}
          onUpdateSettings={handleUpdateSettings}
          zoom={zoom}
          onUpdateZoom={setZoom}
        />
      </div>

      {/* Paste lyrics dialog */}
      <PasteLyricsDialog
        isOpen={isPasteDialogOpen}
        onClose={() => setIsPasteDialogOpen(false)}
        onImport={handleImportLyrics}
      />
    </div>
  );
}

export default function SongEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading editor...
          </div>
        </div>
      }
    >
      <SongEditorContent />
    </Suspense>
  );
}
