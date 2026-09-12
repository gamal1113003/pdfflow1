"use client";

import { useEffect, useState } from "react";

/**
 * Shared access to the browser's install offer.
 *
 * `beforeinstallprompt` fires once per page load and is handed to whoever
 * listens first. Two components want it — the banner and the download page —
 * so it is captured here at module level and both read from the same place.
 * Without this, whichever mounted first would swallow it and the other would
 * appear to do nothing.
 */

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let captured: InstallEvent | null = null;
const listeners = new Set<(event: InstallEvent | null) => void>();
let started = false;

function announce() {
  for (const listener of listeners) listener(captured);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Chrome shows its own bar unless this is prevented.
    event.preventDefault();
    captured = event as InstallEvent;
    announce();
  });

  window.addEventListener("appinstalled", () => {
    captured = null;
    announce();
  });
}

/**
 * True when this is not an ordinary browser tab.
 *
 * An installed app can report any of several display modes depending on how it
 * was installed and which browser did it — `standalone` is the common one, but
 * a window with a title bar reports `window-controls-overlay`, and a
 * minimal-chrome install reports `minimal-ui`. Checking only `standalone`
 * misses those, which is why the link kept appearing.
 *
 * Electron is checked too: it reports no special display mode at all, so
 * without this the desktop build would show an Install link for something
 * already installed.
 */
const DISPLAY_MODES = [
  "standalone",
  "minimal-ui",
  "fullscreen",
  "window-controls-overlay",
];

export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;

  if (DISPLAY_MODES.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)) {
    return true;
  }

  // Safari on iOS reports it here rather than through a media query.
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }

  // The desktop application.
  if (/electron/i.test(window.navigator.userAgent)) return true;

  return false;
}

export function useInstall() {
  const [event, setEvent] = useState<InstallEvent | null>(captured);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    start();
    setInstalled(isInstalled());
    setEvent(captured);

    const listener = (next: InstallEvent | null) => setEvent(next);
    listeners.add(listener);

    // The display mode changes when an app is installed or launched from the
    // home screen without a reload, so it is watched rather than read once.
    const queries = DISPLAY_MODES.map((mode) => window.matchMedia(`(display-mode: ${mode})`));
    const recheck = () => setInstalled(isInstalled());
    queries.forEach((query) => query.addEventListener("change", recheck));
    window.addEventListener("appinstalled", recheck);

    return () => {
      listeners.delete(listener);
      queries.forEach((query) => query.removeEventListener("change", recheck));
      window.removeEventListener("appinstalled", recheck);
    };
  }, []);

  /** Returns true when the person accepted. */
  const install = async (): Promise<boolean> => {
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      captured = null;
      announce();
      setInstalled(true);
      return true;
    }
    return false;
  };

  return { canInstall: Boolean(event) && !installed, installed, install };
}
