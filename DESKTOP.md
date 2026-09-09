# orzix desktop

A desktop version containing only the tools that already run on the device.
No account, no server, no internet connection required.

## Two kinds of tool

**Work offline.** Merge, split, crop, rotate, delete pages, extract pages,
reorder pages, the page editor, annotate, compress, watermark, sign, JPG to
PDF, PNG to PDF, PDF to JPG. Switch off the network and they still work.

**Need a connection.** PDF to Word, PDF to Excel, PDF to PowerPoint, Word to
PDF, Excel to PDF, PowerPoint to PDF, OCR, protect, unlock. These send the file
to your backend, because LibreOffice and Tesseract are far too large to ship
inside the app.

Every tool page says which kind it is before you choose a file, and shows a
clear message if you are offline when a connection is needed.

**Not included:** translation, which needs an API route a static build cannot
have. Accounts are absent too — there is nothing to sign in to.

## Building it

Point the app at your backend first, or the server tools will report that no
service is connected:

```bash
# Windows
set ORZIX_API_URL=https://your-backend.onrender.com

# Mac / Linux
export ORZIX_API_URL=https://your-backend.onrender.com
```

Then:

```bash
npm install
npm run desktop:build     # trims the project and exports a static site
npm run desktop:start     # opens the app
```

The first command copies the project to `.desktop-build`, removes the parts
that need a server, and exports plain HTML into `desktop/app`. Your working
project is not modified.

## Making an installer

```bash
npm run desktop:package
```

Output lands in `desktop/dist`: `.exe` on Windows, `.dmg` on macOS,
`.AppImage` on Linux. Each platform must be built on that platform.

## Before giving it to anyone else

**Windows will warn people not to run it.** An unsigned installer triggers
SmartScreen: "Windows protected your PC". The Run button hides behind "More
info", and most people stop there.

A code signing certificate removes that, at roughly $200–400 a year, and needs
proof that your business exists. Even then, SmartScreen builds reputation over
the first few hundred downloads unless you buy the more expensive EV variety.

macOS is the same story: $99 a year for the Apple Developer Program plus
notarisation, or users see "cannot be opened because the developer cannot be
verified".

If you distribute without signing, say so plainly on the download page and
explain how to get past the warning. Plenty of open-source projects do this. It
costs installs, but it is honest.

## How it works

`desktop/main.js` starts a small HTTP server on 127.0.0.1 and points an
Electron window at it. Loading the files over `file://` would be simpler, but
browsers treat that as an opaque origin and refuse to start web workers — and
PDF.js needs a worker to render a single page.

The window runs with `nodeIntegration: false`, `contextIsolation: true` and
`sandbox: true`. The page is ordinary web content and is given no access to the
file system beyond what a browser tab would have.

## Keeping it in step with the web app

The desktop build reads from the same `src`. Change a tool on the web and run
`npm run desktop:build` again — the trimming script re-applies itself. Nothing
is duplicated by hand.
