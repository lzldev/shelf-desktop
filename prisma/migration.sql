-- CreateTable
CREATE TABLE "Contents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hash" TEXT,
    "extension" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Paths" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT,
    "mTimeMs" REAL,
    "contentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Paths_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Contents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "colorId" INTEGER,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tags_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "TagColors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentTags" (
    "contentId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("contentId", "tagId"),
    CONSTRAINT "ContentTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentTags_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Contents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TagColors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "contents_hash" ON "Contents"("hash");

-- CreateIndex
CREATE INDEX "paths_content_id" ON "Paths"("contentId");

-- CreateIndex
CREATE INDEX "paths_path" ON "Paths"("path");

-- CreateIndex
CREATE INDEX "content_tags_tag_id" ON "ContentTags"("tagId");

-- CreateIndex
CREATE INDEX "content_tags_content_id" ON "ContentTags"("contentId");
