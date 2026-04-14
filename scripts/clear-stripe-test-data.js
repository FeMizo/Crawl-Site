/**
 * clear-stripe-test-data.js
 * Clears stripeCustomerId and stripeSubId from subscriptions so they
 * get re-created against the live Stripe account on next checkout.
 *
 * Usage:
 *   node scripts/clear-stripe-test-data.js                        # all users
 *   node scripts/clear-stripe-test-data.js --email=foo@bar.com    # one user
 *   node scripts/clear-stripe-test-data.js --dry-run              # preview only
 */

const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

function readArg(name) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((a) => a.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1] || "";
  return "";
}

async function main() {
  const email = readArg("email").trim().toLowerCase();

  let where;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`No existe un usuario con email: ${email}`);
    where = { userId: user.id };
  } else {
    where = {
      OR: [
        { stripeCustomerId: { not: null } },
        { stripeSubId: { not: null } },
      ],
    };
  }

  const affected = await prisma.subscription.findMany({
    where,
    select: { id: true, userId: true, plan: true, stripeCustomerId: true, stripeSubId: true },
  });

  if (affected.length === 0) {
    console.log("No subscriptions with Stripe data found. Nothing to do.");
    return;
  }

  console.log(`Found ${affected.length} subscription(s):`);
  for (const s of affected) {
    console.log(`  userId=${s.userId}  plan=${s.plan}  customerId=${s.stripeCustomerId}  subId=${s.stripeSubId}`);
  }

  if (isDryRun) {
    console.log("\n--dry-run: no changes made.");
    return;
  }

  const result = await prisma.subscription.updateMany({
    where,
    data: { stripeCustomerId: null, stripeSubId: null },
  });

  console.log(`\nCleared Stripe data from ${result.count} subscription(s).`);
  console.log("Users will get a fresh live Stripe customer on next checkout.");
}

main()
  .catch((err) => { console.error(err.message || err); process.exit(1); })
  .finally(() => prisma.$disconnect());
