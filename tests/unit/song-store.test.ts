import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  saveSong,
  getAllSongs,
  getSongById,
  deleteSong,
  duplicateSong,
  exportSongToJson,
  importSongFromJson,
  validateSongDocument,
} from '@/features/songs/song-store';
import { createNewSong } from '@/features/songs/song-types';

describe('Song Document Model and Persistence', () => {
  beforeEach(async () => {
    await db.songs.clear();
  });

  it('creates and saves a song document', async () => {
    const song = createNewSong('Test Song', 'Test Artist');
    await saveSong(song);

    const saved = await getSongById(song.id);
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('Test Song');
    expect(saved?.artist).toBe('Test Artist');
    expect(saved?.sections.length).toBeGreaterThan(0);
  });

  it('retrieves all songs sorted by updatedAt', async () => {
    const song1 = createNewSong('Song 1');
    const song2 = createNewSong('Song 2');
    await saveSong(song1);
    await new Promise((r) => setTimeout(r, 10));
    await saveSong(song2);

    const all = await getAllSongs();
    expect(all.length).toBe(2);
    expect(all[0].id).toBe(song2.id); // Most recently updated first
  });

  it('duplicates a song with a new ID and title suffix', async () => {
    const song = createNewSong('Original');
    await saveSong(song);

    const copy = await duplicateSong(song.id);
    expect(copy).toBeDefined();
    expect(copy?.id).not.toBe(song.id);
    expect(copy?.title).toBe('Original (Copy)');

    const count = await db.songs.count();
    expect(count).toBe(2);
  });

  it('deletes a song', async () => {
    const song = createNewSong('To Delete');
    await saveSong(song);
    await deleteSong(song.id);

    const loaded = await getSongById(song.id);
    expect(loaded).toBeUndefined();
  });

  it('exports and imports JSON with schema validation', () => {
    const song = createNewSong('Export Song', 'Author');
    const jsonStr = exportSongToJson(song);
    expect(jsonStr).toContain('Export Song');

    const imported = importSongFromJson(jsonStr);
    expect(imported.success).toBe(true);
    expect(imported.song?.title).toBe('Export Song');
    expect(imported.song?.artist).toBe('Author');
    expect(imported.song?.id).not.toBe(song.id); // Generates fresh ID
  });

  it('rejects invalid JSON when importing', () => {
    const invalidJson = '{"foo": "bar"}';
    const result = importSongFromJson(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
