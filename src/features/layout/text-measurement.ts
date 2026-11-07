/**
 * Precise text measurement module using HTML5 Canvas text metrics.
 * Provides character-level coordinate mapping and sub-character precision.
 */

// Global reusable measurement canvas
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementCtx: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
  if (typeof window === 'undefined') return null;
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementCtx = measurementCanvas.getContext('2d');
  }
  return measurementCtx;
}

// Measurement cache to avoid repeated layout thrashing
const metricsCache = new Map<string, number>();

export function getCachedTextWidth(text: string, font: string): number {
  if (!text) return 0;
  const cacheKey = `${font}__${text}`;
  const cached = metricsCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const ctx = getContext();
  let width = 0;
  if (ctx) {
    ctx.font = font;
    width = ctx.measureText(text).width;
  } else {
    // Fallback estimation for non-DOM or unit tests without canvas
    width = text.length * 8.5;
  }

  // Limit cache size to 5,000 entries
  if (metricsCache.size > 5000) {
    metricsCache.clear();
  }
  metricsCache.set(cacheKey, width);
  return width;
}

/**
 * Returns cumulative horizontal positions for every character boundary in the string.
 * Result has length text.length + 1.
 * result[0] = 0 (before first char)
 * result[i] = cumulative width up to char i
 * result[text.length] = total line width
 */
export function getCharacterOffsets(text: string, font: string): number[] {
  const positions: number[] = [0];
  if (!text) return positions;

  const ctx = getContext();
  if (ctx) {
    ctx.font = font;
  }

  // We measure substrings to capture kerning and variable-width Unicode characters accurately
  for (let i = 1; i <= text.length; i++) {
    const sub = text.slice(0, i);
    const w = ctx ? ctx.measureText(sub).width : i * 8.5;
    positions.push(w);
  }

  return positions;
}

/**
 * Maps a horizontal pixel coordinate along a lyric line to the closest character offset and sub-offset nudge.
 */
export function mapCoordinateToOffset(
  x: number,
  text: string,
  font: string
): { anchorOffset: number; affinity: 'before' | 'after'; visualOffsetX: number; snappedX: number } {
  if (!text || x <= 0) {
    return {
      anchorOffset: 0,
      affinity: 'before',
      visualOffsetX: Math.min(0, x),
      snappedX: 0,
    };
  }

  const offsets = getCharacterOffsets(text, font);
  const totalWidth = offsets[offsets.length - 1];

  if (x >= totalWidth) {
    return {
      anchorOffset: text.length,
      affinity: 'after',
      visualOffsetX: Math.max(0, x - totalWidth),
      snappedX: totalWidth,
    };
  }

  // Find between which two character boundaries x falls
  let closestIndex = 0;
  let minDiff = Math.abs(x - offsets[0]);

  for (let i = 0; i < offsets.length; i++) {
    const diff = Math.abs(x - offsets[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  const snappedX = offsets[closestIndex];
  const visualOffsetX = x - snappedX;
  const affinity = x >= snappedX ? 'after' : 'before';

  return {
    anchorOffset: closestIndex,
    affinity,
    visualOffsetX,
    snappedX,
  };
}

/**
 * Computes the exact horizontal coordinate for a chord anchor given its offset and visual nudge.
 */
export function getAnchorCoordinate(
  anchorOffset: number,
  visualOffsetX: number,
  text: string,
  font: string
): number {
  if (!text) return visualOffsetX;
  const clampedOffset = Math.max(0, Math.min(text.length, anchorOffset));
  const offsets = getCharacterOffsets(text, font);
  const baseX = offsets[clampedOffset] || 0;
  return baseX + (visualOffsetX || 0);
}
