const PUBLIC_PAGES = [
  { path: "/",        priority: "1.0", changefreq: "weekly"   },
  { path: "/precios", priority: "0.9", changefreq: "monthly"  },
  { path: "/register", priority: "0.8", changefreq: "monthly" },
  { path: "/login",   priority: "0.5", changefreq: "monthly"  },
];

function buildSitemap(baseUrl) {
  const today = new Date().toISOString().split("T")[0];
  const urls = PUBLIC_PAGES.map(
    ({ path, priority, changefreq }) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

export function getServerSideProps({ res }) {
  const baseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  const sitemap = buildSitemap(baseUrl);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
