-- AlterEnum
ALTER TYPE "CellType" ADD VALUE 'DECISION';
ALTER TYPE "CellType" ADD VALUE 'EDUCATIONAL';

-- AlterEnum
ALTER TYPE "GamePhase" ADD VALUE 'DECISION_PENDING';

-- CreateTable
CREATE TABLE "cell_decision_options" (
    "id" TEXT NOT NULL,
    "cellId" INTEGER NOT NULL,
    "text" VARCHAR(400) NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "amount" INTEGER NOT NULL,
    "explanation" VARCHAR(600) NOT NULL,

    CONSTRAINT "cell_decision_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cell_decision_options_cellId_idx" ON "cell_decision_options"("cellId");

-- AddForeignKey
ALTER TABLE "cell_decision_options" ADD CONSTRAINT "cell_decision_options_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "board_cells"("position") ON DELETE CASCADE ON UPDATE CASCADE;
