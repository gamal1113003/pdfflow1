"use client";

import { PDFDocument } from "pdf-lib";
import { loadPdf, savePdf } from "@/lib/pdf/document";
import { Paper } from "@/lib/pdf/paper";
import { ingestAsPdf } from "@/lib/pdf/ingest";

export type JobApplication = {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  position: string;
  company: string;
  companyAddress: string;
  date: string;
  reference: string;
  letter: string;
  language: "en" | "ru";
};

const LABELS = {
  en: {
    subject: "Application for",
    reference: "Reference",
    attachments: "Attached documents",
    sincerely: "Yours sincerely,",
  },
  ru: {
    subject: "Заявление на должность",
    reference: "Ссылка",
    attachments: "Приложения",
    sincerely: "С уважением,",
  },
} as const;

/**
 * Builds a covering letter and appends the supporting documents behind it.
 *
 * A job application is usually a letter plus a CV plus certificates, and the
 * person at the other end wants one file. Attachments are converted to PDF
 * first, so a photographed certificate or a Word CV can be included as they
 * are.
 */
export async function buildApplicationPdf(
  application: JobApplication,
  attachments: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const t = LABELS[application.language];
  const paper = new Paper(56);

  // --- Sender, top right ---
  let y = paper.y;
  for (const line of [
    application.fullName,
    application.address,
    application.phone,
    application.email,
  ]) {
    if (!line) continue;
    paper.text(line, {
      size: 9.5,
      color: line === application.fullName ? "#111827" : "#374151",
      weight: line === application.fullName ? "bold" : "normal",
      align: "right",
      y,
    });
    y += 14;
  }

  // --- Recipient, left, below the sender block ---
  paper.y = y + 24;
  for (const line of [application.company, application.companyAddress]) {
    if (!line) continue;
    paper.text(line, { size: 10, color: "#111827" });
  }

  if (application.date) {
    paper.gap(18);
    paper.text(application.date, { size: 9.5, color: "#6b7280", align: "right", y: paper.y });
  }

  paper.gap(26);

  if (application.position) {
    paper.text(`${t.subject}: ${application.position}`, { size: 12, weight: "bold" });
    paper.gap(4);
  }
  if (application.reference) {
    paper.text(`${t.reference}: ${application.reference}`, { size: 9.5, color: "#6b7280" });
    paper.gap(4);
  }

  paper.gap(12);
  paper.paragraph(application.letter, { size: 10.5, lineHeight: 1.7 });

  paper.gap(24);
  paper.text(t.sincerely, { size: 10, color: "#374151" });
  paper.gap(10);
  paper.text(application.fullName, { size: 10.5, weight: "bold" });

  if (attachments.length > 0) {
    paper.gap(26);
    paper.ensure(40 + attachments.length * 15);
    paper.text(`${t.attachments}:`, { size: 9.5, weight: "bold" });
    paper.gap(2);
    attachments.forEach((file, index) => {
      paper.text(`${index + 1}.  ${file.name}`, { size: 9.5, color: "#374151" });
    });
  }

  const letterBytes = await paper.toPdf();

  if (attachments.length === 0) return letterBytes;

  // --- Append the attachments ---
  const output = await PDFDocument.create();
  const letter = await loadPdf(letterBytes);
  const letterPages = await output.copyPages(letter, letter.getPageIndices());
  letterPages.forEach((page) => output.addPage(page));

  for (const [index, file] of attachments.entries()) {
    const ingested = await ingestAsPdf(file);
    const attachment = await loadPdf(ingested.bytes);
    const pages = await output.copyPages(attachment, attachment.getPageIndices());
    pages.forEach((page) => output.addPage(page));
    onProgress?.(index + 1, attachments.length);
  }

  output.setProducer("orzix");
  return savePdf(output);
}
