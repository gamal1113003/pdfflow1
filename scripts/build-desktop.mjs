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

/** Matches the folder layout used by desktop/native. */
function platformDir() {
  return `${process.platform}-${process.arch}`;
}
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
  // Match any @vercel/* import and its component, whatever the exact path or
  // spacing. The earlier version matched one exact string and quietly missed
  // it, leaving an analytics script running inside an offline application.
  layout = layout
    .replace(/^\s*import\s+\{[^}]*\}\s+from\s+["']@vercel\/[^"']+["'];?\s*$/gm, "")
    .replace(/\s*<(Analytics|SpeedInsights)\s*\/>/g, "");
  await writeFile(layoutPath, layout);

  for (const slug of REMOVED_TOOLS) {
    await removeIfPresent(path.join(work, "src/app/(tools)", slug));
    await removeIfPresent(path.join(work, "src/app/ru/(tools)", slug));
  }

  const registryPath = path.join(work, "src/lib/tools.ts");
  let registry = await readFile(registryPath, "utf8");

  // OCR is done differently here: the page rasterises with PDF.js and the
  // application runs Tesseract on each image. Tesseract cannot read a PDF at
  // all, so the shared backend widget would fail on the first page.
  registry = registry.replace(
    /(slug: "ocr-pdf",[\s\S]*?)widget: "backend"/,
    '$1widget: "ocr-local"',
  );

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

  // Left empty on purpose. pdfService then posts to /api/process, which the
  // app answers itself using the bundled programs — same origin, no CORS, and
  // no network. ORZIX_API_URL is only a fallback for tools that were not
  // bundled, and is read by the Electron process rather than the page.
  // Set explicitly rather than left empty, so there is no doubt where the
  // conversions go: to this application, on this machine.
  await writeFile(
    path.join(work, ".env.production"),
    `NEXT_PUBLIC_PDF_API_URL=/api/process\nNEXT_PUBLIC_SITE_URL=http://127.0.0.1\n`,
  );
  if (API_URL) {
    console.log(`  Fallback backend for missing tools: ${API_URL}`);
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

  // The desktop home screen is the tool list. The upload box, the two call to
  // action buttons and the "how it works" steps all exist to explain a website
  // to someone who has just arrived. Someone who has installed an application
  // has already decided; putting a picker in front of the tools is a step in
  // the way.
  for (const [file, heading, sub] of [
    ["src/app/page.tsx", "Everything you need to work with PDFs.", "Everything runs on this computer. No account, no upload."],
    ["src/app/ru/page.tsx", "Всё, что нужно для работы с PDF.", "Всё работает на этом компьютере. Без аккаунта и без загрузки в интернет."],
  ]) {
    const target = path.join(work, file);
    if (!(await exists(target))) continue;
    const isRu = file.includes("/ru/");
    await writeFile(
      target,
      `import { ToolGrid } from "@/components/tools/ToolGrid";
import { tools } from "@/lib/tools";

export default function ${isRu ? "RuHome" : "Home"}Page() {
  return (
    <div className="container py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md font-semibold text-foreground">
          ${heading}
        </h1>
        <p className="mt-3 text-muted-foreground">${sub}</p>
      </header>

      <div className="mt-10">
        <ToolGrid tools={tools} compact />
      </div>
    </div>
  );
}
`,
    );
  }

  // An About page listing what is bundled. It answers "does this actually
  // work offline?" honestly, and carries the licence notices that shipping
  // LibreOffice, Tesseract and qpdf obliges us to include.
  const aboutDir = path.join(work, "src/app/bundled");
  await mkdir(aboutDir, { recursive: true });
  await cp(
    path.join(root, "desktop/templates/bundled-page.tsx"),
    path.join(aboutDir, "page.tsx"),
  );

  // No panel. The website's single line is kept, but made accurate: a tool
  // whose program was bundled really does run on this device, so it is marked
  // as local in the registry. Checked against the files on disk at build time,
  // which is when it is known.
  const bundled = {
    qpdf: await exists(path.join(root, `desktop/native/${platformDir()}/qpdf`)),
    tesseract: await exists(path.join(root, `desktop/native/${platformDir()}/tesseract`)),
    libreoffice: await exists(path.join(root, `desktop/native/${platformDir()}/libreoffice`)),
  };

  const LOCAL_WHEN = {
    "ocr-pdf": "tesseract",
    "protect-pdf": "qpdf",
    "unlock-pdf": "qpdf",
    "pdf-to-word": "libreoffice",
    "pdf-to-excel": "libreoffice",
    "pdf-to-ppt": "libreoffice",
    "word-to-pdf": "libreoffice",
    "excel-to-pdf": "libreoffice",
    "ppt-to-pdf": "libreoffice",
  };

  const nowLocal = Object.entries(LOCAL_WHEN)
    .filter(([, program]) => bundled[program])
    .map(([slug]) => slug);

  if (nowLocal.length > 0) {
    registry = await readFile(registryPath, "utf8");
    for (const slug of nowLocal) {
      registry = registry.replace(
        new RegExp(`(slug: "${slug}",[\\s\\S]*?)runsInBrowser: false`),
        "$1runsInBrowser: true",
      );
    }
    await writeFile(registryPath, registry);
    console.log(`  Marked as local: ${nowLocal.join(", ")}`);
  }

  // Nothing about installing belongs in an application that is already
  // installed. The desktop build is not a progressive web app, so the
  // browser-based detection that hides these on the web cannot see it — they
  // are removed here instead.
  // The download pages are left in place deliberately. Removing them while a
  // link somewhere still points there produces a 404, which is worse than a
  // page explaining that the app is already installed.
  await removeIfPresent(path.join(work, "src/app/offline"));
  await removeIfPresent(path.join(work, "src/app/ru/offline"));

  const headerPathInstall = path.join(work, "src/components/site/Header.tsx");
  let headerInstall = await readFile(headerPathInstall, "utf8");
  headerInstall = headerInstall
    .replace(/\s*<InstallLink \/>/g, "")
    .replace(/^\s*import \{ InstallLink \}.*$\n/m, "");
  await writeFile(headerPathInstall, headerInstall);

  const footerPathInstall = path.join(work, "src/components/site/Footer.tsx");
  let footerInstall = await readFile(footerPathInstall, "utf8");
  footerInstall = footerInstall.replace(
    /\s*\{ label: t\.footer\.download, href: "\/download" \},/g,
    "",
  );
  await writeFile(footerPathInstall, footerInstall);

  // A service worker and an install banner make no sense inside Electron: the
  // files are already local, and there is nothing to install.
  const layoutInstallPath = path.join(work, "src/app/layout.tsx");
  let layoutInstall = await readFile(layoutInstallPath, "utf8");
  layoutInstall = layoutInstall
    .replace(/^\s*import \{ (ServiceWorker|InstallPrompt) \}.*$\n/gm, "")
    .replace(/\s*<(ServiceWorker|InstallPrompt) \/>/g, "")
    .replace(/^\s*manifest: "\/site\.webmanifest",$\n/m, "");
  await writeFile(layoutInstallPath, layoutInstall);

  // Neither sign-in nor sign-up belongs in the desktop application: there is
  // no account behind it, nothing is stored anywhere, and the pages they lead
  // to were removed from this build. Both buttons go entirely rather than
  // being repointed somewhere harmless — a button that does something other
  // than what it says is worse than no button.
  const headerPath = path.join(work, "src/components/site/Header.tsx");
  let header = await readFile(headerPath, "utf8");
  header = header.replace(
    /\s*<Button asChild variant="ghost" size="sm">\s*<Link href=\{pathFor\(language, "\/login"\)\}>Log in<\/Link>\s*<\/Button>\s*<Button asChild size="sm">\s*<Link href=\{pathFor\(language, "\/signup"\)\}>\{t\.nav\.getStarted\}<\/Link>\s*<\/Button>/g,
    "",
  );
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
