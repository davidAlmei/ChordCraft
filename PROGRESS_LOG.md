# Music Chord Sheet Editor - Development Progress Log

## 1. Project Overview & Architecture
**Music Chord Sheet Editor (ChordCraft)** is a modern, responsive document-style web application for musicians to compose, edit, format, and export chord sheets with **free-position chord placement**.

The application features:
- **Free-Position Chord Placement & Ultra-Smooth Nudge**: Chords can be positioned at arbitrary character offsets with an ultra-smooth horizontal scrub slider (`-80px` to `+80px` with 1px precision) plus micro-step buttons and one-click reset.
- **Single Global Popover Management**: Only one chord editing popover can ever be open across the entire song at any given time. Clicking another chord or another line immediately closes the previous popover and switches focus.
- **Clean Side-by-Side Support for Very Close Chords**: When chords are placed very close to each other (such as passing chords or consecutive beats on the same word/syllable), the engine automatically arranges them cleanly side-by-side on the single line with a neat 4px gap so both chords remain 100% visible and readable without visual collision or overlapping.
- **Ultra-Adjustable Line & Section Spacing**: Line spacing is expanded to a wider `1.0×` - `4.0×` range with fine `0.05×` steps, equipped with dual controls: a continuous smooth slider AND direct numeric input box. Section spacing is adjustable from `0px` to `100px` with 1px steps.
- **Synchronized Deletion of Chords on Word/Line Removal**: When words or an entire lyric line is deleted, all associated chords anchored to those deleted words are automatically removed.
- **Accurate Text Measurement & PDF Alignment**: Eliminates coordinate drift on long sentences by using direct font substring measurement in the vector PDF exporter, ensuring 100% exact alignment right above the intended word or character regardless of line length.
- **Beat & Meter Support**: Dedicated time signature / beat field beside the tempo (BPM) control (`4/4`, `3/4`, `6/8`, etc.), reflected across the toolbar, canvas header, song library, and exported PDF metadata.
- **Shared Layout Engine & Print-Ready PDF**: The interactive editor canvas and vector PDF export share identical geometry calculations, guaranteeing consistent chord alignment, pagination, page breaks, margins, and typography.
- **IndexedDB Persistence & Local Storage**: Full offline-first song library powered by Dexie.js with autosave, JSON backup import/export, and schema migration support.

---

## 2. Technology Stack & Key Decisions
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage / Persistence**: IndexedDB via Dexie.js
- **Text Metrics & Layout Engine**: Custom Canvas 2D measurement engine (`text-measurement.ts`, `song-layout.ts`, `chord-layout.ts`)
- **PDF Generation**: Client-side vector jsPDF engine driven by shared layout geometry and exact jsPDF substring metrics (`pdf-exporter.ts`)
- **Testing**: Vitest + React Testing Library for unit & component tests; Playwright for end-to-end user workflows

---

## 3. Project Structure
```text
src/
  app/
    globals.css                   # Global styles & document editor theme
    layout.tsx                    # Root layout with metadata
    page.tsx                      # Home screen / Song Library route
    songs/
      [songId]/
        page.tsx                  # Interactive Song Editor route with Suspense
  components/
    chord-picker/
      ChordEntryPopover.tsx       # Ultra-smooth chord position slider, shortcuts, palettes
    dialogs/
      PasteLyricsDialog.tsx       # Plain-text import dialog with section autodetection
    editor/
      LyricLineEditor.tsx         # Free-position placement canvas, hover guide, drag, keys
      SongCanvas.tsx              # Printable sheet canvas with singleton active popover
    formatting/
      FormattingSidebar.tsx       # Line spacing (1.0-4.0x), section gaps, fonts, margins, zoom
    library/
      SongLibrary.tsx             # Library cards, search, duplicate, delete, rename, JSON backup
    toolbar/
      EditorToolbar.tsx           # Title, metadata (Key, BPM, Beat), live save status, undo/redo
  features/
    chords/
      chord-layout.ts             # Geometry layout, single-line side-by-side alignment
    layout/
      text-measurement.ts         # Canvas 2D metrics cache, coordinate-to-offset mapping
      song-layout.ts              # Shared pagination & page dimension calculation engine
    lyrics/
      position-mapping.ts         # Edit-aware transaction mapping, splitLine, mergeLines, paste
    pdf/
      pdf-exporter.ts             # High-fidelity vector PDF generation with exact character anchor alignment
    songs/
      song-store.ts               # Dexie IndexedDB database, CRUD, export/import validation
      song-types.ts               # Versioned SongDocument, Section, Line, ChordAnchor, Settings
tests/
  setup.ts                        # Vitest DOM & IndexedDB environment setup
  unit/
    song-store.test.ts            # Persistence, CRUD, serialization, JSON validation tests
    position-mapping.test.ts      # Edit mapping, word deletion chord removal, split/merge
    chord-layout.test.ts          # Single-line chord placement, close chord side-by-side tests
    pdf-and-layout.test.ts        # Long sentence export alignment, beat metadata, pagination
    formatting-and-invariance.test.ts # Formatting invariance & Unicode placement tests
  components/
    chord-popover.test.tsx        # Chord popover interaction & quick chip tests
  e2e/
    workflow.spec.ts              # Playwright end-to-end musician critical workflow
vitest.config.ts                  # Vitest configuration with jsdom & alias resolution
playwright.config.ts              # Playwright E2E configuration
```

---

## 4. Summary of Improvements
1. **Ultra-Smooth Chord Position Slider**:
   - Added in [`ChordEntryPopover.tsx`](file:///c:/Tech/Projects/Music%20Chord%20Sheet%20Editor/src/components/chord-picker/ChordEntryPopover.tsx): Continuous smooth scrub slider from `-80px` to `+80px` with 1px precision, with `-1px` / `+1px` fine nudge buttons and a one-click `Reset 0px` shortcut.
2. **Highly Adjustable Spacing Controls**:
   - Expanded in [`FormattingSidebar.tsx`](file:///c:/Tech/Projects/Music%20Chord%20Sheet%20Editor/src/components/formatting/FormattingSidebar.tsx):
     - **Lyric Line Spacing**: Widened range to `1.0×` – `4.0×` with `0.05×` fine step, equipped with both a smooth slider and direct numeric typing box.
     - **Section Gap**: Expanded to `0px` – `100px` with `1px` step, equipped with both a slider and numeric input box.
     - **Chord & Lyric Font Sizes**: Expanded to `8px` – `36px` and `9px` – `40px` with `0.5px` step and numeric boxes.
     - **Margins**: Configurable up to `80mm` per side.
     - **Zoom**: Scalable from `40%` to `200%` with preset pills (75%, 100%, 125%, 150%).

---

## 5. Automated Test Results Summary

```text
 ✓ tests/unit/song-store.test.ts (6 tests)
 ✓ tests/unit/pdf-and-layout.test.ts (6 tests)
 ✓ tests/components/chord-popover.test.tsx (2 tests)
 ✓ tests/unit/chord-layout.test.ts (5 tests)
 ✓ tests/unit/formatting-and-invariance.test.ts (3 tests)
 ✓ tests/unit/position-mapping.test.ts (7 tests)

Test Files  6 passed (6)
Tests       29 passed (29)
Status      PASSED (0 errors)
```

Production build (`next build`):
- Compiled cleanly with Turbopack and strict TypeScript.
- 0 errors, 0 warnings.
