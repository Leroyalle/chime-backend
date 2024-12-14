/*
  Warnings:

  - You are about to drop the `UserBase` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `EmailUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TelegramUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VkUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserBase";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailUser" ("email", "id", "isVerified", "password") SELECT "email", "id", "isVerified", "password" FROM "EmailUser";
DROP TABLE "EmailUser";
ALTER TABLE "new_EmailUser" RENAME TO "EmailUser";
CREATE UNIQUE INDEX "EmailUser_email_key" ON "EmailUser"("email");
CREATE TABLE "new_TelegramUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TelegramUser" ("id", "telegramId") SELECT "id", "telegramId" FROM "TelegramUser";
DROP TABLE "TelegramUser";
ALTER TABLE "new_TelegramUser" RENAME TO "TelegramUser";
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
CREATE TABLE "new_VkUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vkId" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VkUser" ("id", "vkId") SELECT "id", "vkId" FROM "VkUser";
DROP TABLE "VkUser";
ALTER TABLE "new_VkUser" RENAME TO "VkUser";
CREATE UNIQUE INDEX "VkUser_vkId_key" ON "VkUser"("vkId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
