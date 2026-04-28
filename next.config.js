/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";
const defaultDistDir = isDev ? ".next-dev" : ".next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Control referrer info shared with third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS in production (only browsers — reverse proxies should also send HSTS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent XSS by disabling inline scripts in older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content Security Policy — restricts resource origins
  // unsafe-inline required: Next.js Pages Router injects inline scripts + styled-jsx inline styles
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || defaultDistDir,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/home.html",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
