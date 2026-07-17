-- CreateTable
CREATE TABLE "ProjectDataSourceModel" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "primaryField" TEXT NOT NULL,
    "listApi" JSONB,
    "detailApi" JSONB,
    "createApi" JSONB,
    "updateApi" JSONB,
    "deleteApi" JSONB,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDataSourceModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDataSourceModel_projectId_key_key" ON "ProjectDataSourceModel"("projectId", "key");

-- CreateIndex
CREATE INDEX "ProjectDataSourceModel_projectId_updatedAt_idx" ON "ProjectDataSourceModel"("projectId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ProjectDataSourceModel" ADD CONSTRAINT "ProjectDataSourceModel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
