-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "engine" TEXT,
    "difficulty" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("category", "createdAt", "description", "difficulty", "duration", "engine", "id", "instructorId", "price", "published", "thumbnail", "title", "updatedAt") SELECT "category", "createdAt", "description", "difficulty", "duration", "engine", "id", "instructorId", "price", "published", "thumbnail", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_category_idx" ON "Course"("category");
CREATE INDEX "Course_published_idx" ON "Course"("published");
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");
CREATE INDEX "Course_difficulty_idx" ON "Course"("difficulty");
CREATE INDEX "Course_engine_idx" ON "Course"("engine");
CREATE INDEX "Course_createdAt_idx" ON "Course"("createdAt");
CREATE INDEX "Course_category_published_idx" ON "Course"("category", "published");
CREATE INDEX "Course_published_difficulty_idx" ON "Course"("published", "difficulty");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
