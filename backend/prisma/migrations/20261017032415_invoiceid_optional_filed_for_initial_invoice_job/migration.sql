-- DropForeignKey
ALTER TABLE "InvoiceJob" DROP CONSTRAINT "InvoiceJob_invoiceId_fkey";

-- AlterTable
ALTER TABLE "InvoiceJob" ALTER COLUMN "invoiceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InvoiceJob" ADD CONSTRAINT "InvoiceJob_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
