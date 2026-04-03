CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'USER');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "phoneCountry" TEXT,
  "phoneNumber" TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrawlRun" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "maxPages" INTEGER NOT NULL,
  "rateDelay" INTEGER NOT NULL,
  "checkExt" BOOLEAN NOT NULL,
  "total" INTEGER NOT NULL DEFAULT 0,
  "withIssues" INTEGER NOT NULL DEFAULT 0,
  "stats" JSONB,
  "duplicates" JSONB,
  "pages" JSONB,
  "downloadName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoadmapPhase" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoadmapPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoadmapTask" (
  "id" TEXT NOT NULL,
  "phaseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoadmapTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "CrawlRun_userId_createdAt_idx" ON "CrawlRun"("userId", "createdAt");
CREATE INDEX "CrawlRun_projectId_createdAt_idx" ON "CrawlRun"("projectId", "createdAt");
CREATE INDEX "RoadmapPhase_position_createdAt_idx" ON "RoadmapPhase"("position", "createdAt");
CREATE INDEX "RoadmapTask_phaseId_position_createdAt_idx" ON "RoadmapTask"("phaseId", "position", "createdAt");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "CrawlRun"
  ADD CONSTRAINT "CrawlRun_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "CrawlRun"
  ADD CONSTRAINT "CrawlRun_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "RoadmapTask"
  ADD CONSTRAINT "RoadmapTask_phaseId_fkey"
  FOREIGN KEY ("phaseId") REFERENCES "RoadmapPhase"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
