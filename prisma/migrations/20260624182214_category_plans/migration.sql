/*
  Warnings:

  - You are about to drop the column `plannedItemId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `planned_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "planned_items" DROP CONSTRAINT "planned_items_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_plannedItemId_fkey";

-- DropIndex
DROP INDEX "transactions_plannedItemId_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "plannedItemId";

-- DropTable
DROP TABLE "planned_items";

-- CreateTable
CREATE TABLE "category_plans" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_plans_categoryId_key" ON "category_plans"("categoryId");

-- AddForeignKey
ALTER TABLE "category_plans" ADD CONSTRAINT "category_plans_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
