CREATE TYPE "RemoteMaterialStatus" AS ENUM ('enabled', 'disabled');

ALTER TABLE "Page"
ADD COLUMN "materialDependencies" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "PageVersion"
ADD COLUMN "materialDependencies" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "ProjectRemoteMaterial" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "packageName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "manifestUrl" TEXT NOT NULL,
    "entry" TEXT NOT NULL,
    "integrity" TEXT,
    "dependencies" JSONB NOT NULL,
    "materials" JSONB NOT NULL,
    "status" "RemoteMaterialStatus" NOT NULL DEFAULT 'enabled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRemoteMaterial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectRemoteMaterial_projectId_packageName_version_key"
ON "ProjectRemoteMaterial"("projectId", "packageName", "version");

CREATE UNIQUE INDEX "ProjectRemoteMaterial_projectId_packageName_enabled_key"
ON "ProjectRemoteMaterial"("projectId", "packageName")
WHERE "status" = 'enabled';

CREATE INDEX "ProjectRemoteMaterial_projectId_status_updatedAt_idx"
ON "ProjectRemoteMaterial"("projectId", "status", "updatedAt");

ALTER TABLE "ProjectRemoteMaterial"
ADD CONSTRAINT "ProjectRemoteMaterial_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
