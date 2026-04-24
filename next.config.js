/** @type {import('next').NextConfig} */
const defaultDistDir =
  process.env.NODE_ENV === "development" ? ".next-dev" : ".next";

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
