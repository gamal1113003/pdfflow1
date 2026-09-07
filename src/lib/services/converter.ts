import { readFile } from "node:fs/promises";

/**
 * The server-side conversion engine.
 *
 * PDFFlow does not ship one. Converting a PDF to Word accurately needs a
 * layout engine such as LibreOffice; OCR needs a trained model; PDF encryption
 * needs a library that supports it. Pretending otherwise would return broken
 * documents, so every job here fails loudly until an engine is wired in.
 *
 * To connect one, implement `runEngine` below. The surrounding API route
 * already handles upload limits, file-type validation, temporary storage and
 * guaranteed deletion, so an implementation only has to read `inputPath` and
 * return bytes.
 *
 * Typical approach: run LibreOffice headless, or Tesseract for OCR, or qpdf
 * for password work, as a child process inside `workDir`.
 */

export const JOBS = [
  "pdf-to-word",
  "pdf-to-excel",
  "pdf-to-ppt",
  "word-to-pdf",
  "excel-to-pdf",
  "ppt-to-pdf",
  "protect-pdf",
  "unlock-pdf",
  "ocr-pdf",
] as const;

export type Job = (typeof JOBS)[number];

export function isSupportedJob(value: string): value is Job {
  return (JOBS as readonly string[]).includes(value);
}

export class ConverterNotConfiguredError extends Error {
  constructor(job: string) {
    super(
      `${job} runs on a server, and no conversion engine is connected to this deployment yet.`,
    );
    this.name = "ConverterNotConfiguredError";
  }
}

export type ConvertRequest = {
  job: Job;
  /** Absolute path to the uploaded file inside a temporary directory. */
  inputPath: string;
  /** Temporary directory, deleted by the caller once the response is sent. */
  workDir: string;
  originalName: string;
  password?: string;
};

export type ConvertResult = {
  bytes: Buffer;
  fileName: string;
  contentType: string;
};

const OUTPUT: Record<Job, { extension: string; contentType: string }> = {
  "pdf-to-word": {
    extension: "docx",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "pdf-to-excel": {
    extension: "xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  "pdf-to-ppt": {
    extension: "pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  "word-to-pdf": { extension: "pdf", contentType: "application/pdf" },
  "excel-to-pdf": { extension: "pdf", contentType: "application/pdf" },
  "ppt-to-pdf": { extension: "pdf", contentType: "application/pdf" },
  "protect-pdf": { extension: "pdf", contentType: "application/pdf" },
  "unlock-pdf": { extension: "pdf", contentType: "application/pdf" },
  "ocr-pdf": { extension: "pdf", contentType: "application/pdf" },
};

/**
 * Replace this with a real implementation. Return the absolute path of the
 * produced file, which must live inside `workDir` so it is cleaned up too.
 */
async function runEngine(_request: ConvertRequest): Promise<string | null> {
  return null;
}

export async function convert(request: ConvertRequest): Promise<ConvertResult> {
  const outputPath = await runEngine(request);
  if (!outputPath) throw new ConverterNotConfiguredError(request.job);

  const { extension, contentType } = OUTPUT[request.job];
  const base = request.originalName.replace(/\.[^.]+$/, "") || "document";

  return {
    bytes: await readFile(outputPath),
    fileName: `${base}.${extension}`,
    contentType,
  };
}
