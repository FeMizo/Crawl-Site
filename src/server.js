const express = require("express");
const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const https = require("https");
const http = require("http");
const tls = require("tls");
const zlib = require("zlib");
const dns = require("dns").promises;
const { URL } = require("url");
const ExcelJS = require("exceljs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const net = require("net");
const Stripe = require("stripe");
const { PrismaClient } = require("@prisma/client");
const {
  normalizeEmail,
  validateEmail,
  validatePhoneInput,
} = require("../lib/contact-validation");
const {
  USER_ROLE,
  buildRolePermissions,
  canAssignRole,
  canManageTarget,
  canManageUsers,
  getAssignedRole,
  getEffectiveRole,
  getOwnerEmails,
  getRoleLabel,
  normalizeRole,
} = require("../lib/user-roles");
const {
  getPublicError,
  logServerError,
} = require("../lib/server-error-utils");

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return acc;

      const separator = line.indexOf("=");
      if (separator < 0) return acc;

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

function preferLocalDatabaseInDevelopment() {
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") return;

  const currentUrl = String(process.env.dashboard_DATABASE_URL || "");
  if (!/neon\.tech/i.test(currentUrl)) return;

  const localEnv = readDotEnvFile(path.join(process.cwd(), ".env"));
  const localUrl = String(localEnv.dashboard_DATABASE_URL || "");
  if (!/(localhost|127\.0\.0\.1)/i.test(localUrl)) return;

  process.env.dashboard_DATABASE_URL = localUrl;

  if (localEnv.dashboard_DATABASE_URL_UNPOOLED) {
    process.env.dashboard_DATABASE_URL_UNPOOLED =
      localEnv.dashboard_DATABASE_URL_UNPOOLED;
  }
}

preferLocalDatabaseInDevelopment();

const app = express();
const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (isProd) {
    throw new Error("JWT_SECRET must be set in production environment");
  }

  console.warn(
    "Warning: JWT_SECRET not set — using insecure fallback for development",
  );
  return "change-this-local-secret";
}

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: "Stripe not configured" });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (!userId || !plan || !PLAN_DEFAULTS[plan]) break;

        const defaults = PLAN_DEFAULTS[plan];
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            stripeCustomerId: session.customer,
            stripeSubId: session.subscription,
            maxProjects: defaults.maxProjects,
            maxPagesPerCrawl: defaults.maxPagesPerCrawl,
            maxCrawlsPerMonth: defaults.maxCrawlsPerMonth,
            maxHistoryRuns: defaults.maxHistoryRuns,
            features: defaults.features,
            expiresAt: null, // Stripe manages billing cycle
            cancelledAt: null,
          },
          update: {
            plan,
            stripeCustomerId: session.customer,
            stripeSubId: session.subscription,
            maxProjects: defaults.maxProjects,
            maxPagesPerCrawl: defaults.maxPagesPerCrawl,
            maxCrawlsPerMonth: defaults.maxCrawlsPerMonth,
            maxHistoryRuns: defaults.maxHistoryRuns,
            features: defaults.features,
            expiresAt: null,
            cancelledAt: null,
          },
        });
        console.log(`Stripe: ${userId} upgraded to ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubId: subscription.id },
        });
        if (!existing) break;

        if (subscription.cancel_at_period_end) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { cancelledAt: new Date() },
          });
          console.log(`Stripe: subscription ${subscription.id} will cancel at period end`);
        } else if (existing.cancelledAt) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { cancelledAt: null },
          });
          console.log(`Stripe: subscription ${subscription.id} reactivated`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubId: subscription.id },
        });
        if (!existing) break;

        const freeDefaults = PLAN_DEFAULTS.FREE;
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: "FREE",
            stripeSubId: null,
            maxProjects: freeDefaults.maxProjects,
            maxPagesPerCrawl: freeDefaults.maxPagesPerCrawl,
            maxCrawlsPerMonth: freeDefaults.maxCrawlsPerMonth,
            maxHistoryRuns: freeDefaults.maxHistoryRuns,
            features: freeDefaults.features,
            cancelledAt: new Date(),
          },
        });
        console.log(`Stripe: subscription ${subscription.id} deleted, reverted to FREE`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const existing = await prisma.subscription.findFirst({
          where: { stripeCustomerId: invoice.customer },
        });
        if (existing) {
          console.warn(`Stripe: payment failed for customer ${invoice.customer} (user sub ${existing.id})`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : "http://localhost:3000",
    credentials: true,
  }),
);

const crawlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.CRAWL_MAX_PER_MIN
    ? parseInt(process.env.CRAWL_MAX_PER_MIN)
    : 2,
  standardHeaders: true,
  legacyHeaders: false,
});

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

function normalizeDisplayName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function resolveUserRoleData(user) {
  if (!user) {
    return {
      assignedRole: USER_ROLE.USER,
      role: USER_ROLE.USER,
      roleLabel: getRoleLabel(USER_ROLE.USER),
      permissions: buildRolePermissions(null),
    };
  }

  const assignedRole = getAssignedRole(user);
  const role = getEffectiveRole(user);
  return {
    assignedRole,
    role,
    roleLabel: getRoleLabel(role),
    permissions: buildRolePermissions(user),
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const phone = validatePhoneInput(user.phoneCountry, user.phoneNumber, {
    required: false,
  });
  const roleData = resolveUserRoleData(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    assignedRole: roleData.assignedRole,
    role: roleData.role,
    roleLabel: roleData.roleLabel,
    permissions: roleData.permissions,
    phoneCountry: phone.country?.code || null,
    phoneNumber: phone.digits || "",
    phoneE164: phone.e164,
    createdAt: user.createdAt,
  };
}

async function buildMePayload(user, options = {}) {
  const includeCounts = options.includeCounts === true;

  if (!user) {
    return includeCounts
      ? {
          user: null,
          counts: { projects: 0, crawlRuns: 0 },
        }
      : { user: null };
  }

  if (!includeCounts) {
    const sub = await getUserSubscription(user.id);
    return { user: sanitizeUser(user), subscription: { plan: sub.plan, features: sub.features } };
  }

  const [projectCount, crawlRunCount, sub] = await Promise.all([
    prisma.project.count({ where: { userId: user.id } }),
    prisma.crawlRun.count({ where: { userId: user.id } }),
    getUserSubscription(user.id),
  ]);

  return {
    user: sanitizeUser(user),
    counts: { projects: projectCount, crawlRuns: crawlRunCount },
    subscription: {
      plan: sub.plan,
      maxProjects: sub.maxProjects,
      maxPagesPerCrawl: sub.maxPagesPerCrawl,
      maxCrawlsPerMonth: sub.maxCrawlsPerMonth,
      features: sub.features,
      expiresAt: sub.expiresAt,
    },
  };
}

function createAuthToken(user) {
  return jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "7d" });
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

function handleApiError(res, req, context, error, fallbackMessage) {
  logServerError(context, error, {
    path: req.originalUrl || req.url,
    method: req.method,
  });
  const publicError = getPublicError(error, fallbackMessage);
  if (res.headersSent) return;
  return res.status(publicError.status).json({ error: publicError.message });
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "No autenticado" });
    const payload = jwt.verify(token, getJwtSecret());
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Sesion invalida" });
    }
    req.user = user;
    next();
  } catch (error) {
    if (!process.env.JWT_SECRET && isProd) {
      return res
        .status(500)
        .json({ error: "Falta JWT_SECRET en el entorno de produccion" });
    }
    if (error?.name !== "JsonWebTokenError" && error?.name !== "TokenExpiredError") {
      logServerError("auth/require", error, {
        path: req.originalUrl || req.url,
        method: req.method,
      });
    }
    clearAuthCookie(res);
    return res.status(401).json({ error: "Sesion invalida" });
  }
}

function requireUserManagement(req, res, next) {
  if (!canManageUsers(req.user)) {
    return res
      .status(403)
      .json({ error: "No tienes permisos para administrar usuarios" });
  }
  return next();
}

// --- Plan limits ---
const PLAN_DEFAULTS = {
  FREE:    { maxProjects: 1,  maxPagesPerCrawl: 50,   maxCrawlsPerMonth: 2,   maxHistoryRuns: 1,   features: [] },
  STARTER: { maxProjects: 5,  maxPagesPerCrawl: 500,  maxCrawlsPerMonth: 10,  maxHistoryRuns: 10,  features: ["excel_report"] },
  PRO:     { maxProjects: 20, maxPagesPerCrawl: 2000, maxCrawlsPerMonth: 999, maxHistoryRuns: 50,  features: ["excel_report", "architecture", "performance", "scheduled_crawl"] },
  AGENCY:  { maxProjects: 999, maxPagesPerCrawl: 10000, maxCrawlsPerMonth: 999, maxHistoryRuns: 999, features: ["excel_report", "architecture", "performance", "scheduled_crawl", "api_access", "white_label", "multi_user"] },
};

// Stripe price IDs from env — map plan names to Stripe Price IDs
const STRIPE_PRICES = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PRO: process.env.STRIPE_PRICE_PRO,
  AGENCY: process.env.STRIPE_PRICE_AGENCY,
};

const PLAN_DISPLAY_PRICES = { FREE: 0, STARTER: 499, PRO: 1299, AGENCY: 2999 };
const PLAN_CURRENCY = "MXN";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function getOrCreateStripeCustomer(stripe, user, existingSub) {
  if (existingSub?.stripeCustomerId) {
    return existingSub.stripeCustomerId;
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });
  return customer.id;
}

async function getUserSubscription(userId) {
  let sub = null;
  try {
    sub = await prisma.subscription.findUnique({ where: { userId } });
  } catch {
    // Table may not exist yet (pre-migration)
  }
  if (!sub) return { plan: "FREE", ...PLAN_DEFAULTS.FREE };
  const planKey = sub.plan || "FREE";
  const defaults = PLAN_DEFAULTS[planKey] || PLAN_DEFAULTS.FREE;
  return {
    id: sub.id,
    plan: planKey,
    maxProjects: sub.maxProjects || defaults.maxProjects,
    maxPagesPerCrawl: sub.maxPagesPerCrawl || defaults.maxPagesPerCrawl,
    maxCrawlsPerMonth: sub.maxCrawlsPerMonth || defaults.maxCrawlsPerMonth,
    maxHistoryRuns: sub.maxHistoryRuns || defaults.maxHistoryRuns,
    features: sub.features?.length ? sub.features : defaults.features,
    expiresAt: sub.expiresAt,
    cancelledAt: sub.cancelledAt,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubId: sub.stripeSubId,
  };
}

function hasFeature(subscription, feature) {
  return subscription.features.includes(feature);
}

function isPlanExpired(subscription) {
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt) < new Date();
}

async function requirePlanLimit(type) {
  return async (req, res, next) => {
    try {
      const sub = await getUserSubscription(req.user.id);
      if (isPlanExpired(sub) && sub.plan !== "FREE") {
        sub.plan = "FREE";
        Object.assign(sub, PLAN_DEFAULTS.FREE);
      }
      req.subscription = sub;

      if (type === "project") {
        const projectCount = await prisma.project.count({ where: { userId: req.user.id } });
        if (projectCount >= sub.maxProjects) {
          return res.status(403).json({
            error: "Lmite de proyectos alcanzado",
            errorEn: "Project limit reached",
            limit: sub.maxProjects,
            plan: sub.plan,
            upgrade: true,
          });
        }
      }

      if (type === "crawl") {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const crawlCount = await prisma.crawlRun.count({
          where: {
            userId: req.user.id,
            createdAt: { gte: monthStart },
          },
        });
        if (crawlCount >= sub.maxCrawlsPerMonth) {
          return res.status(403).json({
            error: "Lmite de crawls mensuales alcanzado",
            errorEn: "Monthly crawl limit reached",
            limit: sub.maxCrawlsPerMonth,
            current: crawlCount,
            plan: sub.plan,
            upgrade: true,
          });
        }
      }

      if (type === "feature") {
        const feature = req.query.feature || req.body?.feature;
        if (feature && !hasFeature(sub, feature)) {
          return res.status(403).json({
            error: "Funcin no disponible en tu plan",
            errorEn: "Feature not available in your plan",
            feature,
            plan: sub.plan,
            upgrade: true,
          });
        }
      }

      next();
    } catch (error) {
      handleApiError(res, req, "plan-limit", error, "Error verificando plan");
    }
  };
}

async function attachSubscription(req, res, next) {
  try {
    const sub = await getUserSubscription(req.user.id);
    if (isPlanExpired(sub) && sub.plan !== "FREE") {
      sub.plan = "FREE";
      Object.assign(sub, PLAN_DEFAULTS.FREE);
    }
    req.subscription = sub;
    next();
  } catch (error) {
    handleApiError(res, req, "attach-subscription", error, "Error cargando plan");
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

function parsePaginationParams(query, options = {}) {
  const defaultLimit = Number.isInteger(options.defaultLimit)
    ? options.defaultLimit
    : 20;
  const maxLimit = Number.isInteger(options.maxLimit) ? options.maxLimit : 50;
  const pageValue = parseInt(String(query?.page || "1"), 10);
  const limitValue = parseInt(String(query?.limit || defaultLimit), 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit = Number.isFinite(limitValue) && limitValue > 0
    ? Math.min(limitValue, maxLimit)
    : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function buildPaginationMeta(total, page, limit) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const pageCount = safeTotal > 0 ? Math.ceil(safeTotal / limit) : 1;
  const safePage = Math.min(page, pageCount);

  return {
    page: safePage,
    limit,
    total: safeTotal,
    pageCount,
    hasPrev: safePage > 1,
    hasNext: safePage < pageCount,
  };
}

function normalizeSearchQuery(value, maxLength = 64) {
  return String(value || "").trim().slice(0, maxLength);
}

function getManageableRoles(actor) {
  const actorRole = getEffectiveRole(actor);
  if (actorRole === USER_ROLE.OWNER) return null;
  if (actorRole === USER_ROLE.SUPER_ADMIN) {
    return [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN, USER_ROLE.EDITOR, USER_ROLE.USER];
  }
  if (actorRole === USER_ROLE.ADMIN) {
    return [USER_ROLE.EDITOR, USER_ROLE.USER];
  }
  return [];
}

function buildAdminUsersWhere(actor, search, roleFilter) {
  const ownerEmails = Array.from(getOwnerEmails());
  const manageableRoles = getManageableRoles(actor);
  const filters = [];

  if (manageableRoles && manageableRoles.length === 0) {
    return { id: "__no_manageable_users__" };
  }

  if (roleFilter !== "all") {
    if (
      roleFilter === USER_ROLE.OWNER &&
      getEffectiveRole(actor) !== USER_ROLE.OWNER
    ) {
      return { id: "__no_manageable_users__" };
    }

    if (manageableRoles && !manageableRoles.includes(roleFilter)) {
      return { id: "__no_manageable_users__" };
    }

    if (roleFilter === USER_ROLE.OWNER) {
      filters.push({
        OR: [
          { role: USER_ROLE.OWNER.toUpperCase() },
          ...(ownerEmails.length ? [{ email: { in: ownerEmails } }] : []),
        ],
      });
    } else {
      filters.push({ role: roleFilter.toUpperCase() });
    }
  } else if (manageableRoles) {
    filters.push({
      role: { in: manageableRoles.map((role) => role.toUpperCase()) },
    });
  }

  if (getEffectiveRole(actor) !== USER_ROLE.OWNER && ownerEmails.length) {
    filters.push({ email: { notIn: ownerEmails } });
  }

  if (search) {
    const normalizedSearch = search.toLowerCase();
    const explicitlyMatchedRole = [
      USER_ROLE.OWNER,
      USER_ROLE.SUPER_ADMIN,
      USER_ROLE.ADMIN,
      USER_ROLE.EDITOR,
      USER_ROLE.USER,
    ].includes(normalizedSearch)
      ? normalizedSearch
      : null;
    const matchedRoles = [
      ...new Set(
        [explicitlyMatchedRole]
          .concat(
            [
              USER_ROLE.OWNER,
              USER_ROLE.SUPER_ADMIN,
              USER_ROLE.ADMIN,
              USER_ROLE.EDITOR,
              USER_ROLE.USER,
            ].filter(
              (role) =>
                role.includes(normalizedSearch) ||
                getRoleLabel(role).toLowerCase().includes(normalizedSearch),
            ),
          ),
      ),
    ].filter(Boolean);

    const searchFilters = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];

    if (matchedRoles.length) {
      searchFilters.push({
        role: {
          in: matchedRoles.map((role) => role.toUpperCase()),
        },
      });
      if (matchedRoles.includes(USER_ROLE.OWNER) && ownerEmails.length) {
        searchFilters.push({ email: { in: ownerEmails } });
      }
    }

    filters.push({ OR: searchFilters });
  }

  return filters.length ? { AND: filters } : {};
}

const ADMIN_USER_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phoneCountry: true,
  phoneNumber: true,
  createdAt: true,
};

function setPrivateApiCache(res, maxAgeSeconds = 15, swrSeconds = 60) {
  res.setHeader(
    "Cache-Control",
    `private, max-age=${maxAgeSeconds}, stale-while-revalidate=${swrSeconds}`,
  );
}

function normalizeStoredRunPage(page) {
  if (!page || typeof page !== "object") return null;
  return {
    ...page,
    issues: Array.isArray(page.issues) ? page.issues : [],
  };
}

function serializeRunPageRow(page, position) {
  return {
    position,
    url: String(page?.url || ""),
    finalUrl: page?.finalUrl ? String(page.finalUrl) : null,
    statusCode: Number.isFinite(Number(page?.statusCode))
      ? Number(page.statusCode)
      : null,
    hasIssues: Array.isArray(page?.issues) && page.issues.length > 0,
    title: page?.title ? String(page.title).slice(0, 512) : null,
    titleLen: Number(page?.titleLen || 0),
    description: page?.description ? String(page.description).slice(0, 2048) : null,
    descLen: Number(page?.descLen || 0),
    payload: normalizeStoredRunPage(page),
  };
}

function serializeRunDuplicateRow(duplicate, position) {
  const urls = Array.isArray(duplicate?.urls) ? duplicate.urls : [];
  return {
    position,
    title: String(duplicate?.title || "").slice(0, 512),
    urlCount: urls.length,
    payload: {
      title: String(duplicate?.title || ""),
      urls,
    },
  };
}

function mapStoredRunPage(row) {
  return normalizeStoredRunPage(row?.payload);
}

function mapStoredRunDuplicate(row) {
  if (!row?.payload || typeof row.payload !== "object") return null;
  return {
    title: String(row.payload.title || row.title || ""),
    urls: Array.isArray(row.payload.urls) ? row.payload.urls : [],
  };
}

async function loadRunPagesForResponse(runId) {
  const rows = await prisma.crawlRunPage.findMany({
    where: { runId },
    orderBy: { position: "asc" },
    select: { payload: true },
  });
  return rows.map(mapStoredRunPage).filter(Boolean);
}

async function loadRunDuplicatesForResponse(runId) {
  const rows = await prisma.crawlRunDuplicate.findMany({
    where: { runId },
    orderBy: { position: "asc" },
    select: { title: true, payload: true },
  });
  return rows.map(mapStoredRunDuplicate).filter(Boolean);
}

function normalizeRunSourceType(sourceType) {
  const value = String(sourceType || "crawl").trim();
  return value || "crawl";
}

function serializeRunStatus(status) {
  return String(status || "COMPLETED").toLowerCase();
}

async function loadStoredRunPageChunk(runId, page, limit) {
  const where = { runId };
  const total = await prisma.crawlRunPage.count({ where });
  const pagination = buildPaginationMeta(total, page, limit);
  const rows = await prisma.crawlRunPage.findMany({
    where,
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
    orderBy: { position: "asc" },
    select: { payload: true },
  });
  return {
    items: rows.map(mapStoredRunPage).filter(Boolean),
    pagination,
  };
}

async function loadStoredRunDuplicateChunk(runId, page, limit) {
  const where = { runId };
  const total = await prisma.crawlRunDuplicate.count({ where });
  const pagination = buildPaginationMeta(total, page, limit);
  const rows = await prisma.crawlRunDuplicate.findMany({
    where,
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
    orderBy: { position: "asc" },
    select: { title: true, payload: true },
  });
  return {
    items: rows.map(mapStoredRunDuplicate).filter(Boolean),
    pagination,
  };
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

function parseHstsMaxAge(value) {
  const match = String(value || "").match(/max-age\s*=\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function parseSecurityHeaders(headers) {
  const hsts = getHeader(headers, "strict-transport-security");
  const csp = getHeader(headers, "content-security-policy");
  const xfo = getHeader(headers, "x-frame-options");
  const xcto = getHeader(headers, "x-content-type-options");
  const rp = getHeader(headers, "referrer-policy");
  const pp = getHeader(headers, "permissions-policy");
  const coop = getHeader(headers, "cross-origin-opener-policy");
  const corp = getHeader(headers, "cross-origin-resource-policy");
  const coep = getHeader(headers, "cross-origin-embedder-policy");

  let score = 0;
  const breakdown = {};
  const addScore = (key, value) => {
    const numeric = Number(value || 0);
    breakdown[key] = numeric;
    score += numeric;
  };

  if (!csp) {
    addScore("contentSecurityPolicy", 0);
  } else {
    const hasDirective =
      /(default-src|script-src|object-src|base-uri|frame-ancestors)/i.test(csp);
    const hasUnsafe = /unsafe-inline|unsafe-eval/i.test(csp);
    addScore(
      "contentSecurityPolicy",
      hasDirective && !hasUnsafe ? 22 : hasDirective ? 16 : 10,
    );
  }

  if (!hsts) {
    addScore("strictTransportSecurity", 0);
  } else {
    const maxAge = parseHstsMaxAge(hsts);
    const hasSubdomains = /includesubdomains/i.test(hsts);
    addScore(
      "strictTransportSecurity",
      maxAge >= 15552000 && hasSubdomains ? 18 : maxAge >= 31536000 ? 14 : 9,
    );
  }

  if (!xfo) {
    addScore("xFrameOptions", 0);
  } else {
    addScore("xFrameOptions", /^(deny|sameorigin)$/i.test(xfo.trim()) ? 10 : 5);
  }

  if (!xcto) {
    addScore("xContentTypeOptions", 0);
  } else {
    addScore("xContentTypeOptions", /nosniff/i.test(xcto) ? 8 : 4);
  }

  if (!rp) {
    addScore("referrerPolicy", 0);
  } else {
    addScore(
      "referrerPolicy",
      /^(no-referrer|same-origin|strict-origin|strict-origin-when-cross-origin)$/i.test(
        rp.trim(),
      )
        ? 8
        : 4,
    );
  }

  addScore("permissionsPolicy", pp ? 8 : 0);

  if (!coop) {
    addScore("crossOriginOpenerPolicy", 0);
  } else {
    addScore(
      "crossOriginOpenerPolicy",
      /^(same-origin)$/i.test(coop.trim())
        ? 8
        : /^(same-origin-allow-popups)$/i.test(coop.trim())
          ? 6
          : 3,
    );
  }

  if (!corp) {
    addScore("crossOriginResourcePolicy", 0);
  } else {
    addScore(
      "crossOriginResourcePolicy",
      /^(same-origin|same-site|cross-origin)$/i.test(corp.trim()) ? 8 : 4,
    );
  }

  if (!coep) {
    addScore("crossOriginEmbedderPolicy", 0);
  } else {
    addScore(
      "crossOriginEmbedderPolicy",
      /^(require-corp|credentialless)$/i.test(coep.trim()) ? 10 : 5,
    );
  }

  const headerMap = [
    ["Strict-Transport-Security", hsts],
    ["Content-Security-Policy", csp],
    ["X-Frame-Options", xfo],
    ["X-Content-Type-Options", xcto],
    ["Referrer-Policy", rp],
    ["Permissions-Policy", pp],
    ["Cross-Origin-Opener-Policy", coop],
    ["Cross-Origin-Resource-Policy", corp],
    ["Cross-Origin-Embedder-Policy", coep],
  ];
  const present = headerMap.filter(([, value]) => Boolean(value)).length;
  const missingHeaders = headerMap
    .filter(([, value]) => !value)
    .map(([name]) => name);
  const criticalMissingHeaders = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
  ].filter((name) => missingHeaders.includes(name));

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const level =
    normalizedScore >= 90
      ? "high"
      : normalizedScore >= 70
        ? "good"
        : normalizedScore >= 40
          ? "medium"
          : "low";

  return {
    score: normalizedScore,
    level,
    presentHeaders: present,
    totalHeaders: headerMap.length,
    missingHeaders,
    criticalMissingHeaders,
    breakdown,
    strictTransportSecurity: hsts || null,
    contentSecurityPolicy: csp || null,
    xFrameOptions: xfo || null,
    xContentTypeOptions: xcto || null,
    referrerPolicy: rp || null,
    permissionsPolicy: pp || null,
    crossOriginOpenerPolicy: coop || null,
    crossOriginResourcePolicy: corp || null,
    crossOriginEmbedderPolicy: coep || null,
  };
}

function inferHostingType(info) {
  const hint = String(info.hostingHint || "").toLowerCase();
  const server = String(info.serverSoftware || "").toLowerCase();
  const dnsProvider = String(info.dnsProvider || "").toLowerCase();

  if (
    hint.includes("cloudflare") ||
    server.includes("cloudflare") ||
    dnsProvider.includes("cloudflare")
  ) {
    return "CDN / Edge proxy";
  }

  if (
    hint.includes("vercel") ||
    hint.includes("netlify") ||
    hint.includes("github pages")
  ) {
    return "Static / Jamstack";
  }

  if (
    hint.includes("node") ||
    server.includes("node") ||
    server.includes("express")
  ) {
    return "Application server (Node.js)";
  }

  if (
    hint.includes("nginx") ||
    hint.includes("apache") ||
    hint.includes("litespeed") ||
    hint.includes("iis")
  ) {
    return "Traditional web server";
  }

  if (info.cms === "Shopify") return "Managed ecommerce";
  if (info.cms) return "Managed CMS";

  return "Custom / unknown";
}

function inferSiteType(info, body = "") {
  const text = String(body || "").toLowerCase();
  const signals = [];

  if (info.cms) signals.push(`CMS: ${info.cms}`);
  if (info.framework) signals.push(`Framework: ${info.framework}`);
  if (info.hostingHint) signals.push(`Hosting: ${info.hostingHint}`);
  if (/(checkout|cart|product|shop now|add to cart)/i.test(text)) {
    signals.push("Commerce keywords");
  }
  if (/(dashboard|app|workspace|sign in|login)/i.test(text)) {
    signals.push("App flow keywords");
  }
  if (/(blog|article|post|author|read more)/i.test(text)) {
    signals.push("Editorial content keywords");
  }
  if (/(docs|documentation|api reference|developer)/i.test(text)) {
    signals.push("Documentation keywords");
  }

  let primary = "Business / marketing";
  let confidence = 45;
  let purpose = "Presentacion comercial y captacion";

  if (info.cms === "Shopify" || signals.includes("Commerce keywords")) {
    primary = "Ecommerce";
    confidence = info.cms === "Shopify" ? 92 : 78;
    purpose = "Venta en linea y conversion";
  } else if (signals.includes("App flow keywords")) {
    primary = "Web app";
    confidence = info.framework ? 82 : 70;
    purpose = "Flujo de producto y autoservicio";
  } else if (signals.includes("Documentation keywords")) {
    primary = "Documentation";
    confidence = 76;
    purpose = "Soporte tecnico y autoservicio";
  } else if (signals.includes("Editorial content keywords")) {
    primary = "Content / blog";
    confidence = 72;
    purpose = "Publicacion de contenido";
  } else if (info.cms) {
    primary = "CMS site";
    confidence = 68;
    purpose = "Gestion de contenido";
  }

  return {
    primary,
    confidence,
    purpose,
    signals: signals.slice(0, 6),
  };
}

function buildDomainObservations(info) {
  const notes = [];

  if (!info.ip && !info.ipv6) {
    notes.push("No se pudo resolver IP publica del dominio.");
  }

  if (!info.nameservers?.length) {
    notes.push("No se detectaron nameservers; revisa configuracion DNS.");
  }

  if (!info.security) {
    notes.push("No fue posible analizar headers HTTP de seguridad.");
  } else {
    if (
      Array.isArray(info.security.criticalMissingHeaders) &&
      info.security.criticalMissingHeaders.length
    ) {
      notes.push(
        `Faltan headers criticos: ${info.security.criticalMissingHeaders.join(", ")}`,
      );
    }
    if (Number(info.security.score || 0) < 40) {
      notes.push(
        "Nivel de seguridad HTTP bajo; priorizar hardening de headers.",
      );
    }
  }

  if (info.ssl && Number(info.ssl.validDaysRemaining || 0) <= 15) {
    notes.push(
      `Certificado SSL cercano a vencer (${info.ssl.validDaysRemaining} dias).`,
    );
  } else if (!info.ssl) {
    notes.push("Sin certificado SSL detectado para HTTPS.");
  }

  return notes.slice(0, 5);
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
        return resolve(
          withElapsed({
            url,
            statusCode,
            body: "",
            redirectTo,
            headers,
            server,
            powered,
          }),
        );
      }
      if (headOnly || statusCode < 200 || statusCode >= 400) {
        res.resume();
        return resolve(
          withElapsed({
            url,
            statusCode,
            body: "",
            redirectTo: null,
            headers,
            server,
            powered,
          }),
        );
      }
      const ct = res.headers["content-type"] || "";
      // Accept text/html, text/plain (robots.txt), text/xml and application/xml (sitemaps)
      const isText =
        ct.includes("text/html") ||
        ct.includes("text/plain") ||
        ct.includes("xml");
      if (!isText) {
        res.resume();
        return resolve(
          withElapsed({
            url,
            statusCode,
            body: "",
            redirectTo: null,
            nonHtml: true,
            headers,
            server,
            powered,
          }),
        );
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
        resolve(
          withElapsed({
            url,
            statusCode,
            body: Buffer.concat(chunks).toString("utf8"),
            redirectTo: null,
            headers,
            server,
            powered,
          }),
        ),
      );
      stream.on("error", () =>
        resolve(
          withElapsed({
            url,
            statusCode,
            body: "",
            redirectTo: null,
            headers,
            server,
            powered,
          }),
        ),
      );
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(
        withElapsed({
          url,
          statusCode: 0,
          body: "",
          redirectTo: null,
          headers: {},
          timeout: true,
        }),
      );
    });
    req.on("error", (e) =>
      resolve(
        withElapsed({
          url,
          statusCode: 0,
          body: "",
          redirectTo: null,
          headers: {},
          error: e.message,
        }),
      ),
    );
    req.end();
  });
}

//  Site info (hosting, tech stack, DNS)
async function fetchSiteInfo(siteUrl) {
  const info = {
    ip: null,
    ipv6: null,
    aRecords: [],
    dnsProvider: null,
    hostingHint: null,
    hostingType: null,
    hostingLocation: null,
    ipOrganization: null,
    cms: null,
    framework: null,
    serverSoftware: null,
    nameservers: [],
    mxRecords: [],
    cnameRecords: [],
    txtRecords: [],
    dmarcRecords: [],
    siteType: null,
    observations: [],
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
      if (v4.status === "fulfilled") {
        info.aRecords = v4.value.slice(0, 4);
        info.ip = v4.value[0] || null;
      }
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

    // CNAME
    try {
      info.cnameRecords = await dns.resolveCname(hostname).catch(() => []);
    } catch {}

    // TXT + DMARC
    try {
      const txt = await dns.resolveTxt(hostname).catch(() => []);
      const dmarc = await dns.resolveTxt(`_dmarc.${hostname}`).catch(() => []);
      const flatten = (rows) =>
        rows
          .map((parts) =>
            Array.isArray(parts) ? parts.join("") : String(parts || ""),
          )
          .filter(Boolean);
      info.txtRecords = flatten(txt).slice(0, 6);
      info.dmarcRecords = flatten(dmarc).slice(0, 2);
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

      info.siteType = inferSiteType(info, body);
    }
  } catch {}
  info.hostingType = inferHostingType(info);
  if (!info.siteType) {
    info.siteType = inferSiteType(info, "");
  }
  info.observations = buildDomainObservations(info);
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
    const hasWidth = /\bwidth\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'=<>`]+)/i.test(
      tag,
    );
    const hasHeight = /\bheight\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'=<>`]+)/i.test(
      tag,
    );
    return !hasWidth || !hasHeight;
  }).length;
  const totalImgs = imgMatches.length;
  const imageUrls = imgMatches
    .map((m) => {
      const srcMatch = m[0].match(/\bsrc=["']([^"']+)["']/i);
      const src = (srcMatch?.[1] || "").trim();
      if (!src || src.startsWith("data:") || src.startsWith("blob:"))
        return null;
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

  // Placeholder links that look interactive but do not navigate anywhere.
  let placeholderLinks = 0;
  const placeholderLinkDetails = [];
  for (const m of anchorTags) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
    const href = (hrefMatch?.[1] || "").trim().toLowerCase();
    const hasOnClick = /\bonclick\s*=/i.test(attrs);
    const isPlaceholder =
      href === "#" ||
      href === "" ||
      href.startsWith("javascript:") ||
      href.startsWith("void(");
    if (!isPlaceholder) continue;
    placeholderLinks++;
    placeholderLinkDetails.push({
      text:
        inner
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim() || "(sin texto)",
      source: hasOnClick ? "a[onclick]" : "a[href=#]",
      href: href || "#",
    });
  }

  // Form checks (action + submit controls).
  const forms = [...body.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)];
  let formsNoAction = 0;
  const formsNoActionDetails = [];
  let formsNoSubmit = 0;
  const formsNoSubmitDetails = [];

  for (const [idx, formMatch] of forms.entries()) {
    const attrs = formMatch[1] || "";
    const inner = formMatch[2] || "";
    const actionMatch = attrs.match(/\baction=["']([^"']*)["']/i);
    const action = (actionMatch?.[1] || "").trim();
    const hasAction =
      action &&
      action !== "#" &&
      !action.toLowerCase().startsWith("javascript:");
    if (!hasAction) {
      formsNoAction++;
      formsNoActionDetails.push({
        source: `form#${idx + 1}`,
        action: action || "(sin action)",
      });
    }

    const hasSubmitControl =
      /<button\b[^>]*type=["']submit["'][^>]*>/i.test(inner) ||
      /<button\b(?![^>]*type=)[^>]*>/i.test(inner) ||
      /<input\b[^>]*type=["']submit["'][^>]*>/i.test(inner);
    if (!hasSubmitControl) {
      formsNoSubmit++;
      formsNoSubmitDetails.push({
        source: `form#${idx + 1}`,
      });
    }
  }

  // Main navigation health check.
  const navBlocks = [...body.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gi)];
  const navLinkCounts = navBlocks.map((m) => {
    const links = [...m[1].matchAll(/<a\b[^>]*href=["'][^"']+["'][^>]*>/gi)];
    return links.length;
  });
  const mainNavLinks = navLinkCounts.length ? Math.max(...navLinkCounts) : 0;
  const weakNavigation = mainNavLinks > 0 && mainNavLinks < 3;

  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
  const description = descMatch ? descMatch[1].trim() : "";
  const canonical = canonMatch
    ? normalizeUrl(new URL(canonMatch[1], pageUrl).href)
    : "";
  const pageLang = langMatch ? langMatch[1] : "";

  // --- Enhanced SEO extraction ---

  // Resource counts (CSS, JS, inline)
  const externalCss = [...body.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)].length;
  const externalJs = [...body.matchAll(/<script[^>]+src=["'][^"']+["'][^>]*>/gi)].length;
  const inlineScripts = [...body.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi)].length;
  const inlineStyles = [...body.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].length;

  // Page weight (HTML body size in bytes)
  const htmlSizeBytes = Buffer.byteLength(body, "utf8");

  // Render-blocking resources in <head>
  const headMatch = body.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : "";
  const renderBlockingCss = [...headContent.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)]
    .filter((m) => !/\bmedia=["']print["']/i.test(m[0])).length;
  const renderBlockingJs = [...headContent.matchAll(/<script[^>]+src=["'][^"']+["'][^>]*>/gi)]
    .filter((m) => !/\b(async|defer)\b/i.test(m[0])).length;

  // Viewport meta
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(body);

  // Charset
  const hasCharset = /<meta[^>]+charset=/i.test(body) ||
    /<meta[^>]+http-equiv=["']content-type["']/i.test(body);

  // Open Graph tags
  const ogTitle = (body.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    body.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:title["']/i) || [])[1] || "";
  const ogDesc = (body.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
    body.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:description["']/i) || [])[1] || "";
  const ogImage = (body.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    body.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:image["']/i) || [])[1] || "";
  const ogType = (body.match(/<meta[^>]+property=["']og:type["'][^>]*content=["']([^"']*)["']/i) ||
    body.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:type["']/i) || [])[1] || "";
  const hasOg = !!(ogTitle || ogDesc || ogImage);

  // Twitter Card
  const twitterCard = (body.match(/<meta[^>]+name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i) ||
    body.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']twitter:card["']/i) || [])[1] || "";
  const hasTwitterCard = !!twitterCard;

  // Structured data (JSON-LD)
  const jsonLdBlocks = [...body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const structuredDataTypes = [];
  for (const m of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(m[1]);
      const t = parsed["@type"];
      if (t) structuredDataTypes.push(Array.isArray(t) ? t[0] : t);
    } catch {}
  }
  const hasStructuredData = jsonLdBlocks.length > 0;

  // Hreflang
  const hreflangMatches = [...body.matchAll(/<link[^>]+hreflang=["']([^"']+)["'][^>]*href=["']([^"']*)["']/gi)];
  const hreflangs = hreflangMatches.map((m) => ({ lang: m[1], url: m[2] }));

  // Resource hints (preload, prefetch, dns-prefetch, preconnect)
  const preloadCount = [...body.matchAll(/<link[^>]+rel=["']preload["']/gi)].length;
  const prefetchCount = [...body.matchAll(/<link[^>]+rel=["']prefetch["']/gi)].length;
  const preconnectCount = [...body.matchAll(/<link[^>]+rel=["']preconnect["']/gi)].length;
  const dnsPrefetchCount = [...body.matchAll(/<link[^>]+rel=["']dns-prefetch["']/gi)].length;

  // Word count (approximate, from visible text)
  const visibleText = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = visibleText ? visibleText.split(/\s+/).length : 0;

  // Internal links on this page (for architecture analysis)
  const internalLinks = allLinks.filter((l) => {
    try { return new URL(l).origin === new URL(pageUrl).origin; } catch { return false; }
  });

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
    placeholderLinks,
    placeholderLinkDetails,
    formsNoAction,
    formsNoActionDetails,
    formsNoSubmit,
    formsNoSubmitDetails,
    mainNavLinks,
    weakNavigation,
    pageLang,
    titleLen: title.length,
    descLen: description.length,
    // Enhanced fields
    resources: {
      externalCss,
      externalJs,
      inlineScripts,
      inlineStyles,
      renderBlockingCss,
      renderBlockingJs,
    },
    htmlSizeBytes,
    hasViewport,
    hasCharset,
    og: { title: ogTitle, description: ogDesc, image: ogImage, type: ogType, hasOg },
    twitter: { card: twitterCard, hasTwitterCard },
    structuredData: { types: structuredDataTypes, hasStructuredData, count: jsonLdBlocks.length },
    hreflangs,
    resourceHints: { preload: preloadCount, prefetch: prefetchCount, preconnect: preconnectCount, dnsPrefetch: dnsPrefetchCount },
    wordCount,
    internalLinks,
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
    if ((m.placeholderLinks || 0) > 0)
      issues.push({
        type: "placeholder_link",
        label: T(
          `${m.placeholderLinks} enlace(s) placeholder`,
          `${m.placeholderLinks} placeholder link(s)`,
        ),
        group: "functionality",
      });
    if ((m.formsNoAction || 0) > 0)
      issues.push({
        type: "form_no_action",
        label: T(
          `${m.formsNoAction} formulario(s) sin action`,
          `${m.formsNoAction} form(s) missing action`,
        ),
        group: "functionality",
      });
    if ((m.formsNoSubmit || 0) > 0)
      issues.push({
        type: "form_no_submit",
        label: T(
          `${m.formsNoSubmit} formulario(s) sin submit`,
          `${m.formsNoSubmit} form(s) missing submit`,
        ),
        group: "functionality",
      });
    if (m.weakNavigation)
      issues.push({
        type: "weak_navigation",
        label: T(
          `Navegacion principal limitada (${m.mainNavLinks || 0} links)`,
          `Weak primary navigation (${m.mainNavLinks || 0} links)`,
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

    // --- Enhanced issue types ---

    // Missing viewport (mobile-friendliness)
    if (!m.hasViewport)
      issues.push({
        type: "no_viewport",
        label: T("Sin meta viewport", "No viewport meta tag"),
        group: "technical",
      });

    // Missing charset
    if (!m.hasCharset)
      issues.push({
        type: "no_charset",
        label: T("Sin charset definido", "No charset defined"),
        group: "technical",
      });

    // Missing Open Graph
    if (!m.og?.hasOg)
      issues.push({
        type: "no_og",
        label: T("Sin Open Graph tags", "No Open Graph tags"),
        group: "social",
      });

    // Missing Twitter Card
    if (!m.twitter?.hasTwitterCard)
      issues.push({
        type: "no_twitter_card",
        label: T("Sin Twitter Card", "No Twitter Card"),
        group: "social",
      });

    // No structured data
    if (!m.structuredData?.hasStructuredData)
      issues.push({
        type: "no_structured_data",
        label: T("Sin datos estructurados (JSON-LD)", "No structured data (JSON-LD)"),
        group: "technical",
      });

    // Render-blocking resources
    if ((m.resources?.renderBlockingJs || 0) > 0)
      issues.push({
        type: "render_blocking_js",
        label: T(
          `${m.resources.renderBlockingJs} script(s) bloquean renderizado`,
          `${m.resources.renderBlockingJs} render-blocking script(s)`,
        ),
        group: "performance",
      });
    if ((m.resources?.renderBlockingCss || 0) > 2)
      issues.push({
        type: "render_blocking_css",
        label: T(
          `${m.resources.renderBlockingCss} CSS bloquean renderizado`,
          `${m.resources.renderBlockingCss} render-blocking CSS`,
        ),
        group: "performance",
      });

    // Low word count (thin content)
    if ((m.wordCount || 0) > 0 && m.wordCount < 300)
      issues.push({
        type: "thin_content",
        label: T(
          `Contenido escaso (${m.wordCount} palabras)`,
          `Thin content (${m.wordCount} words)`,
        ),
        group: "content",
      });

    // Large HTML size
    if ((m.htmlSizeBytes || 0) > 200000)
      issues.push({
        type: "large_html",
        label: T(
          `HTML pesado (${Math.round(m.htmlSizeBytes / 1024)} KB)`,
          `Large HTML (${Math.round(m.htmlSizeBytes / 1024)} KB)`,
        ),
        group: "performance",
      });
  }

  return issues;
}

// --- Site Architecture Analysis ---
function buildSiteArchitecture(results, startUrl) {
  const normalizeKey = (u) => {
    try {
      const p = new URL(u);
      return (p.origin + p.pathname).replace(/\/+$/, "").toLowerCase();
    } catch { return u.toLowerCase(); }
  };

  const startKey = normalizeKey(startUrl);
  const crawledKeys = new Set(results.map((r) => normalizeKey(r.finalUrl || r.url)));

  // Build adjacency: which pages link to which (internal only)
  const outlinks = new Map(); // page -> Set of internal pages it links to
  const inlinks = new Map();  // page -> Set of internal pages linking to it

  for (const key of crawledKeys) {
    outlinks.set(key, new Set());
    inlinks.set(key, new Set());
  }

  for (const r of results) {
    const pageKey = normalizeKey(r.finalUrl || r.url);
    const internal = r.meta?.internalLinks || [];
    for (const link of internal) {
      const linkKey = normalizeKey(link);
      if (crawledKeys.has(linkKey) && linkKey !== pageKey) {
        outlinks.get(pageKey)?.add(linkKey);
        if (!inlinks.has(linkKey)) inlinks.set(linkKey, new Set());
        inlinks.get(linkKey)?.add(pageKey);
      }
    }
  }

  // BFS depth from start URL
  const depths = new Map();
  depths.set(startKey, 0);
  const bfsQueue = [startKey];
  let head = 0;
  while (head < bfsQueue.length) {
    const current = bfsQueue[head++];
    const currentDepth = depths.get(current);
    for (const neighbor of (outlinks.get(current) || [])) {
      if (!depths.has(neighbor)) {
        depths.set(neighbor, currentDepth + 1);
        bfsQueue.push(neighbor);
      }
    }
  }

  // Build per-page architecture data
  const pageArchitecture = results.map((r) => {
    const key = normalizeKey(r.finalUrl || r.url);
    const depth = depths.has(key) ? depths.get(key) : -1;
    const inlinkCount = inlinks.get(key)?.size || 0;
    const outlinkCount = outlinks.get(key)?.size || 0;
    return {
      url: r.url,
      depth,
      inlinks: inlinkCount,
      outlinks: outlinkCount,
      isOrphan: depth === -1 || (depth > 0 && inlinkCount === 0),
    };
  });

  // Orphan pages (no internal pages link to them, excluding start)
  const orphanPages = pageArchitecture.filter((p) => p.isOrphan).map((p) => p.url);

  // Section/directory scores
  const sectionMap = new Map();
  for (const r of results) {
    try {
      const u = new URL(r.finalUrl || r.url);
      const parts = u.pathname.split("/").filter(Boolean);
      const section = parts.length > 0 ? `/${parts[0]}/` : "/";
      if (!sectionMap.has(section)) sectionMap.set(section, { pages: 0, issues: 0, totalSeoScore: 0 });
      const s = sectionMap.get(section);
      s.pages++;
      s.issues += (r.issues?.length || 0) > 0 ? 1 : 0;
      const seoScore = ((r.seoQuality?.titleScore || 0) + (r.seoQuality?.descScore || 0)) / 2;
      s.totalSeoScore += seoScore;
    } catch {}
  }
  const sectionScores = [];
  for (const [section, data] of sectionMap) {
    sectionScores.push({
      section,
      pages: data.pages,
      pagesWithIssues: data.issues,
      avgSeoScore: Math.round(data.totalSeoScore / data.pages),
      healthPercent: Math.round(((data.pages - data.issues) / data.pages) * 100),
    });
  }
  sectionScores.sort((a, b) => a.avgSeoScore - b.avgSeoScore);

  // Depth distribution
  const depthDistribution = {};
  for (const p of pageArchitecture) {
    const d = p.depth === -1 ? "unreachable" : String(p.depth);
    depthDistribution[d] = (depthDistribution[d] || 0) + 1;
  }

  // Pages with most inlinks (top 10)
  const topInlinked = [...pageArchitecture]
    .sort((a, b) => b.inlinks - a.inlinks)
    .slice(0, 10)
    .map((p) => ({ url: p.url, inlinks: p.inlinks }));

  // Pages with fewest inlinks (bottom 10, excluding start)
  const leastInlinked = [...pageArchitecture]
    .filter((p) => normalizeKey(p.url) !== startKey)
    .sort((a, b) => a.inlinks - b.inlinks)
    .slice(0, 10)
    .map((p) => ({ url: p.url, inlinks: p.inlinks, depth: p.depth }));

  const maxDepth = Math.max(0, ...pageArchitecture.map((p) => p.depth).filter((d) => d >= 0));

  return {
    totalPages: results.length,
    maxDepth,
    orphanPages,
    orphanCount: orphanPages.length,
    depthDistribution,
    sectionScores,
    topInlinked,
    leastInlinked,
    pages: pageArchitecture,
  };
}

const brokenLinkCache = new Map();

function isIpPrivateRange(ip) {
  if (!ip) return false;
  if (net.isIP(ip) === 6) {
    const l = ip.toLowerCase();
    if (l === "::1") return true;
    if (l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80"))
      return true;
    return false;
  }
  // IPv4
  if (/^(127|10)\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}

async function ensureUrlAllowed(rawUrl) {
  if (!rawUrl) return false;
  let hostname;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return false;
  }
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1")
    return false;
  // quick IP literal check
  if (/^\d+\.\d+\.\d+\.\d+$/.test(lower) && isIpPrivateRange(lower))
    return false;
  try {
    const r = await dns.lookup(hostname).catch(() => null);
    if (r && r.address && isIpPrivateRange(r.address)) return false;
  } catch {
    // ignore lookup errors, allow conservative behavior
  }
  return true;
}

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
    const name = normalizeDisplayName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const phone = validatePhoneInput(
      req.body?.phoneCountry,
      req.body?.phoneNumber,
      { required: false },
    );

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contrasena son requeridos" });
    }
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "La contrasena debe tener al menos 8 caracteres" });
    }
    if (!phone.ok) {
      return res.status(400).json({ error: phone.error });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Ese email ya esta registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        role: USER_ROLE.USER.toUpperCase(),
        phoneCountry: phone.country?.code || null,
        phoneNumber: phone.digits || null,
        passwordHash,
      },
    });

    writeAuthCookie(res, user);
    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    return handleApiError(
      res,
      req,
      "auth/register",
      error,
      "No se pudo registrar el usuario",
    );
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contrasena son requeridos" });
    }
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
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
  } catch (error) {
    return handleApiError(
      res,
      req,
      "auth/login",
      error,
      "No se pudo iniciar sesion",
    );
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email) return res.status(400).json({ error: "Email requerido" });
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    if (!password)
      return res.status(400).json({ error: "Nueva contrasena requerida" });
    if (password.length < 8)
      return res
        .status(400)
        .json({ error: "La contrasena debe tener al menos 8 caracteres" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }
    return res.json({ ok: true });
  } catch (error) {
    return handleApiError(
      res,
      req,
      "auth/forgot-password",
      error,
      "No se pudo procesar la solicitud",
    );
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const newPassword = String(req.body?.password || "");
    if (!email || !newPassword)
      return res
        .status(400)
        .json({ error: "Email y nueva contrasena requeridos" });
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ error: "La contrasena debe tener al menos 8 caracteres" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    return res.json({ ok: true });
  } catch (error) {
    return handleApiError(
      res,
      req,
      "auth/reset-password",
      error,
      "No se pudo resetear la contrasena",
    );
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const includeCounts = req.query.includeCounts === "1";

  if (req.query.optional === "1") {
    try {
      const token = req.cookies?.auth_token;
      if (!token) {
        return res.json(await buildMePayload(null, { includeCounts }));
      }

      const payload = jwt.verify(token, getJwtSecret());
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      return res.json(await buildMePayload(user, { includeCounts }));
    } catch (error) {
      if (
        error?.name !== "JsonWebTokenError" &&
        error?.name !== "TokenExpiredError"
      ) {
        logServerError("auth/me-optional", error, {
          path: req.originalUrl || req.url,
          method: req.method,
        });
      }
      return res.json(await buildMePayload(null, { includeCounts }));
    }
  }

  return requireAuth(req, res, async () => {
    res.json(await buildMePayload(req.user, { includeCounts }));
  });
});

app.put("/api/auth/profile", requireAuth, async (req, res) => {
  try {
    const name = normalizeDisplayName(req.body?.name);
    const phone = validatePhoneInput(
      req.body?.phoneCountry,
      req.body?.phoneNumber,
      { required: false },
    );
    if (!phone.ok) {
      return res.status(400).json({ error: phone.error });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || null,
        phoneCountry: phone.country?.code || null,
        phoneNumber: phone.digits || null,
      },
    });
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return handleApiError(
      res,
      req,
      "auth/profile",
      error,
      "No se pudo actualizar el perfil",
    );
  }
});

app.put("/api/auth/password", requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Completa contrasena actual y nueva" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "La nueva contrasena debe tener al menos 8 caracteres",
      });
    }

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Contrasena actual incorrecta" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return res.json({ ok: true });
  } catch (error) {
    return handleApiError(
      res,
      req,
      "auth/password",
      error,
      "No se pudo actualizar la contrasena",
    );
  }
});

app.get(
  "/api/admin/users",
  requireAuth,
  requireUserManagement,
  async (req, res) => {
    try {
      const { page, limit, skip } = parsePaginationParams(req.query, {
        defaultLimit: 15,
        maxLimit: 30,
      });
      const search = normalizeSearchQuery(req.query.q);
      const roleFilter =
        req.query.role && req.query.role !== "all"
          ? normalizeRole(req.query.role)
          : "all";
      const where = buildAdminUsersWhere(req.user, search, roleFilter);
      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: ADMIN_USER_LIST_SELECT,
          orderBy: { createdAt: "asc" },
        }),
      ]);

      return res.json({
        viewer: sanitizeUser(req.user),
        users: users
          .filter((user) => canManageTarget(req.user, user))
          .map((user) => sanitizeUser(user)),
        pagination: buildPaginationMeta(total, page, limit),
      });
    } catch (error) {
      return handleApiError(
        res,
        req,
        "admin/users:list",
        error,
        "No se pudo cargar el listado de usuarios",
      );
    }
  },
);

app.put(
  "/api/admin/users/:userId/role",
  requireAuth,
  requireUserManagement,
  async (req, res) => {
    try {
      const targetRole = normalizeRole(req.body?.role);

      if (req.user.id === req.params.userId) {
        return res
          .status(403)
          .json({ error: "No puedes modificar tu propio rol desde esta ruta" });
      }

      if (!canAssignRole(req.user, targetRole)) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para asignar ese rol" });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: req.params.userId },
      });

      if (!targetUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (!canManageTarget(req.user, targetUser)) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para modificar ese usuario" });
      }

      if (getEffectiveRole(targetUser) === USER_ROLE.OWNER) {
        return res
          .status(403)
          .json({ error: "El rol owner solo puede controlarse desde servidor" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: targetRole.toUpperCase() },
      });

      return res.json({ user: sanitizeUser(updatedUser) });
    } catch (error) {
      return handleApiError(
        res,
        req,
        "admin/users:update-role",
        error,
        "No se pudo actualizar el rol del usuario",
      );
    }
  },
);

app.get("/api/projects", requireAuth, async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query, {
    defaultLimit: 8,
    maxLimit: 24,
  });
  const where = { userId: req.user.id };
  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        targetUrl: true,
        createdAt: true,
        updatedAt: true,
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
    }),
  ]);

  setPrivateApiCache(res, 20, 90);
  res.json({
    viewer: sanitizeUser(req.user),
    pagination: buildPaginationMeta(total, page, limit),
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
  const { page, limit, skip } = parsePaginationParams(req.query, {
    defaultLimit: 12,
    maxLimit: 24,
  });
  const where = { userId: req.user.id };
  const [total, runs] = await Promise.all([
    prisma.crawlRun.count({ where }),
    prisma.crawlRun.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        sourceUrl: true,
        sourceType: true,
        total: true,
        withIssues: true,
        status: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
            targetUrl: true,
          },
        },
      },
    }),
  ]);

  setPrivateApiCache(res, 20, 90);
  res.json({
    viewer: sanitizeUser(req.user),
    pagination: buildPaginationMeta(total, page, limit),
    runs: runs.map((run) => ({
      id: run.id,
      projectId: run.projectId,
      sourceUrl: run.sourceUrl,
      sourceType: normalizeRunSourceType(run.sourceType),
      source: normalizeRunSourceType(run.sourceType),
      total: run.total,
      withIssues: run.withIssues,
      status: serializeRunStatus(run.status),
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
  const allowed = await ensureUrlAllowed(targetUrl);
  if (!allowed) return res.status(400).json({ error: "URL no permitida" });

  // Plan limit check: max projects
  const sub = await getUserSubscription(req.user.id);
  const projectCount = await prisma.project.count({ where: { userId: req.user.id } });
  if (projectCount >= sub.maxProjects) {
    return res.status(403).json({
      error: "Lmite de proyectos alcanzado",
      errorEn: "Project limit reached",
      limit: sub.maxProjects,
      plan: sub.plan,
      upgrade: true,
    });
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
    select: {
      id: true,
      name: true,
      targetUrl: true,
      createdAt: true,
      updatedAt: true,
      crawlRuns: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          status: true,
          sourceUrl: true,
          sourceType: true,
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

  setPrivateApiCache(res, 20, 90);
  res.json({
    viewer: sanitizeUser(req.user),
    project: {
      ...project,
      crawlRuns: project.crawlRuns.map((run) => {
        const sourceType = normalizeRunSourceType(run.sourceType);
        return {
          ...run,
          sourceType,
          source: sourceType,
          status: serializeRunStatus(run.status),
        };
      }),
    },
  });
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
      name: normalizeProjectName(
        req.body?.name ?? existing.name,
        nextTargetUrl,
      ),
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

app.get(
  "/api/projects/:projectId/runs/:runId",
  requireAuth,
  async (req, res) => {
    const run = await prisma.crawlRun.findFirst({
      where: {
        id: req.params.runId,
        projectId: req.params.projectId,
        userId: req.user.id,
      },
      select: {
        id: true,
        sourceUrl: true,
        sourceType: true,
        maxPages: true,
        rateDelay: true,
        checkExt: true,
        total: true,
        withIssues: true,
        stats: true,
        downloadName: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            storedPages: true,
            storedDups: true,
          },
        },
      },
    });

    if (!run) {
      return res.status(404).json({ error: "Historial no encontrado" });
    }

    const sourceType = normalizeRunSourceType(run.sourceType);
    const normalizedRun = {
      ...run,
      sourceType,
      source: sourceType,
      status: serializeRunStatus(run.status),
      pageCount: run._count.storedPages,
      duplicateCount: run._count.storedDups,
    };
    delete normalizedRun._count;

    setPrivateApiCache(res, 15, 60);
    res.json({ run: normalizedRun });
  },
);

app.get(
  "/api/projects/:projectId/runs/:runId/pages",
  requireAuth,
  async (req, res) => {
    const run = await prisma.crawlRun.findFirst({
      where: {
        id: req.params.runId,
        projectId: req.params.projectId,
        userId: req.user.id,
      },
      select: { id: true },
    });

    if (!run) {
      return res.status(404).json({ error: "Historial no encontrado" });
    }

    const { page, limit } = parsePaginationParams(req.query, {
      defaultLimit: 100,
      maxLimit: 200,
    });

    const payload = await loadStoredRunPageChunk(run.id, page, limit);
    setPrivateApiCache(res, 30, 120);
    return res.json(payload);
  },
);

app.get(
  "/api/projects/:projectId/runs/:runId/duplicates",
  requireAuth,
  async (req, res) => {
    const run = await prisma.crawlRun.findFirst({
      where: {
        id: req.params.runId,
        projectId: req.params.projectId,
        userId: req.user.id,
      },
      select: { id: true },
    });

    if (!run) {
      return res.status(404).json({ error: "Historial no encontrado" });
    }

    const { page, limit } = parsePaginationParams(req.query, {
      defaultLimit: 100,
      maxLimit: 200,
    });

    const payload = await loadStoredRunDuplicateChunk(run.id, page, limit);
    setPrivateApiCache(res, 30, 120);
    return res.json(payload);
  },
);

app.get(
  "/api/projects/:projectId/runs/:runId/report",
  requireAuth,
  async (req, res) => {
    // Plan feature check: excel_report
    const sub = await getUserSubscription(req.user.id);
    if (!hasFeature(sub, "excel_report")) {
      return res.status(403).json({
        error: "Reportes Excel no disponibles en tu plan",
        errorEn: "Excel reports not available in your plan",
        plan: sub.plan,
        upgrade: true,
      });
    }

    const run = await prisma.crawlRun.findFirst({
      where: {
        id: req.params.runId,
        projectId: req.params.projectId,
        userId: req.user.id,
      },
      select: {
        id: true,
        sourceUrl: true,
        downloadName: true,
        createdAt: true,
      },
    });

    if (!run) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    const crawlLang = req.query.lang === "en" ? "en" : "es";
    const results = await loadRunPagesForResponse(run.id);
    const duplicates = await loadRunDuplicatesForResponse(run.id);
    const buffer = await generateExcelBuffer(
      results,
      run.sourceUrl,
      duplicates,
      crawlLang,
    );
    const downloadName =
      run.downloadName || buildReportFileName(run.sourceUrl, run.createdAt);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName}"`,
    );
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.send(buffer);
  },
);

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

// --- Subscription / Plan API ---

// GET /api/subscription - Get current user's plan info
app.get("/api/subscription", requireAuth, async (req, res) => {
  try {
    const sub = await getUserSubscription(req.user.id);

    // Count usage this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [projectCount, crawlCount] = await Promise.all([
      prisma.project.count({ where: { userId: req.user.id } }),
      prisma.crawlRun.count({
        where: { userId: req.user.id, createdAt: { gte: monthStart } },
      }),
    ]);

    return res.json({
      subscription: {
        plan: sub.plan,
        maxProjects: sub.maxProjects,
        maxPagesPerCrawl: sub.maxPagesPerCrawl,
        maxCrawlsPerMonth: sub.maxCrawlsPerMonth,
        maxHistoryRuns: sub.maxHistoryRuns,
        features: sub.features,
        expiresAt: sub.expiresAt,
        cancelledAt: sub.cancelledAt,
        stripeManaged: !!sub.stripeSubId,
      },
      usage: {
        projects: projectCount,
        crawlsThisMonth: crawlCount,
      },
      limits: {
        projectsRemaining: Math.max(0, sub.maxProjects - projectCount),
        crawlsRemaining: Math.max(0, sub.maxCrawlsPerMonth - crawlCount),
      },
      plans: PLAN_DEFAULTS,
      stripeEnabled: !!getStripe(),
    });
  } catch (error) {
    handleApiError(res, req, "subscription/get", error, "Error obteniendo plan");
  }
});

// GET /api/subscription/plans - List all available plans (public info)
app.get("/api/subscription/plans", (req, res) => {
  const plans = Object.entries(PLAN_DEFAULTS).map(([key, limits]) => ({
    plan: key,
    ...limits,
    price: PLAN_DISPLAY_PRICES[key] || 0,
    currency: PLAN_CURRENCY,
    hasStripePrice: !!STRIPE_PRICES[key],
  }));
  res.json({ plans });
});

// POST /api/subscription/checkout - Create Stripe Checkout session
app.post("/api/subscription/checkout", requireAuth, async (req, res) => {
  try {
    const newPlan = String(req.body?.plan || "").toUpperCase();
    if (!PLAN_DEFAULTS[newPlan] || newPlan === "FREE") {
      return res.status(400).json({ error: "Plan invlido para checkout" });
    }

    const stripe = getStripe();
    if (!stripe || !STRIPE_PRICES[newPlan]) {
      return res.status(501).json({ error: "Stripe no configurado para este plan" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const currentSub = await getUserSubscription(req.user.id);
    const customerId = await getOrCreateStripeCustomer(stripe, user, currentSub);

    // Save the Stripe customer ID early
    try {
      await prisma.subscription.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, plan: "FREE", stripeCustomerId: customerId, ...PLAN_DEFAULTS.FREE },
        update: { stripeCustomerId: customerId },
      });
    } catch { /* table may not exist */ }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICES[newPlan], quantity: 1 }],
      metadata: { userId: req.user.id, plan: newPlan },
      success_url: `${appUrl}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url: `${appUrl}/dashboard/subscription?cancelled=1`,
      subscription_data: {
        metadata: { userId: req.user.id, plan: newPlan },
      },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    handleApiError(res, req, "subscription/checkout", error, "Error creando sesin de pago");
  }
});

// POST /api/subscription/portal - Open Stripe Customer Portal
app.post("/api/subscription/portal", requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(501).json({ error: "Stripe no configurado" });
    }

    const sub = await getUserSubscription(req.user.id);
    if (!sub.stripeCustomerId) {
      return res.status(400).json({ error: "No tienes cuenta de facturacin" });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/dashboard/subscription`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    handleApiError(res, req, "subscription/portal", error, "Error abriendo portal de facturacin");
  }
});

// POST /api/subscription/cancel - Cancel subscription via Stripe or direct
app.post("/api/subscription/cancel", requireAuth, async (req, res) => {
  try {
    const existing = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });
    if (!existing || existing.plan === "FREE") {
      return res.status(400).json({ error: "No hay suscripcin activa para cancelar" });
    }

    const stripe = getStripe();
    // If managed by Stripe, cancel at period end
    if (stripe && existing.stripeSubId) {
      await stripe.subscriptions.update(existing.stripeSubId, {
        cancel_at_period_end: true,
      });
      await prisma.subscription.update({
        where: { userId: req.user.id },
        data: { cancelledAt: new Date() },
      });
      return res.json({ message: "Suscripcin se cancelar al final del periodo de facturacin." });
    }

    // No Stripe — direct cancel (admin-assigned plans)
    const freeDefaults = PLAN_DEFAULTS.FREE;
    await prisma.subscription.update({
      where: { userId: req.user.id },
      data: {
        plan: "FREE",
        cancelledAt: new Date(),
        maxProjects: freeDefaults.maxProjects,
        maxPagesPerCrawl: freeDefaults.maxPagesPerCrawl,
        maxCrawlsPerMonth: freeDefaults.maxCrawlsPerMonth,
        maxHistoryRuns: freeDefaults.maxHistoryRuns,
        features: freeDefaults.features,
      },
    });
    return res.json({ message: "Suscripcin cancelada. Plan revertido a FREE." });
  } catch (error) {
    handleApiError(res, req, "subscription/cancel", error, "Error cancelando plan");
  }
});

// POST /api/subscription/upgrade - Admin/manual upgrade (no Stripe)
app.post("/api/subscription/upgrade", requireAuth, async (req, res) => {
  try {
    const newPlan = String(req.body?.plan || "").toUpperCase();
    if (!PLAN_DEFAULTS[newPlan]) {
      return res.status(400).json({ error: "Plan invlido" });
    }

    // If Stripe is configured for paid plans, redirect to checkout
    const stripe = getStripe();
    if (stripe && newPlan !== "FREE" && STRIPE_PRICES[newPlan]) {
      return res.status(400).json({
        error: "Usa /api/subscription/checkout para planes de pago",
        checkoutRequired: true,
      });
    }

    const defaults = PLAN_DEFAULTS[newPlan];
    const sub = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        plan: newPlan,
        maxProjects: defaults.maxProjects,
        maxPagesPerCrawl: defaults.maxPagesPerCrawl,
        maxCrawlsPerMonth: defaults.maxCrawlsPerMonth,
        maxHistoryRuns: defaults.maxHistoryRuns,
        features: defaults.features,
      },
      update: {
        plan: newPlan,
        maxProjects: defaults.maxProjects,
        maxPagesPerCrawl: defaults.maxPagesPerCrawl,
        maxCrawlsPerMonth: defaults.maxCrawlsPerMonth,
        maxHistoryRuns: defaults.maxHistoryRuns,
        features: defaults.features,
        cancelledAt: null,
      },
    });

    return res.json({
      message: `Plan actualizado a ${newPlan}`,
      subscription: {
        plan: sub.plan,
        maxProjects: sub.maxProjects,
        maxPagesPerCrawl: sub.maxPagesPerCrawl,
        maxCrawlsPerMonth: sub.maxCrawlsPerMonth,
        maxHistoryRuns: sub.maxHistoryRuns,
        features: sub.features,
        expiresAt: sub.expiresAt,
      },
    });
  } catch (error) {
    handleApiError(res, req, "subscription/upgrade", error, "Error actualizando plan");
  }
});

// ADMIN: PUT /api/admin/users/:userId/plan - Admin assign plan to user
app.put("/api/admin/users/:userId/plan", requireAuth, requireUserManagement, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const newPlan = String(req.body?.plan || "").toUpperCase();
    if (!PLAN_DEFAULTS[newPlan]) {
      return res.status(400).json({ error: "Plan invlido" });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return res.status(404).json({ error: "Usuario no encontrado" });

    const defaults = PLAN_DEFAULTS[newPlan];
    const daysValid = parseInt(req.body?.days) || 30;

    const sub = await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: newPlan,
        maxProjects: defaults.maxProjects,
        maxPagesPerCrawl: defaults.maxPagesPerCrawl,
        maxCrawlsPerMonth: defaults.maxCrawlsPerMonth,
        maxHistoryRuns: defaults.maxHistoryRuns,
        features: defaults.features,
        expiresAt: newPlan === "FREE" ? null : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
      },
      update: {
        plan: newPlan,
        maxProjects: defaults.maxProjects,
        maxPagesPerCrawl: defaults.maxPagesPerCrawl,
        maxCrawlsPerMonth: defaults.maxCrawlsPerMonth,
        maxHistoryRuns: defaults.maxHistoryRuns,
        features: defaults.features,
        expiresAt: newPlan === "FREE" ? null : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
        cancelledAt: null,
      },
    });

    return res.json({ message: `Plan de ${targetUser.email} actualizado a ${newPlan}`, subscription: sub });
  } catch (error) {
    handleApiError(res, req, "admin/plan", error, "Error asignando plan");
  }
});

//  SSE: Crawl
app.get("/api/crawl", crawlLimiter, requireAuth, async (req, res) => {
  const startUrl = req.query.url;
  const source = req.query.source || "crawl";
  const rateDelay = parseInt(req.query.rate) || 0;
  const checkExt = req.query.external === "1";
  const crawlLang = req.query.lang || "es";
  const projectId = String(req.query.projectId || "");

  if (!startUrl) return res.status(400).json({ error: "URL requerida" });
  if (!projectId) return res.status(400).json({ error: "Proyecto requerido" });

  // Plan limit: monthly crawls + maxPages cap
  const sub = await getUserSubscription(req.user.id);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const crawlCount = await prisma.crawlRun.count({
    where: { userId: req.user.id, createdAt: { gte: monthStart } },
  });
  if (crawlCount >= sub.maxCrawlsPerMonth) {
    return res.status(403).json({
      error: "Lmite de crawls mensuales alcanzado",
      errorEn: "Monthly crawl limit reached",
      limit: sub.maxCrawlsPerMonth,
      current: crawlCount,
      plan: sub.plan,
      upgrade: true,
    });
  }
  const maxPages = Math.min(parseInt(req.query.max) || 50, sub.maxPagesPerCrawl);
  const ok = await ensureUrlAllowed(startUrl);
  if (!ok) return res.status(400).json({ error: "URL no permitida" });
  let baseOrigin;
  try {
    baseOrigin = new URL(startUrl).origin;
  } catch {
    return res.status(400).json({ error: "URL invlida" });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: req.user.id },
  });
  if (!project)
    return res.status(404).json({ error: "Proyecto no encontrado" });
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

  const results = [];
  const visited = new Set();
  const queue = [];
  let active = 0;
  let cancelled = false;

  // Robots
  const { disallowed, hasSitemap, sitemapUrls, rawContent } =
    await fetchRobots(startUrl);
  send("robots", { disallowed, hasSitemap, sitemapUrls, rawContent });

  // Domain info snapshot for persistence and replay on historical runs
  const domainInfo = await fetchSiteInfo(startUrl).catch(() => null);
  if (domainInfo) {
    send("siteinfo", domainInfo);
  }

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
        canonical: meta?.canonical || "",
        noindex: meta?.noindex || false,
        buttonsNoLink: meta?.buttonsNoLink || 0,
        buttonsNoLinkDetails: meta?.buttonsNoLinkDetails || [],
        placeholderLinks: meta?.placeholderLinks || 0,
        placeholderLinkDetails: meta?.placeholderLinkDetails || [],
        formsNoAction: meta?.formsNoAction || 0,
        formsNoActionDetails: meta?.formsNoActionDetails || [],
        formsNoSubmit: meta?.formsNoSubmit || 0,
        formsNoSubmitDetails: meta?.formsNoSubmitDetails || [],
        mainNavLinks: meta?.mainNavLinks || 0,
        weakNavigation: meta?.weakNavigation || false,
        pageLang: meta?.pageLang || "",
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
        placeholderLinks: meta?.placeholderLinks || 0,
        placeholderLinkDetails: meta?.placeholderLinkDetails || [],
        formsNoAction: meta?.formsNoAction || 0,
        formsNoActionDetails: meta?.formsNoActionDetails || [],
        formsNoSubmit: meta?.formsNoSubmit || 0,
        formsNoSubmitDetails: meta?.formsNoSubmitDetails || [],
        mainNavLinks: meta?.mainNavLinks || 0,
        weakNavigation: meta?.weakNavigation || false,
        brokenButtonLinks,
        brokenButtonDetails,
        pageLang: meta?.pageLang || "",
        brokenExternalLinks,
        seoQuality,
        // Enhanced fields
        resources: meta?.resources || null,
        htmlSizeBytes: meta?.htmlSizeBytes || 0,
        hasViewport: meta?.hasViewport || false,
        hasCharset: meta?.hasCharset || false,
        og: meta?.og || null,
        twitter: meta?.twitter || null,
        structuredData: meta?.structuredData || null,
        hreflangs: meta?.hreflangs || [],
        resourceHints: meta?.resourceHints || null,
        wordCount: meta?.wordCount || 0,
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

  // --- Site Architecture Analysis ---
  const architecture = buildSiteArchitecture(results, startUrl);
  if (!cancelled) {
    send("architecture", architecture);
  }

  if (!cancelled) {
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
      placeholderLinks: results.filter(
        (r) => (r.meta?.placeholderLinks || 0) > 0,
      ).length,
      formsNoAction: results.filter((r) => (r.meta?.formsNoAction || 0) > 0)
        .length,
      formsNoSubmit: results.filter((r) => (r.meta?.formsNoSubmit || 0) > 0)
        .length,
      weakNavigation: results.filter((r) => r.meta?.weakNavigation).length,
      slowLoad: results.filter((r) => (r.loadTimeMs || 0) >= 3000).length,
      noindex: results.filter((r) => r.meta && r.meta.noindex).length,
      blocked: results.filter((r) => r.blocked).length,
      duplicates: duplicates.length,
      headingSkips: results.filter((r) => r.meta?.headingSkips?.length > 0)
        .length,
      // Enhanced stats
      noViewport: results.filter((r) => r.issues.some((i) => i.type === "no_viewport")).length,
      noCharset: results.filter((r) => r.issues.some((i) => i.type === "no_charset")).length,
      noOg: results.filter((r) => r.issues.some((i) => i.type === "no_og")).length,
      noTwitterCard: results.filter((r) => r.issues.some((i) => i.type === "no_twitter_card")).length,
      noStructuredData: results.filter((r) => r.issues.some((i) => i.type === "no_structured_data")).length,
      renderBlockingJs: results.filter((r) => r.issues.some((i) => i.type === "render_blocking_js")).length,
      renderBlockingCss: results.filter((r) => r.issues.some((i) => i.type === "render_blocking_css")).length,
      thinContent: results.filter((r) => r.issues.some((i) => i.type === "thin_content")).length,
      largeHtml: results.filter((r) => r.issues.some((i) => i.type === "large_html")).length,
      orphanPages: architecture.orphanCount,
      maxDepth: architecture.maxDepth,
      architecture,
      domainInfo: domainInfo || null,
      robots: { disallowed, hasSitemap, sitemapUrls, rawContent },
    };
    const withIssues = results.filter((r) => r.issues.length > 0).length;
    const downloadName = buildReportFileName(startUrl);
    const createdRun = await prisma.$transaction(async (tx) => {
      const run = await tx.crawlRun.create({
        data: {
          userId: req.user.id,
          projectId: project.id,
          sourceUrl: startUrl,
          sourceType: source,
          maxPages,
          rateDelay,
          checkExt,
          total: results.length,
          withIssues,
          stats,
          downloadName,
          status: "COMPLETED",
        },
        select: { id: true },
      });

      if (results.length) {
        await tx.crawlRunPage.createMany({
          data: results.map((page, index) => ({
            runId: run.id,
            ...serializeRunPageRow(page, index),
          })),
        });
      }

      if (duplicates.length) {
        await tx.crawlRunDuplicate.createMany({
          data: duplicates.map((duplicate, index) => ({
            runId: run.id,
            ...serializeRunDuplicateRow(duplicate, index),
          })),
        });
      }

      return run;
    });
    send("done", {
      total: results.length,
      withIssues,
      stats,
      duplicates,
      downloadUrl: `/api/projects/${project.id}/runs/${createdRun.id}/report?lang=${crawlLang}`,
      fileName: downloadName,
      runId: createdRun.id,
    });
  }

  res.end();
});

//  Excel
function buildReportFileName(siteUrl, createdAt = new Date()) {
  let host = "site";
  try {
    host = new URL(siteUrl).hostname || host;
  } catch {}

  const timestamp = new Date(createdAt)
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  return `seo-report-${host.replace(/[^a-z0-9.-]/gi, "-")}-${timestamp}.xlsx`;
}

async function generateExcelBuffer(
  results,
  siteUrl,
  duplicates,
  crawlLang = "es",
) {
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
    [null],
    [T("🔒 Social & Datos ", "🔒 Social & Data "), "", null, null],
    [
      T("Sin Open Graph", "No Open Graph"),
      results.filter((r) => r.issues?.some((i) => i.type === "no_og")).length,
      C.warnBg,
      null,
    ],
    [
      T("Sin Twitter Card", "No Twitter Card"),
      results.filter((r) => r.issues?.some((i) => i.type === "no_twitter_card")).length,
      C.warnBg,
      null,
    ],
    [
      T("Sin datos estructurados", "No structured data"),
      results.filter((r) => r.issues?.some((i) => i.type === "no_structured_data")).length,
      C.warnBg,
      null,
    ],
    [null],
    [T("⚡ Rendimiento ", "⚡ Performance "), "", null, null],
    [
      T("Carga lenta (≥3s)", "Slow load (≥3s)"),
      results.filter((r) => (r.loadTimeMs || 0) >= 3000).length,
      C.errorBg,
      null,
    ],
    [
      T("JS bloqueante", "Render-blocking JS"),
      results.filter((r) => r.issues?.some((i) => i.type === "render_blocking_js")).length,
      C.warnBg,
      null,
    ],
    [
      T("CSS bloqueante (>2)", "Render-blocking CSS (>2)"),
      results.filter((r) => r.issues?.some((i) => i.type === "render_blocking_css")).length,
      C.warnBg,
      null,
    ],
    [
      T("HTML pesado (>200KB)", "Large HTML (>200KB)"),
      results.filter((r) => r.issues?.some((i) => i.type === "large_html")).length,
      C.warnBg,
      null,
    ],
    [
      T("Contenido escaso (<300 palabras)", "Thin content (<300 words)"),
      results.filter((r) => r.issues?.some((i) => i.type === "thin_content")).length,
      C.warnBg,
      null,
    ],
    [null],
    [T("🏗️ Arquitectura ", "🏗️ Architecture "), "", null, null],
    [
      T("Sin viewport", "No viewport"),
      results.filter((r) => r.issues?.some((i) => i.type === "no_viewport")).length,
      C.warnBg,
      null,
    ],
    [
      T("Sin charset", "No charset"),
      results.filter((r) => r.issues?.some((i) => i.type === "no_charset")).length,
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
    { header: T("Palabras", "Words"), key: "words", width: 10 },
    { header: T("HTML KB", "HTML KB"), key: "htmlkb", width: 10 },
    { header: T("Tiempo ms", "Load ms"), key: "loadms", width: 10 },
    { header: "OG", key: "og", width: 6 },
    { header: "JSON-LD", key: "jsonld", width: 8 },
    { header: "Viewport", key: "viewport", width: 9 },
    { header: T("JS bloq.", "Block JS"), key: "blockjs", width: 9 },
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
      words: p.meta?.wordCount || 0,
      htmlkb: p.meta?.htmlSizeBytes ? Math.round(p.meta.htmlSizeBytes / 1024) : 0,
      loadms: p.loadTimeMs || 0,
      og: p.meta?.og?.hasOg ? "✓" : "✗",
      jsonld: p.meta?.structuredData?.hasStructuredData ? "✓" : "✗",
      viewport: p.meta?.hasViewport ? "✓" : "✗",
      blockjs: p.meta?.resources?.renderBlockingJs || 0,
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
    styleHeader(ws4);
    duplicates.forEach((d, i) => {
      const r = ws4.addRow({ title: d.title, urls: d.urls.join("\n") });
      r.height = 18 * d.urls.length;
      styleRow(r, i % 2 === 0 ? C.purpleBg : "FFFFFF");
    });
  }

  // --- Architecture sheet ---
  const wsArch = wb.addWorksheet(T("Arquitectura", "Architecture"));
  wsArch.views = [{ showGridLines: false, state: "frozen", xSplit: 0, ySplit: 1 }];
  wsArch.columns = [
    { header: "URL", key: "url", width: 55 },
    { header: T("Profundidad", "Depth"), key: "depth", width: 12 },
    { header: T("Inlinks", "Inlinks"), key: "inlinks", width: 10 },
    { header: T("Outlinks", "Outlinks"), key: "outlinks", width: 10 },
    { header: T("Hurfana", "Orphan"), key: "orphan", width: 10 },
    { header: T("Palabras", "Words"), key: "words", width: 10 },
    { header: T("HTML KB", "HTML KB"), key: "htmlkb", width: 10 },
    { header: T("Tiempo ms", "Load ms"), key: "loadms", width: 10 },
    { header: "OG", key: "og", width: 6 },
    { header: "Twitter", key: "tw", width: 8 },
    { header: "JSON-LD", key: "jsonld", width: 8 },
    { header: T("Hreflangs", "Hreflangs"), key: "hreflangs", width: 10 },
  ];
  styleHeader(wsArch);

  // Build architecture lookup from results
  const archData = buildSiteArchitecture(results, siteUrl);
  const archMap = new Map();
  for (const p of archData.pages) archMap.set(p.url, p);

  results.forEach((p, i) => {
    const arch = archMap.get(p.url) || {};
    const r = wsArch.addRow({
      url: p.url,
      depth: arch.depth != null ? (arch.depth === -1 ? T("Inalcanzable", "Unreachable") : arch.depth) : "-",
      inlinks: arch.inlinks || 0,
      outlinks: arch.outlinks || 0,
      orphan: arch.isOrphan ? "✓" : "",
      words: p.meta?.wordCount || 0,
      htmlkb: p.meta?.htmlSizeBytes ? Math.round(p.meta.htmlSizeBytes / 1024) : 0,
      loadms: p.loadTimeMs || 0,
      og: p.meta?.og?.hasOg ? "✓" : "✗",
      tw: p.meta?.twitter?.hasTwitterCard ? "✓" : "✗",
      jsonld: p.meta?.structuredData?.hasStructuredData ? "✓" : "✗",
      hreflangs: p.meta?.hreflangs?.length || 0,
    });
    const bg = arch.isOrphan
      ? C.errorBg
      : arch.depth > 3
        ? C.warnBg
        : i % 2 === 0
          ? "FFFFFF"
          : C.alt;
    styleRow(r, bg);
  });

  // --- Section Scores sheet ---
  if (archData.sectionScores?.length > 0) {
    const wsSec = wb.addWorksheet(T("Secciones", "Sections"));
    wsSec.views = [{ showGridLines: false, state: "frozen", xSplit: 0, ySplit: 1 }];
    wsSec.columns = [
      { header: T("Seccin", "Section"), key: "section", width: 30 },
      { header: T("Pginas", "Pages"), key: "pages", width: 10 },
      { header: T("Con problemas", "With issues"), key: "issues", width: 14 },
      { header: T("Score SEO prom.", "Avg SEO score"), key: "avgseo", width: 14 },
      { header: T("Salud %", "Health %"), key: "health", width: 10 },
    ];
    styleHeader(wsSec);
    archData.sectionScores.forEach((s, i) => {
      const r = wsSec.addRow({
        section: s.section,
        pages: s.pages,
        issues: s.pagesWithIssues,
        avgseo: s.avgSeoScore,
        health: s.healthPercent,
      });
      const bg = s.healthPercent < 50
        ? C.errorBg
        : s.healthPercent < 80
          ? C.warnBg
          : i % 2 === 0
            ? "FFFFFF"
            : C.alt;
      styleRow(r, bg);
    });
  }

  const output = await wb.xlsx.writeBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
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
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`\n  SEO Crawler en http://localhost:${PORT}\n`),
  );
}

module.exports = app;
