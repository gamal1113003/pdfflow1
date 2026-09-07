import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

export function percentSaved(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.max(0, Math.round(((before - after) / before) * 100));
}

/** "report.pdf" -> "report" */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^./\\]+$/, "");
}

export function withSuffix(fileName: string, suffix: string, ext = "pdf"): string {
  return `${baseName(fileName)}-${suffix}.${ext}`;
}

/** Parses "1-3, 8, 11-12" against a page count. Returns 1-based page numbers, sorted & deduped. */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const chunk of input.split(",")) {
    const part = chunk.trim();
    if (!part) continue;
    const range = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const [lo, hi] = start <= end ? [start, end] : [end, start];
      for (let p = lo; p <= hi; p++) if (p >= 1 && p <= pageCount) pages.add(p);
      continue;
    }
    const single = Number(part);
    if (Number.isInteger(single) && single >= 1 && single <= pageCount) pages.add(single);
  }
  return [...pages].sort((a, b) => a - b);
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
