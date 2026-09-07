import { NextResponse, type NextRequest } from "next/server";
import {
  isTranslationConfigured,
  translateTexts,
  TranslationNotConfiguredError,
} from "@/lib/services/translationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 40_000;

/**
 * Translates a batch of text. The text passes through this route and is
 * returned — it is never written to disk, logged, or stored in the database.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isTranslationConfigured()) {
      return NextResponse.json(
        { error: new TranslationNotConfiguredError().message },
        { status: 501 },
      );
    }

    const body = (await request.json()) as { texts?: unknown; target?: unknown };

    if (!Array.isArray(body.texts) || typeof body.target !== "string") {
      return NextResponse.json({ error: "Bad request." }, { status: 400 });
    }

    const texts = body.texts.filter((entry): entry is string => typeof entry === "string");
    const total = texts.reduce((sum, entry) => sum + entry.length, 0);

    if (total > MAX_CHARS) {
      return NextResponse.json(
        { error: "That is too much text for one request. Try a shorter document." },
        { status: 413 },
      );
    }

    const translations = await translateTexts(texts, body.target.toUpperCase());
    return NextResponse.json({ translations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TranslationNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Translation failed." },
      { status: 500 },
    );
  }
}
