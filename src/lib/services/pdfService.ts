/**
 * Service layer for the operations that cannot honestly be done in a browser
 * tab: high-fidelity Office conversion, OCR, and PDF encryption/decryption.
 *
 * Nothing here is simulated. Until `NEXT_PUBLIC_PDF_API_URL` points at a real
 * conversion service the UI says the job needs a backend and stops there.
 *
 * To connect one, implement an endpoint that accepts multipart/form-data with
 * a `file` field plus any job options, and responds with the converted file.
 */

export type ServiceJob =
  | "pdf-to-word"
  | "pdf-to-excel"
  | "pdf-to-ppt"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "ppt-to-pdf"
  | "protect-pdf"
  | "unlock-pdf"
  | "ocr-pdf"
    "compress-pdf"
    "watermark-pdf"
    "png-to-pdf"
    "rotate-pdf"
    "flatten-pdf"
    "crop-pdf"
    "translate-pdf";

export const SERVICE_ENDPOINT = process.env.NEXT_PUBLIC_PDF_API_URL ?? "";

export function isServiceConfigured(): boolean {
  return SERVICE_ENDPOINT.length > 0;
}

export class ServiceUnavailableError extends Error {
  constructor() {
    super(
      "This conversion runs on a server, and no processing service is connected to this build yet.",
    );
    this.name = "ServiceUnavailableError";
  }
}

export type ServiceResult = {
  blob: Blob;
  fileName: string;
};

export type ServiceOptions = Record<string, string | number | boolean | undefined>;

export async function runServiceJob(
  job: ServiceJob,
  file: File,
  options: ServiceOptions = {},
  signal?: AbortSignal,
): Promise<ServiceResult> {
  if (!isServiceConfigured()) {
    throw new ServiceUnavailableError();
  }

  const body = new FormData();
  body.append("file", file);
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) body.append(key, String(value));
  }

  const response = await fetch(`${SERVICE_ENDPOINT.replace(/\/$/, "")}/${job}`, {
    method: "POST",
    body,
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail?.slice(0, 200) || "The conversion service could not process this file.",
    );
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return {
    blob: await response.blob(),
    fileName: match?.[1] ?? `${file.name.replace(/\.[^.]+$/, "")}-${job}`,
  };
}
