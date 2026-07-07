-- ============================================================
-- Script de recálculo de estadísticas de Academia
-- Corrige datos inflados por bugs de duplicación
-- ============================================================

BEGIN;

-- 1. Recalcular lessons_completed reales
UPDATE "user_statistics" us
SET "lessonsCompleted" = (
  SELECT COUNT(*)
  FROM "user_lesson_progress" ulp
  WHERE ulp."userId" = us."userId"
    AND ulp."status" = 'COMPLETED'
)
WHERE EXISTS (
  SELECT 1 FROM "user_lesson_progress" ulp
  WHERE ulp."userId" = us."userId"
);

-- 2. Recalcular modules_completed reales desde user_module_progress
UPDATE "user_statistics" us
SET "modulesCompleted" = (
  SELECT COUNT(*)
  FROM "user_module_progress" ump
  WHERE ump."userId" = us."userId"
    AND ump."status" = 'COMPLETED'
);

-- 3. Recalcular totalXpEarned desde transacciones reales
UPDATE "user_statistics" us
SET "totalXpEarned" = (
  SELECT COALESCE(SUM("amount"), 0)
  FROM "xp_transactions" xt
  WHERE xt."userId" = us."userId"
    AND xt."source" IN ('LESSON_COMPLETED', 'MODULE_COMPLETED')
);

-- 4. Recalcular readingProgress en cada user_module_progress
UPDATE "user_module_progress" ump
SET "readingProgress" = (
  SELECT
    CASE
      WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE ulp."status" = 'COMPLETED')) * 100.0 / COUNT(*))
      ELSE 0
    END
  FROM "lessons" l
  LEFT JOIN "user_lesson_progress" ulp
    ON ulp."lessonId" = l."id" AND ulp."userId" = ump."userId"
  WHERE l."moduleId" = ump."moduleId"
);

-- 5. Recalcular quizzes completados, aprobados y distintos aprobados
UPDATE "user_statistics" us
SET
  "quizzesCompleted" = (
    SELECT COUNT(*)
    FROM "quiz_attempts" qa
    WHERE qa."userId" = us."userId"
  ),
  "quizzesPassed" = (
    SELECT COUNT(*)
    FROM "quiz_attempts" qa
    WHERE qa."userId" = us."userId" AND qa."passed" = true
  ),
  "distinctPassedQuizzes" = (
    SELECT COUNT(DISTINCT qa."quizId")
    FROM "quiz_attempts" qa
    WHERE qa."userId" = us."userId" AND qa."passed" = true
  );

-- 6. Sincronizar user_game_stats.xp con todas las transacciones XP
UPDATE "user_game_stats" ugs
SET "xp" = (
  SELECT COALESCE(SUM("amount"), 0)
  FROM "xp_transactions" xt
  WHERE xt."userId" = ugs."userId"
);

-- 7. Recalcular niveles según XP recalculado
UPDATE "user_game_stats" ugs
SET "level" = (
  SELECT COALESCE(
    (SELECT l."number" FROM "levels" l
     WHERE l."xpRequired" <= ugs."xp"
     ORDER BY l."number" DESC LIMIT 1),
    1
  )
);

COMMIT;
