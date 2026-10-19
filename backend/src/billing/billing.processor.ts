import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('billing')
export class InvoiceJobProcessor extends WorkerHost {

    async process(job: Job): Promise<void> {
        console.log(`This ${job.id} has been added to the queue`)
    }
}