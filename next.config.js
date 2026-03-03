/** @type {import('next').NextConfig} */
const nextConfig = {
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
