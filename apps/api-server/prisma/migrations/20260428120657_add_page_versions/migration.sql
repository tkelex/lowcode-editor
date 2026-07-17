-- CreateTable
CREATE TABLE "PageVersion" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'save',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageVersion_pageId_createdAt_idx" ON "PageVersion"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "PageVersion_createdById_idx" ON "PageVersion"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_pageId_versionNo_key" ON "PageVersion"("pageId", "versionNo");

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
