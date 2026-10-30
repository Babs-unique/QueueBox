//Recovery queue for pending and failed outbox when during redis downtime
import { Injectable , OnModuleInit , Logger } from "@nestjs/common"
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from "bullmq"
import { OutboxRecoveryService } from '../outbox-recovery/outbox-recovery.service';

@Injectable()
export class QueueRecovery implements OnModuleInit {
     private readonly logger = new Logger(QueueRecovery.name);
    constructor(
        @InjectQueue('InvoiceJob') private invoiceJob: Queue,
        private readonly recoveryService: OutboxRecoveryService
    ) {}


      async onModuleInit(): Promise<void> {
       const redisClient = await this.invoiceJob.getBackend().client;

        redisClient.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });

        redisClient.on('connect', () => {
            this.logger.log('Redis connected');
            this.recoveryService.recoverPendingOutbox();
            this.recoveryService.recoverFailedOutbox();
        }); 
    }
   
}