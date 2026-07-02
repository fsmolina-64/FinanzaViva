-- Rename column
ALTER TABLE "cell_decision_options" RENAME COLUMN "cellId" TO "cellPosition";

-- Rename index
ALTER INDEX "cell_decision_options_cellId_idx" RENAME TO "cell_decision_options_cellPosition_idx";
