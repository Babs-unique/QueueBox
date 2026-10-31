-- CreateEnum
CREATE TYPE "DqStatus" AS ENUM ('PENDING_REPLAY', 'REPLAYING', 'RESOLVED', 'FAILED_PERMANENTLY');

-- CreateTable
CREATE TABLE "InvoiceJobDlq" (
    "id" TEXT NOT NULL,
    "invoiceJobId" TEXT NOT NULL,
    "originalQueueJobId" TEXT NOT NULL,
    "failureReason" TEXT NOT NULL,
    "attemptsMade" INTEGER NOT NULL DEFAULT 0,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DqStatus" NOT NULL DEFAULT 'PENDING_REPLAY',
    "replayCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplayAt" TIMESTAMP(3),

    CONSTRAINT "InvoiceJobDlq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceJobDlq_invoiceJobId_key" ON "InvoiceJobDlq"("invoiceJobId");
