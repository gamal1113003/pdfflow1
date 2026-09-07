"use client";

import {
  Highlighter,
  ImagePlus,
  MousePointer2,
  Pencil,
  Square,
  SquareSlash,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EditorTool =
  | "select"
  | "text"
  | "draw"
  | "highlight"
  | "rect"
  | "blackout"
  | "image";

const TOOLS: { id: EditorTool; label: string; Icon: typeof Type }[] = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "text", label: "Add text", Icon: Type },
  { id: "draw", label: "Draw", Icon: Pencil },
  { id: "highlight", label: "Highlight", Icon: Highlighter },
  { id: "rect", label: "Shape", Icon: Square },
  { id: "blackout", label: "Black out", Icon: SquareSlash },
  { id: "image", label: "Image", Icon: ImagePlus },
];

export const COLORS = [
  { value: "#111827", label: "Black" },
  { value: "#dc2626", label: "Red" },
  { value: "#5b45e0", label: "Violet" },
  { value: "#0f9d66", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
];

export function AnnotateToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
}: {
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-2 shadow-card">
      <div role="toolbar" aria-label="Editing tools" className="flex flex-wrap items-center gap-1">
        {TOOLS.map(({ id, label, Icon }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              title={label}
              onClick={() => onToolChange(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5 pr-1">
        <span className="sr-only" id="colour-label">
          Colour
        </span>
        {COLORS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            aria-label={entry.label}
            aria-pressed={color === entry.value}
            title={entry.label}
            onClick={() => onColorChange(entry.value)}
            style={{ backgroundColor: entry.value }}
            className={cn(
              "size-6 rounded-full border-2 transition-transform",
              color === entry.value
                ? "scale-110 border-foreground"
                : "border-transparent hover:scale-105",
            )}
          />
        ))}
      </div>
    </div>
  );
}
