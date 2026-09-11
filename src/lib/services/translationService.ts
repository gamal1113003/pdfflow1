/**
 * Server-side translation. Text is sent to a provider, translated, and
 * returned — nothing is written to disk or to the database.
 *
 * Three providers are supported. Set one of:
 *
 *   LIBRETRANSLATE_URL=http://localhost:5000   free, open source, self-hosted
 *   DEEPL_API_KEY=...                          paid, best quality
 *   GOOGLE_TRANSLATE_API_KEY=...               paid, widest language coverage
 *
 * LibreTranslate needs no key when you run it yourself:
 *
 *   docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
 *
 * The first run downloads language models and takes a few minutes. After that
 * it works offline, costs nothing, and the text never leaves your machine.
 * Quality is below DeepL, but for reading a document it is usually enough.
 *
 * These are server-only variables. Do not prefix them with NEXT_PUBLIC_ —
 * that would ship your billable API key to every visitor's browser.
 */

export const TRANSLATE_LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "RU", label: "Русский" },
  { code: "AR", label: "العربية" },
  { code: "DE", label: "Deutsch" },
  { code: "ES", label: "Español" },
  { code: "FR", label: "Français" },
  { code: "IT", label: "Italiano" },
  { code: "PT", label: "Português" },
  { code: "PL", label: "Polski" },
  { code: "TR", label: "Türkçe" },
  { code: "UK", label: "Українська" },
  { code: "ZH", label: "中文" },
  { code: "JA", label: "日本語" },
] as const;

export class TranslationNotConfiguredError extends Error {
  constructor() {
    super(
      "Translation needs a provider API key, and none is connected to this deployment.",
    );
    this.name = "TranslationNotConfiguredError";
  }
}

const DEEPL_KEY = process.env.DEEPL_API_KEY ?? "";
const GOOGLE_KEY = process.env.GOOGLE_TRANSLATE_API_KEY ?? "";
const LIBRE_URL = process.env.LIBRETRANSLATE_URL ?? "";
const LIBRE_KEY = process.env.LIBRETRANSLATE_API_KEY ?? "";

export function isTranslationConfigured(): boolean {
  return DEEPL_KEY.length > 0 || GOOGLE_KEY.length > 0 || LIBRE_URL.length > 0;
}

/**
 * LibreTranslate takes one string per call and lowercase two-letter codes.
 * "auto" lets it detect the source language.
 */
async function translateWithLibre(texts: string[], target: string): Promise<string[]> {
  const endpoint = `${LIBRE_URL.replace(/\/$/, "")}/translate`;
  const out: string[] = [];

  for (const text of texts) {
    if (!text.trim()) {
      out.push("");
      continue;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: target.toLowerCase(),
        format: "text",
        ...(LIBRE_KEY ? { api_key: LIBRE_KEY } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        response.status === 400 && detail.includes("not supported")
          ? "LibreTranslate does not have a model for that language installed."
          : "LibreTranslate could not process this text. Check that it is running.",
      );
    }

    const data = (await response.json()) as { translatedText?: string };
    out.push(data.translatedText ?? "");
  }

  return out;
}

async function translateWithDeepL(texts: string[], target: string): Promise<string[]> {
  // Free keys end in ":fx" and use a different host.
  const host = DEEPL_KEY.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";

  const response = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: texts, target_lang: target }),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 456
        ? "The translation quota for this API key is used up."
        : "The translation provider rejected the request.",
    );
  }

  const data = (await response.json()) as { translations: { text: string }[] };
  return data.translations.map((entry) => entry.text);
}

async function translateWithGoogle(texts: string[], target: string): Promise<string[]> {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, target: target.toLowerCase(), format: "text" }),
    },
  );

  if (!response.ok) {
    throw new Error("The translation provider rejected the request.");
  }

  const data = (await response.json()) as {
    data: { translations: { translatedText: string }[] };
  };
  return data.data.translations.map((entry) => entry.translatedText);
}

export async function translateTexts(texts: string[], target: string): Promise<string[]> {
  if (!isTranslationConfigured()) throw new TranslationNotConfiguredError();
  if (texts.length === 0) return [];

  // Self-hosted first: it is free, so prefer it when available.
  if (LIBRE_URL) return translateWithLibre(texts, target);
  if (DEEPL_KEY) return translateWithDeepL(texts, target);
  return translateWithGoogle(texts, target);
}
