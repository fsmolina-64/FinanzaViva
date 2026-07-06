-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletion_scheduled_at" TIMESTAMP(3);
