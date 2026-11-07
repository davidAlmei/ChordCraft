import { ChordAnchor, LyricLine } from '../songs/song-types';

/**
 * Maps chord anchors when text in a single line is modified (inserted or deleted).
 * 
 * @param chords Existing chord anchors on the line
 * @param changeIndex Character index where edit starts
 * @param charsDeleted Number of characters deleted from changeIndex
 * @param charsInserted Number of characters inserted at changeIndex
 */
export function mapChordsOnTextEdit(
  chords: ChordAnchor[],
  changeIndex: number,
  charsDeleted: number,
  charsInserted: number,
  resultingLineText?: string
): ChordAnchor[] {
  // If the line has no text left after editing, all associated chords are deleted
  if (resultingLineText !== undefined && resultingLineText.trim() === '') {
    return [];
  }

  const delta = charsInserted - charsDeleted;
  const deleteEnd = changeIndex + charsDeleted;

  const result: ChordAnchor[] = [];

  for (const chord of chords) {
    if (chord.anchorOffset < changeIndex) {
      // Anchor is before the edit point: remains unchanged
      result.push({ ...chord });
    } else if (charsDeleted > 0 && chord.anchorOffset >= changeIndex && chord.anchorOffset < deleteEnd) {
      // Anchor was inside the deleted words: delete the associated chord
      continue;
    } else {
      // Anchor is after the edit point: adjust by net delta
      result.push({
        ...chord,
        anchorOffset: Math.max(0, chord.anchorOffset + delta),
      });
    }
  }

  return result;
}

/**
 * Splits a line into two lines at splitOffset (e.g. user pressed Enter).
 * Chords before splitOffset remain on first line.
 * Chords at or after splitOffset move to second line with re-anchored offsets.
 */
export function splitLine(
  line: LyricLine,
  splitOffset: number,
  newLineId?: string
): { line1: LyricLine; line2: LyricLine } {
  const text1 = line.text.slice(0, splitOffset);
  const text2 = line.text.slice(splitOffset);

  const chords1: ChordAnchor[] = [];
  const chords2: ChordAnchor[] = [];

  for (const chord of line.chords) {
    if (chord.anchorOffset < splitOffset) {
      chords1.push({ ...chord });
    } else {
      chords2.push({
        ...chord,
        anchorOffset: Math.max(0, chord.anchorOffset - splitOffset),
      });
    }
  }

  const line1: LyricLine = {
    ...line,
    text: text1,
    chords: chords1,
  };

  const line2: LyricLine = {
    id: newLineId || `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    text: text2,
    chords: chords2,
  };

  return { line1, line2 };
}

/**
 * Merges line2 into line1 (e.g. user pressed Backspace at start of line2).
 * Line2's chords are re-anchored by adding line1's text length.
 */
export function mergeLines(line1: LyricLine, line2: LyricLine): LyricLine {
  const offsetShift = line1.text.length;

  const shiftedChords2: ChordAnchor[] = line2.chords.map((chord) => ({
    ...chord,
    anchorOffset: chord.anchorOffset + offsetShift,
  }));

  return {
    ...line1,
    text: line1.text + line2.text,
    chords: [...line1.chords, ...shiftedChords2],
  };
}

/**
 * Handles pasting text (which may contain multiple lines) into a lyric line at pasteOffset.
 */
export function handlePasteIntoLine(
  line: LyricLine,
  pasteOffset: number,
  pastedText: string
): LyricLine[] {
  // Normalize newline characters (\r\n -> \n, \r -> \n)
  const normalized = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const pasteLines = normalized.split('\n');

  if (pasteLines.length === 1) {
    // Single line paste
    const newText = line.text.slice(0, pasteOffset) + pasteLines[0] + line.text.slice(pasteOffset);
    const updatedChords = mapChordsOnTextEdit(line.chords, pasteOffset, 0, pasteLines[0].length);
    return [
      {
        ...line,
        text: newText,
        chords: updatedChords,
      },
    ];
  }

  // Multiline paste:
  // First line gets prefix + pasteLines[0]
  // Intermediate lines get pasteLines[1..n-1]
  // Last line gets pasteLines[n-1] + suffix and chords from suffix
  const prefix = line.text.slice(0, pasteOffset);
  const suffix = line.text.slice(pasteOffset);

  const prefixChords: ChordAnchor[] = [];
  const suffixChords: ChordAnchor[] = [];

  for (const chord of line.chords) {
    if (chord.anchorOffset <= pasteOffset) {
      prefixChords.push({ ...chord });
    } else {
      // Relative to suffix
      const relativeOffset = chord.anchorOffset - pasteOffset;
      suffixChords.push({
        ...chord,
        anchorOffset: relativeOffset,
      });
    }
  }

  const result: LyricLine[] = [];

  // First line
  result.push({
    id: line.id,
    text: prefix + pasteLines[0],
    chords: prefixChords,
  });

  // Intermediate lines
  for (let i = 1; i < pasteLines.length - 1; i++) {
    result.push({
      id: `line_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      text: pasteLines[i],
      chords: [],
    });
  }

  // Last line
  const lastPasted = pasteLines[pasteLines.length - 1];
  const lastLineChords = suffixChords.map((chord) => ({
    ...chord,
    anchorOffset: chord.anchorOffset + lastPasted.length,
  }));

  result.push({
    id: `line_${Date.now()}_last_${Math.random().toString(36).substring(2, 7)}`,
    text: lastPasted + suffix,
    chords: lastLineChords,
  });

  return result;
}
