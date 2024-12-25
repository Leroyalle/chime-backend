/*
  Warnings:

  - You are about to drop the column `chatId` on the `UserBase` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_ChatToUserBase" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ChatToUserBase_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChatToUserBase_B_fkey" FOREIGN KEY ("B") REFERENCES "UserBase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "about" TEXT,
    "name" TEXT NOT NULL DEFAULT 'User',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserBase" ("about", "banned", "createdAt", "id", "name", "role", "updatedAt") SELECT "about", "banned", "createdAt", "id", "name", "role", "updatedAt" FROM "UserBase";
DROP TABLE "UserBase";
ALTER TABLE "new_UserBase" RENAME TO "UserBase";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ChatToUserBase_AB_unique" ON "_ChatToUserBase"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatToUserBase_B_index" ON "_ChatToUserBase"("B");
