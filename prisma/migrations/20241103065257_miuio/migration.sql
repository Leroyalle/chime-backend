/*
  Warnings:

  - Added the required column `userBaseId` to the `EmailUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userBaseId` to the `TelegramUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userBaseId` to the `VkUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "userBaseId" INTEGER NOT NULL,
    CONSTRAINT "EmailUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmailUser" ("email", "id", "password") SELECT "email", "id", "password" FROM "EmailUser";
DROP TABLE "EmailUser";
ALTER TABLE "new_EmailUser" RENAME TO "EmailUser";
CREATE UNIQUE INDEX "EmailUser_email_key" ON "EmailUser"("email");
CREATE UNIQUE INDEX "EmailUser_userBaseId_key" ON "EmailUser"("userBaseId");
CREATE TABLE "new_TelegramUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" TEXT NOT NULL,
    "userBaseId" INTEGER NOT NULL,
    CONSTRAINT "TelegramUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TelegramUser" ("id", "telegramId") SELECT "id", "telegramId" FROM "TelegramUser";
DROP TABLE "TelegramUser";
ALTER TABLE "new_TelegramUser" RENAME TO "TelegramUser";
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
CREATE UNIQUE INDEX "TelegramUser_userBaseId_key" ON "TelegramUser"("userBaseId");
CREATE TABLE "new_VkUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vkId" TEXT NOT NULL,
    "userBaseId" INTEGER NOT NULL,
    CONSTRAINT "VkUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VkUser" ("id", "vkId") SELECT "id", "vkId" FROM "VkUser";
DROP TABLE "VkUser";
ALTER TABLE "new_VkUser" RENAME TO "VkUser";
CREATE UNIQUE INDEX "VkUser_vkId_key" ON "VkUser"("vkId");
CREATE UNIQUE INDEX "VkUser_userBaseId_key" ON "VkUser"("userBaseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
