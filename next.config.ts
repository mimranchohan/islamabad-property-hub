import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],

  // ✅ Security Headers — applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // XSS protection for older browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer info
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Don't cache auth-sensitive pages
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          // Permissions policy — disable unused APIs
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",     // Next.js needs these
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://zagyoznuzwvcyqfycvqf.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
