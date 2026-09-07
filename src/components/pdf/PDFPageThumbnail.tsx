"use client";

import { cn } from "@/lib/utils";

export function PDFPageThumbnail({
  src,
  pageNumber,
  rotation = 0,
  className,
}: {
  src?: string;
  pageNumber: number;
  rotation?: number;
  className?: string;
}) {
  const quarterTurn = Math.abs(rotation % 180) === 90;

  return (
    <div
      className={cn(
        "relative grid aspect-[3/4] place-items-center overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Page ${pageNumber}`}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{
            transform: `rotate(${rotation}deg)`,
            maxHeight: quarterTurn ? "75%" : "100%",
            maxWidth: quarterTurn ? "75%" : "100%",
          }}
        />
      ) : (
        <div className="size-full animate-pulse bg-gradient-to-b from-muted to-border/60" />
      )}
    </div>
  );
}
