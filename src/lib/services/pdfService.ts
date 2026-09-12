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
  | "pdf-to-pdfa";

// `||` rather than `??`: an empty NEXT_PUBLIC_PDF_API_URL should fall back to
// the built-in route, not be treated as a configured value. `??` only catches
// undefined, so an empty string sailed through and the endpoint became "".
export const SERVICE_ENDPOINT = process.env.NEXT_PUBLIC_PDF_API_URL || "/api/process";

export function isServiceConfigured(): boolean {
  return SERVICE_ENDPOINT.length > 0;
}

/** The API route replies 501 while no conversion engine is connected. */
function isNotImplemented(status: number): boolean {
  return status === 501;
}

export class ServiceUnavailableError extends Error {
  constructor(detail?: string) {
    super(
      detail ||
        "This conversion needs a connection, and nothing is connected to this build yet.",
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

  if (isNotImplemented(response.status)) {
    // The responder knows why better than we do — in the desktop app it will
    // name the missing program rather than talk about servers.
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ServiceUnavailableError(body.error);
  }

  if (!response.ok) {
    // The backend sends a short message plus a `detail` field carrying the
    // real output from the program that failed. Showing only the short one
    // means "OCR failed." and nothing to act on.
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
    };
    const message = [body.error, body.detail].filter(Boolean).join(" ");
    throw new Error(message || "The conversion service could not process this file.");
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return {
    blob: await response.blob(),
    fileName: match?.[1] ?? `${file.name.replace(/\.[^.]+$/, "")}-${job}`,
  };
}
