-- AlterTable
ALTER TABLE "Page" ADD COLUMN "publicId" TEXT,
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "publishedVersionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Page_publicId_key" ON "Page"("publicId");
