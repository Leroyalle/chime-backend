/*
  Warnings:

  - You are about to drop the column `isVerified` on the `EmailUser` table. All the data in the column will be lost.

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
INSERT INTO "new_EmailUser" ("email", "id", "password", "userBaseId") SELECT "email", "id", "password", "userBaseId" FROM "EmailUser";
DROP TABLE "EmailUser";
ALTER TABLE "new_EmailUser" RENAME TO "EmailUser";
CREATE UNIQUE INDEX "EmailUser_email_key" ON "EmailUser"("email");
CREATE UNIQUE INDEX "EmailUser_userBaseId_key" ON "EmailUser"("userBaseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
