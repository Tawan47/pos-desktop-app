import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { EventsModule } from './events/events.module';
import { QuickServicesModule } from './quick-services/quick-services.module';

@Module({
  imports: [
    PrismaModule, 
    ProductsModule, 
    SalesModule, 
    EventsModule,
    QuickServicesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
