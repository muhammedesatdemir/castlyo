/*
  Warnings:

  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Profile";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "talent_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "status" TEXT,
    "lastLogin" TEXT,
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "gender" TEXT,
    "birthDate" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "specialties" JSONB,
    "experience" TEXT,
    "activities" JSONB,
    "portfolioImages" JSONB,
    "portfolioVideos" JSONB,
    "isPublic" BOOLEAN DEFAULT true,
    "boostedUntil" DATETIME,
    CONSTRAINT "talent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "talent_profiles_userId_key" ON "talent_profiles"("userId");
