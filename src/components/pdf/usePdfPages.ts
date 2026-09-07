"use client";

import { useEffect, useRef, useState } from "react";
import { renderThumbnails } from "@/lib/pdf/render";

export type Thumbnails = Record<number, string>;

/**
 * Renders page thumbnails progressively so a 200-page PDF still feels alive.
 * Returns a map of 1-based page number to data URL.
 */
export function usePdfPages(bytes: Uint8Array | null, maxEdge = 300) {
  const [thumbnails, setThumbnails] = useState<Thumbnails>({});
  const [rendered, setRendered] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    controller.current?.abort();
    setThumbnails({});
    setRendered(0);
    setTotal(0);
    setError(null);
    if (!bytes) return;

    const abort = new AbortController();
    controller.current = abort;

    renderThumbnails(
      bytes,
      (pageNumber, page) => {
        if (abort.signal.aborted) return;
        setThumbnails((current) => ({ ...current, [pageNumber]: page.dataUrl }));
        setRendered((count) => count + 1);
      },
      { maxEdge, signal: abort.signal },
    )
      .then((pages) => {
        if (!abort.signal.aborted) setTotal(pages);
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "This PDF could not be previewed.");
      });

    return () => abort.abort();
  }, [bytes, maxEdge]);

  return { thumbnails, rendered, total, error };
}
