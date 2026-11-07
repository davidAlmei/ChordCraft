import { ChordAnchor, SongSettings } from '../songs/song-types';
import { getAnchorCoordinate, getCachedTextWidth } from '../layout/text-measurement';

export interface ChordLayoutItem {
  chord: ChordAnchor;
  x: number; // Left coordinate relative to line start
  y: number; // Vertical offset: strictly 0 (single line)
  width: number;
  height: number;
  row: number; // strictly 0
  isColliding: boolean;
}

export interface LineChordLayout {
  items: ChordLayoutItem[];
  rowCount: number;
  totalChordHeight: number;
}

const MIN_CHORD_GAP = 4; // minimum gap in px between adjacent chords

/**
 * Calculates positioned rectangles for each chord above a lyric line.
 * All chords remain on a single horizontal line.
 * If chords are placed close to each other, they are visually placed side-by-side
 * with clean spacing so both chords are completely readable without overlapping.
 */
export function calculateLineChordLayout(
  chords: ChordAnchor[],
  text: string,
  settings: Pick<SongSettings, 'lyricFontFamily' | 'lyricFontSize' | 'chordFontFamily' | 'chordFontSize'>
): LineChordLayout {
  const singleLineHeight = Math.max(20, settings.chordFontSize + 6);
  if (!chords || chords.length === 0) {
    return { items: [], rowCount: 1, totalChordHeight: singleLineHeight };
  }

  const lyricFont = `${settings.lyricFontSize}px ${settings.lyricFontFamily}`;
  const chordFont = `600 ${settings.chordFontSize}px ${settings.chordFontFamily}`;

  // Sort chords by anchorOffset, then visualOffsetX
  const sortedChords = [...chords].sort((a, b) => {
    if (a.anchorOffset !== b.anchorOffset) {
      return a.anchorOffset - b.anchorOffset;
    }
    return (a.visualOffsetX || 0) - (b.visualOffsetX || 0);
  });

  let currentMinX = 0;

  const items: ChordLayoutItem[] = sortedChords.map((chord) => {
    const naturalX = getAnchorCoordinate(chord.anchorOffset, chord.visualOffsetX, text, lyricFont);
    const width = Math.max(14, getCachedTextWidth(chord.symbol || 'C', chordFont));

    // If chords are very close to each other, position cleanly so they don't collide
    const effectiveX = Math.max(naturalX, currentMinX);
    currentMinX = effectiveX + width + MIN_CHORD_GAP;

    return {
      chord,
      x: effectiveX,
      y: 0,
      width,
      height: settings.chordFontSize,
      row: 0,
      isColliding: false,
    };
  });

  return {
    items,
    rowCount: 1,
    totalChordHeight: singleLineHeight,
  };
}
