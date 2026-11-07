import { describe, it, expect } from 'vitest';
import { createNewSong, DEFAULT_SONG_SETTINGS, SongDocument } from '@/features/songs/song-types';
import { calculateLineChordLayout } from '@/features/chords/chord-layout';
import { mapCoordinateToOffset, getCharacterOffsets } from '@/features/layout/text-measurement';
import { computeSongLayout } from '@/features/layout/song-layout';

describe('Formatting Changes & Document Invariance', () => {
  it('confirms formatting changes do not mutate lyric content or musical anchor offsets', () => {
    const song = createNewSong('Formatting Invariance Test', 'Artist');
    song.sections[0].lines[0].text = 'My Jesus, my Saviour';
    song.sections[0].lines[0].chords = [
      { id: 'c1', symbol: 'A', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c2', symbol: 'E', anchorOffset: 4, affinity: 'before', visualOffsetX: 0, row: 0 }, // inside "Jesus"
      { id: 'c3', symbol: 'F#m', anchorOffset: 13, affinity: 'before', visualOffsetX: 0, row: 0 },
    ];

    const originalLyric = song.sections[0].lines[0].text;
    const originalOffsets = song.sections[0].lines[0].chords.map((c) => c.anchorOffset);

    // Change fonts, sizes, spacing, margins, orientation
    song.settings.lyricFontSize = 20;
    song.settings.chordFontSize = 18;
    song.settings.lineSpacing = 2.0;
    song.settings.sectionSpacing = 40;
    song.settings.chordRowSpacing = 26;
    song.settings.pageSize = 'Letter';
    song.settings.orientation = 'landscape';
    song.settings.margins = { top: 30, right: 30, bottom: 30, left: 30 };

    // Layout should re-compute layout geometry
    const layout = computeSongLayout(song);
    expect(layout).toBeDefined();

    // Verify lyric text and musical anchors remain identical
    expect(song.sections[0].lines[0].text).toBe(originalLyric);
    expect(song.sections[0].lines[0].chords.map((c) => c.anchorOffset)).toEqual(originalOffsets);
  });

  it('supports chord placement before, between, and after characters within a single word', () => {
    const font = '16px sans-serif';
    const word = 'Hallelujah'; // 10 characters
    const offsets = getCharacterOffsets(word, font);

    expect(offsets.length).toBe(11);
    expect(offsets[0]).toBe(0);
    expect(offsets[10]).toBeGreaterThan(offsets[9]);

    // Test placement between 'e' and 'l' closer to 'l' (index 4)
    const midX = offsets[3] + (offsets[4] - offsets[3]) * 0.75;
    const mapping = mapCoordinateToOffset(midX, word, font);
    expect(mapping.anchorOffset).toBe(4); // Snapped to boundary 4

    // Test placement closer to 'e' (index 3)
    const earlyX = offsets[3] + (offsets[4] - offsets[3]) * 0.25;
    const earlyMapping = mapCoordinateToOffset(earlyX, word, font);
    expect(earlyMapping.anchorOffset).toBe(3);
  });

  it('handles Unicode accents and symbols seamlessly', () => {
    const font = '16px sans-serif';
    const unicodeText = 'Canción de cuna con amor y alegría ♫';
    const offsets = getCharacterOffsets(unicodeText, font);

    expect(offsets.length).toBe(unicodeText.length + 1);
    expect(offsets[offsets.length - 1]).toBeGreaterThan(offsets[0]);

    // Position chords at various points
    const chords = [
      { id: 'c1', symbol: 'F#m7', anchorOffset: 0, affinity: 'before' as const, visualOffsetX: 0, row: 0 },
      { id: 'c2', symbol: 'B7', anchorOffset: 8, affinity: 'before' as const, visualOffsetX: 0, row: 0 },
      { id: 'c3', symbol: 'Emaj9', anchorOffset: 24, affinity: 'before' as const, visualOffsetX: 0, row: 0 },
    ];

    const layout = calculateLineChordLayout(chords, unicodeText, DEFAULT_SONG_SETTINGS);
    expect(layout.items.length).toBe(3);
    expect(layout.items[0].x).toBe(0);
    expect(layout.items[1].x).toBeGreaterThan(layout.items[0].x);
    expect(layout.items[2].x).toBeGreaterThan(layout.items[1].x);
  });
});
