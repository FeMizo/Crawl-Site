/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    return [
      {
        source: "/api/site-info",
        destination: "http://localhost:3001/api/site-info",
      },
      {
        source: "/api/crawl",
        destination: "http://localhost:3001/api/crawl",
      },
      {
        source: "/api/download/:sessionId",
        destination: "http://localhost:3001/api/download/:sessionId",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/api/auth/:path*",
      },
      {
        source: "/api/projects/:path*",
        destination: "http://localhost:3001/api/projects/:path*",
      },
      {
        source: "/api/history",
        destination: "http://localhost:3001/api/history",
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
