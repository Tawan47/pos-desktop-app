import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController, SummaryController } from './sales.controller';

@Module({
  controllers: [SalesController, SummaryController],
  providers: [SalesService]
})
export class SalesModule {}
