/**
 * Build configuration for the desktop app.
 *
 * `output: "export"` produces plain HTML, CSS and JavaScript with no server
 * behind it — which is exactly right here, because every tool in the desktop
 * build already runs on the device.
 *
 * The trimming script removes the parts that cannot be exported (API routes,
 * middleware, the signed-in pages) before this config is used.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Two lockfiles exist while building the copy; this tells Next which root
  // to trace from instead of guessing.
  outputFileTracingRoot: process.cwd(),
  // Each route becomes a folder with an index.html, which a plain file server
  // can resolve without rewrite rules.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
