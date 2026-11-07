import { describe, it, expect } from 'vitest';
import {
  mapChordsOnTextEdit,
  splitLine,
  mergeLines,
  handlePasteIntoLine,
} from '@/features/lyrics/position-mapping';
import { ChordAnchor, LyricLine } from '@/features/songs/song-types';

describe('Edit-aware chord position mapping', () => {
  const sampleChords: ChordAnchor[] = [
    { id: 'c1', symbol: 'G', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
    { id: 'c2', symbol: 'C', anchorOffset: 8, affinity: 'before', visualOffsetX: 0, row: 0 },
    { id: 'c3', symbol: 'D', anchorOffset: 16, affinity: 'before', visualOffsetX: 0, row: 0 },
  ];

  it('preserves anchors when text is inserted before them', () => {
    // Insert 5 characters at index 4 (between c1 and c2)
    const result = mapChordsOnTextEdit(sampleChords, 4, 0, 5);
    expect(result[0].anchorOffset).toBe(0); // Before edit -> unchanged
    expect(result[1].anchorOffset).toBe(13); // 8 + 5 = 13
    expect(result[2].anchorOffset).toBe(21); // 16 + 5 = 21
  });

  it('adjusts anchors when text before them is deleted', () => {
    // Delete 3 characters at index 4
    const result = mapChordsOnTextEdit(sampleChords, 4, 3, 0);
    expect(result[0].anchorOffset).toBe(0);
    expect(result[1].anchorOffset).toBe(5); // 8 - 3 = 5
    expect(result[2].anchorOffset).toBe(13); // 16 - 3 = 13
  });

  it('deletes associated chord when deleted words contain the anchor', () => {
    // Delete range from 6 to 12 (covers offset 8, which is chord c2)
    const result = mapChordsOnTextEdit(sampleChords, 6, 6, 0);
    expect(result.length).toBe(2);
    expect(result.find((c) => c.id === 'c2')).toBeUndefined();
    expect(result[0].anchorOffset).toBe(0);
    expect(result[1].anchorOffset).toBe(10); // 16 - 6 = 10
  });

  it('deletes all associated chords when the line text is deleted', () => {
    const result = mapChordsOnTextEdit(sampleChords, 0, 25, 0, '');
    expect(result.length).toBe(0);
  });

  it('splits a line and divides chords correctly', () => {
    const line: LyricLine = {
      id: 'l1',
      text: 'Amazing grace, how sweet the sound',
      chords: [
        { id: 'c1', symbol: 'G', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
        { id: 'c2', symbol: 'C', anchorOffset: 15, affinity: 'before', visualOffsetX: 0, row: 0 },
      ],
    };

    // Split at index 14 (at comma)
    const { line1, line2 } = splitLine(line, 14);

    expect(line1.text).toBe('Amazing grace,');
    expect(line1.chords.length).toBe(1);
    expect(line1.chords[0].symbol).toBe('G');
    expect(line1.chords[0].anchorOffset).toBe(0);

    expect(line2.text).toBe(' how sweet the sound');
    expect(line2.chords.length).toBe(1);
    expect(line2.chords[0].symbol).toBe('C');
    expect(line2.chords[0].anchorOffset).toBe(1); // 15 - 14 = 1
  });

  it('merges two lines and shifts chords of second line', () => {
    const line1: LyricLine = {
      id: 'l1',
      text: 'Hello ',
      chords: [{ id: 'c1', symbol: 'C', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 }],
    };
    const line2: LyricLine = {
      id: 'l2',
      text: 'World',
      chords: [{ id: 'c2', symbol: 'G', anchorOffset: 1, affinity: 'before', visualOffsetX: 0, row: 0 }],
    };

    const merged = mergeLines(line1, line2);
    expect(merged.text).toBe('Hello World');
    expect(merged.chords.length).toBe(2);
    expect(merged.chords[0].anchorOffset).toBe(0);
    expect(merged.chords[1].anchorOffset).toBe(7); // 6 (length of 'Hello ') + 1
  });

  it('handles multi-line paste cleanly', () => {
    const line: LyricLine = {
      id: 'l1',
      text: 'Line 1 Prefix Suffix',
      chords: [
        { id: 'c1', symbol: 'Am', anchorOffset: 0, affinity: 'before', visualOffsetX: 0, row: 0 },
        { id: 'c2', symbol: 'F', anchorOffset: 15, affinity: 'before', visualOffsetX: 0, row: 0 },
      ],
    };

    // Paste two lines at offset 14 (between 'Line 1 Prefix ' and 'Suffix')
    const pasteContent = 'Middle\nNew Line ';
    const lines = handlePasteIntoLine(line, 14, pasteContent);

    expect(lines.length).toBe(2);
    expect(lines[0].text).toBe('Line 1 Prefix Middle');
    expect(lines[0].chords[0].symbol).toBe('Am');
    expect(lines[0].chords[0].anchorOffset).toBe(0);

    expect(lines[1].text).toBe('New Line Suffix');
    expect(lines[1].chords.length).toBe(1);
    expect(lines[1].chords[0].symbol).toBe('F');
    // c2 was at 15 (1 char into 'Suffix'). In line 2, it is at 9 (length of 'New Line ') + 1 = 10
    expect(lines[1].chords[0].anchorOffset).toBe(10);
  });
});
