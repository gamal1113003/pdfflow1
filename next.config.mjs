/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

// Where the optional conversion backend lives, so CSP can allow talking to it.
const apiOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_PDF_API_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

/**
 * Content Security Policy.
 *
 * 'unsafe-inline' for styles is required: Tailwind and next/font inject inline
 * style blocks. 'unsafe-inline' for scripts covers Next's hydration bootstrap;
 * removing it needs the nonce setup described in SECURITY.md.
 *
 * 'unsafe-eval' is development only — the Next dev server needs it, production
 * does not, and PDF.js is configured with isEvalSupported: false so it does not
 * need it either.
 *
 * blob: appears in worker-src and img-src because PDF.js runs in a blob worker
 * and pages are rendered to canvas before download.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  `connect-src 'self' blob: data:${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "media-src 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  // Stop the browser guessing content types.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // No framing at all — this app is never meant to be embedded.
  { key: "X-Frame-Options", value: "DENY" },

  // Do not leak the path of the page someone came from.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Turn off device APIs the app never uses.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "interest-cohort=()",
    ].join(", "),
  },

  // Isolate the browsing context.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },

  // Force HTTPS for two years, including subdomains. Only sent in production —
  // sending this from localhost would pin your machine to HTTPS on port 3000.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),

  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  reactStrictMode: true,

  // Do not advertise the framework version to scanners.
  poweredByHeader: false,

  eslint: { ignoreDuringBuilds: false },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  webpack: (config) => {
    // pdfjs-dist ships an optional Node canvas dependency we never use in the browser.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
