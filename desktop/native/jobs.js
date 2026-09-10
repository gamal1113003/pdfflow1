/**
 * The jobs that need a real program rather than a browser.
 *
 * Each one writes to a private temporary directory and removes it afterwards,
 * on success and on failure alike. Nothing is left behind, which matters more
 * here than on a server: this is the user's own machine.
 */

const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { locate } = require("./index.js");

const run = promisify(execFile);

class MissingToolError extends Error {
  constructor(tool) {
    super(`${tool} was not bundled with this installation.`);
    this.name = "MissingToolError";
  }
}

async function workspace() {
  return fs.mkdtemp(path.join(os.tmpdir(), "orzix-"));
}

async function withWorkspace(fn) {
  const dir = await workspace();
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** LibreOffice converts anything it can open into a PDF. */
async function officeToPdf(inputBuffer, originalName) {
  const soffice = locate("soffice");
  if (!soffice) throw new MissingToolError("LibreOffice");

  return withWorkspace(async (dir) => {
    const input = path.join(dir, originalName.replace(/[^\w.-]/g, "_"));
    await fs.writeFile(input, inputBuffer);

    // A writable HOME is required: LibreOffice creates a profile on first run
    // and refuses to start without one.
    await run(soffice, [
      "--headless",
      "--norestore",
      "--convert-to",
      "pdf",
      "--outdir",
      dir,
      input,
    ], { env: { ...process.env, HOME: dir }, timeout: 300000, maxBuffer: 1 << 26 });

    const produced = path.join(dir, `${path.parse(input).name}.pdf`);
    return fs.readFile(produced);
  });
}

/** And the other direction, for PDF to Word and PDF to Excel. */
async function pdfToOffice(inputBuffer, format) {
  const soffice = locate("soffice");
  if (!soffice) throw new MissingToolError("LibreOffice");

  const filter = {
    docx: "docx:MS Word 2007 XML",
    xlsx: "xlsx:Calc MS Excel 2007 XML",
    pptx: "pptx:Impress MS PowerPoint 2007 XML",
  }[format];
  if (!filter) throw new Error(`Unsupported output format: ${format}`);

  return withWorkspace(async (dir) => {
    const input = path.join(dir, "input.pdf");
    await fs.writeFile(input, inputBuffer);

    await run(soffice, [
      "--headless",
      "--norestore",
      "--infilter=writer_pdf_import",
      "--convert-to",
      filter,
      "--outdir",
      dir,
      input,
    ], { env: { ...process.env, HOME: dir }, timeout: 300000, maxBuffer: 1 << 26 });

    return fs.readFile(path.join(dir, `input.${format}`));
  });
}

/** Password protection and removal, both qpdf. */
async function protectPdf(inputBuffer, password) {
  const qpdf = locate("qpdf");
  if (!qpdf) throw new MissingToolError("qpdf");

  return withWorkspace(async (dir) => {
    const input = path.join(dir, "input.pdf");
    const output = path.join(dir, "output.pdf");
    await fs.writeFile(input, inputBuffer);

    await run(qpdf, [
      "--encrypt", password, password, "256", "--",
      input, output,
    ], { timeout: 120000 });

    return fs.readFile(output);
  });
}

async function unlockPdf(inputBuffer, password) {
  const qpdf = locate("qpdf");
  if (!qpdf) throw new MissingToolError("qpdf");

  return withWorkspace(async (dir) => {
    const input = path.join(dir, "input.pdf");
    const output = path.join(dir, "output.pdf");
    await fs.writeFile(input, inputBuffer);

    try {
      await run(qpdf, [`--password=${password}`, "--decrypt", input, output], {
        timeout: 120000,
      });
    } catch (error) {
      // qpdf exits 2 when the password is wrong, which is worth saying clearly.
      if (String(error.stderr || "").includes("invalid password")) {
        throw new Error("That password is not correct.");
      }
      throw error;
    }

    return fs.readFile(output);
  });
}

/**
 * OCR. Tesseract writes a searchable PDF directly, so no separate merge step
 * is needed — the text layer sits behind the original image.
 */
async function ocrPdf(inputBuffer, language = "eng") {
  const tesseract = locate("tesseract");
  if (!tesseract) throw new MissingToolError("Tesseract");

  return withWorkspace(async (dir) => {
    const input = path.join(dir, "input.pdf");
    const stem = path.join(dir, "output");
    await fs.writeFile(input, inputBuffer);

    await run(tesseract, [input, stem, "-l", language, "pdf"], {
      env: { ...process.env, TESSDATA_PREFIX: path.join(path.dirname(tesseract), "tessdata") },
      timeout: 600000,
      maxBuffer: 1 << 26,
    });

    return fs.readFile(`${stem}.pdf`);
  });
}

/**
 * OCR on a single rasterised page. Tesseract writes a searchable PDF: the
 * image on top, the recognised text invisible behind it, so the page looks
 * identical but can be searched and copied.
 */
async function ocrImage(imageBuffer, language = "eng") {
  const tesseract = locate("tesseract");
  if (!tesseract) throw new MissingToolError("Tesseract");

  return withWorkspace(async (dir) => {
    const input = path.join(dir, "page.png");
    const stem = path.join(dir, "page");
    await fs.writeFile(input, imageBuffer);

    await run(tesseract, [input, stem, "-l", language, "pdf"], {
      env: {
        ...process.env,
        TESSDATA_PREFIX: path.join(path.dirname(tesseract), "tessdata"),
      },
      timeout: 180000,
      maxBuffer: 1 << 26,
    });

    return fs.readFile(`${stem}.pdf`);
  });
}

module.exports = {
  ocrImage,
  officeToPdf,
  pdfToOffice,
  protectPdf,
  unlockPdf,
  ocrPdf,
  MissingToolError,
};
