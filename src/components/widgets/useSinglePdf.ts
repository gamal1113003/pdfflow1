"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPdfInfo } from "@/lib/pdf/document";
import { conversionLabel, ingestAsPdf } from "@/lib/pdf/ingest";
import { usePendingFile } from "@/components/pdf/PendingFileProvider";

export type LoadedPdf = {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
  /** Set when the upload was converted to PDF on the way in. */
  convertedFrom?: string;
  /** Name to use for downloads, always ending in .pdf. */
  displayName: string;
};

/** Shared state for every tool that works on exactly one PDF. */
export function useSinglePdf() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setConverting(conversionLabel(file));
    try {
      // Anything that is not already a PDF is converted first, so every tool
      // downstream can assume it is working with one.
      const ingested = await ingestAsPdf(file);
      const info = await getPdfInfo(ingested.bytes);
      setPdf({
        file,
        bytes: ingested.bytes,
        pageCount: info.pageCount,
        displayName: ingested.fileName,
        convertedFrom: ingested.converted
          ? (file.name.split(".").pop() ?? "").toUpperCase()
          : undefined,
      });
    } catch (cause) {
      setPdf(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while reading your PDF. Please try again.",
      );
    } finally {
      setLoading(false);
      setConverting(null);
    }
  }, []);

  // A file dropped on the homepage is picked up here automatically.
  const { takePendingFile } = usePendingFile();
  const claimed = useRef(false);
  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;
    const queued = takePendingFile();
    if (queued) void load([queued]);
  }, [load, takePendingFile]);

  const clear = useCallback(() => {
    setPdf(null);
    setError(null);
  }, []);

  return { pdf, loading, converting, error, setError, load, clear };
}
