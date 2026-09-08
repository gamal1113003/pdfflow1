"use client";

import { useEffect, useState } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import { FileUploader } from "@/components/pdf/FileUploader";
import { FileSummary } from "@/components/pdf/FileSummary";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice, InfoNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { PDFPageGrid, type PageAction } from "@/components/pdf/PDFPageGrid";
import { usePdfPages } from "@/components/pdf/usePdfPages";
import { Button } from "@/components/ui/button";
import { WidgetStack } from "@/components/widgets/WidgetShell";
import { useSinglePdf } from "@/components/widgets/useSinglePdf";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import { applyPagePlan, planFromPageCount, type PagePlan } from "@/lib/pdf/organize";
import type { Tool } from "@/lib/tools";
import { formatBytes, moveItem, uid, withSuffix } from "@/lib/utils";
import { ACCEPTED_INPUT } from "@/lib/pdf/ingest";

type Mode = "rotate" | "delete" | "extract" | "reorder" | "edit";

const MODE_COPY: Record<
  Mode,
  { actions: PageAction[]; selectable: boolean; cta: string; title: string; hint: string; suffix: string }
> = {
  rotate: {
    actions: ["rotate"],
    selectable: true,
    cta: "Save rotated PDF",
    title: "Rotate the pages you need",
    hint: "Rotate a single page with its button, or select pages and rotate them together.",
    suffix: "rotated",
  },
  delete: {
    actions: ["delete"],
    selectable: true,
    cta: "Delete selected pages",
    title: "Pick the pages to remove",
    hint: "Select the pages you want to remove, or delete them one at a time.",
    suffix: "trimmed",
  },
  extract: {
    actions: [],
    selectable: true,
    cta: "Extract selected pages",
    title: "Pick the pages to keep",
    hint: "Select the pages you want to keep. Everything else is left out of the new file.",
    suffix: "extracted",
  },
  reorder: {
    actions: ["move"],
    selectable: false,
    cta: "Save reordered PDF",
    title: "Drag pages into order",
    hint: "Drag pages into the order you want, or use the arrow buttons for keyboard access.",
    suffix: "reordered",
  },
  edit: {
    actions: ["move", "rotate", "duplicate", "delete"],
    selectable: true,
    cta: "Save PDF",
    title: "Edit the page layout",
    hint: "Reorder, rotate, duplicate or delete pages. Nothing is saved until you download.",
    suffix: "edited",
  },
};

export function OrganizeWidget({ tool }: { tool: Tool }) {
  const mode: Mode = (tool.config?.mode as Mode | undefined) ?? "edit";
  const copy = MODE_COPY[mode];

  const { pdf, loading, error, setError, load, clear } = useSinglePdf();
  const [plan, setPlan] = useState<PagePlan[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const { thumbnails, rendered, error: previewError } = usePdfPages(pdf?.bytes ?? null);

  async function handleFiles(files: File[]) {
    setResult(null);
    setSelected(new Set());
    await load(files);
  }

  // Build a fresh page plan whenever a new document is loaded.
  useEffect(() => {
    setPlan(pdf ? planFromPageCount(pdf.pageCount) : []);
    setSelected(new Set());
  }, [pdf]);

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function rotate(ids: string[], amount = 90) {
    setPlan((current) =>
      current.map((page) =>
        ids.includes(page.id) ? { ...page, rotation: (page.rotation + amount) % 360 } : page,
      ),
    );
  }

  function remove(ids: string[]) {
    setPlan((current) => {
      const next = current.filter((page) => !ids.includes(page.id));
      return next.length > 0 ? next : current;
    });
    setSelected(new Set());
  }

  function duplicate(id: string) {
    setPlan((current) => {
      const index = current.findIndex((page) => page.id === id);
      if (index < 0) return current;
      const copyPage = { ...current[index], id: uid() };
      return [...current.slice(0, index + 1), copyPage, ...current.slice(index + 1)];
    });
  }

  async function run() {
    if (!pdf) return;
    const finalPlan =
      mode === "extract"
        ? plan.filter((page) => selected.has(page.id))
        : mode === "delete" && selected.size > 0
          ? plan.filter((page) => !selected.has(page.id))
          : plan;

    if (finalPlan.length === 0) {
      setError(
        mode === "extract"
          ? "Select at least one page to extract."
          : "A PDF needs at least one page. Keep one page and try again.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      setResult(await applyPagePlan(pdf.bytes, finalPlan));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong while saving your PDF. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setPlan([]);
    setSelected(new Set());
    clear();
  }

  if (result && pdf) {
    const fileName = withSuffix(pdf.displayName, copy.suffix);
    return (
      <DownloadResult
        fileName={fileName}
        stats={[
          { label: "Pages before", value: String(pdf.pageCount) },
          {
            label: "Pages now",
            value: String(
              mode === "extract"
                ? selected.size
                : mode === "delete" && selected.size > 0
                  ? plan.length - selected.size
                  : plan.length,
            ),
          },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={reset}
        onDelete={reset}
      />
    );
  }

  const selectedIds = [...selected];

  return (
    <WidgetStack>
      {!pdf ? (
        <FileUploader extensions={ACCEPTED_INPUT} disabled={loading} busy={loading} onFiles={handleFiles} />
      ) : (
        <>
          <FileSummary
            fileName={pdf.file.name}
            size={pdf.bytes.byteLength}
            pageCount={plan.length}
            onRemove={busy ? undefined : reset}
          />

          <InfoNotice title={copy.title}>{copy.hint}</InfoNotice>

          {copy.selectable && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelected(new Set(plan.map((page) => page.id)))}
              >
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear selection
              </Button>
              {mode !== "extract" && (
                <>
                  <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                  {(mode === "rotate" || mode === "edit") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={selected.size === 0}
                      onClick={() => rotate(selectedIds)}
                    >
                      <RotateCw aria-hidden="true" />
                      Rotate selected
                    </Button>
                  )}
                  {(mode === "delete" || mode === "edit") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={selected.size === 0}
                      onClick={() => remove(selectedIds)}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete selected
                    </Button>
                  )}
                </>
              )}
              <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
                {selected.size} selected
              </span>
            </div>
          )}

          {rendered < plan.length && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Rendering previews… {rendered} of {pdf.pageCount}
            </p>
          )}

          <PDFPageGrid
            plan={plan}
            thumbnails={thumbnails}
            actions={copy.actions}
            selectable={copy.selectable}
            selected={selected}
            onToggleSelect={toggleSelect}
            onRotate={(id) => rotate([id])}
            onDelete={(id) => remove([id])}
            onDuplicate={duplicate}
            onMove={(from, to) => setPlan((current) => moveItem(current, from, to))}
          />

          {busy ? (
            <ProcessingProgress label="Saving your PDF" value={null} />
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={run}>
              {copy.cta}
            </Button>
          )}
        </>
      )}

      {(error || previewError) && (
        <ErrorNotice title="Something went wrong" message={error ?? previewError ?? ""} />
      )}
    </WidgetStack>
  );
}
