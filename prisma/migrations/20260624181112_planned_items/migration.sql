-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "plannedItemId" TEXT;

-- CreateTable
CREATE TABLE "planned_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "categoryId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_plannedItemId_idx" ON "transactions"("plannedItemId");

-- AddForeignKey
ALTER TABLE "planned_items" ADD CONSTRAINT "planned_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_plannedItemId_fkey" FOREIGN KEY ("plannedItemId") REFERENCES "planned_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
