-- AddForeignKey
ALTER TABLE "InvoiceJobDlq" ADD CONSTRAINT "InvoiceJobDlq_invoiceJobId_fkey" FOREIGN KEY ("invoiceJobId") REFERENCES "InvoiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
