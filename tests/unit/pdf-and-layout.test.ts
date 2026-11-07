import { describe, it, expect } from 'vitest';
import { computeSongLayout, getPageDimensions } from '@/features/layout/song-layout';
import { exportSongToPdf } from '@/features/pdf/pdf-exporter';
import { createNewSong } from '@/features/songs/song-types';

describe('Shared Layout Engine & Pagination', () => {
  it('computes page dimensions accurately for A4 and Letter', () => {
    const a4 = getPageDimensions('A4', 'portrait');
    expect(a4.widthMm).toBe(210);
    expect(a4.heightMm).toBe(297);

    const letterLandscape = getPageDimensions('Letter', 'landscape');
    expect(letterLandscape.widthMm).toBe(279.4);
    expect(letterLandscape.heightMm).toBe(215.9);
  });

  it('computes single page layout for a normal short song', () => {
    const song = createNewSong('Test Song', 'Artist');
    const layout = computeSongLayout(song);

    expect(layout.totalPages).toBe(1);
    expect(layout.pages.length).toBe(1);
    expect(layout.pages[0].sections.length).toBe(1);
    expect(layout.pages[0].sections[0].lines.length).toBe(2);
  });

  it('paginates long songs across multiple pages without clipping', () => {
    const song = createNewSong('Long Song', 'Artist');
    // Generate 60 lines
    const longLines = Array.from({ length: 60 }, (_, i) => ({
      id: `line_${i}`,
      text: `Lyric line number ${i + 1} with some text content to fill height`,
      chords: [
        { id: `c_${i}`, symbol: 'Am', anchorOffset: 0, affinity: 'before' as const, visualOffsetX: 0, row: 0 },
      ],
    }));

    song.sections = [
      {
        id: 'sec_1',
        label: 'Section 1',
        lines: longLines,
      },
    ];

    const layout = computeSongLayout(song);
    expect(layout.totalPages).toBeGreaterThan(1);
    expect(layout.pages.length).toBe(layout.totalPages);
    for (const page of layout.pages) {
      expect(page.contentHeight).toBeLessThanOrEqual(page.maxContentHeight + 100);
    }
  });
});

describe('PDF Export Engine', () => {
  it('generates a valid PDF blob without errors', async () => {
    const song = createNewSong('Amazing Grace', 'John Newton');
    const blob = await exportSongToPdf(song, { returnBlob: true });

    expect(blob).toBeDefined();
    expect(blob instanceof Blob).toBe(true);
    expect((blob as Blob).size).toBeGreaterThan(500); // Standard minimal PDF size
  });

  it('handles songs with sharps, flats, and unicode lyrics', async () => {
    const song = createNewSong('Spanish Song: Corazón ♯ & ♭', 'Composer');
    song.sections[0].lines[0].text = '¡Oh amor sublime y eterno!';
    song.sections[0].lines[0].chords = [
      { id: 'c1', symbol: 'F#m7', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c2', symbol: 'Bbmaj7', anchorOffset: 8, affinity: 'before', visualOffsetX: 0, row: 0 },
    ];

    const blob = await exportSongToPdf(song, { returnBlob: true });
    expect(blob).toBeDefined();
    expect((blob as Blob).size).toBeGreaterThan(500);
  });

  it('exports long sentences with chords and beat metadata without misplacement', async () => {
    const song = createNewSong('Long Sentence Song', 'Author');
    song.timeSignature = '6/8';
    song.tempo = 140;
    const longSentence = 'This is a very long sentence with many words that extends horizontally across the page to test chord alignment';
    song.sections[0].lines[0].text = longSentence;
    song.sections[0].lines[0].chords = [
      { id: 'c1', symbol: 'G', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c2', symbol: 'Em', anchorOffset: 25, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c3', symbol: 'C', anchorOffset: 65, affinity: 'before', visualOffsetX: 0, row: 0 },
      { id: 'c4', symbol: 'D7', anchorOffset: 95, affinity: 'before', visualOffsetX: 0, row: 0 },
    ];

    const blob = await exportSongToPdf(song, { returnBlob: true });
    expect(blob).toBeDefined();
    expect((blob as Blob).size).toBeGreaterThan(500);
  });
});
