-- CreateTable
CREATE TABLE "PageTemplate" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'block',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "schema" JSONB NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'project',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageTemplate_projectId_type_idx" ON "PageTemplate"("projectId", "type");

-- CreateIndex
CREATE INDEX "PageTemplate_createdById_idx" ON "PageTemplate"("createdById");

-- CreateIndex
CREATE INDEX "PageTemplate_visibility_type_idx" ON "PageTemplate"("visibility", "type");

-- AddForeignKey
ALTER TABLE "PageTemplate" ADD CONSTRAINT "PageTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageTemplate" ADD CONSTRAINT "PageTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
