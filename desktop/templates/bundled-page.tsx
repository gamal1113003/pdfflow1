"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

type Capabilities = { qpdf: boolean; tesseract: boolean; libreoffice: boolean };

/**
 * Shown in the desktop app only. Two jobs: tell the person honestly whether
 * this installation really works offline, and carry the licence notices that
 * redistributing LibreOffice, Tesseract and qpdf requires.
 */
const PROGRAMS = [
  {
    key: "libreoffice" as const,
    name: "LibreOffice",
    powers: "Word, Excel and PowerPoint conversion, both directions",
    licence: "Mozilla Public License 2.0",
    site: "https://www.libreoffice.org",
  },
  {
    key: "tesseract" as const,
    name: "Tesseract OCR",
    powers: "Reading text from scanned pages",
    licence: "Apache License 2.0",
    site: "https://github.com/tesseract-ocr/tesseract",
  },
  {
    key: "qpdf" as const,
    name: "qpdf",
    powers: "Adding and removing PDF passwords",
    licence: "Apache License 2.0",
    site: "https://qpdf.sourceforge.io",
  },
];

export default function BundledPage() {
  const [caps, setCaps] = useState<Capabilities | null>(null);

  useEffect(() => {
    fetch("/api/capabilities")
      .then((response) => response.json())
      .then(setCaps)
      .catch(() => setCaps({ qpdf: false, tesseract: false, libreoffice: false }));
  }, []);

  return (
    <div className="container py-14">
      <h1 className="font-display text-display-md font-semibold">What is inside</h1>
      <p className="mt-4 max-w-[62ch] leading-relaxed text-muted-foreground">
        Most tools are built into the application itself and have always worked
        without a connection. The three programs below handle the jobs that need
        more than a browser can do. Where one is missing, the tools it powers
        say so rather than failing quietly.
      </p>

      <ul className="mt-10 space-y-4">
        {PROGRAMS.map((program) => {
          const present = caps?.[program.key];
          return (
            <li key={program.key} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span
                className={
                  present
                    ? "grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success"
                    : "grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                }
              >
                {present ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="font-display text-[1.05rem] font-semibold">
                  {program.name}{" "}
                  <span className="font-sans text-sm font-normal text-muted-foreground">
                    {caps === null ? "checking…" : present ? "included" : "not included"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{program.powers}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {program.licence} · {program.site}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        These programs are separate works, redistributed unmodified under their
        own licences. Their full licence texts are included with the
        installation.
      </p>
    </div>
  );
}
