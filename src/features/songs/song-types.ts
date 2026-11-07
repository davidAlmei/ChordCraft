export type PageSize = 'A4' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SongSettings {
  pageSize: PageSize;
  orientation: PageOrientation;
  lyricFontFamily: string;
  chordFontFamily: string;
  lyricFontSize: number;
  chordFontSize: number;
  chordColor: string;
  lineSpacing: number;
  sectionSpacing: number;
  chordRowSpacing: number;
  margins: PageMargins;
  autoChordRows: boolean;
}

export interface ChordAnchor {
  id: string;
  symbol: string;
  anchorOffset: number; // character index in line text
  affinity: 'before' | 'after';
  visualOffsetX: number; // fine horizontal nudge in pixels
  row: number; // 0-indexed row for overlapping chords
}

export interface LyricLine {
  id: string;
  text: string;
  chords: ChordAnchor[];
}

export interface SongSection {
  id: string;
  label?: string; // e.g., "Verse 1", "Chorus", "Intro", "Bridge"
  lines: LyricLine[];
}

export interface SongDocument {
  schemaVersion: number;
  id: string;
  title: string;
  artist?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string; // e.g. "4/4", "3/4", "6/8"
  notes?: string;
  sections: SongSection[];
  settings: SongSettings;
  createdAt: string;
  updatedAt: string;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SONG_SETTINGS: SongSettings = {
  pageSize: 'A4',
  orientation: 'portrait',
  lyricFontFamily: 'Inter, system-ui, sans-serif',
  chordFontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  lyricFontSize: 14,
  chordFontSize: 13,
  chordColor: '#2563eb', // Royal blue
  lineSpacing: 1.6,
  sectionSpacing: 24,
  chordRowSpacing: 18,
  margins: {
    top: 20, // mm
    right: 20,
    bottom: 20,
    left: 20,
  },
  autoChordRows: true,
};

export function createNewSong(title = 'Untitled Song', artist = ''): SongDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title,
    artist,
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    notes: '',
    sections: [
      {
        id: `sec_${Date.now()}_1`,
        label: 'Verse 1',
        lines: [
          {
            id: `line_${Date.now()}_1`,
            text: 'Amazing grace, how sweet the sound',
            chords: [
              {
                id: `chord_${Date.now()}_1`,
                symbol: 'G',
                anchorOffset: 0,
                affinity: 'before',
                visualOffsetX: 0,
                row: 0,
              },
              {
                id: `chord_${Date.now()}_2`,
                symbol: 'G7',
                anchorOffset: 15,
                affinity: 'before',
                visualOffsetX: 0,
                row: 0,
              },
              {
                id: `chord_${Date.now()}_3`,
                symbol: 'C',
                anchorOffset: 19,
                affinity: 'before',
                visualOffsetX: 0,
                row: 0,
              },
              {
                id: `chord_${Date.now()}_4`,
                symbol: 'G',
                anchorOffset: 29,
                affinity: 'before',
                visualOffsetX: 0,
                row: 0,
              },
            ],
          },
          {
            id: `line_${Date.now()}_2`,
            text: 'That saved a wretch like me',
            chords: [
              {
                id: `chord_${Date.now()}_5`,
                symbol: 'Em',
                anchorOffset: 5,
                affinity: 'before',
                visualOffsetX: 0,
                row: 0,
              },
              {
                id: `chord_${Date.now()}_6`,
                symbol: 'D',
                anchorOffset: 20,
                affinity: 'before',
                visualOffsetX: 0,
                row: 0,
              },
            ],
          },
        ],
      },
    ],
    settings: { ...DEFAULT_SONG_SETTINGS },
    createdAt: now,
    updatedAt: now,
  };
}
