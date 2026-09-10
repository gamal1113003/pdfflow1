# Bundled tools

These are the programs the desktop app carries so it can work with no
connection. They are not committed to git — they are large, and each platform
needs its own build. `scripts/fetch-native.mjs` downloads them.

```
desktop/native/
  win32-x64/
    qpdf/bin/qpdf.exe
    tesseract/tesseract.exe
    libreoffice/program/soffice.exe
  darwin-arm64/
  linux-x64/
```

Sizes, roughly:

| Tool | Size | Gives you |
|---|---|---|
| qpdf | 5 MB | Protect, Unlock |
| Tesseract + eng/rus | 60 MB | OCR |
| LibreOffice | 400 MB | Word/Excel/PowerPoint conversion both ways |

LibreOffice is the bulk of it. If you drop it, the installer falls from about
600 MB to 150 MB and the six Office tools go back to needing the server.
