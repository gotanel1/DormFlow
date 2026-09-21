-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "waterPrev" INTEGER NOT NULL DEFAULT 0,
    "waterCurr" INTEGER NOT NULL DEFAULT 0,
    "elecPrev" INTEGER NOT NULL DEFAULT 0,
    "elecCurr" INTEGER NOT NULL DEFAULT 0,
    "waterUnits" INTEGER NOT NULL,
    "elecUnits" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeterReading_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MeterReading" ("elecUnits", "id", "month", "recordedAt", "roomId", "waterUnits") SELECT "elecUnits", "id", "month", "recordedAt", "roomId", "waterUnits" FROM "MeterReading";
DROP TABLE "MeterReading";
ALTER TABLE "new_MeterReading" RENAME TO "MeterReading";
CREATE UNIQUE INDEX "MeterReading_roomId_month_key" ON "MeterReading"("roomId", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Expense_month_idx" ON "Expense"("month");
