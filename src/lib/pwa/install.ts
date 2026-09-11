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

/** True when the site is already running as an installed app. */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari on iOS reports it here instead.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
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
    return () => {
      listeners.delete(listener);
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
