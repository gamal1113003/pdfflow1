"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, which is what lets the browser tools run with
 * no connection and allows the site to be installed as an app.
 *
 * Only in production: a service worker in development caches the dev server's
 * output and produces confusing stale pages.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration fails on unsupported browsers and in private windows.
        // The site works regardless, so there is nothing to report.
      });
    };

    // Registering after load keeps it off the critical path.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
