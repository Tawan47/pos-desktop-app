import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('api/sales') // Matching frontend expectations
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get('summary')
  findSummary(@Query('date') date?: string, @Query('month') month?: string) {
    return this.salesService.findSummary(date, month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(+id);
  }
}

@Controller('api/summary')
export class SummaryController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findSummary(@Query('date') date?: string, @Query('month') month?: string) {
    return this.salesService.findSummary(date, month);
  }
}
