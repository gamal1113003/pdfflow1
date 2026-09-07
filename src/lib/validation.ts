export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB — everything runs in the browser tab.

export const ACCEPT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  png: ["image/png"],
  image: ["image/jpeg", "image/png", "image/webp"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
};

export type FileRejection = { file: File; reason: string };

export function extensionOf(file: File): string {
  return (file.name.split(".").pop() ?? "").toLowerCase();
}

export function validateFile(
  file: File,
  opts: { extensions: string[]; maxBytes?: number },
): string | null {
  const max = opts.maxBytes ?? MAX_FILE_BYTES;
  const ext = extensionOf(file);
  if (!opts.extensions.includes(ext)) {
    const list = opts.extensions.map((e) => e.toUpperCase()).join(", ");
    return `Unsupported file. Choose a ${list} file.`;
  }
  if (file.size > max) {
    return `This file exceeds the maximum supported size of ${Math.round(max / 1024 / 1024)} MB.`;
  }
  if (file.size === 0) {
    return "This file is empty.";
  }
  return null;
}
