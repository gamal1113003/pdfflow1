"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPdfInfo, readFileBytes } from "@/lib/pdf/document";
import { usePendingFile } from "@/components/pdf/PendingFileProvider";

export type LoadedPdf = {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
};

/** Shared state for every tool that works on exactly one PDF. */
export function useSinglePdf() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await readFileBytes(file);
      const info = await getPdfInfo(bytes);
      setPdf({ file, bytes, pageCount: info.pageCount });
    } catch (cause) {
      setPdf(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while reading your PDF. Please try again.",
      );
    } finally {
      setLoading(false);
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

  return { pdf, loading, error, setError, load, clear };
}
