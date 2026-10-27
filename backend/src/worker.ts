import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BillingWorkerModule } from './billing/billling-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BillingWorkerModule);
  console.log('Standalone NestJS Worker is running and listening for jobs...');

    app.enableShutdownHooks();
}
bootstrap().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
