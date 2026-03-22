import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuickServicesService } from './quick-services.service';
import { CreateQuickServiceDto } from './dto/create-quick-service.dto';
import { UpdateQuickServiceDto } from './dto/update-quick-service.dto';

@Controller('api/quick-services')
export class QuickServicesController {
  constructor(private readonly quickServicesService: QuickServicesService) {}

  @Post()
  create(@Body() createQuickServiceDto: CreateQuickServiceDto) {
    return this.quickServicesService.create(createQuickServiceDto);
  }

  @Get()
  findAll() {
    return this.quickServicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quickServicesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuickServiceDto: UpdateQuickServiceDto) {
    return this.quickServicesService.update(+id, updateQuickServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quickServicesService.remove(+id);
  }
}
