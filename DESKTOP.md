# orzix desktop

Everything runs on the machine. No account, no server, and — once the bundled
programs are in place — no internet connection.

## How it works

The app opens a window onto a copy of the site, served from a small HTTP
server on 127.0.0.1. Requests that the browser cannot handle are answered by
the same server, using programs shipped inside the installer:

| Job | Program | Size |
|---|---|---|
| Word / Excel / PowerPoint, both directions | LibreOffice | ~400 MB |
| OCR | Tesseract | ~60 MB |
| Protect, unlock | qpdf | ~5 MB |

Everything else — merge, split, crop, rotate, page editing, annotating,
compressing, watermarking, signing, image conversion — already ran in the
browser and needs nothing extra.

Because the page and the API share an origin, there is no CORS and no
desktop-specific code in the web app. `pdfService.ts` posts to
`/api/process/<job>` exactly as it does on the website; on the desktop that
request is answered locally.

## Building

**1. Fetch the bundled programs.** Once per machine:

```bash
npm run desktop:native          # everything, ~600 MB installer
npm run desktop:native:lite     # qpdf and Tesseract only, ~200 MB
```

Some downloads have to be placed by hand — the script prints exactly what it
wants and where. LibreOffice in particular is distributed differently on each
platform.

**2. Build and run:**

```bash
npm install
npm run desktop:build
npm run desktop:start
```

**3. Make an installer:**

```bash
npm run desktop:package
```

Output in `desktop/dist`. Each platform must be built on that platform.

## If a program is missing

The app still runs. A tool whose program was not bundled either forwards the
job to a remote backend, if one is configured:

```bash
$env:ORZIX_API_URL = "https://your-backend.onrender.com"   # PowerShell
export ORZIX_API_URL=https://your-backend.onrender.com     # Mac/Linux
```

or reports plainly that it needs one. It does not fail silently.

Check what an installation can see by opening
`http://127.0.0.1:<port>/api/capabilities` in the app's developer tools, or by
watching which tools report a missing program.

## Not included

**Translation.** It calls a Next API route for batches of text, and a static
build has no API routes. Adding it would mean reimplementing the batching in
the Electron process against a translation API — possible, but it needs a
paid key, and a tool that needs the internet sits oddly in an offline app.

**Accounts.** There is nothing to sign in to.

## Before giving it to anyone else

**Windows will warn people not to run it.** An unsigned installer triggers
SmartScreen: "Windows protected your PC", with the Run button hidden behind
"More info". Most people stop there.

Code signing costs roughly $200–400 a year and requires proof that your
business exists. Even then, SmartScreen builds reputation over the first few
hundred downloads unless you buy the more expensive EV certificate.

macOS is the same: $99 a year plus notarisation, or users see "cannot be
opened because the developer cannot be verified".

**Check the licences before distributing.** LibreOffice is MPL 2.0, Tesseract
is Apache 2.0, qpdf is Apache 2.0. All permit redistribution, and all require
that you include their licence texts and say what you have bundled. Put those
in an About page before you publish an installer.

## Keeping it in step with the web app

The desktop build reads the same `src`. Change a tool on the website, run
`npm run desktop:build` again, and the trimming script re-applies itself.
Nothing is maintained twice.
