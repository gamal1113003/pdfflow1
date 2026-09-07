import { NextResponse, type NextRequest } from "next/server";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { convert, ConverterNotConfiguredError, isSupportedJob } from "@/lib/services/converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024 * 1024;

const ACCEPTED: Record<string, string[]> = {
  "pdf-to-word": ["application/pdf"],
  "pdf-to-excel": ["application/pdf"],
  "pdf-to-ppt": ["application/pdf"],
  "ocr-pdf": ["application/pdf"],
  "protect-pdf": ["application/pdf"],
  "unlock-pdf": ["application/pdf"],
  "word-to-pdf": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  "excel-to-pdf": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ],
  "ppt-to-pdf": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ],
};

/**
 * Temporary processing endpoint for the jobs a browser cannot do.
 *
 * The contract this route keeps: the uploaded file is written to a private
 * temporary directory, processed, returned, and deleted. The `finally` block
 * runs on success, on failure and on invalid input alike, so no upload
 * outlives the request. Nothing is written to a database or object store —
 * there is no code path here that persists a document.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ job: string }> },
) {
  const { job } = await context.params;

  if (!isSupportedJob(job)) {
    return NextResponse.json({ error: "Unknown conversion." }, { status: 404 });
  }

  let workDir: string | null = null;

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "That file is empty." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "This file exceeds the maximum supported size of 100 MB." },
        { status: 413 },
      );
    }

    const allowed = ACCEPTED[job] ?? [];
    if (allowed.length > 0 && !allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "That file type is not accepted by this tool." },
        { status: 415 },
      );
    }

    workDir = await mkdtemp(join(tmpdir(), "pdfflow-"));
    const inputPath = join(workDir, "input");
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    const result = await convert({
      job,
      inputPath,
      workDir,
      originalName: file.name,
      password: typeof form.get("password") === "string" ? String(form.get("password")) : undefined,
    });

    // Record that a tool ran. The slug and a timestamp, nothing else.
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
       if (user) {
  // Types collapse to never here; the RLS policy is the real guard.
  await supabase.from("usage").insert({ user_id: user.id, tool: job } as never);
}
      } catch {
        // Never fail a conversion because tracking failed.
      }
    }

    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ConverterNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return NextResponse.json(
      { error: "Something went wrong while processing your file." },
      { status: 500 },
    );
  } finally {
    // Runs on every path, including thrown errors, so the upload never lingers.
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
