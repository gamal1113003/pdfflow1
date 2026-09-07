"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Method = "draw" | "type" | "upload";

const METHODS: { id: Method; label: string }[] = [
  { id: "draw", label: "Draw" },
  { id: "type", label: "Type" },
  { id: "upload", label: "Upload" },
];

const TYPE_FONTS = [
  { id: "cursive", label: "Flowing", family: "'Segoe Script', 'Snell Roundhand', cursive" },
  { id: "serif", label: "Formal", family: "Georgia, 'Times New Roman', serif" },
  { id: "sans", label: "Plain", family: "Inter, system-ui, sans-serif" },
];

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const [method, setMethod] = useState<Method>("draw");
  const [typed, setTyped] = useState("");
  const [font, setFont] = useState(TYPE_FONTS[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  // Keep the drawing canvas sized to its container.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || method !== "draw") return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
  }, [method]);

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = pointerPosition(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function extendStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const { x, y } = pointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
    hasInk.current = true;
  }

  function endStroke() {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasInk.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange(null);
  }

  function renderTyped(value: string, family: string) {
    if (!value.trim()) {
      onChange(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 280;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font = `120px ${family}`;
    context.fillStyle = "#111827";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(value, canvas.width / 2, canvas.height / 2, canvas.width - 60);
    onChange(canvas.toDataURL("image/png"));
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(image, 0, 0);
        onChange(canvas.toDataURL("image/png"));
      }
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  return (
    <div>
      <div role="tablist" aria-label="Signature method" className="flex gap-1 rounded-full bg-muted p-1">
        {METHODS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={method === entry.id}
            onClick={() => {
              setMethod(entry.id);
              onChange(null);
            }}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              method === entry.id
                ? "bg-card text-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {method === "draw" && (
          <div>
            <canvas
              ref={canvasRef}
              onPointerDown={startStroke}
              onPointerMove={extendStroke}
              onPointerUp={endStroke}
              onPointerLeave={endStroke}
              className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-border bg-card"
              aria-label="Signature drawing area"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Sign with your mouse or finger.</p>
              <Button variant="ghost" size="sm" onClick={clearCanvas}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {method === "type" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="typed-signature">Your name</Label>
              <Input
                id="typed-signature"
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value);
                  renderTyped(event.target.value, font.family);
                }}
                placeholder="Alex Moreau"
                maxLength={40}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPE_FONTS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setFont(entry);
                    renderTyped(typed, entry.family);
                  }}
                  style={{ fontFamily: entry.family }}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-lg transition-colors",
                    font.id === entry.id
                      ? "border-primary bg-primary-soft/60"
                      : "border-border hover:border-foreground/20",
                  )}
                >
                  {typed.trim() || entry.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {method === "upload" && (
          <div className="space-y-2">
            <Label htmlFor="signature-file">Signature image</Label>
            <input
              id="signature-file"
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(event) => handleUpload(event.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-sm text-muted-foreground">
              A PNG with a transparent background looks best on the page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
