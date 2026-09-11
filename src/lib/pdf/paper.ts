"use client";

import { PDFDocument } from "pdf-lib";
import { PdfError, savePdf } from "@/lib/pdf/document";

/**
 * A small page-drawing layer for documents built from a form.
 *
 * Text is drawn on a canvas rather than with pdf-lib's fonts. pdf-lib can only
 * embed the standard 14 fonts without a font file, and those cover Latin
 * characters only — a Russian invoice would come out as blanks. The browser's
 * own font engine handles every script it can display.
 *
 * The cost is that the result is an image: the finished document cannot be
 * searched or copied. For an invoice or a covering letter that is usually
 * acceptable, and it is stated in the interface rather than left as a
 * surprise.
 */

export const A4 = { width: 595.28, height: 841.89 };
const SCALE = 3; // 216 dpi: sharp when printed, still a sensible file size

export const FONT_STACK =
  '"Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Arabic", system-ui, sans-serif';

export type Align = "left" | "right" | "center";

export class Paper {
  private pages: HTMLCanvasElement[] = [];
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  /** Current vertical position, in points from the top. */
  y = 0;

  constructor(
    readonly margin = 48,
    readonly size = A4,
  ) {
    this.newPage();
  }

  get contentWidth() {
    return this.size.width - this.margin * 2;
  }

  get left() {
    return this.margin;
  }

  get right() {
    return this.size.width - this.margin;
  }

  newPage() {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(this.size.width * SCALE);
    canvas.height = Math.round(this.size.height * SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PdfError("Your browser could not draw the document.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(SCALE, SCALE);
    ctx.textBaseline = "top";

    this.pages.push(canvas);
    this.canvas = canvas;
    this.ctx = ctx;
    this.y = this.margin;
  }

  /** Starts a new page when the next block would not fit. */
  ensure(height: number) {
    if (this.y + height > this.size.height - this.margin) this.newPage();
  }

  private font(size: number, weight: "normal" | "bold" = "normal") {
    this.ctx.font = `${weight === "bold" ? "600 " : ""}${size}px ${FONT_STACK}`;
  }

  text(
    value: string,
    options: {
      size?: number;
      weight?: "normal" | "bold";
      color?: string;
      align?: Align;
      x?: number;
      y?: number;
    } = {},
  ) {
    const { size = 10, weight = "normal", color = "#111827", align = "left" } = options;
    this.font(size, weight);
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;

    const x = options.x ?? (align === "right" ? this.right : align === "center" ? this.size.width / 2 : this.left);
    const y = options.y ?? this.y;
    this.ctx.fillText(value, x, y);
    this.ctx.textAlign = "left";
    if (options.y === undefined) this.y += size * 1.45;
  }

  /** Wrapped paragraph. Returns the height used. */
  paragraph(
    value: string,
    options: { size?: number; color?: string; width?: number; lineHeight?: number } = {},
  ): number {
    const { size = 10, color = "#374151", lineHeight = 1.6 } = options;
    const width = options.width ?? this.contentWidth;
    this.font(size);
    this.ctx.fillStyle = color;

    const start = this.y;
    for (const block of value.replace(/\r\n/g, "\n").split("\n")) {
      if (!block.trim()) {
        this.y += size * lineHeight;
        continue;
      }
      let line = "";
      for (const word of block.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (this.ctx.measureText(candidate).width > width && line) {
          this.ensure(size * lineHeight);
          this.ctx.fillStyle = color;
          this.font(size);
          this.ctx.fillText(line, this.left, this.y);
          this.y += size * lineHeight;
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) {
        this.ensure(size * lineHeight);
        this.ctx.fillStyle = color;
        this.font(size);
        this.ctx.fillText(line, this.left, this.y);
        this.y += size * lineHeight;
      }
    }
    return this.y - start;
  }

  rule(options: { color?: string; y?: number } = {}) {
    const y = options.y ?? this.y;
    this.ctx.strokeStyle = options.color ?? "#e5e7eb";
    this.ctx.lineWidth = 0.75;
    this.ctx.beginPath();
    this.ctx.moveTo(this.left, y);
    this.ctx.lineTo(this.right, y);
    this.ctx.stroke();
    if (options.y === undefined) this.y += 10;
  }

  box(x: number, y: number, width: number, height: number, fill: string) {
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x, y, width, height);
  }

  async image(dataUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new PdfError("That image could not be read."));
      image.src = dataUrl;
    });
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    this.ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
  }

  gap(height: number) {
    this.y += height;
  }

  /** Turns the drawn pages into a PDF. */
  async toPdf(): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    for (const canvas of this.pages) {
      const embedded = await doc.embedJpg(canvas.toDataURL("image/jpeg", 0.94));
      const page = doc.addPage([this.size.width, this.size.height]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: this.size.width,
        height: this.size.height,
      });
    }
    doc.setProducer("orzix");
    return savePdf(doc);
  }

  /** The raw pages, for callers that need to merge with other documents. */
  get pageCanvases() {
    return this.pages;
  }
}
