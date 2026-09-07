"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Copy, GripVertical, RotateCw, Trash2 } from "lucide-react";
import { PDFPageThumbnail } from "@/components/pdf/PDFPageThumbnail";
import type { Thumbnails } from "@/components/pdf/usePdfPages";
import type { PagePlan } from "@/lib/pdf/organize";
import { cn } from "@/lib/utils";

export type PageAction = "rotate" | "delete" | "duplicate" | "move";

export type PDFPageGridProps = {
  plan: PagePlan[];
  thumbnails: Thumbnails;
  /** Enabled per-page controls. */
  actions: PageAction[];
  selectable?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onMove?: (from: number, to: number) => void;
};

export function PDFPageGrid({
  plan,
  thumbnails,
  actions,
  selectable = false,
  selected,
  onToggleSelect,
  onRotate,
  onDelete,
  onDuplicate,
  onMove,
}: PDFPageGridProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const canMove = actions.includes("move") && Boolean(onMove);

  return (
    <ul
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-label="Pages in this document"
    >
      {plan.map((page, index) => {
        const isSelected = selected?.has(page.id) ?? false;
        const isDragTarget = overIndex === index && draggingIndex !== index;

        return (
          <li
            key={page.id}
            draggable={canMove}
            onDragStart={(event) => {
              if (!canMove) return;
              setDraggingIndex(index);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(index));
            }}
            onDragOver={(event) => {
              if (!canMove || draggingIndex === null) return;
              event.preventDefault();
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((current) => (current === index ? null : current))}
            onDrop={(event) => {
              if (!canMove || draggingIndex === null) return;
              event.preventDefault();
              onMove?.(draggingIndex, index);
              setDraggingIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDraggingIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              "group relative rounded-xl border bg-card p-2.5 transition-[border-color,box-shadow,opacity]",
              isSelected ? "border-primary shadow-card" : "border-border",
              isDragTarget && "border-primary ring-2 ring-primary/30",
              draggingIndex === index && "opacity-45",
              canMove && "cursor-grab active:cursor-grabbing",
            )}
          >
            {selectable ? (
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleSelect?.(page.id)}
                className="block w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="sr-only">
                  {isSelected ? `Deselect page ${index + 1}` : `Select page ${index + 1}`}
                </span>
                <PDFPageThumbnail
                  src={thumbnails[page.sourceIndex + 1]}
                  pageNumber={index + 1}
                  rotation={page.rotation}
                />
              </button>
            ) : (
              <PDFPageThumbnail
                src={thumbnails[page.sourceIndex + 1]}
                pageNumber={index + 1}
                rotation={page.rotation}
              />
            )}

            {selectable && (
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute left-4 top-4 grid size-6 place-items-center rounded-md border-2 text-xs font-semibold",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/80 bg-black/25 text-transparent backdrop-blur-sm",
                )}
              >
                ✓
              </span>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                {canMove && <GripVertical className="size-3.5" aria-hidden="true" />}
                {index + 1}
              </span>

              <div className="flex items-center gap-0.5">
                {canMove && (
                  <>
                    <IconAction
                      label={`Move page ${index + 1} earlier`}
                      disabled={index === 0}
                      onClick={() => onMove?.(index, index - 1)}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label={`Move page ${index + 1} later`}
                      disabled={index === plan.length - 1}
                      onClick={() => onMove?.(index, index + 1)}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </IconAction>
                  </>
                )}
                {actions.includes("rotate") && (
                  <IconAction
                    label={`Rotate page ${index + 1}`}
                    onClick={() => onRotate?.(page.id)}
                  >
                    <RotateCw className="size-4" aria-hidden="true" />
                  </IconAction>
                )}
                {actions.includes("duplicate") && (
                  <IconAction
                    label={`Duplicate page ${index + 1}`}
                    onClick={() => onDuplicate?.(page.id)}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </IconAction>
                )}
                {actions.includes("delete") && (
                  <IconAction
                    label={`Delete page ${index + 1}`}
                    destructive
                    disabled={plan.length === 1}
                    onClick={() => onDelete?.(page.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconAction>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35",
        destructive && "hover:bg-destructive-soft hover:text-destructive",
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}
