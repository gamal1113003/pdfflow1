# Making the desktop app work offline

The application already runs every browser-based tool without a connection.
Three programs need to be placed in `desktop/native/win32-x64/` for the
remaining nine.

Check what is currently present at any time: open the app, press
`Ctrl+Shift+I`, and visit `/bundled` in the window. It lists each program and
whether this installation has it.

---

## 1. qpdf — passwords (5 MB)

Gives you: **Protect PDF**, **Unlock PDF**

```
npm run desktop:native
```

The script downloads and unpacks this one automatically. If it fails, take the
`msvc64.zip` from the qpdf releases page on GitHub and unpack it so that this
file exists:

```
desktop/native/win32-x64/qpdf/bin/qpdf.exe
```

---

## 2. Tesseract — OCR (60 MB)

Gives you: **OCR PDF**, and reading text from scans

1. Install the Windows build from the UB Mannheim page
   (`github.com/UB-Mannheim/tesseract/wiki`). During installation, tick the
   **Russian** language pack as well as English.
2. Copy the whole installed folder — usually
   `C:\Program Files\Tesseract-OCR` — to:

```
desktop/native/win32-x64/tesseract/
```

So that this exists:

```
desktop/native/win32-x64/tesseract/tesseract.exe
desktop/native/win32-x64/tesseract/tessdata/eng.traineddata
desktop/native/win32-x64/tesseract/tessdata/rus.traineddata
```

---

## 3. LibreOffice — Office conversion (400 MB)

Gives you: **PDF to Word**, **PDF to Excel**, **PDF to PowerPoint**,
**Word to PDF**, **Excel to PDF**, **PowerPoint to PDF**

Use the **portable** build, not the installer — a portable copy can be moved
into the project folder, which an installed one cannot.

1. Download LibreOffice Portable from `libreoffice.org/download/portable-versions/`
2. Run it once to unpack itself
3. Copy the `App\libreoffice` folder from inside it to:

```
desktop/native/win32-x64/libreoffice/
```

So that this exists:

```
desktop/native/win32-x64/libreoffice/program/soffice.exe
```

**This is the big one.** Leaving it out keeps the installer near 200 MB
instead of 600 MB, at the cost of the six Office tools.

---

## 4. Build and check

```
npm run desktop:build
npm run desktop:start
```

Open `/bundled` in the app. Each program should show **included**.

Then test properly: **turn off your wifi** and convert a Word file to PDF. If
it works with the network off, the app is genuinely offline.

---

## 5. Package it

```
npm run desktop:package
```

The installer appears in `desktop/dist`.

Before giving it to anyone: the licence texts for LibreOffice, Tesseract and
qpdf must be included. Each program ships its own — keep them in the folders
you copied, and they travel with the build.
