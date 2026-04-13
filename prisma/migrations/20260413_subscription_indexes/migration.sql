-- Add indexes to Subscription for Stripe webhook lookup performance
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubId_idx" ON "Subscription"("stripeSubId");
CREATE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");
