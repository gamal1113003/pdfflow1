"use client";

import { useEffect, useRef } from "react";
import { recordUsage } from "@/lib/auth/recordUsage";

/**
 * Records that a signed-in person opened a tool. One row per visit: the tool
 * slug and a timestamp. Signed-out visitors are not recorded at all.
 */
export function TrackToolUsage({ slug }: { slug: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void recordUsage(slug);
  }, [slug]);

  return null;
}
