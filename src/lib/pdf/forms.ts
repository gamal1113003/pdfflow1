"use client";

import {
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";
import { loadPdf, PdfError, savePdf } from "@/lib/pdf/document";

/**
 * Reading and filling interactive form fields.
 *
 * A PDF form is a set of named widgets stored alongside the page content —
 * AcroForm fields. Filling one properly means writing to those fields, so the
 * values stay editable and a machine reading the form can find them. Drawing
 * text on top of the page instead would look right and be useless to anything
 * that processes the document.
 */

export type FieldKind = "text" | "checkbox" | "radio" | "dropdown" | "list";

export type FormField = {
  name: string;
  kind: FieldKind;
  value: string;
  /** For radio groups, dropdowns and lists. */
  options?: string[];
  readOnly: boolean;
  multiline: boolean;
  maxLength?: number;
};

export async function readForm(bytes: Uint8Array): Promise<FormField[]> {
  const doc = await loadPdf(bytes);
  let form;
  try {
    form = doc.getForm();
  } catch {
    throw new PdfError("This document has no interactive form fields.");
  }

  const fields = form.getFields();
  if (fields.length === 0) {
    throw new PdfError(
      "This document has no fillable fields. It may be a form that was printed and scanned — in which case Annotate PDF lets you write on it directly.",
    );
  }

  return fields.map((field): FormField => {
    const name = field.getName();
    const readOnly = field.isReadOnly();

    if (field instanceof PDFTextField) {
      return {
        name,
        kind: "text",
        value: field.getText() ?? "",
        readOnly,
        multiline: field.isMultiline(),
        maxLength: field.getMaxLength(),
      };
    }
    if (field instanceof PDFCheckBox) {
      return { name, kind: "checkbox", value: field.isChecked() ? "on" : "", readOnly, multiline: false };
    }
    if (field instanceof PDFRadioGroup) {
      return {
        name,
        kind: "radio",
        value: field.getSelected() ?? "",
        options: field.getOptions(),
        readOnly,
        multiline: false,
      };
    }
    if (field instanceof PDFDropdown) {
      return {
        name,
        kind: "dropdown",
        value: field.getSelected()[0] ?? "",
        options: field.getOptions(),
        readOnly,
        multiline: false,
      };
    }
    if (field instanceof PDFOptionList) {
      return {
        name,
        kind: "list",
        value: field.getSelected()[0] ?? "",
        options: field.getOptions(),
        readOnly,
        multiline: false,
      };
    }

    return { name, kind: "text", value: "", readOnly: true, multiline: false };
  });
}

/** Characters the standard PDF fonts cannot represent. */
const NON_LATIN = /[^\u0000-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014\u2026]/;

export function unsupportedCharacters(values: Record<string, string>): string[] {
  return Object.entries(values)
    .filter(([, value]) => NON_LATIN.test(value))
    .map(([name]) => name);
}

export async function fillForm(
  bytes: Uint8Array,
  values: Record<string, string>,
  flatten: boolean,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const form = doc.getForm();

  for (const [name, value] of Object.entries(values)) {
    let field;
    try {
      field = form.getField(name);
    } catch {
      continue; // A field that has gone is skipped rather than failing the lot.
    }
    if (field.isReadOnly()) continue;

    try {
      if (field instanceof PDFTextField) {
        field.setText(value);
      } else if (field instanceof PDFCheckBox) {
        if (value) field.check();
        else field.uncheck();
      } else if (field instanceof PDFRadioGroup) {
        if (value) field.select(value);
      } else if (field instanceof PDFDropdown) {
        if (value) field.select(value);
      } else if (field instanceof PDFOptionList) {
        if (value) field.select(value);
      }
    } catch (cause) {
      // The usual cause is a character the built-in font cannot encode.
      throw new PdfError(
        `“${name}” could not be filled: ${
          cause instanceof Error ? cause.message : "unsupported value"
        }`,
      );
    }
  }

  try {
    // Redraws each widget so the values appear when the file is opened. Without
    // this, some readers show the fields empty until they are clicked.
    form.updateFieldAppearances();
  } catch {
    // Fails when a value contains characters the standard fonts cannot draw.
    // The values are still stored correctly, so this is not fatal.
  }

  if (flatten) {
    // Turns the filled fields into ordinary page content: no longer editable,
    // and it looks the same everywhere.
    form.flatten();
  }

  doc.setProducer("orzix");
  return savePdf(doc);
}
