'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit2,
  FileDown,
  Upload,
  Calendar,
  Sparkles,
  ExternalLink,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SongDocument, createNewSong } from '@/features/songs/song-types';
import {
  getAllSongs,
  saveSong,
  deleteSong,
  duplicateSong,
  seedInitialDataIfEmpty,
  exportSongToJson,
  importSongFromJson,
} from '@/features/songs/song-store';

export const SongLibrary: React.FC = () => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [songs, setSongs] = useState<SongDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<SongDocument | null>(null);

  // JSON Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Load songs from IndexedDB
  const refreshSongs = useCallback(async () => {
    try {
      await seedInitialDataIfEmpty();
      const all = await getAllSongs();
      setSongs(all);
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSongs();
  }, [refreshSongs]);

  // Create new song
  const handleCreateNewSong = async () => {
    const newSong = createNewSong('New Song', '');
    await saveSong(newSong);
    startTransition(() => {
      router.push(`/songs/${newSong.id}`);
    });
  };

  // Duplicate song
  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = await duplicateSong(id);
    if (copy) {
      await refreshSongs();
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteSong(deleteTarget.id);
    setDeleteTarget(null);
    await refreshSongs();
  };

  // Rename
  const handleConfirmRename = async () => {
    if (!renameTarget || !renameTarget.title.trim()) return;
    const targetSong = songs.find((s) => s.id === renameTarget.id);
    if (targetSong) {
      await saveSong({ ...targetSong, title: renameTarget.title.trim() });
      setRenameTarget(null);
      await refreshSongs();
    }
  };

  // Export JSON backup
  const handleExportJson = (song: SongDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonStr = exportSongToJson(song);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      const res = importSongFromJson(content);
      if (res.success && res.song) {
        await saveSong(res.song);
        await refreshSongs();
        setIsImportModalOpen(false);
      } else {
        setImportError(res.error || 'Failed to import JSON');
      }
    };
    reader.readAsText(file);
  };

  // Import from textarea
  const handleImportText = async () => {
    setImportError(null);
    const res = importSongFromJson(importJsonText);
    if (res.success && res.song) {
      await saveSong(res.song);
      await refreshSongs();
      setIsImportModalOpen(false);
      setImportJsonText('');
    } else {
      setImportError(res.error || 'Failed to import JSON');
    }
  };

  // Filter songs by search query
  const filteredSongs = songs.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(query) ||
      (s.artist && s.artist.toLowerCase().includes(query)) ||
      (s.key && s.key.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">ChordCraft</span>
              <span className="text-[11px] text-slate-400 font-medium block">Free-Position Chord Sheet Editor</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
              title="Import song backup"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import JSON</span>
            </button>

            <button
              onClick={handleCreateNewSong}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Song</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, artist, or key..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'} in local library
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your songs...
          </div>
        ) : filteredSongs.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              {searchQuery ? 'No matching songs found' : 'No chord sheets yet'}
            </h3>
            <p className="text-slate-500 text-xs mb-6">
              {searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'Create your first song to place chords freely, format lyrics, and export high-fidelity PDFs.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={handleCreateNewSong}
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
              >
                Create your first song
              </button>
            )}
          </div>
        ) : (
          /* Songs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSongs.map((song) => {
              const formattedDate = new Date(song.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const totalChords = song.sections.reduce(
                (secTotal, s) => secTotal + s.lines.reduce((lTotal, l) => lTotal + l.chords.length, 0),
                0
              );

              return (
                <div
                  key={song.id}
                  onClick={() => router.push(`/songs/${song.id}`)}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all p-5 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {song.title || 'Untitled Song'}
                      </h4>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {song.key && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {song.key}
                          </span>
                        )}
                        {song.tempo && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {song.tempo} BPM
                          </span>
                        )}
                        {song.timeSignature && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {song.timeSignature}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Artist */}
                    <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                      {song.artist || 'Unknown artist'}
                    </p>

                    {/* Meta stats */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-4">
                      <span>{song.sections.length} {song.sections.length === 1 ? 'section' : 'sections'}</span>
                      <span>•</span>
                      <span>{totalChords} chords</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    className="pt-3 border-t border-slate-100 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameTarget({ id: song.id, title: song.title });
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Rename Song"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(song.id, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Duplicate Song"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleExportJson(song, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Export JSON backup"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(song);
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Song"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/songs/${song.id}`}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition ml-1"
                        title="Open Editor"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Rename Dialog */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-slate-800">
            <h3 className="font-bold text-sm mb-3">Rename Song</h3>
            <input
              type="text"
              autoFocus
              value={renameTarget.title}
              onChange={(e) => setRenameTarget({ ...renameTarget, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
              className="w-full text-sm p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 font-semibold"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-slate-800">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Delete Song?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to permanently delete <strong className="text-slate-800">&ldquo;{deleteTarget.title}&rdquo;</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Dialog */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm">Import Song JSON Backup</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Upload .json file</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Or paste JSON content</label>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                rows={5}
                placeholder='{"title": "My Song", ...}'
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {importError && (
              <p className="text-xs text-rose-600 mb-3">{importError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImportText}
                disabled={!importJsonText.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
