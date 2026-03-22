import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuickServiceDto } from './dto/create-quick-service.dto';
import { UpdateQuickServiceDto } from './dto/update-quick-service.dto';

@Injectable()
export class QuickServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createQuickServiceDto: CreateQuickServiceDto) {
    try {
      return await this.prisma.quickService.create({
        data: createQuickServiceDto,
      });
    } catch (error) {
      console.error('Error creating quick service:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.quickService.findMany({
        orderBy: { id: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching quick services:', error);
      return []; // Return empty array instead of crashing
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.quickService.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Error fetching quick service ${id}:`, error);
      return null;
    }
  }

  async update(id: number, updateQuickServiceDto: UpdateQuickServiceDto) {
    try {
      return await this.prisma.quickService.update({
        where: { id },
        data: updateQuickServiceDto,
      });
    } catch (error) {
      console.error(`Error updating quick service ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.quickService.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting quick service ${id}:`, error);
      throw error;
    }
  }
}
