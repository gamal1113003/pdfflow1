import { degrees, rgb, StandardFonts } from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";

export type WatermarkPosition = "diagonal" | "center" | "bottom-right" | "tile";

export type WatermarkOptions = {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  position: WatermarkPosition;
  pageNumbers?: number[];
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return rgb(0.4, 0.4, 0.45);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

export async function watermarkPdf(
  bytes: Uint8Array,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const text = options.text.trim();
  if (!text) throw new PdfError("Enter the text you want to stamp on each page.");

  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const color = hexToRgb(options.color);
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    if (options.pageNumbers && !options.pageNumbers.includes(index + 1)) return;
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    const draw = (x: number, y: number, rotation: number) =>
      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color,
        opacity: options.opacity,
        rotate: degrees(rotation),
      });

    switch (options.position) {
      case "center":
        draw((width - textWidth) / 2, (height - textHeight) / 2, 0);
        break;
      case "bottom-right":
        draw(width - textWidth - 36, 36, 0);
        break;
      case "tile": {
        const stepX = textWidth + 80;
        const stepY = textHeight + 90;
        for (let y = 40; y < height; y += stepY) {
          for (let x = 20; x < width; x += stepX) {
            draw(x, y, 0);
          }
        }
        break;
      }
      case "diagonal":
      default: {
        const angle = (options.rotation * Math.PI) / 180;
        const x = (width - textWidth * Math.cos(angle)) / 2;
        const y = (height - textWidth * Math.sin(angle)) / 2;
        draw(x, y, options.rotation);
      }
    }
  });

  doc.setProducer("PDFFlow");
  return savePdf(doc);
}
