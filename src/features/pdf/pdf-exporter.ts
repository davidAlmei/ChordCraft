import { jsPDF } from 'jspdf';
import { SongDocument } from '../songs/song-types';
import { computeSongLayout, MM_TO_PT, PT_TO_PX } from '../layout/song-layout';

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [37, 99, 235]; // fallback blue
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Sanitizes and normalizes music symbol representations for clean PDF rendering.
 */
function cleanSymbol(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u266F/g, '#') // ♯ to #
    .replace(/\u266D/g, 'b'); // ♭ to b
}

export interface PdfExportOptions {
  returnBlob?: boolean;
}

/**
 * Generates a high-fidelity vector PDF matching the editor's computed layout.
 */
export async function exportSongToPdf(song: SongDocument, options?: PdfExportOptions): Promise<Blob | void> {
  const settings = song.settings;
  const layout = computeSongLayout(song);

  const format = settings.pageSize.toLowerCase() as 'a4' | 'letter';
  const orientation = settings.orientation === 'landscape' ? 'l' : 'p';

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format,
    compress: true,
  });

  const [chordR, chordG, chordB] = hexToRgb(settings.chordColor);
  const leftMarginPt = settings.margins.left * MM_TO_PT;
  const rightMarginPt = settings.margins.right * MM_TO_PT;
  const topMarginPt = settings.margins.top * MM_TO_PT;
  const bottomMarginPt = settings.margins.bottom * MM_TO_PT;
  const pageWidthPt = layout.pageDimensions.widthPt;
  const pageHeightPt = layout.pageDimensions.heightPt;
  const maxPrintableWidthPt = pageWidthPt - leftMarginPt - rightMarginPt;

  layout.pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage(format, orientation);
    }

    // Header on first page
    if (page.showHeader) {
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(17, 24, 39); // gray-900
      doc.text(song.title || 'Untitled Song', leftMarginPt, topMarginPt + 22);

      // Metadata line (Artist, Key, Tempo, Beat)
      const metaParts: string[] = [];
      if (song.artist) metaParts.push(song.artist);
      if (song.key) metaParts.push(`Key: ${song.key}`);
      if (song.tempo) metaParts.push(`${song.tempo} BPM`);
      if (song.timeSignature) metaParts.push(`Beat: ${song.timeSignature}`);

      if (metaParts.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(metaParts.join('  •  '), leftMarginPt, topMarginPt + 40);
      }

      // Divider line
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.setLineWidth(0.75);
      doc.line(leftMarginPt, topMarginPt + 52, pageWidthPt - rightMarginPt, topMarginPt + 52);
    }

    // Render sections & lines
    for (const sec of page.sections) {
      // Section label
      if (sec.label) {
        const labelYPt = topMarginPt + (sec.y / PT_TO_PX) + 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(75, 85, 99); // gray-600
        doc.text(sec.label.toUpperCase(), leftMarginPt, labelYPt);
      }

      for (const line of sec.lines) {
        const lineTopPt = topMarginPt + (line.y / PT_TO_PX);

        // Calculate lyric font size with auto-fit for long lines
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(settings.lyricFontSize);
        const naturalWidthPt = doc.getTextWidth(line.text || '');
        const fitScale = naturalWidthPt > maxPrintableWidthPt ? maxPrintableWidthPt / naturalWidthPt : 1;
        const effectiveLyricFontSize = settings.lyricFontSize * fitScale;
        const effectiveChordFontSize = settings.chordFontSize * fitScale;

        // Set font size for exact anchor measurement
        doc.setFontSize(effectiveLyricFontSize);

        // Draw chords on single horizontal row above lyrics
        if (line.chords && line.chords.length > 0) {
          let lastChordEndPt = leftMarginPt;
          for (const chItem of line.chords) {
            // Measure exact substring width in jsPDF so long sentences NEVER misplace chords!
            const textUpToAnchor = line.text.slice(0, Math.min(line.text.length, chItem.chord.anchorOffset));
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(effectiveLyricFontSize);
            const anchorExactXPt = leftMarginPt + doc.getTextWidth(textUpToAnchor) + ((chItem.chord.visualOffsetX || 0) * fitScale / PT_TO_PX);

            // Ensure very close adjacent chords never print on top of each other
            const chordXPt = Math.max(anchorExactXPt, lastChordEndPt);

            // Single line chord row: all chords at the exact same Y baseline
            const chordYPt = lineTopPt + (effectiveChordFontSize * 0.95);

            doc.setFont('courier', 'bold');
            doc.setFontSize(effectiveChordFontSize);
            doc.setTextColor(chordR, chordG, chordB);
            const symbolText = cleanSymbol(chItem.chord.symbol);
            doc.text(symbolText, chordXPt, chordYPt);

            lastChordEndPt = chordXPt + doc.getTextWidth(symbolText) + (3 * fitScale);
          }
        }

        // Draw lyrics
        if (line.text) {
          const lyricYPt = lineTopPt + (line.chordAreaHeight / PT_TO_PX) + (effectiveLyricFontSize * 0.9);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(effectiveLyricFontSize);
          doc.setTextColor(31, 41, 55); // gray-800
          doc.text(line.text, leftMarginPt, lyricYPt);
        }
      }
    }

    // Footer with page number
    const footerYPt = pageHeightPt - bottomMarginPt + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175); // gray-400
    const pageStr = `Page ${page.pageNumber} of ${layout.totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidthPt - rightMarginPt - pageStrWidth, footerYPt);
  });

  if (options?.returnBlob) {
    return doc.output('blob');
  }

  // Sanitize filename
  const safeTitle = (song.title || 'chord-sheet').replace(/[^a-z0-9_\-\s]/gi, '').trim().replace(/\s+/g, '_');
  doc.save(`${safeTitle}.pdf`);
}
