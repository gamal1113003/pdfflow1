/**
 * Prepares and builds the desktop version.
 *
 * The web app has parts a static build cannot include: API routes, middleware,
 * and pages that depend on a signed-in session. Rather than complicate the web
 * app with flags, this copies the project to a scratch directory, removes those
 * parts, and builds from there. The original is untouched.
 *
 *   node scripts/build-desktop.mjs
 */

import { cp, rm, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const root = process.cwd();
const work = path.join(root, ".desktop-build");

/**
 * Where the desktop app sends the jobs it cannot do locally. Set this to your
 * deployed backend before building, or those tools will report that no service
 * is connected:
 *
 *   set ORZIX_API_URL=https://your-backend.onrender.com   (Windows)
 *   ORZIX_API_URL=https://your-backend.onrender.com       (Mac/Linux)
 */
const API_URL = process.env.ORZIX_API_URL ?? "";

/**
 * Translation is the one server tool that cannot come along. It calls a Next
 * API route for batches of text, and a static export has no API routes. The
 * others speak to the backend directly and work unchanged.
 */
const REMOVED_TOOLS = ["translate-pdf"];

/** Pages that only make sense with a backend. */
const SERVER_PAGES = [
  "api",
  "auth",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "dashboard",
  "profile",
];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function removeIfPresent(target) {
  if (await exists(target)) await rm(target, { recursive: true, force: true });
}

async function main() {
  console.log("Preparing a trimmed copy…");
  await removeIfPresent(work);
  await mkdir(work, { recursive: true });

  for (const entry of ["src", "public", "package.json", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs"]) {
    await cp(path.join(root, entry), path.join(work, entry), { recursive: true });
  }
  await cp(path.join(root, "next.config.desktop.mjs"), path.join(work, "next.config.mjs"));

  // Remove everything that needs a server.
  for (const page of SERVER_PAGES) {
    await removeIfPresent(path.join(work, "src/app", page));
    await removeIfPresent(path.join(work, "src/app/ru", page));
  }
  await removeIfPresent(path.join(work, "src/middleware.ts"));

  // robots.txt and sitemap.xml exist for search engines. A static export
  // cannot generate them, and an offline app has no use for them.
  await removeIfPresent(path.join(work, "src/app/robots.ts"));
  await removeIfPresent(path.join(work, "src/app/sitemap.ts"));
  await removeIfPresent(path.join(work, "src/lib/supabase"));
  await removeIfPresent(path.join(work, "src/lib/auth"));
  await removeIfPresent(path.join(work, "src/components/auth"));

  // Usage tracking writes to the database, which the desktop build has no
  // connection to. The component is replaced with an inert one rather than
  // deleted, so ToolWorkspace does not need editing.
  await writeFile(
    path.join(work, "src/components/tools/TrackToolUsage.tsx"),
    `"use client";

/** Nothing is tracked in the desktop build; there is no database to write to. */
export function TrackToolUsage(_props: { slug: string }) {
  return null;
}
`,
  );

  // Analytics is a hosting feature and has no meaning offline.
  const layoutPath = path.join(work, "src/app/layout.tsx");
  let layout = await readFile(layoutPath, "utf8");
  layout = layout
    .replace(/^import \{ Analytics \} from "@vercel\/analytics\/next";\n/m, "")
    .replace(/\s*<Analytics \/>/g, "");
  await writeFile(layoutPath, layout);

  for (const slug of REMOVED_TOOLS) {
    await removeIfPresent(path.join(work, "src/app/(tools)", slug));
    await removeIfPresent(path.join(work, "src/app/ru/(tools)", slug));
  }

  const registryPath = path.join(work, "src/lib/tools.ts");
  let registry = await readFile(registryPath, "utf8");
  registry = registry.replace(
    "export const toolBySlug",
    `// Translation needs an API route the desktop build does not have.
const REMOVED = new Set(${JSON.stringify(REMOVED_TOOLS)});
for (let i = tools.length - 1; i >= 0; i--) {
  if (REMOVED.has(tools[i].slug)) tools.splice(i, 1);
}

export const toolBySlug`,
  );
  await writeFile(registryPath, registry);

  // Point the server-side tools at the deployed backend. Without a value they
  // still appear, and say plainly that no service is connected.
  await writeFile(
    path.join(work, ".env.production"),
    `NEXT_PUBLIC_PDF_API_URL=${API_URL}\nNEXT_PUBLIC_SITE_URL=http://127.0.0.1\n`,
  );
  if (!API_URL) {
    console.warn(
      "  ORZIX_API_URL is not set — Office conversion, OCR and password tools will report no service.",
    );
  }

  // /tools reads ?category= on the server, which a static export cannot do.
  // In the desktop build the filter simply starts on "All tools"; the buttons
  // still work, they just are not preselected from the URL.
  for (const dir of ["src/app/tools", "src/app/ru/tools"]) {
    const page = path.join(work, dir, "page.tsx");
    if (!(await exists(page))) continue;
    const locale = dir.includes("/ru/") ? '"ru"' : '"en"';
    const meta = dir.includes("/ru/")
      ? `title: "Все инструменты для PDF | orzix",\n    description: "Полный набор инструментов для работы с PDF на вашем устройстве.",`
      : `title: "All PDF tools | orzix",\n    description: "Every tool in one place, running on your device.",`;
    await writeFile(
      page,
      `import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolsExplorer } from "@/components/tools/ToolsExplorer";
import { ToolsHeading } from "@/components/tools/ToolsHeading";
import { pageMetadata } from "@/lib/seo";
import { tools } from "@/lib/tools";

export const metadata: Metadata = pageMetadata({
  ${meta}
  path: "/tools",
  locale: ${locale},
});

export default function ToolsPage() {
  return (
    <div className="container py-14 sm:py-16">
      <ToolsHeading count={tools.length} />
      <div className="mt-12">
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <ToolsExplorer />
        </Suspense>
      </div>
    </div>
  );
}
`,
    );
  }

  // A desktop window is smaller than a browser on a monitor, and there is no
  // reason to scroll past tall cards to reach a tool. The compact layout is
  // used here only; the website keeps the fuller cards.
  const explorerPath = path.join(work, "src/components/tools/ToolsExplorer.tsx");
  let explorer = await readFile(explorerPath, "utf8");
  explorer = explorer
    .replace(
      'className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"',
      'className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"',
    )
    .replace("<ToolCard key={tool.slug} tool={tool} />", "<ToolCard key={tool.slug} tool={tool} compact />");
  await writeFile(explorerPath, explorer);

  const homePath = path.join(work, "src/app/page.tsx");
  let home = await readFile(homePath, "utf8");
  home = home.replace("<ToolGrid tools={tools} />", "<ToolGrid tools={tools} compact />");
  await writeFile(homePath, home);

  // The header links to pages that no longer exist.
  const headerPath = path.join(work, "src/components/site/Header.tsx");
  let header = await readFile(headerPath, "utf8");
  header = header
    .replace(/\s*<Button asChild variant="ghost" size="sm">\s*<Link href=\{pathFor\(language, "\/login"\)\}>Log in<\/Link>\s*<\/Button>/g, "")
    .replace(/<Link href=\{pathFor\(language, "\/signup"\)\}>/g, '<Link href={pathFor(language, "/tools")}>');
  await writeFile(headerPath, header);

  const footerPath = path.join(work, "src/components/site/Footer.tsx");
  let footer = await readFile(footerPath, "utf8");
  footer = footer.replace(/\{ label: t\.footer\.contact, href: "\/contact" \},\s*/g, "");
  await writeFile(footerPath, footer);

  console.log("Installing dependencies…");
  await run("npm", ["install", "--no-audit", "--no-fund"], { cwd: work, shell: true });

  console.log("Building…");
  await run("npx", ["next", "build"], { cwd: work, shell: true, maxBuffer: 1024 * 1024 * 32 });

  console.log("Copying the export into desktop/app…");
  const outDir = path.join(root, "desktop", "app");
  await removeIfPresent(outDir);
  await cp(path.join(work, "out"), outDir, { recursive: true });

  console.log("Done. Run: npm run desktop:start");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
