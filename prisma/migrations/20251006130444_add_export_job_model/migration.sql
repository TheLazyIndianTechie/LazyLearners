-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "videoDuration" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "videoMetadata" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "videoThumbnails" TEXT;

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN "completedAt" DATETIME;

-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchTime" INTEGER NOT NULL DEFAULT 0,
    "completionPercentage" REAL NOT NULL DEFAULT 0,
    "lastPosition" INTEGER NOT NULL DEFAULT 0,
    "resumePosition" INTEGER NOT NULL DEFAULT 0,
    "qualityPreference" TEXT,
    "playbackSpeed" REAL NOT NULL DEFAULT 1.0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoBookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    CONSTRAINT "VideoBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoBookmark_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "timecode" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    CONSTRAINT "LessonNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    CONSTRAINT "LessonQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    CONSTRAINT "LessonAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "LessonQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "resourceId" TEXT,
    "format" TEXT NOT NULL,
    "filters" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" REAL NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "ExportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VideoProgress_userId_idx" ON "VideoProgress"("userId");

-- CreateIndex
CREATE INDEX "VideoProgress_lessonId_idx" ON "VideoProgress"("lessonId");

-- CreateIndex
CREATE INDEX "VideoProgress_userId_lessonId_idx" ON "VideoProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "VideoProgress_completionPercentage_idx" ON "VideoProgress"("completionPercentage");

-- CreateIndex
CREATE INDEX "VideoProgress_updatedAt_idx" ON "VideoProgress"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_userId_lessonId_key" ON "VideoProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "VideoBookmark_userId_idx" ON "VideoBookmark"("userId");

-- CreateIndex
CREATE INDEX "VideoBookmark_lessonId_idx" ON "VideoBookmark"("lessonId");

-- CreateIndex
CREATE INDEX "VideoBookmark_userId_lessonId_idx" ON "VideoBookmark"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "VideoBookmark_createdAt_idx" ON "VideoBookmark"("createdAt");

-- CreateIndex
CREATE INDEX "VideoBookmark_position_idx" ON "VideoBookmark"("position");

-- CreateIndex
CREATE INDEX "LessonNote_userId_lessonId_idx" ON "LessonNote"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonNote_createdAt_idx" ON "LessonNote"("createdAt");

-- CreateIndex
CREATE INDEX "LessonQuestion_lessonId_createdAt_idx" ON "LessonQuestion"("lessonId", "createdAt");

-- CreateIndex
CREATE INDEX "LessonQuestion_userId_idx" ON "LessonQuestion"("userId");

-- CreateIndex
CREATE INDEX "LessonQuestion_resolved_idx" ON "LessonQuestion"("resolved");

-- CreateIndex
CREATE INDEX "LessonAnswer_questionId_createdAt_idx" ON "LessonAnswer"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "ExportJob_userId_idx" ON "ExportJob"("userId");

-- CreateIndex
CREATE INDEX "ExportJob_status_idx" ON "ExportJob"("status");

-- CreateIndex
CREATE INDEX "ExportJob_createdAt_idx" ON "ExportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ExportJob_userId_status_idx" ON "ExportJob"("userId", "status");
