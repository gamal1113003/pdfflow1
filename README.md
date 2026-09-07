# PDFFlow

**Simple tools for every PDF.** A browser-first PDF toolkit built with Next.js 15, TypeScript and
Tailwind CSS. Most tools do their work inside the visitor's tab using `pdf-lib` and `PDF.js`, so
documents never leave the device.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

Requires Node 18.18 or newer.

---

## What actually works

These run entirely in the browser and produce real files:

| Tool | Route | Notes |
| --- | --- | --- |
| Merge PDF | `/merge-pdf` | Any number of files, drag or keyboard reordering |
| Split PDF | `/split-pdf` | Selected pages, every page, or ranges (ZIP for multi-file output) |
| Rotate / Delete / Extract / Reorder | `/rotate-pdf`, `/delete-pages`, `/extract-pages`, `/reorder-pages` | One shared page-plan engine |
| Edit PDF | `/edit-pdf` | Visual page grid: reorder, rotate, duplicate, delete |
| Compress PDF | `/compress-pdf` | Basic = lossless rewrite; Strong/Extreme = page rasterisation |
| Watermark PDF | `/watermark-pdf` | Text, colour, size, opacity, angle, four placements |
| Sign PDF | `/sign-pdf` | Draw, type or upload a signature; drag it onto the page |
| JPG / PNG to PDF | `/jpg-to-pdf`, `/png-to-pdf` | Page size, orientation, margins |
| PDF to JPG | `/pdf-to-jpg` | Four resolutions, per-page or ZIP download |

### What deliberately does not work yet

`pdf-to-word`, `pdf-to-excel`, `pdf-to-ppt`, `word-to-pdf`, `excel-to-pdf`, `ppt-to-pdf`,
`ocr-pdf`, `protect-pdf` and `unlock-pdf` need server-side processing — a layout engine, an OCR
model, or PDF encryption (which `pdf-lib` does not support at all).

Rather than fake them, each page ships the full real UI — upload, validation, options, progress,
result and download — and delegates the actual job to `src/lib/services/pdfService.ts`. When no
service is configured the tool explains why it stopped.

To connect one, set `NEXT_PUBLIC_PDF_API_URL` and implement endpoints that accept
`multipart/form-data` (a `file` field plus any options) at `POST {BASE}/{job}`, returning the
converted file. Nothing else has to change.

---

## Architecture

```
src/
  app/
    layout.tsx            Fonts, theme, header/footer, pending-file provider
    page.tsx              Homepage
    (tools)/<slug>/       22 tool routes, generated from the registry
    tools/ pricing/ about/ contact/ privacy/ terms/
    sitemap.ts robots.ts not-found.tsx
  components/
    site/                 Header, Footer, Logo, theme toggle, contact form
    home/                 Hero, HowItWorks, TrustSection, Pricing, FAQ
    tools/                ToolCard, ToolGrid, ToolsExplorer, ToolPageLayout, ToolWorkspace
    pdf/                  FileUploader, PDFViewer, PDFPageGrid, PDFPageThumbnail,
                          ProcessingProgress, DownloadResult, FileSummary, Notices
    widgets/              One widget per interaction pattern (9 total)
    ui/                   shadcn-style primitives
  lib/
    tools.ts              Single source of truth for all 22 tools
    pdf/                  document, render, organize, merge, split, compress,
                          images, watermark, sign, download
    services/pdfService.ts  Backend contract for server-only jobs
    seo.ts site.ts pricing.ts utils.ts validation.ts
```

**The registry drives everything.** `src/lib/tools.ts` defines each tool's slug, copy, category,
icon, SEO metadata and which widget renders it. Navigation, the tool grid, search, related tools,
the sitemap and per-page metadata are all derived from it. Adding a tool means adding an entry plus
a four-line route file.

**Nine widgets cover 22 routes.** `ToolWorkspace` maps `tool.widget` to a lazily loaded client
component, so marketing pages never download `pdf.js` or `pdf-lib`.

**Page operations share one engine.** Rotate, delete, extract, reorder and duplicate are all the
same thing: a `PagePlan[]` describing which source page goes where and how it is turned. See
`lib/pdf/organize.ts`.

---

## Design

- Accent `hsl(248 71% 57%)` — a violet-indigo, chosen to sit away from the red used across the
  category. Tokens live in `src/app/globals.css` for both themes.
- Type: Plus Jakarta Sans (display) + Inter (UI), loaded via `next/font`.
- Dark mode via `next-themes` with light / dark / system, no flash on load.
- Motion is limited to responses to user action; `prefers-reduced-motion` is respected globally.

## Accessibility

Semantic landmarks, a skip link, visible focus rings on every interactive element, labelled inputs,
`aria-live` for progress and selection counts, and a keyboard path for every drag interaction —
page reordering and file reordering both have arrow buttons, and the signature can be positioned
with arrow keys.

---

## Known constraints

- **Not yet built or type-checked.** Written without network access, so `npm install` and
  `npm run build` have not been run. Expect to fix a small number of issues on first build.
- PDF.js loads its worker via `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`.
  If your bundler setup does not emit it, copy the worker into `public/` and set
  `GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"` in `src/lib/pdf/render.ts`.
- Large documents are bounded by device memory, since the work is local. The uploader caps files
  at 100 MB (`src/lib/validation.ts`).
- Sign PDF applies a visible signature image, not a cryptographic digital signature. The UI says so.
- Auth ("Log in" / "Get started") is not implemented; those links point at existing pages.
