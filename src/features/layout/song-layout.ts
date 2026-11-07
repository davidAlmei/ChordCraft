import { SongDocument, SongSettings, PageSize, PageOrientation } from '../songs/song-types';
import { calculateLineChordLayout, ChordLayoutItem } from '../chords/chord-layout';

export interface PageDimensions {
  widthMm: number;
  heightMm: number;
  widthPt: number;
  heightPt: number;
  widthPx: number;
  heightPx: number;
}

export const MM_TO_PT = 2.83465;
export const PT_TO_PX = 96 / 72; // 1.33333
export const MM_TO_PX = MM_TO_PT * PT_TO_PX; // ~3.7795

export function getPageDimensions(size: PageSize, orientation: PageOrientation): PageDimensions {
  let widthMm = size === 'Letter' ? 215.9 : 210.0;
  let heightMm = size === 'Letter' ? 279.4 : 297.0;

  if (orientation === 'landscape') {
    const tmp = widthMm;
    widthMm = heightMm;
    heightMm = tmp;
  }

  const widthPt = widthMm * MM_TO_PT;
  const heightPt = heightMm * MM_TO_PT;
  const widthPx = widthMm * MM_TO_PX;
  const heightPx = heightMm * MM_TO_PX;

  return { widthMm, heightMm, widthPt, heightPt, widthPx, heightPx };
}

export interface ComputedLineLayout {
  lineId: string;
  text: string;
  chords: ChordLayoutItem[];
  lyricHeight: number;
  chordAreaHeight: number;
  totalHeight: number;
  y: number; // relative to printable top on page
}

export interface ComputedSectionLayout {
  sectionId: string;
  label?: string;
  labelHeight: number;
  lines: ComputedLineLayout[];
  totalHeight: number;
  y: number;
}

export interface ComputedPageLayout {
  pageIndex: number;
  pageNumber: number;
  headerHeight: number;
  showHeader: boolean;
  sections: ComputedSectionLayout[];
  contentHeight: number;
  maxContentHeight: number;
}

export interface SongLayoutResult {
  pages: ComputedPageLayout[];
  pageDimensions: PageDimensions;
  totalPages: number;
}

/**
 * Shared layout engine for editor preview pagination and PDF export.
 */
export function computeSongLayout(song: SongDocument): SongLayoutResult {
  const settings = song.settings;
  const dims = getPageDimensions(settings.pageSize, settings.orientation);

  const topMarginPx = settings.margins.top * MM_TO_PX;
  const bottomMarginPx = settings.margins.bottom * MM_TO_PX;
  const printableHeightPx = Math.max(100, dims.heightPx - topMarginPx - bottomMarginPx);

  const lyricLineHeightPx = settings.lyricFontSize * settings.lineSpacing;
  const sectionLabelHeightPx = 28;
  const sectionSpacingPx = settings.sectionSpacing;

  // Header height on page 1 (Title, artist, key/tempo)
  const headerHeightPx = 80;

  const pages: ComputedPageLayout[] = [];
  let currentPageIndex = 0;

  function createPage(isFirst: boolean): ComputedPageLayout {
    return {
      pageIndex: currentPageIndex++,
      pageNumber: currentPageIndex,
      headerHeight: isFirst ? headerHeightPx : 20,
      showHeader: isFirst,
      sections: [],
      contentHeight: isFirst ? headerHeightPx : 20,
      maxContentHeight: printableHeightPx,
    };
  }

  let currentPage = createPage(true);
  pages.push(currentPage);

  for (let sIdx = 0; sIdx < song.sections.length; sIdx++) {
    const section = song.sections[sIdx];
    const hasLabel = Boolean(section.label && section.label.trim());
    const labelHeight = hasLabel ? sectionLabelHeightPx : 0;

    let currentSectionLayout: ComputedSectionLayout = {
      sectionId: section.id,
      label: section.label,
      labelHeight,
      lines: [],
      totalHeight: labelHeight,
      y: currentPage.contentHeight,
    };

    // Check if label alone fits on current page
    if (currentPage.contentHeight + labelHeight > currentPage.maxContentHeight && currentPage.sections.length > 0) {
      // New page
      currentPage = createPage(false);
      pages.push(currentPage);
      currentSectionLayout.y = currentPage.contentHeight;
    }

    currentPage.contentHeight += labelHeight;

    for (let lIdx = 0; lIdx < section.lines.length; lIdx++) {
      const line = section.lines[lIdx];
      const chordLayout = calculateLineChordLayout(line.chords, line.text, settings);
      const chordAreaHeight = chordLayout.totalChordHeight;
      const totalLineHeight = chordAreaHeight + lyricLineHeightPx;

      // Check if this line fits on current page
      if (
        currentPage.contentHeight + totalLineHeight > currentPage.maxContentHeight &&
        (currentPage.sections.length > 0 || currentSectionLayout.lines.length > 0)
      ) {
        // Finalize section on current page if it has lines
        if (currentSectionLayout.lines.length > 0) {
          currentPage.sections.push(currentSectionLayout);
        }

        // Start new page
        currentPage = createPage(false);
        pages.push(currentPage);

        // Continue section on new page
        currentSectionLayout = {
          sectionId: `${section.id}_cont_${currentPage.pageIndex}`,
          label: hasLabel ? `${section.label} (cont.)` : undefined,
          labelHeight: hasLabel ? 20 : 0,
          lines: [],
          totalHeight: hasLabel ? 20 : 0,
          y: currentPage.contentHeight,
        };
        currentPage.contentHeight += currentSectionLayout.labelHeight;
      }

      const lineLayout: ComputedLineLayout = {
        lineId: line.id,
        text: line.text,
        chords: chordLayout.items,
        lyricHeight: lyricLineHeightPx,
        chordAreaHeight,
        totalHeight: totalLineHeight,
        y: currentPage.contentHeight,
      };

      currentSectionLayout.lines.push(lineLayout);
      currentSectionLayout.totalHeight += totalLineHeight;
      currentPage.contentHeight += totalLineHeight;
    }

    if (currentSectionLayout.lines.length > 0) {
      currentPage.sections.push(currentSectionLayout);
      currentPage.contentHeight += sectionSpacingPx;
    }
  }

  return {
    pages,
    pageDimensions: dims,
    totalPages: pages.length,
  };
}
