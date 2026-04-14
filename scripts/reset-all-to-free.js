/**
 * reset-all-to-free.js
 * Reverts all subscriptions to FREE and clears Stripe data.
 *
 * Usage:
 *   node scripts/reset-all-to-free.js            # reset all
 *   node scripts/reset-all-to-free.js --dry-run  # preview only
 */

const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

const FREE = {
  plan: "FREE",
  maxProjects: 1,
  maxPagesPerCrawl: 50,
  maxCrawlsPerMonth: 1,
  maxHistoryRuns: 1,
  features: [],
  stripeCustomerId: null,
  stripeSubId: null,
  cancelledAt: null,
  expiresAt: null,
};

async function main() {
  const affected = await prisma.subscription.findMany({
    where: { NOT: { plan: "FREE" } },
    select: { id: true, userId: true, plan: true, stripeCustomerId: true },
  });

  if (affected.length === 0) {
    console.log("Todos los usuarios ya estan en FREE. Nada que hacer.");
    return;
  }

  console.log(`${affected.length} suscripcion(es) seran revertidas a FREE:`);
  for (const s of affected) {
    console.log(`  userId=${s.userId}  plan=${s.plan}  customerId=${s.stripeCustomerId || "-"}`);
  }

  if (isDryRun) {
    console.log("\n--dry-run: no se realizaron cambios.");
    return;
  }

  // updateMany doesn't support array fields (features: String[]), so update one by one
  for (const s of affected) {
    await prisma.subscription.update({
      where: { id: s.id },
      data: FREE,
    });
    console.log(`  ✓ userId=${s.userId} revertido a FREE`);
  }

  console.log(`\nRevertidos ${affected.length} usuario(s) a FREE.`);
}

main()
  .catch((err) => { console.error(err.message || err); process.exit(1); })
  .finally(() => prisma.$disconnect());
