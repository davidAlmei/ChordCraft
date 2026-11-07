import { describe, it, expect } from 'vitest';
import { calculateLineChordLayout } from '@/features/chords/chord-layout';
import { mapCoordinateToOffset, getAnchorCoordinate } from '@/features/layout/text-measurement';
import { ChordAnchor, DEFAULT_SONG_SETTINGS } from '@/features/songs/song-types';

describe('Text Measurement & Coordinate Mapping', () => {
  const font = '16px sans-serif';
  const text = 'Amazing grace, how sweet';

  it('maps coordinate 0 to offset 0', () => {
    const res = mapCoordinateToOffset(0, text, font);
    expect(res.anchorOffset).toBe(0);
    expect(res.affinity).toBe('before');
  });

  it('maps large coordinate past text length to end of text', () => {
    const res = mapCoordinateToOffset(1000, text, font);
    expect(res.anchorOffset).toBe(text.length);
    expect(res.affinity).toBe('after');
  });

  it('returns valid coordinates for arbitrary offsets', () => {
    const x0 = getAnchorCoordinate(0, 0, text, font);
    const x5 = getAnchorCoordinate(5, 0, text, font);
    expect(x5).toBeGreaterThan(x0);
  });
});

describe('Single-Line Chord Layout & Collision Detection', () => {
  it('places chords strictly on a single line (row 0, y 0)', () => {
    const chords: ChordAnchor[] = [
      { id: 'c1', symbol: 'C', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c2', symbol: 'G', anchorOffset: 20, affinity: 'before', visualOffsetX: 0, row: 0 },
    ];
    const text = 'This is a long lyric line with plenty of space';

    const layout = calculateLineChordLayout(chords, text, DEFAULT_SONG_SETTINGS);
    expect(layout.items.length).toBe(2);
    expect(layout.items[0].row).toBe(0);
    expect(layout.items[1].row).toBe(0);
    expect(layout.items[0].y).toBe(0);
    expect(layout.items[1].y).toBe(0);
    expect(layout.rowCount).toBe(1);
    expect(layout.items[0].isColliding).toBe(false);
  });

  it('cleanly positions chords placed very close to each other side-by-side on the single line', () => {
    const chords: ChordAnchor[] = [
      { id: 'c1', symbol: 'Cmaj7', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c2', symbol: 'Dm7', anchorOffset: 1, affinity: 'before', visualOffsetX: 0, row: 0 },
    ];
    const text = 'Amazing grace';

    const layout = calculateLineChordLayout(chords, text, DEFAULT_SONG_SETTINGS);

    expect(layout.items.length).toBe(2);
    expect(layout.rowCount).toBe(1);
    expect(layout.items[0].row).toBe(0);
    expect(layout.items[1].row).toBe(0);
    expect(layout.items[0].y).toBe(0);
    expect(layout.items[1].y).toBe(0);
    // c2 is positioned immediately after c1 with gap so both are clearly readable
    expect(layout.items[1].x).toBeGreaterThanOrEqual(layout.items[0].x + layout.items[0].width);
  });
});
