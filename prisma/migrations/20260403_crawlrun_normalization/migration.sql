BEGIN;

DO $$
BEGIN
  CREATE TYPE "CrawlStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CrawlRunPage" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "finalUrl" TEXT,
  "statusCode" INTEGER,
  "hasIssues" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT,
  "titleLen" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "descLen" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CrawlRunPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CrawlRunDuplicate" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "urlCount" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CrawlRunDuplicate_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "CrawlRunPage"
    ADD CONSTRAINT "CrawlRunPage_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CrawlRunDuplicate"
    ADD CONSTRAINT "CrawlRunDuplicate_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CrawlRun"
  ADD COLUMN IF NOT EXISTS "sourceType" TEXT,
  ADD COLUMN IF NOT EXISTS "statusV2" "CrawlStatus";

UPDATE "CrawlRun"
SET "sourceType" = COALESCE(NULLIF("sourceType", ''), NULLIF("source", ''), 'crawl')
WHERE "sourceType" IS NULL
   OR "sourceType" = '';

UPDATE "CrawlRun"
SET "statusV2" = CASE LOWER(COALESCE("status"::text, 'completed'))
  WHEN 'pending' THEN 'PENDING'::"CrawlStatus"
  WHEN 'running' THEN 'RUNNING'::"CrawlStatus"
  WHEN 'failed' THEN 'FAILED'::"CrawlStatus"
  WHEN 'cancelled' THEN 'CANCELLED'::"CrawlStatus"
  ELSE 'COMPLETED'::"CrawlStatus"
END
WHERE "statusV2" IS NULL;

INSERT INTO "CrawlRunPage" (
  "id",
  "runId",
  "position",
  "url",
  "finalUrl",
  "statusCode",
  "hasIssues",
  "title",
  "titleLen",
  "description",
  "descLen",
  "payload",
  "createdAt"
)
SELECT
  r.id || '_page_' || (page_entry.ordinality - 1)::text AS "id",
  r.id AS "runId",
  (page_entry.ordinality - 1)::integer AS "position",
  LEFT(COALESCE(NULLIF(page_entry.item ->> 'url', ''), r."sourceUrl"), 2048) AS "url",
  NULLIF(LEFT(COALESCE(page_entry.item ->> 'finalUrl', ''), 2048), '') AS "finalUrl",
  CASE
    WHEN COALESCE(page_entry.item ->> 'statusCode', '') ~ '^-?[0-9]+$'
      THEN (page_entry.item ->> 'statusCode')::integer
    ELSE NULL
  END AS "statusCode",
  CASE
    WHEN COALESCE(page_entry.item ->> 'hasIssues', '') IN ('true', 'false')
      THEN (page_entry.item ->> 'hasIssues')::boolean
    WHEN jsonb_typeof(page_entry.item -> 'issues') = 'array'
      THEN jsonb_array_length(page_entry.item -> 'issues') > 0
    ELSE false
  END AS "hasIssues",
  NULLIF(LEFT(COALESCE(page_entry.item ->> 'title', ''), 512), '') AS "title",
  CASE
    WHEN COALESCE(page_entry.item ->> 'titleLen', '') ~ '^-?[0-9]+$'
      THEN (page_entry.item ->> 'titleLen')::integer
    ELSE 0
  END AS "titleLen",
  NULLIF(LEFT(COALESCE(page_entry.item ->> 'description', ''), 2048), '') AS "description",
  CASE
    WHEN COALESCE(page_entry.item ->> 'descLen', '') ~ '^-?[0-9]+$'
      THEN (page_entry.item ->> 'descLen')::integer
    ELSE 0
  END AS "descLen",
  page_entry.item AS "payload",
  r."createdAt" AS "createdAt"
FROM "CrawlRun" r
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(r."pages") = 'array' THEN r."pages"
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS page_entry(item, ordinality)
WHERE NOT EXISTS (
  SELECT 1
  FROM "CrawlRunPage" existing
  WHERE existing."runId" = r.id
);

INSERT INTO "CrawlRunDuplicate" (
  "id",
  "runId",
  "position",
  "title",
  "urlCount",
  "payload",
  "createdAt"
)
SELECT
  r.id || '_dup_' || (dup_entry.ordinality - 1)::text AS "id",
  r.id AS "runId",
  (dup_entry.ordinality - 1)::integer AS "position",
  LEFT(COALESCE(dup_entry.item ->> 'title', ''), 512) AS "title",
  CASE
    WHEN jsonb_typeof(dup_entry.item -> 'urls') = 'array'
      THEN jsonb_array_length(dup_entry.item -> 'urls')
    WHEN COALESCE(dup_entry.item ->> 'urlCount', '') ~ '^-?[0-9]+$'
      THEN (dup_entry.item ->> 'urlCount')::integer
    ELSE 0
  END AS "urlCount",
  jsonb_build_object(
    'title', COALESCE(dup_entry.item ->> 'title', ''),
    'urls', CASE
      WHEN jsonb_typeof(dup_entry.item -> 'urls') = 'array'
        THEN dup_entry.item -> 'urls'
      ELSE '[]'::jsonb
    END
  ) AS "payload",
  r."createdAt" AS "createdAt"
FROM "CrawlRun" r
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(r."duplicates") = 'array' THEN r."duplicates"
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS dup_entry(item, ordinality)
WHERE NOT EXISTS (
  SELECT 1
  FROM "CrawlRunDuplicate" existing
  WHERE existing."runId" = r.id
);

ALTER TABLE "CrawlRun"
  ALTER COLUMN "sourceType" SET DEFAULT 'crawl',
  ALTER COLUMN "sourceType" SET NOT NULL,
  ALTER COLUMN "statusV2" SET DEFAULT 'COMPLETED',
  ALTER COLUMN "statusV2" SET NOT NULL;

ALTER TABLE "CrawlRun"
  DROP COLUMN "duplicates",
  DROP COLUMN "pages",
  DROP COLUMN "source",
  DROP COLUMN "status";

ALTER TABLE "CrawlRun"
  RENAME COLUMN "statusV2" TO "status";

DROP INDEX IF EXISTS "RoadmapPhase_position_createdAt_idx";
DROP INDEX IF EXISTS "RoadmapTask_phaseId_position_createdAt_idx";

CREATE INDEX IF NOT EXISTS "CrawlRunPage_runId_position_idx"
  ON "CrawlRunPage"("runId", "position");

CREATE INDEX IF NOT EXISTS "CrawlRunPage_runId_hasIssues_position_idx"
  ON "CrawlRunPage"("runId", "hasIssues", "position");

CREATE INDEX IF NOT EXISTS "CrawlRunPage_url_idx"
  ON "CrawlRunPage"("url");

CREATE INDEX IF NOT EXISTS "CrawlRunDuplicate_runId_position_idx"
  ON "CrawlRunDuplicate"("runId", "position");

CREATE INDEX IF NOT EXISTS "CrawlRunDuplicate_runId_urlCount_idx"
  ON "CrawlRunDuplicate"("runId", "urlCount");

CREATE INDEX IF NOT EXISTS "CrawlRun_status_createdAt_idx"
  ON "CrawlRun"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Project_userId_createdAt_idx"
  ON "Project"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "RoadmapPhase_position_idx"
  ON "RoadmapPhase"("position");

CREATE INDEX IF NOT EXISTS "RoadmapTask_phaseId_position_idx"
  ON "RoadmapTask"("phaseId", "position");

COMMIT;
