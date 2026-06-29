-- AlterTable: make categoryId nullable in transactions
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_categoryId_fkey";
ALTER TABLE "transactions" ALTER COLUMN "categoryId" DROP NOT NULL;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
