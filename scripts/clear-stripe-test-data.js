/**
 * clear-stripe-test-data.js
 * Clears stripeCustomerId and stripeSubId from all subscriptions so they
 * get re-created against the live Stripe account on next checkout.
 *
 * Usage:
 *   node scripts/clear-stripe-test-data.js
 *   node scripts/clear-stripe-test-data.js --dry-run
 */

const { PrismaClient } = require("@prisma/client");

const isDryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

async function main() {
  const affected = await prisma.subscription.findMany({
    where: {
      OR: [
        { stripeCustomerId: { not: null } },
        { stripeSubId: { not: null } },
      ],
    },
    select: { id: true, userId: true, plan: true, stripeCustomerId: true, stripeSubId: true },
  });

  if (affected.length === 0) {
    console.log("No subscriptions with Stripe data found. Nothing to do.");
    return;
  }

  console.log(`Found ${affected.length} subscription(s) with Stripe test data:`);
  for (const s of affected) {
    console.log(`  userId=${s.userId}  plan=${s.plan}  customerId=${s.stripeCustomerId}  subId=${s.stripeSubId}`);
  }

  if (isDryRun) {
    console.log("\n--dry-run: no changes made.");
    return;
  }

  const result = await prisma.subscription.updateMany({
    where: {
      OR: [
        { stripeCustomerId: { not: null } },
        { stripeSubId: { not: null } },
      ],
    },
    data: {
      stripeCustomerId: null,
      stripeSubId: null,
    },
  });

  console.log(`\nCleared Stripe data from ${result.count} subscription(s).`);
  console.log("Users will get a fresh live Stripe customer on next checkout.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
