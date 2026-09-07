"use client";

import { FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export function FileSummary({
  fileName,
  size,
  pageCount,
  onRemove,
}: {
  fileName: string;
  size: number;
  pageCount?: number | null;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <FileText className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{fileName}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatBytes(size)}
          {typeof pageCount === "number" && ` · ${pageCount} ${pageCount === 1 ? "page" : "pages"}`}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="sr-only">Remove {fileName}</span>
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
