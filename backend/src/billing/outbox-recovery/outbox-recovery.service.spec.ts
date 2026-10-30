import { Test, TestingModule } from '@nestjs/testing';
import { OutboxRecoveryService } from './outbox-recovery.service';

describe('OutboxRecoveryService', () => {
  let service: OutboxRecoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxRecoveryService],
    }).compile();

    service = module.get<OutboxRecoveryService>(OutboxRecoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
