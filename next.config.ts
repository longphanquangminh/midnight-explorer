import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Other Next.js options can be added here */
  async headers() {
    // Derive allowed connect-src endpoints from environment (if provided)
    const connectSrcExtra: string[] = [];
    if (process.env.NEXT_PUBLIC_INDEXER_URL) {
      connectSrcExtra.push(process.env.NEXT_PUBLIC_INDEXER_URL);
    }
    if (process.env.NEXT_PUBLIC_RPC_URL) {
      connectSrcExtra.push(process.env.NEXT_PUBLIC_RPC_URL);
    }

    // Build a strict Content Security Policy
    const csp = [
      "default-src 'self'",
      // Next.js & Tailwind require unsafe-inline styles for the initial render
      "style-src 'self' 'unsafe-inline'",
      // Allow inline scripts always; allow eval in development for fast refresh
      (() => {
        const scriptSrcParts = ["'self'", "'unsafe-inline'"];
        if (process.env.NODE_ENV !== "production") {
          scriptSrcParts.push("'unsafe-eval'");
        }
        return `script-src ${scriptSrcParts.join(" ")}`;
      })(),
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' ${connectSrcExtra.join(" ")}`.trim(),
    ].join("; ");

    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: csp,
      },
      {
        key: "Referrer-Policy",
        value: "no-referrer",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Permissions-Policy",
        // Disable camera/mic/geolocation by default
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
