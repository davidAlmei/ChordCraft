import Dexie, { type Table } from 'dexie';
import { SongDocument, CURRENT_SCHEMA_VERSION, DEFAULT_SONG_SETTINGS, createNewSong } from './song-types';

export class ChordSheetDatabase extends Dexie {
  songs!: Table<SongDocument, string>;

  constructor() {
    super('ChordSheetEditorDB');
    this.version(1).stores({
      songs: 'id, title, artist, updatedAt, createdAt',
    });
  }
}

export const db = new ChordSheetDatabase();

export async function getAllSongs(): Promise<SongDocument[]> {
  try {
    const list = await db.songs.toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('Failed to get songs from IndexedDB:', err);
    return [];
  }
}

export async function getSongById(id: string): Promise<SongDocument | undefined> {
  try {
    return await db.songs.get(id);
  } catch (err) {
    console.error(`Failed to get song ${id}:`, err);
    return undefined;
  }
}

export async function saveSong(song: SongDocument): Promise<void> {
  const updated: SongDocument = {
    ...song,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  await db.songs.put(updated);
}

export async function deleteSong(id: string): Promise<void> {
  await db.songs.delete(id);
}

export async function duplicateSong(id: string): Promise<SongDocument | null> {
  const original = await getSongById(id);
  if (!original) return null;

  const now = new Date().toISOString();
  const copy: SongDocument = {
    ...JSON.parse(JSON.stringify(original)),
    id: `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title: `${original.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  await db.songs.add(copy);
  return copy;
}

export function validateSongDocument(data: any): { valid: boolean; error?: string; song?: SongDocument } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Document must be a valid JSON object' };
  }
  if (typeof data.title !== 'string' || !data.title.trim()) {
    return { valid: false, error: 'Song must have a non-empty title string' };
  }
  if (!Array.isArray(data.sections)) {
    return { valid: false, error: 'Song must have a sections array' };
  }

  // Ensure settings exist with defaults
  const settings = {
    ...DEFAULT_SONG_SETTINGS,
    ...(data.settings || {}),
    margins: {
      ...DEFAULT_SONG_SETTINGS.margins,
      ...(data.settings?.margins || {}),
    },
  };

  const song: SongDocument = {
    schemaVersion: data.schemaVersion || CURRENT_SCHEMA_VERSION,
    id: data.id || `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title: data.title,
    artist: data.artist || '',
    key: data.key || 'C',
    tempo: typeof data.tempo === 'number' ? data.tempo : 120,
    timeSignature: typeof data.timeSignature === 'string' ? data.timeSignature : '4/4',
    notes: data.notes || '',
    sections: data.sections.map((sec: any, secIdx: number) => ({
      id: sec.id || `sec_${Date.now()}_${secIdx}`,
      label: sec.label || `Section ${secIdx + 1}`,
      lines: Array.isArray(sec.lines)
        ? sec.lines.map((ln: any, lnIdx: number) => ({
            id: ln.id || `line_${Date.now()}_${secIdx}_${lnIdx}`,
            text: typeof ln.text === 'string' ? ln.text : '',
            chords: Array.isArray(ln.chords)
              ? ln.chords.map((ch: any, chIdx: number) => ({
                  id: ch.id || `chord_${Date.now()}_${secIdx}_${lnIdx}_${chIdx}`,
                  symbol: typeof ch.symbol === 'string' ? ch.symbol : 'C',
                  anchorOffset: typeof ch.anchorOffset === 'number' ? Math.max(0, ch.anchorOffset) : 0,
                  affinity: ch.affinity === 'after' ? 'after' : 'before',
                  visualOffsetX: typeof ch.visualOffsetX === 'number' ? ch.visualOffsetX : 0,
                  row: typeof ch.row === 'number' ? Math.max(0, ch.row) : 0,
                }))
              : [],
          }))
        : [],
    })),
    settings,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { valid: true, song };
}

export function exportSongToJson(song: SongDocument): string {
  return JSON.stringify(song, null, 2);
}

export function importSongFromJson(jsonString: string): { success: boolean; song?: SongDocument; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const result = validateSongDocument(parsed);
    if (!result.valid || !result.song) {
      return { success: false, error: result.error || 'Invalid song format' };
    }
    // Assign a fresh ID upon import to prevent accidental overwrites
    result.song.id = `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return { success: true, song: result.song };
  } catch (err: any) {
    return { success: false, error: `JSON Parse error: ${err.message}` };
  }
}

export async function seedInitialDataIfEmpty(): Promise<SongDocument> {
  const count = await db.songs.count();
  if (count === 0) {
    const initial = createNewSong('Amazing Grace', 'John Newton');
    await db.songs.add(initial);
    return initial;
  }
  const first = await db.songs.toCollection().first();
  return first!;
}
