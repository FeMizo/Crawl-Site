const express = require("express");
const path = require("path");
const https = require("https");
const http = require("http");
const tls = require("tls");
const zlib = require("zlib");
const dns = require("dns").promises;
const { URL } = require("url");
const ExcelJS = require("exceljs");
const fs = require("fs");
const os = require("os");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-this-local-secret";
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createAuthToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
}

function writeAuthCookie(res, user) {
  res.cookie("auth_token", createAuthToken(user), getAuthCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "No autenticado" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Sesion invalida" });
    }
    req.user = user;
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Sesion invalida" });
  }
}

function normalizeProjectName(name, targetUrl) {
  const raw = String(name || "").trim();
  if (raw) return raw.slice(0, 120);
  try {
    const url = new URL(targetUrl);
    return url.hostname;
  } catch {
    return "Proyecto";
  }
}

//  URL utils
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}
function normalizeForCompare(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/"))
      u.pathname = u.pathname.slice(0, -1);
    return u.toString().toLowerCase();
  } catch {
    return (url || "").toLowerCase();
  }
}
function sameUrlLoose(a, b) {
  if (!a || !b) return false;
  return normalizeForCompare(a) === normalizeForCompare(b);
}
function isSameDomain(url, origin) {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function getHeader(headers, name) {
  if (!headers) return "";
  const key = Object.keys(headers).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return key ? String(headers[key] || "") : "";
}

function parseSecurityHeaders(headers) {
  const hsts = getHeader(headers, "strict-transport-security");
  const csp = getHeader(headers, "content-security-policy");
  const xfo = getHeader(headers, "x-frame-options");
  const xcto = getHeader(headers, "x-content-type-options");
  const rp = getHeader(headers, "referrer-policy");
  const pp = getHeader(headers, "permissions-policy");
  const present = [hsts, csp, xfo, xcto, rp, pp].filter(Boolean).length;
  return {
    score: Math.round((present / 6) * 100),
    strictTransportSecurity: hsts || null,
    contentSecurityPolicy: csp || null,
    xFrameOptions: xfo || null,
    xContentTypeOptions: xcto || null,
    referrerPolicy: rp || null,
    permissionsPolicy: pp || null,
  };
}

function fetchJson(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith("https") ? https : http;
      const req = lib.request(
        url,
        {
          method: "GET",
          timeout: 8000,
          headers: { "User-Agent": "SEO-Crawler/1.0" },
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) =>
            chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)),
          );
          res.on("end", () => {
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            } catch {
              resolve(null);
            }
          });
        },
      );
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
      req.on("error", () => resolve(null));
      req.end();
    } catch {
      resolve(null);
    }
  });
}

async function fetchIpGeo(ip) {
  if (!ip) return null;
  const data = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (!data || data.success === false) return null;
  return {
    city: data.city || null,
    region: data.region || null,
    country: data.country || null,
    countryCode: data.country_code || null,
    isp: data.connection?.isp || null,
    org: data.connection?.org || null,
  };
}

function fetchSslInfo(hostname) {
  return new Promise((resolve) => {
    if (!hostname) return resolve(null);
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 8000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(true);
          if (!cert || !cert.valid_to) {
            socket.end();
            return resolve(null);
          }
          const validTo = new Date(cert.valid_to);
          const validFrom = new Date(cert.valid_from);
          const validDays = Math.max(
            0,
            Math.ceil((validTo.getTime() - Date.now()) / 86400000),
          );
          socket.end();
          resolve({
            subjectCN: cert.subject?.CN || null,
            issuerCN: cert.issuer?.CN || null,
            validFrom: Number.isNaN(validFrom.getTime())
              ? null
              : validFrom.toISOString(),
            validTo: Number.isNaN(validTo.getTime())
              ? null
              : validTo.toISOString(),
            validDaysRemaining: validDays,
          });
        } catch {
          socket.end();
          resolve(null);
        }
      },
    );
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
    socket.on("error", () => resolve(null));
  });
}

//  HTTP fetch
function fetchRaw(url, headOnly = false) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const withElapsed = (obj) => ({
      ...obj,
      elapsedMs: Date.now() - startedAt,
    });
    const lib = url.startsWith("https") ? https : http;
    const options = {
      method: headOnly ? "HEAD" : "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEO-Crawler/1.0)",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Encoding": "gzip, deflate, br",
      },
      timeout: 12000,
    };
    const req = lib.request(url, options, (res) => {
      const statusCode = res.statusCode;
      const headers = res.headers || {};
      const location = res.headers.location;
      const encoding = res.headers["content-encoding"] || "";
      const server = res.headers["server"] || "";
      const powered = res.headers["x-powered-by"] || "";
      if (statusCode >= 300 && statusCode < 400 && location) {
        res.resume();
        let redirectTo = null;
        try {
          redirectTo = normalizeUrl(new URL(location, url).href);
        } catch {}
        return resolve(withElapsed({
          url,
          statusCode,
          body: "",
          redirectTo,
          headers,
          server,
          powered,
        }));
      }
      if (headOnly || statusCode < 200 || statusCode >= 400) {
        res.resume();
        return resolve(withElapsed({
          url,
          statusCode,
          body: "",
          redirectTo: null,
          headers,
          server,
          powered,
        }));
      }
      const ct = res.headers["content-type"] || "";
      // Accept text/html, text/plain (robots.txt), text/xml and application/xml (sitemaps)
      const isText =
        ct.includes("text/html") ||
        ct.includes("text/plain") ||
        ct.includes("xml");
      if (!isText) {
        res.resume();
        return resolve(withElapsed({
          url,
          statusCode,
          body: "",
          redirectTo: null,
          nonHtml: true,
          headers,
          server,
          powered,
        }));
      }
      let stream = res;
      if (encoding === "gzip") stream = res.pipe(zlib.createGunzip());
      else if (encoding === "br")
        stream = res.pipe(zlib.createBrotliDecompress());
      else if (encoding === "deflate") stream = res.pipe(zlib.createInflate());
      const chunks = [];
      stream.on("data", (c) => {
        chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
        if (chunks.reduce((a, b) => a + b.length, 0) > 600000) res.destroy();
      });
      stream.on("end", () =>
        resolve(withElapsed({
          url,
          statusCode,
          body: Buffer.concat(chunks).toString("utf8"),
          redirectTo: null,
          headers,
          server,
          powered,
        })),
      );
      stream.on("error", () =>
        resolve(withElapsed({
          url,
          statusCode,
          body: "",
          redirectTo: null,
          headers,
          server,
          powered,
        })),
      );
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(withElapsed({
        url,
        statusCode: 0,
        body: "",
        redirectTo: null,
        headers: {},
        timeout: true,
      }));
    });
    req.on("error", (e) =>
      resolve(withElapsed({
        url,
        statusCode: 0,
        body: "",
        redirectTo: null,
        headers: {},
        error: e.message,
      })),
    );
    req.end();
  });
}

//  Site info (hosting, tech stack, DNS)
async function fetchSiteInfo(siteUrl) {
  const info = {
    ip: null,
    ipv6: null,
    dnsProvider: null,
    hostingHint: null,
    hostingLocation: null,
    ipOrganization: null,
    cms: null,
    framework: null,
    serverSoftware: null,
    nameservers: [],
    mxRecords: [],
    security: null,
    ssl: null,
  };
  try {
    const hostname = new URL(siteUrl).hostname;

    // DNS lookup
    try {
      const [v4, v6] = await Promise.allSettled([
        dns.resolve4(hostname),
        dns.resolve6(hostname),
      ]);
      if (v4.status === "fulfilled") info.ip = v4.value[0];
      if (v6.status === "fulfilled") info.ipv6 = v6.value[0];
    } catch {}

    // Nameservers
    try {
      const ns = await dns.resolveNs(hostname).catch(() => []);
      info.nameservers = ns.slice(0, 6);
      // Guess DNS provider
      const nsStr = ns.join(" ").toLowerCase();
      if (nsStr.includes("cloudflare")) info.dnsProvider = "Cloudflare";
      else if (nsStr.includes("godaddy") || nsStr.includes("domaincontrol"))
        info.dnsProvider = "GoDaddy";
      else if (nsStr.includes("awsdns")) info.dnsProvider = "Amazon Route 53";
      else if (nsStr.includes("google")) info.dnsProvider = "Google Cloud DNS";
      else if (nsStr.includes("azure")) info.dnsProvider = "Azure DNS";
      else if (nsStr.includes("namecheap")) info.dnsProvider = "Namecheap";
      else if (nsStr.includes("hover")) info.dnsProvider = "Hover";
      else if (nsStr.includes("bluehost")) info.dnsProvider = "Bluehost";
      else if (nsStr.includes("hostgator")) info.dnsProvider = "HostGator";
      else if (nsStr.includes("siteground")) info.dnsProvider = "SiteGround";
      else if (nsStr.includes("wpengine")) info.dnsProvider = "WP Engine";
      else if (nsStr.includes("kinsta")) info.dnsProvider = "Kinsta";
      else if (ns.length)
        info.dnsProvider = ns[0].split(".").slice(-2).join("."); // last 2 parts
    } catch {}

    // MX
    try {
      const mx = await dns.resolveMx(hostname).catch(() => []);
      info.mxRecords = mx.slice(0, 4).map((r) => r.exchange);
    } catch {}

    // Fetch homepage for tech detection
    const raw = await fetchRaw(siteUrl);
    let hops = 0;
    let r = raw;
    while (r.redirectTo && hops < 5) {
      r = await fetchRaw(r.redirectTo);
      hops++;
    }

    info.serverSoftware = r.server || raw.server || null;
    info.security = parseSecurityHeaders(r.headers || raw.headers || {});

    const geo = await fetchIpGeo(info.ip);
    if (geo) {
      info.ipOrganization = geo.org || geo.isp || null;
      info.hostingLocation = [geo.city, geo.region, geo.country]
        .filter(Boolean)
        .join(", ");
    }

    const protocol = new URL(siteUrl).protocol;
    info.ssl = protocol === "https:" ? await fetchSslInfo(hostname) : null;

    if (r.body) {
      const body = r.body;
      const lbody = body.toLowerCase();

      // CMS detection
      if (body.includes("/wp-content/") || body.includes("wp-includes"))
        info.cms = "WordPress";
      else if (body.includes("Shopify.theme") || body.includes("/shopify/"))
        info.cms = "Shopify";
      else if (
        body.includes("data-drupal") ||
        lbody.includes("drupal.settings")
      )
        info.cms = "Drupal";
      else if (
        body.includes("data-joomla") ||
        lbody.includes("/components/com_")
      )
        info.cms = "Joomla";
      else if (
        lbody.includes("squarespace") &&
        lbody.includes("static1.squarespace")
      )
        info.cms = "Squarespace";
      else if (
        lbody.includes("cdn.webflow.com") ||
        body.includes("data-wf-page")
      )
        info.cms = "Webflow";
      else if (lbody.includes("wix.com/") || lbody.includes("static.wixstatic"))
        info.cms = "Wix";
      else if (
        lbody.includes("ghost-") ||
        lbody.includes("content/themes/ghost")
      )
        info.cms = "Ghost";
      else if (lbody.includes("next.js") || body.includes("__NEXT_DATA__"))
        info.framework = "Next.js";
      else if (body.includes("__nuxt") || body.includes("__NUXT_"))
        info.framework = "Nuxt.js";
      else if (body.includes("ng-version=") || body.includes("ng-app"))
        info.framework = "Angular";
      else if (body.includes("data-reactroot") || body.includes("react-dom"))
        info.framework = "React";
      else if (
        lbody.includes("gatsby-focus-wrapper") ||
        lbody.includes("gatsby-")
      )
        info.framework = "Gatsby";

      // Server / hosting hints from headers + meta
      const srv = (info.serverSoftware || "").toLowerCase();
      const pow = (r.powered || raw.powered || "").toLowerCase();
      if (srv.includes("cloudflare")) info.hostingHint = "Cloudflare";
      else if (pow.includes("php")) info.hostingHint = "PHP Hosting";
      else if (pow.includes("express") || pow.includes("node"))
        info.hostingHint = "Node.js Server";
      else if (srv.includes("nginx")) info.hostingHint = "Nginx";
      else if (srv.includes("apache")) info.hostingHint = "Apache";
      else if (srv.includes("litespeed")) info.hostingHint = "LiteSpeed";
      else if (srv.includes("iis")) info.hostingHint = "IIS (Microsoft)";
      else if (srv.includes("vercel")) info.hostingHint = "Vercel";
      else if (srv.includes("netlify")) info.hostingHint = "Netlify";
      else if (srv.includes("github")) info.hostingHint = "GitHub Pages";
      else if (srv.includes("amazon")) info.hostingHint = "AWS";
      else if (srv.includes("google")) info.hostingHint = "Google Cloud";
      else if (srv.includes("microsoft") || srv.includes("azure"))
        info.hostingHint = "Azure";

      // Shopify / WP Engine / Kinsta hints via response body meta
      if (!info.hostingHint) {
        if (lbody.includes("shopify.com")) info.hostingHint = "Shopify Hosting";
        else if (lbody.includes("wpengine")) info.hostingHint = "WP Engine";
        else if (lbody.includes("kinsta")) info.hostingHint = "Kinsta";
      }
    }
  } catch {}
  return info;
}

//  Sitemap parser
async function fetchSitemap(siteUrl) {
  const urls = [];
  const tried = new Set();
  async function parseSitemapXml(xmlUrl) {
    if (tried.has(xmlUrl)) return;
    tried.add(xmlUrl);
    try {
      let raw = await fetchRaw(xmlUrl);
      let hops = 0;
      while (raw.redirectTo && hops < 5) {
        raw = await fetchRaw(raw.redirectTo);
        hops++;
      }
      if (!raw.body) return;
      const nestedMatches = [
        ...raw.body.matchAll(/<loc>\s*(https?:[^<]+sitemap[^<]*)\s*<\/loc>/gi),
      ];
      if (nestedMatches.length) {
        for (const m of nestedMatches) await parseSitemapXml(m[1].trim());
        return;
      }
      const locMatches = [
        ...raw.body.matchAll(/<loc>\s*(https?:[^<]+)\s*<\/loc>/gi),
      ];
      for (const m of locMatches) {
        const u = normalizeUrl(m[1].trim());
        if (u) urls.push(u);
      }
    } catch {}
  }
  const base = new URL(siteUrl).origin;
  await parseSitemapXml(`${base}/sitemap.xml`);
  if (!urls.length) await parseSitemapXml(`${base}/sitemap_index.xml`);
  return [...new Set(urls)];
}

//  Robots.txt parser
async function fetchRobots(siteUrl) {
  const disallowed = [];
  const sitemapUrls = [];
  try {
    const base = new URL(siteUrl).origin;
    let raw = await fetchRaw(`${base}/robots.txt`);
    let hops = 0;
    while (raw.redirectTo && hops < 5) {
      raw = await fetchRaw(raw.redirectTo);
      hops++;
    }
    if (!raw.body)
      return { disallowed, hasSitemap: false, sitemapUrls, rawContent: "" };
    let inOurAgent = false;
    for (const line of raw.body.split("\n")) {
      const trimmed = line.trim();
      const l = trimmed.toLowerCase();
      // Sitemap: directive appears anywhere, outside of any user-agent block
      if (l.startsWith("sitemap:")) {
        const su = trimmed.slice(8).trim();
        if (su) sitemapUrls.push(su);
        continue;
      }
      if (l.startsWith("user-agent:")) {
        const agent = l.replace("user-agent:", "").trim();
        inOurAgent = agent === "*" || agent.includes("seo-crawler");
      }
      if (inOurAgent && l.startsWith("disallow:")) {
        const p = trimmed.slice(9).trim();
        if (p && p !== "/") disallowed.push(p);
      }
    }
    return {
      disallowed,
      hasSitemap: sitemapUrls.length > 0,
      sitemapUrls,
      rawContent: raw.body,
    };
  } catch {
    return {
      disallowed: [],
      hasSitemap: false,
      sitemapUrls: [],
      rawContent: "",
    };
  }
}

function isDisallowed(url, disallowed) {
  try {
    const pathname = new URL(url).pathname;
    return disallowed.some((d) => pathname.startsWith(d));
  } catch {
    return false;
  }
}

//  Meta + content extractor
function extractMeta(body, pageUrl) {
  const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    body.match(
      /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
    ) ||
    body.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i,
    );
  const robotsMatch =
    body.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i) ||
    body.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']robots["']/i);
  const canonMatch =
    body.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
    body.match(/<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const langMatch = body.match(/<html[^>]+lang=["']([^"']+)["']/i);

  // H1-H6 heading structure for level checking
  const headingMatches = [
    ...body.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi),
  ];
  const headings = headingMatches
    .map((m) => ({
      level: parseInt(m[1][1]),
      text: m[2]
        .replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 120),
    }))
    .filter((h) => h.text);

  // H1 tags
  const h1s = headings.filter((h) => h.level === 1).map((h) => h.text);

  // Detect heading skips (e.g. h1  h3 skipping h2)
  const headingSkips = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr > prev + 1) {
      headingSkips.push({
        from: `H${prev}`,
        to: `H${curr}`,
        text: headings[i].text,
      });
    }
  }

  // Images without alt
  const imgMatches = [...body.matchAll(/<img[^>]+>/gi)];
  const imgsNoAlt = imgMatches.filter(
    (m) => !/alt\s*=\s*["'][^"']+["']/i.test(m[0]),
  ).length;
  const imgsNoSize = imgMatches.filter((m) => {
    const tag = m[0];
    const hasWidth =
      /\bwidth\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'=<>`]+)/i.test(tag);
    const hasHeight =
      /\bheight\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'=<>`]+)/i.test(tag);
    return !hasWidth || !hasHeight;
  }).length;
  const totalImgs = imgMatches.length;
  const imageUrls = imgMatches
    .map((m) => {
      const srcMatch = m[0].match(/\bsrc=["']([^"']+)["']/i);
      const src = (srcMatch?.[1] || "").trim();
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return null;
      try {
        return normalizeUrl(new URL(src, pageUrl).href);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // All links
  const linkMatches = [...body.matchAll(/href=["']([^"'#][^"']*?)["']/gi)];
  const allLinks = linkMatches
    .map((m) => {
      try {
        return normalizeUrl(new URL(m[1], pageUrl).href);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Button functionality checks
  const buttonLikeItems = [];
  let buttonsNoLink = 0;
  const buttonsNoLinkDetails = [];
  const anchorTags = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  for (const m of anchorTags) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const tag = `<a ${attrs}>`;
    const anchorText = inner
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const isButtonLike =
      /role=["']button["']/i.test(attrs) ||
      /\b(class|id)=["'][^"']*(btn|button|cta)[^"']*["']/i.test(attrs);
    if (!isButtonLike) continue;

    const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
    const href = (hrefMatch?.[1] || "").trim();
    if (
      !href ||
      href === "#" ||
      href.toLowerCase().startsWith("javascript:") ||
      href.toLowerCase().startsWith("mailto:") ||
      href.toLowerCase().startsWith("tel:")
    ) {
      buttonsNoLink++;
      buttonsNoLinkDetails.push({
        text: anchorText || "(sin texto)",
        source: "a.btn-like",
        href: href || "(vacio)",
      });
      continue;
    }
    try {
      const abs = normalizeUrl(new URL(href, pageUrl).href);
      if (abs)
        buttonLikeItems.push({
          url: abs,
          text: anchorText || "(sin texto)",
          source: "a.btn-like",
        });
    } catch {}
  }

  const buttonTags = [
    ...body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi),
  ];
  for (const m of buttonTags) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const hasOnClick = /\bonclick\s*=/i.test(attrs);
    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
    const btnType = (typeMatch?.[1] || "submit").toLowerCase();
    if (!hasOnClick && btnType === "button") {
      const buttonText = inner
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      buttonsNoLink++;
      buttonsNoLinkDetails.push({
        text: buttonText || "(sin texto)",
        source: `button[type=${btnType}]`,
        href: "(sin link)",
      });
    }
  }

  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
  const description = descMatch ? descMatch[1].trim() : "";
  const canonical = canonMatch
    ? normalizeUrl(new URL(canonMatch[1], pageUrl).href)
    : "";
  const pageLang = langMatch ? langMatch[1] : "";

  return {
    title,
    description,
    descExists: descMatch !== null,
    noindex: robotsMatch
      ? robotsMatch[1].toLowerCase().includes("noindex")
      : false,
    canonical,
    h1s,
    headings,
    headingSkips,
    imgsNoAlt,
    imgsNoSize,
    totalImgs,
    imageUrls: [...new Set(imageUrls)],
    allLinks,
    buttonLikeItems,
    buttonsNoLink,
    buttonsNoLinkDetails,
    pageLang,
    titleLen: title.length,
    descLen: description.length,
  };
}

function extractLinks(body, baseUrl) {
  const links = [];
  const regex = /href=["']([^"'#][^"']*?)["']/gi;
  let match;
  while ((match = regex.exec(body)) !== null) {
    try {
      const abs = normalizeUrl(new URL(match[1], baseUrl).href);
      if (
        abs &&
        !abs.match(
          /\.(jpe?g|png|gif|svg|webp|css|js|pdf|zip|ico|xml|txt|mp4|mp3|woff2?)(\?|$)/i,
        )
      )
        links.push(abs);
    } catch {}
  }
  return [...new Set(links)];
}

//  SEO quality scorer
// Returns a simple score 0-100 and suggestions for title + description
function scoreSEO(meta, url) {
  const result = {
    titleScore: 0,
    descScore: 0,
    titleSuggestions: [],
    descSuggestions: [],
  };
  if (!meta) return result;

  // Title scoring
  const t = meta.title;
  const tl = meta.titleLen;
  if (!t) {
    result.titleScore = 0;
    result.titleSuggestions.push({
      es: "No hay ttulo. Es el elemento SEO ms importante.",
      en: "No title found. This is the most important SEO element.",
    });
  } else {
    let ts = 100;
    if (tl < 30) {
      ts -= 40;
      result.titleSuggestions.push({
        es: `Ttulo muy corto (${tl} chars). Ideal: 50-60.`,
        en: `Title too short (${tl} chars). Ideal: 50-60.`,
      });
    } else if (tl < 50) {
      ts -= 15;
      result.titleSuggestions.push({
        es: `Ttulo corto (${tl} chars). Puedes aadir ms contexto (ideal 50-60).`,
        en: `Title a bit short (${tl} chars). Consider adding more context (ideal 50-60).`,
      });
    } else if (tl > 60) {
      ts -= 20;
      result.titleSuggestions.push({
        es: `Ttulo largo (${tl} chars). Google cortar a ~60 chars.`,
        en: `Title too long (${tl} chars). Google will truncate at ~60 chars.`,
      });
    }
    // Check brand separator
    if (
      !t.includes("|") &&
      !t.includes("-") &&
      !t.includes("") &&
      !t.includes(":")
    ) {
      ts -= 10;
      result.titleSuggestions.push({
        es: "Considera usar separador (|, -, ) entre tema y marca.",
        en: "Consider using a separator (|, -, ) between topic and brand.",
      });
    }
    // Check keyword position (roughly: main keyword should be near start)
    if (tl > 0 && t.indexOf(" ") > 20)
      result.titleSuggestions.push({
        es: "Intenta poner la keyword principal al inicio del ttulo.",
        en: "Try placing the main keyword at the beginning of the title.",
      });
    result.titleScore = Math.max(0, ts);
  }

  // Description scoring
  const d = meta.description;
  const dl = meta.descLen;
  if (!meta.descExists) {
    result.descScore = 0;
    result.descSuggestions.push({
      es: "No hay meta description. Adela para mejorar el CTR.",
      en: "No meta description found. Add one to improve CTR.",
    });
  } else if (!d) {
    result.descScore = 10;
    result.descSuggestions.push({
      es: "Meta description vaca. Google la generar automticamente (no es lo ideal).",
      en: "Empty meta description. Google will auto-generate it (not ideal).",
    });
  } else {
    let ds = 100;
    if (dl < 70) {
      ds -= 35;
      result.descSuggestions.push({
        es: `Descripcin muy corta (${dl} chars). Ideal: 140-160.`,
        en: `Description too short (${dl} chars). Ideal: 140-160.`,
      });
    } else if (dl < 120) {
      ds -= 15;
      result.descSuggestions.push({
        es: `Descripcin corta (${dl} chars). Puede ampliarse (ideal 140-160).`,
        en: `Description short (${dl} chars). Consider expanding (ideal 140-160).`,
      });
    } else if (dl > 160) {
      ds -= 15;
      result.descSuggestions.push({
        es: `Descripcin larga (${dl} chars). Google cortar a ~160 chars.`,
        en: `Description long (${dl} chars). Google truncates at ~160 chars.`,
      });
    }
    if (
      !d.includes("?") &&
      !d.match(/\b(ahora|hoy|gratis|nuevo|free|new|now|today|discover)\b/i)
    )
      result.descSuggestions.push({
        es: "Aade un CTA o palabra de accin para mejorar el CTR.",
        en: "Add a CTA or action word to improve CTR.",
      });
    result.descScore = Math.max(0, ds);
  }

  return result;
}

//  Issue builder
function getIssues(page, crawlLang = "es") {
  const issues = [];
  const m = page.meta;
  const T = (es, en) => (crawlLang === "en" ? en : es);

  if (page.timeout)
    issues.push({
      type: "timeout",
      label: T("Timeout", "Timeout"),
      group: "errors",
    });
  if (page.error)
    issues.push({
      type: "error",
      label: T(`Error: ${page.error}`, `Error: ${page.error}`),
      group: "errors",
    });
  if (page.blocked)
    issues.push({
      type: "blocked",
      label: T("Bloqueada por robots.txt", "Blocked by robots.txt"),
      group: "errors",
    });
  if (page.statusCode === 404)
    issues.push({ type: "404", label: "404 Not Found", group: "errors" });
  if (
    page.statusCode >= 400 &&
    page.statusCode !== 404 &&
    page.statusCode !== 0
  )
    issues.push({
      type: "http_error",
      label: `HTTP ${page.statusCode}`,
      group: "errors",
    });
  if (page.redirectTo && !sameUrlLoose(page.redirectTo, page.url))
    issues.push({
      type: "redirect",
      label: `Redirect  ${page.redirectTo}`,
      group: "errors",
    });

  if (page.statusCode >= 200 && page.statusCode < 300 && m) {
    // Title
    if (!m.title)
      issues.push({
        type: "no_title",
        label: T("Sin ttulo", "No title"),
        group: "titles",
      });
    else if (m.titleLen < 30)
      issues.push({
        type: "title_short",
        label: T(
          `Ttulo corto (${m.titleLen} chars)`,
          `Short title (${m.titleLen} chars)`,
        ),
        group: "titles",
      });
    else if (m.titleLen > 60)
      issues.push({
        type: "title_long",
        label: T(
          `Ttulo largo (${m.titleLen} chars)`,
          `Long title (${m.titleLen} chars)`,
        ),
        group: "titles",
      });

    // Desc
    if (!m.descExists)
      issues.push({
        type: "no_desc",
        label: T("Sin meta description", "No meta description"),
        group: "desc",
      });
    else if (!m.description)
      issues.push({
        type: "no_desc",
        label: T("Meta description vaca", "Empty meta description"),
        group: "desc",
      });
    else if (m.descLen < 70)
      issues.push({
        type: "desc_short",
        label: T(
          `Description corta (${m.descLen} chars)`,
          `Short description (${m.descLen} chars)`,
        ),
        group: "desc",
      });
    else if (m.descLen > 160)
      issues.push({
        type: "desc_long",
        label: T(
          `Description larga (${m.descLen} chars)`,
          `Long description (${m.descLen} chars)`,
        ),
        group: "desc",
      });

    // H1
    if (!m.h1s || m.h1s.length === 0)
      issues.push({ type: "no_h1", label: T("Sin H1", "No H1"), group: "h1" });
    else if (m.h1s.length > 1)
      issues.push({
        type: "multi_h1",
        label: T(
          `Mltiples H1 (${m.h1s.length})`,
          `Multiple H1 (${m.h1s.length})`,
        ),
        group: "h1",
      });

    // Heading skips
    if (m.headingSkips && m.headingSkips.length > 0) {
      for (const skip of m.headingSkips) {
        issues.push({
          type: "heading_skip",
          label: T(
            `Salto de heading ${skip.from}${skip.to}`,
            `Heading skip ${skip.from}${skip.to}`,
          ),
          group: "h1",
        });
      }
    }

    // Images
    if (m.imgsNoAlt > 0)
      issues.push({
        type: "imgs_no_alt",
        label: T(
          `${m.imgsNoAlt} imagen(es) sin alt`,
          `${m.imgsNoAlt} image(s) without alt`,
        ),
        group: "images",
      });
    if (m.imgsNoSize > 0)
      issues.push({
        type: "imgs_no_size",
        label: T(
          `${m.imgsNoSize} imagen(es) sin width/height`,
          `${m.imgsNoSize} image(s) without width/height`,
        ),
        group: "images",
      });
    if ((page.brokenImageLinks || []).length > 0)
      issues.push({
        type: "broken_image",
        label: T(
          `${page.brokenImageLinks.length} imagen(es) rotas`,
          `${page.brokenImageLinks.length} broken image(s)`,
        ),
        group: "images",
      });

    if (m.buttonsNoLink > 0)
      issues.push({
        type: "button_no_link",
        label: T(
          `${m.buttonsNoLink} botón(es) sin link`,
          `${m.buttonsNoLink} button(s) without link`,
        ),
        group: "functionality",
      });

    if ((page.brokenButtonLinks || []).length > 0)
      issues.push({
        type: "broken_button",
        label: T(
          `${page.brokenButtonLinks.length} botón(es) rotos`,
          `${page.brokenButtonLinks.length} broken button(s)`,
        ),
        group: "functionality",
      });
    if ((page.loadTimeMs || 0) >= 3000)
      issues.push({
        type: "slow_load",
        label: T(
          `Carga lenta (${page.loadTimeMs} ms)`,
          `Slow load (${page.loadTimeMs} ms)`,
        ),
        group: "functionality",
      });

    // Noindex
    if (m.noindex)
      issues.push({
        type: "noindex",
        label: T("Noindex activo", "Noindex active"),
        group: "errors",
      });

    // Canonical mismatch
    if (m.canonical && !sameUrlLoose(m.canonical, page.finalUrl || page.url))
      issues.push({
        type: "canonical",
        label: T(
          "Canonical apunta a otra URL",
          "Canonical points to different URL",
        ),
        group: "errors",
      });
  }

  return issues;
}

//  Sessions
const sessions = new Map();
const brokenLinkCache = new Map();

async function checkExternalLink(url) {
  if (brokenLinkCache.has(url)) return brokenLinkCache.get(url);
  const result = await fetchRaw(url, true);
  const broken =
    result.statusCode === 0 ||
    result.statusCode === 404 ||
    result.statusCode === 410 ||
    result.statusCode >= 500 ||
    result.timeout;
  brokenLinkCache.set(url, broken);
  return broken;
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "La password debe tener al menos 8 caracteres" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Ese email ya esta registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash },
    });

    writeAuthCookie(res, user);
    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo registrar el usuario" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    writeAuthCookie(res, user);
    return res.json({ user: sanitizeUser(user) });
  } catch {
    return res.status(500).json({ error: "No se pudo iniciar sesion" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const [projectCount, crawlRunCount] = await Promise.all([
    prisma.project.count({ where: { userId: req.user.id } }),
    prisma.crawlRun.count({ where: { userId: req.user.id } }),
  ]);
  res.json({
    user: sanitizeUser(req.user),
    counts: { projects: projectCount, crawlRuns: crawlRunCount },
  });
});

app.get("/api/projects", requireAuth, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user.id },
    include: {
      _count: { select: { crawlRuns: true } },
      crawlRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          createdAt: true,
          total: true,
          withIssues: true,
          status: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      targetUrl: project.targetUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      runCount: project._count.crawlRuns,
      lastRun: project.crawlRuns[0] || null,
    })),
  });
});

app.get("/api/history", requireAuth, async (req, res) => {
  const runs = await prisma.crawlRun.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          targetUrl: true,
        },
      },
    },
  });

  res.json({
    runs: runs.map((run) => ({
      id: run.id,
      projectId: run.projectId,
      sourceUrl: run.sourceUrl,
      total: run.total,
      withIssues: run.withIssues,
      status: run.status,
      createdAt: run.createdAt,
      project: run.project,
    })),
  });
});

app.post("/api/projects", requireAuth, async (req, res) => {
  const targetUrl = normalizeUrl(req.body?.targetUrl || "");
  if (!targetUrl) {
    return res.status(400).json({ error: "URL invalida" });
  }

  const project = await prisma.project.create({
    data: {
      userId: req.user.id,
      name: normalizeProjectName(req.body?.name, targetUrl),
      targetUrl,
    },
  });

  res.status(201).json({ project });
});

app.get("/api/projects/:projectId", requireAuth, async (req, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: req.params.projectId,
      userId: req.user.id,
    },
    include: {
      crawlRuns: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          sourceUrl: true,
          source: true,
          total: true,
          withIssues: true,
          downloadName: true,
          createdAt: true,
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ error: "Proyecto no encontrado" });
  }

  res.json({ project });
});

app.put("/api/projects/:projectId", requireAuth, async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.projectId, userId: req.user.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "Proyecto no encontrado" });
  }

  const nextTargetUrl = req.body?.targetUrl
    ? normalizeUrl(req.body.targetUrl)
    : existing.targetUrl;
  if (!nextTargetUrl) {
    return res.status(400).json({ error: "URL invalida" });
  }

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: {
      name: normalizeProjectName(req.body?.name ?? existing.name, nextTargetUrl),
      targetUrl: nextTargetUrl,
    },
  });

  res.json({ project });
});

app.delete("/api/projects/:projectId", requireAuth, async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.projectId, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Proyecto no encontrado" });
  }

  await prisma.project.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

app.get("/api/projects/:projectId/runs/:runId", requireAuth, async (req, res) => {
  const run = await prisma.crawlRun.findFirst({
    where: {
      id: req.params.runId,
      projectId: req.params.projectId,
      userId: req.user.id,
    },
    select: {
      id: true,
      sourceUrl: true,
      source: true,
      maxPages: true,
      rateDelay: true,
      checkExt: true,
      total: true,
      withIssues: true,
      stats: true,
      duplicates: true,
      pages: true,
      downloadName: true,
      status: true,
      createdAt: true,
    },
  });

  if (!run) {
    return res.status(404).json({ error: "Historial no encontrado" });
  }

  res.json({ run });
});

//  API: Site info
app.get("/api/site-info", requireAuth, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL requerida" });
  try {
    const info = await fetchSiteInfo(url);
    res.json(info);
  } catch (e) {
    res.json({ error: e.message });
  }
});

//  SSE: Crawl
app.get("/api/crawl", requireAuth, async (req, res) => {
  const startUrl = req.query.url;
  const maxPages = Math.min(parseInt(req.query.max) || 50, 500);
  const source = req.query.source || "crawl";
  const rateDelay = parseInt(req.query.rate) || 0;
  const checkExt = req.query.external === "1";
  const crawlLang = req.query.lang || "es";
  const projectId = String(req.query.projectId || "");

  if (!startUrl) return res.status(400).json({ error: "URL requerida" });
  if (!projectId) return res.status(400).json({ error: "Proyecto requerido" });
  let baseOrigin;
  try {
    baseOrigin = new URL(startUrl).origin;
  } catch {
    return res.status(400).json({ error: "URL invlida" });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: req.user.id },
  });
  if (!project) return res.status(404).json({ error: "Proyecto no encontrado" });
  if (!sameUrlLoose(project.targetUrl, startUrl)) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        targetUrl: normalizeUrl(startUrl),
        name: normalizeProjectName(project.name, startUrl),
      },
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const sessionId = Date.now().toString();
  const results = [];
  const visited = new Set();
  const queue = [];
  let active = 0;
  let cancelled = false;

  sessions.set(sessionId, {
    cancel: () => {
      cancelled = true;
    },
    userId: req.user.id,
    projectId: project.id,
  });
  send("session", { sessionId });

  // Robots
  const { disallowed, hasSitemap, sitemapUrls, rawContent } =
    await fetchRobots(startUrl);
  send("robots", { disallowed, hasSitemap, sitemapUrls, rawContent });

  // Seed queue
  if (source === "sitemap") {
    const smUrls = await fetchSitemap(startUrl);
    send("sitemap", { count: smUrls.length });
    for (const u of smUrls.slice(0, maxPages)) {
      const key = normalizeForCompare(u);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(u);
      }
    }
    if (!queue.length) {
      const ns = normalizeUrl(startUrl);
      visited.add(normalizeForCompare(ns));
      queue.push(ns);
    }
  } else {
    const ns = normalizeUrl(startUrl);
    visited.add(normalizeForCompare(ns));
    queue.push(ns);
  }

  const titleMap = new Map();

  async function crawlOne(url) {
    if (cancelled) return;
    active++;
    try {
      if (rateDelay > 0) await new Promise((r) => setTimeout(r, rateDelay));
      const blocked = isDisallowed(url, disallowed);

      let raw = await fetchRaw(url);
      let totalLoadTimeMs = Number(raw.elapsedMs || 0);
      let firstRedirectTo = raw.redirectTo || "";
      let currentUrl = url;
      let hops = 0;
      while (raw.redirectTo && hops < 10) {
        const dest = raw.redirectTo;
        if (sameUrlLoose(dest, currentUrl)) break;
        if (!visited.has(normalizeForCompare(dest)))
          visited.add(normalizeForCompare(dest));
        const next = await fetchRaw(dest);
        totalLoadTimeMs += Number(next.elapsedMs || 0);
        hops++;
        currentUrl = dest;
        raw = next;
        if (raw.body) break;
      }

      const statusCode = raw.statusCode;
      const finalUrl = currentUrl !== url ? currentUrl : "";
      const meta = raw.body ? extractMeta(raw.body, currentUrl || url) : null;
      const links = raw.body ? extractLinks(raw.body, currentUrl || url) : [];

      for (const link of links) {
        const key = normalizeForCompare(link);
        if (
          isSameDomain(link, baseOrigin) &&
          !visited.has(key) &&
          visited.size < maxPages
        ) {
          visited.add(key);
          queue.push(link);
        }
      }

      let brokenExternalLinks = [];
      if (checkExt && meta?.allLinks) {
        const externalLinks = meta.allLinks.filter(
          (l) => l && !isSameDomain(l, baseOrigin),
        );
        const checks = await Promise.all(
          externalLinks.slice(0, 10).map(async (l) => {
            const broken = await checkExternalLink(l);
            return broken ? l : null;
          }),
        );
        brokenExternalLinks = checks.filter(Boolean);
      }

      let brokenButtonLinks = [];
      let brokenButtonDetails = [];
      if (meta?.buttonLikeItems?.length) {
        const checks = await Promise.all(
          meta.buttonLikeItems.slice(0, 20).map(async (item) => {
            const broken = await checkExternalLink(item.url);
            return broken ? item : null;
          }),
        );
        brokenButtonDetails = checks.filter(Boolean);
        brokenButtonLinks = brokenButtonDetails.map((x) => x.url);
      }
      let brokenImageLinks = [];
      if (meta?.imageUrls?.length) {
        const checks = await Promise.all(
          meta.imageUrls.slice(0, 30).map(async (imgUrl) => {
            const broken = await checkExternalLink(imgUrl);
            return broken ? imgUrl : null;
          }),
        );
        brokenImageLinks = checks.filter(Boolean);
      }
      const loadTimeMs = totalLoadTimeMs;

      // SEO quality score
      const seoQuality = scoreSEO(meta, url);

      const page = {
        url,
        finalUrl,
        statusCode,
        redirectTo: firstRedirectTo,
        meta,
        timeout: raw.timeout || false,
        error: raw.error || "",
        blocked,
        brokenExternalLinks,
        brokenButtonLinks,
        brokenButtonDetails,
        brokenImageLinks,
        loadTimeMs,
        seoQuality,
      };
      page.issues = getIssues(page, crawlLang);

      if (meta?.title) {
        const t = meta.title.toLowerCase();
        if (!titleMap.has(t)) titleMap.set(t, []);
        titleMap.get(t).push(url);
      }

      results.push(page);

      send("page", {
        url: page.url,
        finalUrl: page.finalUrl,
        statusCode: page.statusCode,
        redirectTo: page.redirectTo,
        blocked: page.blocked,
        title: meta?.title || "",
        titleLen: meta?.titleLen || 0,
        description: meta?.description || "",
        descLen: meta?.descLen || 0,
        h1s: meta?.h1s || [],
        headings: meta?.headings || [],
        totalH: meta?.headings?.length || 0,
        headingSkips: meta?.headingSkips || [],
        imgsNoAlt: meta?.imgsNoAlt || 0,
        imgsNoSize: meta?.imgsNoSize || 0,
        totalImgs: meta?.totalImgs || 0,
        brokenImageLinks,
        loadTimeMs,
        canonical: meta?.canonical || "",
        noindex: meta?.noindex || false,
        buttonsNoLink: meta?.buttonsNoLink || 0,
        buttonsNoLinkDetails: meta?.buttonsNoLinkDetails || [],
        brokenButtonLinks,
        brokenButtonDetails,
        pageLang: meta?.pageLang || "",
        brokenExternalLinks,
        seoQuality,
        issues: page.issues.map((i) => ({
          label: i.label,
          type: i.type,
          group: i.group,
        })),
        hasIssues: page.issues.length > 0,
        total: results.length,
        queued: queue.length,
      });
    } catch (e) {
      /* skip */
    }
    active--;
  }

  const CONCURRENCY = 5;
  while ((queue.length > 0 || active > 0) && !cancelled) {
    while (active < CONCURRENCY && queue.length > 0 && !cancelled)
      crawlOne(queue.shift());
    await new Promise((r) => setTimeout(r, 80));
  }

  const duplicates = [];
  for (const [title, urls] of titleMap.entries()) {
    if (urls.length > 1) duplicates.push({ title, urls });
  }

  if (!cancelled) {
    const filePath = await generateExcel(
      results,
      startUrl,
      duplicates,
      crawlLang,
    );
    sessions.set(`file_${sessionId}`, filePath);
    const stats = {
      404: results.filter((r) => r.statusCode === 404).length,
      redirects: results.filter(
        (r) => r.redirectTo && !sameUrlLoose(r.redirectTo, r.url),
      ).length,
      titleIssues: results.filter((r) =>
        r.issues.some((i) => i.group === "titles"),
      ).length,
      descIssues: results.filter((r) =>
        r.issues.some((i) => i.group === "desc"),
      ).length,
      h1Issues: results.filter((r) => r.issues.some((i) => i.group === "h1"))
        .length,
      imgIssues: results.filter((r) =>
        r.issues.some((i) => i.group === "images"),
      ).length,
      brokenImages: results.filter((r) => (r.brokenImageLinks || []).length)
        .length,
      functionalityIssues: results.filter((r) =>
        r.issues.some((i) => i.group === "functionality"),
      ).length,
      buttonsNoLink: results.filter((r) => (r.meta?.buttonsNoLink || 0) > 0)
        .length,
      brokenButtons: results.filter((r) => (r.brokenButtonLinks || []).length)
        .length,
      slowLoad: results.filter((r) => (r.loadTimeMs || 0) >= 3000).length,
      noindex: results.filter((r) => r.meta && r.meta.noindex).length,
      blocked: results.filter((r) => r.blocked).length,
      duplicates: duplicates.length,
      headingSkips: results.filter((r) => r.meta?.headingSkips?.length > 0)
        .length,
    };
    const withIssues = results.filter((r) => r.issues.length > 0).length;
    const createdRun = await prisma.crawlRun.create({
      data: {
        userId: req.user.id,
        projectId: project.id,
        sourceUrl: startUrl,
        source,
        maxPages,
        rateDelay,
        checkExt,
        total: results.length,
        withIssues,
        stats,
        duplicates,
        pages: results,
        downloadName: path.basename(filePath),
        status: "completed",
      },
      select: { id: true },
    });
    sessions.set(`file_${sessionId}`, {
      filePath,
      userId: req.user.id,
      projectId: project.id,
      runId: createdRun.id,
    });
    send("done", {
      total: results.length,
      withIssues,
      stats,
      duplicates,
      downloadUrl: `/api/download/${sessionId}`,
      fileName: path.basename(filePath),
      runId: createdRun.id,
    });
  }

  sessions.delete(sessionId);
  res.end();
});

app.get("/api/download/:sessionId", requireAuth, (req, res) => {
  const fileSession = sessions.get(`file_${req.params.sessionId}`);
  if (
    !fileSession ||
    fileSession.userId !== req.user.id ||
    !fs.existsSync(fileSession.filePath)
  )
    return res.status(404).json({ error: "Archivo no encontrado" });
  res.download(fileSession.filePath, path.basename(fileSession.filePath), () => {
    fs.unlink(fileSession.filePath, () => {});
    sessions.delete(`file_${req.params.sessionId}`);
  });
});

//  Excel
async function generateExcel(results, siteUrl, duplicates, crawlLang = "es") {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SEO Crawler";
  wb.created = new Date();
  const C = {
    errorBg: "FFEBEE",
    warnBg: "FFF8E1",
    okBg: "E8F5E9",
    alt: "F7F7F7",
    hdrBg: "1A1A1A",
    hdrFg: "00FF88",
    purpleBg: "F3E8FF",
  };
  const hF = {
    name: "Consolas",
    bold: true,
    color: { argb: C.hdrFg },
    size: 10,
  };
  const bF = { name: "Consolas", size: 9 };
  const lft = { horizontal: "left", vertical: "middle", wrapText: true };
  const ctr = { horizontal: "center", vertical: "middle", wrapText: true };
  const T = (es, en) => (crawlLang === "en" ? en : es);

  function styleHeader(ws) {
    const r = ws.getRow(1);
    r.height = 26;
    r.eachCell((c) => {
      c.font = hF;
      c.alignment = ctr;
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: C.hdrBg },
      };
      c.border = { bottom: { style: "medium", color: { argb: "00FF88" } } };
    });
  }
  function styleRow(r, bg) {
    r.height = 20;
    r.eachCell((c) => {
      c.font = bF;
      c.alignment = lft;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      c.border = { bottom: { style: "hair", color: { argb: "EEEEEE" } } };
    });
  }

  const total = results.length;
  const withIssues = results.filter((r) => r.issues.length > 0).length;

  // Resumen
  const ws1 = wb.addWorksheet(T("Resumen", "Summary"));
  ws1.views = [{ showGridLines: false }];
  ws1.columns = [{ width: 2 }, { width: 40 }, { width: 16 }, { width: 2 }];
  ws1.getRow(1).height = 40;
  ws1.mergeCells("B1:C1");
  Object.assign(ws1.getCell("B1"), {
    value: "SEO CRAWLER  REPORT",
    font: { name: "Consolas", bold: true, size: 20 },
    alignment: lft,
  });
  ws1.mergeCells("B2:C2");
  ws1.getCell("B2").value = siteUrl;
  ws1.getCell("B2").font = {
    name: "Consolas",
    size: 10,
    color: { argb: "555555" },
  };
  ws1.mergeCells("B3:C3");
  ws1.getCell("B3").value = new Date().toLocaleString("es-MX");
  ws1.getCell("B3").font = {
    name: "Consolas",
    size: 9,
    italic: true,
    color: { argb: "999999" },
  };
  ws1.getRow(4).height = 14;

  const metrics = [
    [T("TOTAL PGINAS", "TOTAL PAGES"), total, null, null],
    [T("Con problemas", "With issues"), withIssues, C.errorBg, "FF5252"],
    [T("Sin problemas", "No issues"), total - withIssues, C.okBg, "4CAF50"],
    [null],
    [T(" Ttulos ", " Titles "), "", null, null],
    [
      T("Sin ttulo", "No title"),
      results.filter((r) => r.issues.some((i) => i.type === "no_title")).length,
      C.errorBg,
      null,
    ],
    [
      T("Ttulo corto", "Short title"),
      results.filter((r) => r.issues.some((i) => i.type === "title_short"))
        .length,
      C.warnBg,
      null,
    ],
    [
      T("Ttulo largo", "Long title"),
      results.filter((r) => r.issues.some((i) => i.type === "title_long"))
        .length,
      C.warnBg,
      null,
    ],
    [
      T("Duplicados", "Duplicates"),
      duplicates.length,
      duplicates.length > 0 ? C.warnBg : C.okBg,
      null,
    ],
    [null],
    [T(" Descriptions ", " Descriptions "), "", null, null],
    [
      T("Sin description", "No description"),
      results.filter((r) => r.issues.some((i) => i.type === "no_desc")).length,
      C.errorBg,
      null,
    ],
    [
      T("Desc corta", "Short desc"),
      results.filter((r) => r.issues.some((i) => i.type === "desc_short"))
        .length,
      C.warnBg,
      null,
    ],
    [
      T("Desc larga", "Long desc"),
      results.filter((r) => r.issues.some((i) => i.type === "desc_long"))
        .length,
      C.warnBg,
      null,
    ],
    [null],
    [T(" Estructura ", " Structure "), "", null, null],
    [
      T("Sin H1", "No H1"),
      results.filter((r) => r.issues.some((i) => i.type === "no_h1")).length,
      C.errorBg,
      null,
    ],
    [
      T("Mltiples H1", "Multi H1"),
      results.filter((r) => r.issues.some((i) => i.type === "multi_h1")).length,
      C.warnBg,
      null,
    ],
    [
      T("Saltos heading", "Heading skips"),
      results.filter((r) => r.meta?.headingSkips?.length > 0).length,
      C.warnBg,
      null,
    ],
    [
      T("Imgs sin alt", "Imgs no alt"),
      results.filter((r) => r.issues.some((i) => i.type === "imgs_no_alt"))
        .length,
      C.warnBg,
      null,
    ],
    [null],
    [T(" Tcnico ", " Technical "), "", null, null],
    [
      "404",
      results.filter((r) => r.statusCode === 404).length,
      C.errorBg,
      null,
    ],
    [
      T("Redirecciones", "Redirects"),
      results.filter((r) => r.redirectTo && !sameUrlLoose(r.redirectTo, r.url))
        .length,
      C.warnBg,
      null,
    ],
    [
      "Noindex",
      results.filter((r) => r.meta && r.meta.noindex).length,
      C.warnBg,
      null,
    ],
    [
      T("Bloqueadas", "Blocked"),
      results.filter((r) => r.blocked).length,
      C.warnBg,
      null,
    ],
  ];

  let row = 5;
  for (const [label, val, bg, color] of metrics) {
    if (!label && val === undefined) {
      row++;
      continue;
    }
    const r = ws1.getRow(row);
    r.height = label?.includes("") ? 22 : 24;
    const lc = r.getCell(2),
      vc = r.getCell(3);
    lc.value = label;
    lc.font = {
      name: "Consolas",
      size: 10,
      bold: !!label?.includes("") || row === 5,
    };
    lc.alignment = lft;
    vc.value = val !== "" ? val : "";
    vc.font = {
      name: "Consolas",
      bold: true,
      size: label?.includes("") ? 10 : 13,
    };
    vc.alignment = ctr;
    if (bg)
      for (const c of [lc, vc]) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        c.border = {
          top: { style: "thin", color: { argb: "DDDDDD" } },
          bottom: { style: "thin", color: { argb: "DDDDDD" } },
          left: { style: "thin", color: { argb: "DDDDDD" } },
          right: { style: "thin", color: { argb: "DDDDDD" } },
        };
      }
    row++;
  }

  // Todas las pginas
  const ws2 = wb.addWorksheet(T("Todas las pginas", "All pages"));
  ws2.views = [{ showGridLines: false, state: "frozen", xSplit: 0, ySplit: 1 }];
  ws2.columns = [
    { header: "URL", key: "url", width: 50 },
    { header: "HTTP", key: "status", width: 8 },
    { header: T("Ttulo", "Title"), key: "title", width: 40 },
    { header: "Chars T.", key: "tlen", width: 9 },
    { header: T("Description", "Description"), key: "desc", width: 45 },
    { header: "Chars D.", key: "dlen", width: 9 },
    { header: "H1", key: "h1", width: 35 },
    { header: "# H1", key: "h1n", width: 6 },
    { header: T("Saltos H", "H Skips"), key: "hskips", width: 20 },
    { header: T("Imgs s/alt", "Imgs no alt"), key: "imgs", width: 10 },
    { header: "Canonical", key: "canon", width: 40 },
    { header: T("Redirect", "Redirect"), key: "redir", width: 40 },
    { header: T("Problemas", "Issues"), key: "issues", width: 60 },
    { header: T("Score ttulo", "Title score"), key: "tscore", width: 11 },
    { header: T("Score desc", "Desc score"), key: "dscore", width: 11 },
  ];
  styleHeader(ws2);
  results.forEach((p, i) => {
    const hasRR = p.redirectTo && !sameUrlLoose(p.redirectTo, p.url);
    const r = ws2.addRow({
      url: p.url,
      status: p.statusCode || "T/O",
      title: p.meta?.title || "",
      tlen: p.meta?.titleLen || 0,
      desc: p.meta?.description || "",
      dlen: p.meta?.descLen || 0,
      h1: p.meta?.h1s?.[0] || "",
      h1n: p.meta?.h1s?.length || 0,
      hskips:
        p.meta?.headingSkips?.map((s) => `${s.from}${s.to}`).join(", ") || "",
      imgs: p.meta?.imgsNoAlt || 0,
      canon: p.meta?.canonical || "",
      redir: hasRR ? p.redirectTo : "",
      issues: p.issues.map((x) => x.label).join("  ") || "OK",
      tscore: p.seoQuality?.titleScore || 0,
      dscore: p.seoQuality?.descScore || 0,
    });
    const bg =
      p.statusCode === 404
        ? C.errorBg
        : hasRR || p.meta?.noindex
          ? C.warnBg
          : p.issues.length > 0
            ? C.warnBg
            : i % 2 === 0
              ? "FFFFFF"
              : C.alt;
    styleRow(r, bg);
  });

  // Problemas
  const ws3 = wb.addWorksheet(T("Problemas", "Issues"));
  ws3.views = [{ showGridLines: false, state: "frozen", xSplit: 0, ySplit: 1 }];
  ws3.columns = [
    { header: "URL", key: "url", width: 50 },
    { header: "HTTP", key: "status", width: 8 },
    { header: T("Grupo", "Group"), key: "group", width: 12 },
    { header: T("Problemas", "Issues"), key: "issues", width: 55 },
    { header: T("Ttulo", "Title"), key: "title", width: 35 },
    { header: T("Description", "Description"), key: "desc", width: 40 },
  ];
  styleHeader(ws3);
  results
    .filter((p) => p.issues.length > 0)
    .forEach((p, i) => {
      const r = ws3.addRow({
        url: p.url,
        status: p.statusCode || "T/O",
        group: [...new Set(p.issues.map((x) => x.group))].join(", "),
        issues: p.issues.map((x) => x.label).join("  "),
        title: p.meta?.title || "",
        desc: p.meta?.description || "",
      });
      styleRow(r, i % 2 === 0 ? "FFFFFF" : C.alt);
    });

  // Duplicados
  if (duplicates.length > 0) {
    const ws4 = wb.addWorksheet(T("Duplicados", "Duplicates"));
    ws4.views = [
      { showGridLines: false, state: "frozen", xSplit: 0, ySplit: 1 },
    ];
    ws4.columns = [
      { header: T("Ttulo", "Title"), key: "title", width: 55 },
      { header: "URLs", key: "urls", width: 80 },
    ];
    styleHeader(ws4);
    duplicates.forEach((d, i) => {
      const r = ws4.addRow({ title: d.title, urls: d.urls.join("\n") });
      r.height = 18 * d.urls.length;
      styleRow(r, i % 2 === 0 ? C.purpleBg : "FFFFFF");
    });
  }

  const tmpFile = path.join(os.tmpdir(), `seo-report-${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(tmpFile);
  return tmpFile;
}

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/home.html")),
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html")),
);
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/home.html")),
);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`\n  SEO Crawler en http://localhost:${PORT}\n`),
);
