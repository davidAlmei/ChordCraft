# ChordCraft — Music Chord Sheet Editor

> A lightweight, document-grade chord sheet editor designed for musicians, featuring **free-position chord placement**, single-line chord arrangement, persistent local storage, and deterministic, print-ready PDF export.

[![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-29%20Passing-emerald?style=flat-square)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](#license)

---

## 🎵 Product Vision & Overview

Traditional lyric and chord sheet editors force chords to snap only to whole words or require awkward manual spaces that break as soon as fonts, screen sizes, or export renderers change.

**ChordCraft** introduces **free-position character-level chord placement**:
- Chords can be positioned **before words**, **between words**, **after words**, or **directly between characters inside a word or syllable** (e.g. at the exact moment a vocal changes pitch).
- Chords reside strictly on a **single horizontal row** above lyrics without vertical jumping.
- Passing chords and chords on consecutive syllables or beats sit cleanly **side-by-side** with a crisp visual gap, preventing visual occlusion.
- High-fidelity **vector PDF export** uses exact substring metrics so long sentences never suffer from chord alignment drift.
- **Offline-first**: Everything runs locally in the browser with IndexedDB persistence—no login, API key, or server required.

---

## ✨ Features

### 1. Free-Position Chord Placement & Editing
- **Character-Level Snapping**: Move pointer over the chord row to see a subtle vertical guideline and hover preview badge indicating the exact snap location.
- **Chord Entry Popover**: Accepts free-form chord symbols (`Am`, `F#m7`, `Dsus4/F#`, `C#dim`, `Bbmaj7`, `G/B`).
- **Quick-Access Palettes**: Fast chips for roots (`C`–`B`), accidentals (`#`, `b`), chord qualities (`m`, `7`, `maj7`, `m7`, `sus4`, `dim`, `add9`), and slash bass notes (`/E`, `/G`, etc.).
- **Ultra-Smooth Position Slider**: Fine horizontal scrub slider ranging from `-80px` to `+80px` with 1px precision, `-1px` / `+1px` micro-nudge buttons, and a one-click `Reset 0px` shortcut.
- **Single Global Popover**: Clicking any chord or chord area closes any previously open popover, preventing multiple editing subtabs from cluttering the canvas.
- **Horizontal Dragging**: Drag chords along the line with smooth pointer capture.
- **Single-Line Side-by-Side Passing Chords**: Chords placed on adjacent characters or beats automatically arrange side-by-side on the single line with clean spacing, ensuring both chords remain 100% readable.

### 2. Natural Lyric Editing & Dynamic Deletion Sync
- **Natural Text Input**: Real text editing with arrow keys, text selection, and clipboard support.
- **Line Splitting & Merging**: 
  - Pressing `Enter` splits the line, moving chords past the split point to the new line.
  - Pressing `Backspace` at the beginning of a line merges it with the preceding line, shifting chord anchors seamlessly.
- **Synchronized Deletion**: When words containing chords or an entire line of text is deleted, all associated chords are automatically removed.
- **Paste Lyrics Dialog**: Paste plain-text song lyrics with automatic detection of section headers (`[Verse 1]`, `[Chorus]`, `Bridge`, etc.) and blank lines.
- **Undo & Redo**: Full document history stack with `Ctrl+Z` and `Ctrl+Shift+Z`.

### 3. Musical Metadata & Layout Flexibility
- **Metadata Fields**: Editable Song Title, Artist / Composer, Key (e.g., `C`, `G`, `F#m`), Tempo (`BPM`), and dedicated **Time Signature / Beat** field (`4/4`, `3/4`, `6/8`).
- **High-Granularity Spacing Controls**:
  - **Lyric Line Spacing**: `1.0×` to `4.0×` range with fine `0.05×` step, equipped with dual controls (smooth slider + direct numeric input).
  - **Section Gap**: `0px` to `100px` with `1px` step (smooth slider + direct numeric input).
  - **Chord & Lyric Font Sizes**: `8px`–`36px` and `9px`–`40px` with `0.5px` precision.
  - **Chord Colors**: Curated musician palette (Royal Blue, Deep Indigo, Emerald, Crimson, Amber, Charcoal) plus full custom hex color picker.
- **Paper & Margins**: A4 (210 × 297 mm) and US Letter (8.5 × 11 in) in Portrait or Landscape, with margins adjustable from `0mm` to `80mm`.
- **Canvas Zoom**: `40%` to `200%` zoom with preset buttons (`75%`, `100%`, `125%`, `150%`).
- **Distraction-Free Mode**: Hides toolbars and format sidebars to maximize sheet focus.

### 4. Deterministic Vector PDF Export
- **Shared Geometry Model**: The PDF exporter and the editor canvas use the same layout metrics engine (`computeSongLayout`).
- **No Long-Sentence Drift**: Chords are positioned using direct substring measurement in jsPDF (`doc.getTextWidth(line.text.slice(0, anchorOffset))`), eliminating font metric drift on long sentences.
- **Multi-Page Pagination**: Clean automatic page breaks without splitting or clipping lines or chords.
- **Metadata & Numbering**: Includes title, artist, key, tempo, beat, and footer page numbering (`Page X of Y`).
- **Unicode Support**: Full support for international accents and music symbols (♯, ♭, #, b).

### 5. Song Library & Persistence
- **IndexedDB via Dexie.js**: All changes are automatically persisted offline after a short debounce.
- **Library Management**: Filter and search songs by title, artist, or key; rename; duplicate; and delete with confirmation.
- **JSON Backup**: Import and export songs as `.json` files for backup or transferring between devices.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (Strict Mode) |
| **UI & Styling** | React 19, Tailwind CSS 4, Lucide React |
| **Storage / DB** | IndexedDB via Dexie.js |
| **Layout & Metrics** | HTML5 Canvas 2D Text Metrics Cache |
| **PDF Generation** | jsPDF (Vector coordinate rendering) |
| **Testing** | Vitest, React Testing Library, fake-indexeddb, Playwright |

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── globals.css                   # Global styles & document sheet styles
│   ├── layout.tsx                    # Next.js root layout with metadata
│   ├── page.tsx                      # Home screen / Song Library route
│   └── songs/[songId]/
│       └── page.tsx                  # Interactive Song Editor route with Suspense
├── components/
│   ├── chord-picker/
│   │   └── ChordEntryPopover.tsx     # Smooth scrub slider, shortcuts & palette
│   ├── dialogs/
│   │   └── PasteLyricsDialog.tsx     # Plain-text import with section autodetection
│   ├── editor/
│   │   ├── LyricLineEditor.tsx       # Line canvas, hover guide, drag & micro-nudge
│   │   └── SongCanvas.tsx            # Printable paper sheet with singleton popover
│   ├── formatting/
│   │   └── FormattingSidebar.tsx     # Spacing (1.0-4.0x), fonts, margins, zoom
│   ├── library/
│   │   └── SongLibrary.tsx           # Library cards, search, duplicate, delete, backup
│   └── toolbar/
│       └── EditorToolbar.tsx         # Title, Key, BPM, Beat, save status, undo/redo
├── features/
│   ├── chords/
│   │   └── chord-layout.ts           # Single-line side-by-side layout engine
│   ├── layout/
│   │   ├── text-measurement.ts       # Canvas 2D font metrics cache & mapping
│   │   └── song-layout.ts            # Shared pagination & page dimension engine
│   ├── lyrics/
│   │   └── position-mapping.ts       # Edit-aware mapping, word deletion sync, split/merge
│   ├── pdf/
│   │   └── pdf-exporter.ts           # Vector PDF generator with exact anchor metrics
│   └── songs/
│       ├── song-store.ts             # Dexie database, CRUD, export/import validation
│       └── song-types.ts             # Versioned SongDocument, Section, Line, Settings
tests/
├── setup.ts                          # Vitest DOM & IndexedDB setup
├── unit/
│   ├── song-store.test.ts            # Database CRUD, persistence, JSON validation
│   ├── position-mapping.test.ts      # Edit mapping, word deletion chord removal
│   ├── chord-layout.test.ts          # Single-line chord placement, close chord tests
│   ├── pdf-and-layout.test.ts        # Long sentence export alignment, beat metadata
│   └── formatting-and-invariance.test.ts # Invariance & Unicode placement tests
├── components/
│   └── chord-popover.test.tsx        # Chord popover interaction & chip tests
└── e2e/
    └── workflow.spec.ts              # Playwright end-to-end musician critical workflow
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ / v22+ recommended)
- **npm**: v9.0.0 or later

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd "Music Chord Sheet Editor"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Production Build

### Run Unit & Component Tests
ChordCraft includes 29 automated tests covering persistence, text metrics, chord collisions, long-sentence PDF alignment, and edit mapping:

```bash
npm test
```

### Build for Production
To create an optimized production build with Turbopack and strict type-checking:

```bash
npm run build
```

### Start Production Server
```bash
npm start
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` / `⌘ + Z` | Undo last edit or chord placement |
| `Ctrl + Shift + Z` / `⌘ + Shift + Z` | Redo |
| `Ctrl + S` / `⌘ + S` | Save document immediately to IndexedDB |
| `Ctrl + Shift + E` / `⌘ + Shift + E` | Export print-ready PDF |
| `Enter` | In chord popover: confirm chord / In lyric line: split line |
| `Escape` | Close active chord popover |
| `ArrowLeft` / `ArrowRight` | Nudge selected chord horizontally (±2px) |
| `Shift + ArrowLeft` / `ArrowRight` | Nudge selected chord horizontally (±10px) |
| `Delete` / `Backspace` | On selected chord: delete chord / At line start: merge with previous |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
