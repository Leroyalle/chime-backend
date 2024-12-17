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
