-- CreateTable
CREATE TABLE "GoogleUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "userBaseId" INTEGER NOT NULL,
    CONSTRAINT "GoogleUser_userBaseId_fkey" FOREIGN KEY ("userBaseId") REFERENCES "UserBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleUser_email_key" ON "GoogleUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleUser_userBaseId_key" ON "GoogleUser"("userBaseId");
