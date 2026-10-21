import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

@Injectable()
@Processor('InvoiceJob', { concurrency: 3 })
export class InvoiceJobProcessor extends WorkerHost {
    async process(job: Job): Promise<void> {
        console.log(`This ${job.id} has been added to the queue`)
    }
}