/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
