-- AlterTable
ALTER TABLE "Family" ADD COLUMN     "budgets" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "monthStartDay" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#BFEFE0';

-- CreateTable
CREATE TABLE "AccountAlias" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountAlias_userId_idx" ON "AccountAlias"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountAlias_accountId_userId_key" ON "AccountAlias"("accountId", "userId");

-- AddForeignKey
ALTER TABLE "AccountAlias" ADD CONSTRAINT "AccountAlias_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountAlias" ADD CONSTRAINT "AccountAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
