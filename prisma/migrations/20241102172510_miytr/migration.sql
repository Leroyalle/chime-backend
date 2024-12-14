/*
  Warnings:

  - You are about to drop the column `banned` on the `EmailUser` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EmailUser` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `EmailUser` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `EmailUser` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EmailUser` table. All the data in the column will be lost.
  - You are about to drop the column `banned` on the `TelegramUser` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TelegramUser` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `TelegramUser` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TelegramUser` table. All the data in the column will be lost.
  - You are about to drop the column `banned` on the `VkUser` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VkUser` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `VkUser` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VkUser` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "UserBase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    CONSTRAINT "EmailUser_id_fkey" FOREIGN KEY ("id") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmailUser" ("email", "id", "password") SELECT "email", "id", "password" FROM "EmailUser";
DROP TABLE "EmailUser";
ALTER TABLE "new_EmailUser" RENAME TO "EmailUser";
CREATE UNIQUE INDEX "EmailUser_email_key" ON "EmailUser"("email");
CREATE TABLE "new_TelegramUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" TEXT NOT NULL,
    CONSTRAINT "TelegramUser_id_fkey" FOREIGN KEY ("id") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TelegramUser" ("id", "telegramId") SELECT "id", "telegramId" FROM "TelegramUser";
DROP TABLE "TelegramUser";
ALTER TABLE "new_TelegramUser" RENAME TO "TelegramUser";
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
CREATE TABLE "new_VkUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vkId" TEXT NOT NULL,
    CONSTRAINT "VkUser_id_fkey" FOREIGN KEY ("id") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VkUser" ("id", "vkId") SELECT "id", "vkId" FROM "VkUser";
DROP TABLE "VkUser";
ALTER TABLE "new_VkUser" RENAME TO "VkUser";
CREATE UNIQUE INDEX "VkUser_vkId_key" ON "VkUser"("vkId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
