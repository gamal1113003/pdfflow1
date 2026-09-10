/**
 * Downloads the programs the desktop app bundles.
 *
 * Run once per machine before packaging:
 *
 *   node scripts/fetch-native.mjs            everything
 *   node scripts/fetch-native.mjs --lite     qpdf and Tesseract only
 *
 * LibreOffice is roughly 400 MB of the total. Without it the six Office tools
 * fall back to a remote backend, or report that they need one.
 *
 * These downloads are large and the URLs change over time. If one fails, the
 * message says which tool and where it was looking; fetching it by hand into
 * the same folder works just as well.
 */

import { createWriteStream } from "node:fs";
import { mkdir, rm, access } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const platform = `${process.platform}-${process.arch}`;
const root = path.join(process.cwd(), "desktop", "native", platform);
const lite = process.argv.includes("--lite");

/**
 * Kept in one place so it is obvious what is being downloaded and from where.
 * Verify these against the projects' own release pages before shipping.
 */
const SOURCES = {
  "win32-x64": {
    qpdf: {
      url: "https://github.com/qpdf/qpdf/releases/download/v11.9.1/qpdf-11.9.1-msvc64.zip",
      strip: "qpdf-11.9.1-msvc64",
    },
    tesseract: {
      note: "Install the UB Mannheim build, then copy its folder to desktop/native/win32-x64/tesseract",
      url: "https://github.com/UB-Mannheim/tesseract/wiki",
      manual: true,
    },
    libreoffice: {
      note: "Download the LibreOffice portable build and copy its App/libreoffice folder to desktop/native/win32-x64/libreoffice",
      url: "https://www.libreoffice.org/download/portable-versions/",
      manual: true,
    },
  },
  "darwin-arm64": {
    qpdf: { note: "brew install qpdf, then copy /opt/homebrew/opt/qpdf", manual: true },
    tesseract: { note: "brew install tesseract tesseract-lang", manual: true },
    libreoffice: { note: "Copy LibreOffice.app/Contents from /Applications", manual: true },
  },
  "linux-x64": {
    qpdf: { note: "apt-get download qpdf, or copy /usr/bin/qpdf and its libraries", manual: true },
    tesseract: { note: "Copy /usr/bin/tesseract and /usr/share/tesseract-ocr", manual: true },
    libreoffice: { note: "Use the LibreOffice AppImage and extract it", manual: true },
  },
};

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function download(url, destination) {
  console.log(`  fetching ${url}`);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await pipeline(response.body, createWriteStream(destination));
}

async function unzip(archive, into) {
  if (process.platform === "win32") {
    await run("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${archive}' -DestinationPath '${into}' -Force`,
    ]);
  } else {
    await run("unzip", ["-oq", archive, "-d", into]);
  }
}

async function main() {
  const sources = SOURCES[platform];
  if (!sources) {
    console.error(`No sources listed for ${platform}. Add them to scripts/fetch-native.mjs.`);
    process.exit(1);
  }

  await mkdir(root, { recursive: true });
  const wanted = lite ? ["qpdf", "tesseract"] : ["qpdf", "tesseract", "libreoffice"];

  for (const tool of wanted) {
    const source = sources[tool];
    const target = path.join(root, tool);

    if (await exists(target)) {
      console.log(`${tool}: already present`);
      continue;
    }

    if (!source || source.manual) {
      console.log(`${tool}: needs to be placed by hand`);
      console.log(`  ${source?.note ?? "No instructions recorded."}`);
      if (source?.url) console.log(`  ${source.url}`);
      console.log(`  destination: ${target}`);
      continue;
    }

    console.log(`${tool}:`);
    const archive = path.join(root, `${tool}.zip`);
    try {
      await download(source.url, archive);
      await unzip(archive, root);
      if (source.strip) {
        const { rename } = await import("node:fs/promises");
        await rename(path.join(root, source.strip), target);
      }
      await rm(archive, { force: true });
      console.log(`  ready at ${target}`);
    } catch (error) {
      console.error(`  failed: ${error.message}`);
      console.error(`  fetch it by hand into ${target}`);
    }
  }

  console.log("\nDone. Check what the app can see with:  npm run desktop:start");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
