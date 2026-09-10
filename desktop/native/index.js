/**
 * Locates the bundled command-line tools.
 *
 * In development they sit under desktop/native. In a packaged app they are
 * unpacked next to the application, because Electron's asar archive cannot
 * execute files from inside itself.
 */

const path = require("node:path");
const fs = require("node:fs");

const PLATFORM_DIR = `${process.platform}-${process.arch}`;
const EXE = process.platform === "win32" ? ".exe" : "";

function nativeRoot() {
  // process.resourcesPath only exists in a packaged app.
  const packaged = process.resourcesPath
    ? path.join(process.resourcesPath, "native", PLATFORM_DIR)
    : null;
  if (packaged && fs.existsSync(packaged)) return packaged;
  return path.join(__dirname, PLATFORM_DIR);
}

const ROOT = nativeRoot();

/** Absolute path to a bundled binary, or null when it was not shipped. */
function locate(name) {
  const candidates = {
    qpdf: [path.join(ROOT, "qpdf", "bin", `qpdf${EXE}`)],
    tesseract: [path.join(ROOT, "tesseract", `tesseract${EXE}`)],
    soffice: [
      path.join(ROOT, "libreoffice", "program", `soffice${EXE}`),
      path.join(ROOT, "libreoffice", "MacOS", "soffice"),
      path.join(ROOT, "libreoffice", "squashfs-root", "usr", "bin", "soffice"),
    ],
  }[name];

  if (!candidates) return null;
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/** What this installation can actually do, reported to the interface. */
function capabilities() {
  return {
    qpdf: Boolean(locate("qpdf")),
    tesseract: Boolean(locate("tesseract")),
    libreoffice: Boolean(locate("soffice")),
  };
}

module.exports = { locate, capabilities, ROOT, PLATFORM_DIR };
