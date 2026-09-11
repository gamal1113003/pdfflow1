"use client";

import { A4, Paper } from "@/lib/pdf/paper";

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  /** Per cent. */
  discount: number;
  /** Per cent. */
  tax: number;
};

export type Party = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
};

export type Invoice = {
  seller: Party;
  buyer: Party;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentDetails: string;
  notes: string;
  lines: InvoiceLine[];
  logoDataUrl?: string;
  language: "en" | "ru";
};

const LABELS = {
  en: {
    invoice: "INVOICE",
    billTo: "Bill to",
    paymentDetails: "Payment details",
    number: "Invoice No.",
    issued: "Issue date",
    due: "Due date",
    item: "Item",
    quantity: "Qty",
    price: "Price",
    discount: "Disc.",
    tax: "Tax",
    lineTotal: "Total",
    subtotal: "Subtotal",
    taxTotal: "Tax",
    total: "Total",
    notes: "Notes",
    page: "Page",
  },
  ru: {
    invoice: "СЧЁТ",
    billTo: "Получатель",
    paymentDetails: "Платёжные данные",
    number: "Счёт №",
    issued: "Дата выставления",
    due: "Срок оплаты",
    item: "Наименование",
    quantity: "Кол-во",
    price: "Цена",
    discount: "Скидка",
    tax: "НДС",
    lineTotal: "Сумма",
    subtotal: "Итого без НДС",
    taxTotal: "НДС",
    total: "Всего",
    notes: "Примечания",
    page: "Страница",
  },
} as const;

/** Money is handled in whole minor units to avoid floating point drift. */
export function lineNet(line: InvoiceLine): number {
  const gross = line.quantity * line.price;
  return gross - (gross * line.discount) / 100;
}

export function lineTax(line: InvoiceLine): number {
  return (lineNet(line) * line.tax) / 100;
}

export function invoiceTotals(lines: InvoiceLine[]) {
  const net = lines.reduce((sum, line) => sum + lineNet(line), 0);
  const tax = lines.reduce((sum, line) => sum + lineTax(line), 0);
  return { net, tax, total: net + tax };
}

export function formatMoney(value: number, currency: string, language: "en" | "ru"): string {
  try {
    return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export async function buildInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const t = LABELS[invoice.language];
  const paper = new Paper(48);
  const money = (value: number) => formatMoney(value, invoice.currency, invoice.language);

  // --- Header: logo and seller on the left, payment details on the right ---
  const headerTop = paper.y;

  if (invoice.logoDataUrl) {
    await paper.image(invoice.logoDataUrl, paper.left, headerTop, 120, 60);
  }

  const sellerX = invoice.logoDataUrl ? paper.left + 136 : paper.left;
  let y = headerTop;
  paper.text(invoice.seller.name, { size: 15, weight: "bold", x: sellerX, y });
  y += 21;
  for (const line of [
    invoice.seller.address,
    invoice.seller.phone,
    [invoice.seller.website, invoice.seller.email].filter(Boolean).join("  |  "),
  ]) {
    if (!line) continue;
    paper.text(line, { size: 9.5, color: "#374151", x: sellerX, y });
    y += 14;
  }

  if (invoice.paymentDetails.trim()) {
    let rightY = headerTop;
    paper.text(`${t.paymentDetails}:`, { size: 9.5, weight: "bold", align: "right", y: rightY });
    rightY += 15;
    for (const line of invoice.paymentDetails.split("\n").filter(Boolean)) {
      paper.text(line, { size: 9.5, color: "#374151", align: "right", y: rightY });
      rightY += 14;
    }
    y = Math.max(y, rightY);
  }

  paper.y = Math.max(y, headerTop + (invoice.logoDataUrl ? 72 : 0)) + 14;
  paper.rule();
  paper.gap(12);

  // --- Buyer on the left, invoice details on the right ---
  const detailsTop = paper.y;
  paper.text(`${t.billTo}:`, { size: 9.5, weight: "bold", y: detailsTop });
  let buyerY = detailsTop + 16;
  for (const line of [
    invoice.buyer.name,
    invoice.buyer.address,
    invoice.buyer.phone,
    invoice.buyer.email,
  ]) {
    if (!line) continue;
    paper.text(line, { size: 9.5, color: "#374151", y: buyerY });
    buyerY += 14;
  }

  let metaY = detailsTop;
  const meta: [string, string][] = [
    [t.number, invoice.number],
    [t.issued, invoice.issueDate],
    [t.due, invoice.dueDate],
  ];
  for (const [label, value] of meta) {
    if (!value) continue;
    paper.text(`${label}:`, { size: 9.5, color: "#6b7280", x: paper.right - 150, y: metaY });
    paper.text(value, { size: 9.5, weight: "bold", align: "right", y: metaY });
    metaY += 15;
  }

  paper.y = Math.max(buyerY, metaY) + 20;

  // --- Title and line items ---
  paper.text(t.invoice, { size: 17, weight: "bold" });
  paper.gap(8);

  const columns = [
    { key: "item", width: paper.contentWidth - 250, align: "left" as const },
    { key: "quantity", width: 45, align: "right" as const },
    { key: "price", width: 75, align: "right" as const },
    { key: "discount", width: 45, align: "right" as const },
    { key: "tax", width: 40, align: "right" as const },
    { key: "lineTotal", width: 85, align: "right" as const },
  ];

  const drawHeader = () => {
    paper.box(paper.left, paper.y - 4, paper.contentWidth, 22, "#f3f4f6");
    let x = paper.left + 6;
    for (const column of columns) {
      paper.text(t[column.key as keyof typeof t], {
        size: 9,
        weight: "bold",
        x: column.align === "right" ? x + column.width - 12 : x,
        y: paper.y + 2,
        align: column.align,
      });
      x += column.width;
    }
    paper.y += 24;
  };

  drawHeader();

  invoice.lines.forEach((line, index) => {
    if (!line.description.trim() && line.quantity === 0) return;
    paper.ensure(26);
    if (paper.y === paper.margin) drawHeader();

    const values = [
      `${index + 1}.  ${line.description}`,
      String(line.quantity),
      money(line.price),
      `${line.discount}%`,
      `${line.tax}%`,
      money(lineNet(line) + lineTax(line)),
    ];

    let x = paper.left + 6;
    values.forEach((value, column) => {
      const spec = columns[column];
      paper.text(value, {
        size: 9.5,
        color: column === 0 ? "#111827" : "#374151",
        x: spec.align === "right" ? x + spec.width - 12 : x,
        y: paper.y,
        align: spec.align,
      });
      x += spec.width;
    });

    paper.y += 18;
    paper.rule({ color: "#f3f4f6" });
    paper.y -= 4;
  });

  // --- Totals, right aligned ---
  paper.gap(16);
  const totals = invoiceTotals(invoice.lines);
  const rows: [string, string, boolean][] = [
    [t.subtotal, money(totals.net), false],
    [t.taxTotal, money(totals.tax), false],
    [t.total, money(totals.total), true],
  ];

  for (const [label, value, strong] of rows) {
    paper.ensure(22);
    if (strong) {
      paper.rule({ color: "#111827" });
      paper.gap(2);
    }
    paper.text(`${label}:`, {
      size: strong ? 11 : 9.5,
      weight: strong ? "bold" : "normal",
      color: strong ? "#111827" : "#6b7280",
      x: paper.right - 200,
      y: paper.y,
    });
    paper.text(value, {
      size: strong ? 11 : 9.5,
      weight: strong ? "bold" : "normal",
      align: "right",
      y: paper.y,
    });
    paper.y += strong ? 22 : 17;
  }

  if (invoice.notes.trim()) {
    paper.gap(20);
    paper.ensure(60);
    paper.text(`${t.notes}:`, { size: 9.5, weight: "bold" });
    paper.gap(2);
    paper.paragraph(invoice.notes, { size: 9.5 });
  }

  return paper.toPdf();
}

export const CURRENCIES = ["EUR", "USD", "GBP", "RUB", "AED", "SAR", "EGP", "TRY", "PLN", "UAH"];

export { A4 };
