-- CreateTable
CREATE TABLE "planned_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planned_items_categoryId_idx" ON "planned_items"("categoryId");

-- AddForeignKey
ALTER TABLE "planned_items" ADD CONSTRAINT "planned_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate each existing per-category plan into a single planned item (named
-- after its category) so current budgets are preserved.
INSERT INTO "planned_items" ("id", "categoryId", "name", "amount", "dayOfMonth", "active", "createdBy", "createdAt")
SELECT cp."id", cp."categoryId", c."name", cp."amount", cp."dayOfMonth", cp."active", cp."createdBy", cp."createdAt"
FROM "category_plans" cp
JOIN "categories" c ON c."id" = cp."categoryId";

-- DropTable
DROP TABLE "category_plans";
