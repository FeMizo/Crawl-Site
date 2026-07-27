CREATE TABLE "AiSeoRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "primaryKeyword" TEXT NOT NULL,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intent" TEXT,
    "suggestedTitle" TEXT,
    "suggestedMeta" TEXT,
    "suggestedH1" TEXT,
    "suggestedH2s" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT NOT NULL DEFAULT 'local',
    "model" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSeoRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "runId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "wpPostId" TEXT,
    "wpPostUrl" TEXT,
    "driveFileId" TEXT,
    "driveFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WordPressConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedAppPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoogleDriveConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "folderId" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleDriveConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiSeoRecommendation_runId_pageUrl_key" ON "AiSeoRecommendation"("runId", "pageUrl");
CREATE INDEX "AiSeoRecommendation_userId_projectId_idx" ON "AiSeoRecommendation"("userId", "projectId");
CREATE INDEX "BlogDraft_userId_projectId_createdAt_idx" ON "BlogDraft"("userId", "projectId", "createdAt");
CREATE INDEX "BlogDraft_projectId_slug_idx" ON "BlogDraft"("projectId", "slug");
CREATE UNIQUE INDEX "WordPressConnection_projectId_key" ON "WordPressConnection"("projectId");
CREATE INDEX "WordPressConnection_userId_idx" ON "WordPressConnection"("userId");
CREATE UNIQUE INDEX "GoogleDriveConnection_userId_key" ON "GoogleDriveConnection"("userId");

ALTER TABLE "AiSeoRecommendation" ADD CONSTRAINT "AiSeoRecommendation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiSeoRecommendation" ADD CONSTRAINT "AiSeoRecommendation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogDraft" ADD CONSTRAINT "BlogDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogDraft" ADD CONSTRAINT "BlogDraft_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CrawlRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WordPressConnection" ADD CONSTRAINT "WordPressConnection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleDriveConnection" ADD CONSTRAINT "GoogleDriveConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
