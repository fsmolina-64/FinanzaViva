-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
