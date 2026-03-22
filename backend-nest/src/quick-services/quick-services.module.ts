import { Module } from '@nestjs/common';
import { QuickServicesService } from './quick-services.service';
import { QuickServicesController } from './quick-services.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickServicesController],
  providers: [QuickServicesService],
})
export class QuickServicesModule {}
