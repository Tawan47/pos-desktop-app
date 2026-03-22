import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const newProd = await this.prisma.product.create({
        data: createProductDto,
      });
      const products = await this.findAll();
      this.eventsGateway.emitProductUpdated(products);
      return newProd;
    } catch (error) {
       // P2002 is Prisma's error code for unique constraint violation
      if (error.code === 'P2002') {
        throw new BadRequestException('Barcode must be unique.');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { id: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const updatedProd = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
      const products = await this.findAll();
      this.eventsGateway.emitProductUpdated(products);
      return updatedProd;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Barcode might be duplicated.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.prisma.product.delete({
      where: { id },
    });
    const products = await this.findAll();
    this.eventsGateway.emitProductUpdated(products);
    return { success: true };
  }
}
