/**
 * The local API.
 *
 * The web app posts conversions to /api/process/<job>. In the desktop build
 * those requests are answered here, by the bundled programs, on this machine.
 * Because the page and the API share an origin there is no CORS involved and
 * `pdfService.ts` needs no desktop-specific code at all.
 *
 * If a program was not bundled and a remote backend is configured, the request
 * is forwarded rather than failing. That keeps a small installer usable.
 */

const Busboy = require("busboy");
const jobs = require("./native/jobs.js");
const { capabilities } = require("./native/index.js");

const REMOTE = process.env.ORZIX_API_URL || "";

/**
 * Tesseract reads images, not PDFs — "Pdf reading is not supported" is its own
 * error message. On a server, ocrmypdf rasterises the pages first. Here the
 * page already has PDF.js, so the renderer does that step and sends one image
 * at a time; this job turns each into a single-page searchable PDF, and the
 * page stitches them back together with pdf-lib.
 */
const PAGE_JOBS = {
  "ocr-page": { ext: "pdf", type: "application/pdf" },
};

const OUTPUT = {
  "pdf-to-word": { ext: "docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  "pdf-to-excel": { ext: "xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  "pdf-to-ppt": { ext: "pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  "word-to-pdf": { ext: "pdf", type: "application/pdf" },
  "excel-to-pdf": { ext: "pdf", type: "application/pdf" },
  "ppt-to-pdf": { ext: "pdf", type: "application/pdf" },
  "protect-pdf": { ext: "pdf", type: "application/pdf" },
  "unlock-pdf": { ext: "pdf", type: "application/pdf" },
  "ocr-pdf": { ext: "pdf", type: "application/pdf" },
};

/** Reads one file and any text fields out of a multipart request. */
function readUpload(request) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: request.headers,
      limits: { files: 1, fileSize: 200 * 1024 * 1024 },
    });

    const fields = {};
    let fileName = "upload";
    const chunks = [];

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });
    busboy.on("file", (_name, stream, info) => {
      fileName = info.filename || fileName;
      stream.on("data", (chunk) => chunks.push(chunk));
    });
    busboy.on("error", reject);
    busboy.on("close", () =>
      resolve({ buffer: Buffer.concat(chunks), fileName, fields }),
    );

    request.pipe(busboy);
  });
}

async function runLocally(job, buffer, fileName, fields) {
  switch (job) {
    case "ocr-page":
      return jobs.ocrImage(buffer, fields.language || "eng");
    case "word-to-pdf":
    case "excel-to-pdf":
    case "ppt-to-pdf":
      return jobs.officeToPdf(buffer, fileName);
    case "pdf-to-word":
      return jobs.pdfToOffice(buffer, "docx");
    case "pdf-to-excel":
      return jobs.pdfToOffice(buffer, "xlsx");
    case "pdf-to-ppt":
      return jobs.pdfToOffice(buffer, "pptx");
    case "protect-pdf":
      return jobs.protectPdf(buffer, fields.password || "");
    case "unlock-pdf":
      return jobs.unlockPdf(buffer, fields.password || "");
    case "ocr-pdf":
      return jobs.ocrPdf(buffer, fields.language || "eng");
    default:
      return null;
  }
}

/** Sends the job on to a remote backend when the local tool is absent. */
async function forward(job, buffer, fileName, fields) {
  const form = new FormData();
  form.append("file", new Blob([buffer]), fileName);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);

  const response = await fetch(`${REMOTE.replace(/\/$/, "")}/${job}`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail.slice(0, 300) || "The remote service could not process this file.");
  }
  return Buffer.from(await response.arrayBuffer());
}

async function handle(request, response, job) {
  const spec = OUTPUT[job] ?? PAGE_JOBS[job];
  if (!spec) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Unknown conversion." }));
    return;
  }

  try {
    const { buffer, fileName, fields } = await readUpload(request);
    if (buffer.length === 0) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "No file was uploaded." }));
      return;
    }

    let result;
    try {
      result = await runLocally(job, buffer, fileName, fields);
    } catch (error) {
      if (error instanceof jobs.MissingToolError && REMOTE) {
        result = await forward(job, buffer, fileName, fields);
      } else if (error instanceof jobs.MissingToolError) {
        response.writeHead(501, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: `${error.message} Connect a service, or install the full version.`,
          }),
        );
        return;
      } else {
        throw error;
      }
    }

    const { ext, type } = spec;
    const base = fileName.replace(/\.[^.]+$/, "") || "document";
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${base}.${ext}"`,
      "Cache-Control": "no-store",
    });
    response.end(result);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({ error: error.message || "Something went wrong processing your file." }),
    );
  }
}

module.exports = { handle, capabilities, isApiPath: (p) => p.startsWith("/api/process/") };
