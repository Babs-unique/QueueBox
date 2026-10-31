import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceDlqReplayService } from './invoice-dlq-replay.service';

describe('InvoiceDlqReplayService', () => {
  let service: InvoiceDlqReplayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceDlqReplayService],
    }).compile();

    service = module.get<InvoiceDlqReplayService>(InvoiceDlqReplayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
