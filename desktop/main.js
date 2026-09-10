/**
 * orzix desktop.
 *
 * The exported site is served from a tiny HTTP server bound to 127.0.0.1
 * rather than loaded over file://. Browsers treat file:// as an opaque origin,
 * which breaks web workers — and PDF.js needs a worker to render anything.
 * A local server costs a few lines and avoids that whole class of problem.
 *
 * Nothing here reaches the internet. There is no server-side tool in this
 * build, so the app works with the network switched off.
 */

const { app, BrowserWindow, shell, Menu, dialog } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const APP_DIR = path.join(__dirname, "app");
const api = require("./api.js");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

function serve() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      try {
        const url = new URL(request.url, "http://127.0.0.1");

        // Conversions are answered by the bundled programs on this machine.
        if (api.isApiPath(url.pathname)) {
          if (request.method !== "POST") {
            response.writeHead(405).end("Method not allowed");
            return;
          }
          const job = url.pathname.replace("/api/process/", "").replace(/\/$/, "");
          api.handle(request, response, job);
          return;
        }

        // Reports which bundled tools this installation actually has.
        if (url.pathname === "/api/capabilities") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(api.capabilities()));
          return;
        }

        let filePath = path.join(APP_DIR, decodeURIComponent(url.pathname));

        // Refuse anything that tries to climb out of the app directory.
        if (!filePath.startsWith(APP_DIR)) {
          response.writeHead(403).end("Forbidden");
          return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }
        if (!fs.existsSync(filePath)) {
          const fallback = path.join(APP_DIR, "404.html");
          if (fs.existsSync(fallback)) {
            response.writeHead(404, { "Content-Type": MIME[".html"] });
            fs.createReadStream(fallback).pipe(response);
            return;
          }
          response.writeHead(404).end("Not found");
          return;
        }

        response.writeHead(200, {
          "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
          "Cache-Control": "no-store",
        });
        fs.createReadStream(filePath).pipe(response);
      } catch (error) {
        response.writeHead(500).end(String(error));
      }
    });

    // Port 0 asks the system for any free port, so nothing collides.
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
    server.on("error", reject);
  });
}

async function createWindow() {
  if (!fs.existsSync(APP_DIR)) {
    dialog.showErrorBox(
      "Build missing",
      "The exported site was not found. Run:\n\n  npm run desktop:build",
    );
    app.quit();
    return;
  }

  const port = await serve();

  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    backgroundColor: "#0e1016",
    show: false,
    title: "orzix",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      // The page is ordinary web content and needs no privileged access.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.loadURL(`http://127.0.0.1:${port}/`);

  // External links open in the real browser rather than inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
}

const template = [
  {
    label: "File",
    submenu: [{ role: "quit" }],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
      { role: "toggleDevTools" },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
