"use client";

import { useCallback, useId, useRef, useState } from "react";
import { AlertCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_FILE_BYTES, validateFile } from "@/lib/validation";
import { cn } from "@/lib/utils";

export type FileUploaderProps = {
  /** Lowercase extensions without the dot, e.g. ["pdf"]. */
  extensions?: string[];
  multiple?: boolean;
  maxBytes?: number;
  disabled?: boolean;
  title?: string;
  hint?: string;
  buttonLabel?: string;
  note?: string;
  size?: "lg" | "sm";
  className?: string;
  onFiles: (files: File[]) => void;
};

export function FileUploader({
  extensions = ["pdf"],
  multiple = false,
  maxBytes = MAX_FILE_BYTES,
  disabled = false,
  title = "Drop your PDF here",
  hint = "or choose a file from your device",
  buttonLabel = "Choose PDF",
  note,
  size = "lg",
  className,
  onFiles,
}: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = extensions.map((ext) => `.${ext}`).join(",");

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const incoming = Array.from(fileList).slice(0, multiple ? undefined : 1);
      const accepted: File[] = [];
      let firstError: string | null = null;

      for (const file of incoming) {
        const problem = validateFile(file, { extensions, maxBytes });
        if (problem) {
          firstError ??= problem;
          continue;
        }
        accepted.push(file);
      }

      setError(accepted.length === 0 ? firstError : null);
      if (accepted.length > 0) onFiles(accepted);
    },
    [extensions, maxBytes, multiple, onFiles],
  );

  return (
    <div className={className}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed bg-card text-center transition-colors duration-150",
          size === "lg" ? "px-6 py-12 sm:py-16" : "px-5 py-8",
          dragging
            ? "border-primary bg-primary-soft/60"
            : "border-border hover:border-primary/50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span
          className={cn(
            "mx-auto grid place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-200",
            size === "lg" ? "size-14" : "size-11",
            dragging && "scale-110",
          )}
        >
          <UploadCloud className={size === "lg" ? "size-7" : "size-5"} aria-hidden="true" />
        </span>

        <h3
          className={cn(
            "mt-5 font-display font-semibold tracking-tight text-foreground",
            size === "lg" ? "text-xl sm:text-2xl" : "text-base",
          )}
        >
          {title}
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{hint}</p>

        <Button
          type="button"
          size={size === "lg" ? "lg" : "sm"}
          className="mt-6"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {buttonLabel}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          {note ??
            `${extensions.map((e) => e.toUpperCase()).join(", ")} · up to ${Math.round(maxBytes / 1024 / 1024)} MB`}
        </p>

        <label htmlFor={inputId} className="sr-only">
          {title}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
