/*
  Warnings:

  - The primary key for the `Comment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `EmailUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Follows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GoogleUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Like` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Post` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TelegramUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserBase` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `VerificationCode` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "id", "postId", "updatedAt", "userId") SELECT "content", "createdAt", "id", "postId", "updatedAt", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_EmailUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "userBaseId" TEXT NOT NULL,
    CONSTRAINT "EmailUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmailUser" ("email", "id", "password", "userBaseId") SELECT "email", "id", "password", "userBaseId" FROM "EmailUser";
DROP TABLE "EmailUser";
ALTER TABLE "new_EmailUser" RENAME TO "EmailUser";
CREATE UNIQUE INDEX "EmailUser_email_key" ON "EmailUser"("email");
CREATE UNIQUE INDEX "EmailUser_userBaseId_key" ON "EmailUser"("userBaseId");
CREATE TABLE "new_Follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    CONSTRAINT "Follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Follows" ("followerId", "followingId", "id") SELECT "followerId", "followingId", "id" FROM "Follows";
DROP TABLE "Follows";
ALTER TABLE "new_Follows" RENAME TO "Follows";
CREATE TABLE "new_GoogleUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "userBaseId" TEXT NOT NULL,
    CONSTRAINT "GoogleUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GoogleUser" ("email", "givenName", "id", "name", "photoUrl", "userBaseId") SELECT "email", "givenName", "id", "name", "photoUrl", "userBaseId" FROM "GoogleUser";
DROP TABLE "GoogleUser";
ALTER TABLE "new_GoogleUser" RENAME TO "GoogleUser";
CREATE UNIQUE INDEX "GoogleUser_email_key" ON "GoogleUser"("email");
CREATE UNIQUE INDEX "GoogleUser_userBaseId_key" ON "GoogleUser"("userBaseId");
CREATE TABLE "new_Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Like" ("id", "postId", "userId") SELECT "id", "postId", "userId" FROM "Like";
DROP TABLE "Like";
ALTER TABLE "new_Like" RENAME TO "Like";
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "id", "imageUrl") SELECT "authorId", "content", "createdAt", "id", "imageUrl" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE TABLE "new_TelegramUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "authDate" DATETIME NOT NULL,
    "userBaseId" TEXT NOT NULL,
    CONSTRAINT "TelegramUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TelegramUser" ("authDate", "firstName", "id", "photoUrl", "telegramId", "userBaseId", "username") SELECT "authDate", "firstName", "id", "photoUrl", "telegramId", "userBaseId", "username" FROM "TelegramUser";
DROP TABLE "TelegramUser";
ALTER TABLE "new_TelegramUser" RENAME TO "TelegramUser";
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
CREATE UNIQUE INDEX "TelegramUser_userBaseId_key" ON "TelegramUser"("userBaseId");
CREATE TABLE "new_UserBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserBase" ("banned", "createdAt", "id", "role", "updatedAt") SELECT "banned", "createdAt", "id", "role", "updatedAt" FROM "UserBase";
DROP TABLE "UserBase";
ALTER TABLE "new_UserBase" RENAME TO "UserBase";
CREATE TABLE "new_VerificationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "EmailUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VerificationCode" ("code", "createdAt", "expiresAt", "id", "userId") SELECT "code", "createdAt", "expiresAt", "id", "userId" FROM "VerificationCode";
DROP TABLE "VerificationCode";
ALTER TABLE "new_VerificationCode" RENAME TO "VerificationCode";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
