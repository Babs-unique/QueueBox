
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRecoveryService } from '../outbox-recovery/outbox-recovery.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
        private readonly recoveryService: OutboxRecoveryService
    ) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  handleCron() {
    this.logger.debug('Called every 4 hours');
    this.recoveryService.recoverPendingOutbox();
    this.recoveryService.recoverFailedOutbox();
  }
}
