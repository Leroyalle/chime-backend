/*
  Warnings:

  - Added the required column `name` to the `UserBase` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "about" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserBase" ("banned", "createdAt", "id", "role", "updatedAt") SELECT "banned", "createdAt", "id", "role", "updatedAt" FROM "UserBase";
DROP TABLE "UserBase";
ALTER TABLE "new_UserBase" RENAME TO "UserBase";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
