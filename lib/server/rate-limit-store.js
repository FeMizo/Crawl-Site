// Postgres-backed store for express-rate-limit (v6 Store interface).
//
// Rationale: the app runs as Vercel serverless functions — each invocation
// can be a separate process/instance, so express-rate-limit's default
// in-memory store enforces almost nothing across instances. This store
// persists counters in Postgres via Prisma (RateLimitEntry table) so the
// same limiter state is shared across all instances.
//
// express-rate-limit v6 Store interface:
//   init(options)
//   async increment(key) -> { totalHits, resetTime }
//   async decrement(key)
//   async resetKey(key)

class PrismaRateLimitStore {
  /**
   * @param {{ prisma: import("@prisma/client").PrismaClient, prefix: string }} opts
   */
  constructor({ prisma, prefix }) {
    this.prisma = prisma;
    this.prefix = prefix;
    this.windowMs = 60 * 1000; // sane default, overwritten by init()
  }

  init(options) {
    if (options && typeof options.windowMs === "number") {
      this.windowMs = options.windowMs;
    }
  }

  _fullKey(key) {
    return `${this.prefix}:${key}`;
  }

  async increment(key) {
    const fullKey = this._fullKey(key);
    const now = new Date();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.rateLimitEntry.findUnique({
          where: { key: fullKey },
        });

        if (!existing || existing.expiresAt <= now) {
          const resetTime = new Date(now.getTime() + this.windowMs);
          const row = await tx.rateLimitEntry.upsert({
            where: { key: fullKey },
            create: { key: fullKey, count: 1, expiresAt: resetTime },
            update: { count: 1, expiresAt: resetTime },
          });
          return row;
        }

        const row = await tx.rateLimitEntry.update({
          where: { key: fullKey },
          data: { count: { increment: 1 } },
        });
        return row;
      });

      // Opportunistic cleanup of expired rows — fire and forget, never
      // block the request path on this.
      if (Math.random() < 0.01) {
        this.prisma.rateLimitEntry
          .deleteMany({ where: { expiresAt: { lte: now } } })
          .catch((err) => {
            console.warn("[rate-limit-store] cleanup failed:", err.message);
          });
      }

      return { totalHits: result.count, resetTime: result.expiresAt };
    } catch (err) {
      // FAIL OPEN: a DB error must never take down login/crawl endpoints.
      console.warn(
        `[rate-limit-store] increment failed for ${fullKey}, failing open:`,
        err.message,
      );
      return {
        totalHits: 1,
        resetTime: new Date(Date.now() + this.windowMs),
      };
    }
  }

  async decrement(key) {
    const fullKey = this._fullKey(key);
    const now = new Date();

    try {
      const existing = await this.prisma.rateLimitEntry.findUnique({
        where: { key: fullKey },
      });

      if (!existing || existing.expiresAt <= now) {
        return;
      }

      const nextCount = Math.max(0, existing.count - 1);
      await this.prisma.rateLimitEntry.update({
        where: { key: fullKey },
        data: { count: nextCount },
      });
    } catch (err) {
      // Swallow not-found / DB errors — decrement is best-effort.
      console.warn(
        `[rate-limit-store] decrement failed for ${fullKey}:`,
        err.message,
      );
    }
  }

  async resetKey(key) {
    const fullKey = this._fullKey(key);

    try {
      await this.prisma.rateLimitEntry.delete({ where: { key: fullKey } });
    } catch (err) {
      // Swallow not-found errors.
      if (err.code !== "P2025") {
        console.warn(
          `[rate-limit-store] resetKey failed for ${fullKey}:`,
          err.message,
        );
      }
    }
  }
}

module.exports = { PrismaRateLimitStore };
