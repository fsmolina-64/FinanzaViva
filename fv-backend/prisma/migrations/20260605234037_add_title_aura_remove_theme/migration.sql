DELETE FROM "user_rewards" WHERE "rewardId" IN (SELECT id FROM "rewards" WHERE "type" = 'THEME');
DELETE FROM "rewards" WHERE "type" = 'THEME';

BEGIN;
CREATE TYPE "RewardType_new" AS ENUM ('AVATAR', 'TITLE', 'AURA', 'BADGE', 'SIMULATOR_EVENT', 'FRAME');
ALTER TABLE "rewards" ALTER COLUMN "type" TYPE "RewardType_new" USING ("type"::text::"RewardType_new");
ALTER TYPE "RewardType" RENAME TO "RewardType_old";
ALTER TYPE "RewardType_new" RENAME TO "RewardType";
DROP TYPE "public"."RewardType_old";
COMMIT;