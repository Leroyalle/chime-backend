/*
  Warnings:

  - Added the required column `authDate` to the `TelegramUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `TelegramUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoUrl` to the `TelegramUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `TelegramUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TelegramUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "authDate" DATETIME NOT NULL,
    "userBaseId" INTEGER NOT NULL,
    CONSTRAINT "TelegramUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TelegramUser" ("id", "telegramId", "userBaseId") SELECT "id", "telegramId", "userBaseId" FROM "TelegramUser";
DROP TABLE "TelegramUser";
ALTER TABLE "new_TelegramUser" RENAME TO "TelegramUser";
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
CREATE UNIQUE INDEX "TelegramUser_userBaseId_key" ON "TelegramUser"("userBaseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
