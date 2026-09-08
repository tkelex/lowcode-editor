CREATE TABLE "AiAgentRun" (
  "id" TEXT PRIMARY KEY,
  "actorId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "projectId" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "pageId" INTEGER REFERENCES "Page"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "input" JSONB NOT NULL,
  "snapshot" JSONB NOT NULL,
  "baselineFingerprint" TEXT,
  "savedVersionId" INTEGER,
  "lastSequence" INTEGER NOT NULL DEFAULT 0,
  "leaseToken" TEXT,
  "leaseExpiresAt" TIMESTAMP(3),
  "recoveryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "candidateExpiresAt" TIMESTAMP(3),
  CONSTRAINT "AiAgentRun_status_check" CHECK ("status" IN ('queued','running','awaiting_confirmation','accepted','rejected','expired','cancelled','failed'))
);
CREATE INDEX "AiAgentRun_status_createdAt_idx" ON "AiAgentRun"("status", "createdAt");
CREATE INDEX "AiAgentRun_pageId_actorId_createdAt_idx" ON "AiAgentRun"("pageId", "actorId", "createdAt");
CREATE INDEX "AiAgentRun_projectId_actorId_createdAt_idx" ON "AiAgentRun"("projectId", "actorId", "createdAt");
-- Prisma cannot express partial indexes. Keep this constraint in migrations.
CREATE UNIQUE INDEX "AiAgentRun_active_page_key" ON "AiAgentRun"("pageId")
  WHERE "pageId" IS NOT NULL AND "status" IN ('queued', 'running');
CREATE TABLE "AiAgentRunEvent" (
  "runId" TEXT NOT NULL REFERENCES "AiAgentRun"("id") ON DELETE CASCADE,
  "sequence" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("runId", "sequence")
);
