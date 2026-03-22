import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async create(createSaleDto: CreateSaleDto) {
    console.log('--- Incoming Sale Request ---');
    console.log('Payload:', JSON.stringify(createSaleDto, null, 2));

    if (!createSaleDto.items || createSaleDto.items.length === 0) {
      throw new BadRequestException('Sale must contain at least one item.');
    }

    try {
      // Generate invoice number if missing
      const invoiceNumber = createSaleDto.invoiceNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await this.prisma.$transaction(async (tx: any) => {
        const sale = await tx.sale.create({
          data: {
            invoiceNumber,
            paymentMethod: createSaleDto.paymentMethod,
            subtotal: createSaleDto.subtotal,
            discount: createSaleDto.discount || 0,
            extraCost: createSaleDto.extraCost || 0,
            total: createSaleDto.total,
            date: createSaleDto.date,
          },
        });

        for (const item of createSaleDto.items) {
          const isRealProduct = typeof item.id === 'number' || (!isNaN(Number(item.id)) && String(item.id).trim() !== '');
          const productId = isRealProduct ? Number(item.id) : null;

          await tx.saleItem.create({
            data: {
              sale_id: sale.id,
              product_id: productId,
              name: item.name,
              price: item.price,
              qty: item.qty,
            },
          });

          if (productId) {
            // Only update inventory for real products and avoid crash on missing products
            const exist = await tx.product.findUnique({ where: { id: productId } });
            if (exist) {
                await tx.product.update({
                  where: { id: productId },
                  data: {
                    quantity: {
                      decrement: item.qty,
                    },
                  },
                });
            }
          }
        }

        return tx.sale.findUnique({
          where: { id: sale.id },
          include: { items: true },
        });
      });

      // Emit real-time events after successful transaction
      const products = await this.prisma.product.findMany({ orderBy: { id: 'desc' } });
      this.eventsGateway.emitProductUpdated(products);

      const allSales = await this.findAll();
      this.eventsGateway.emitSaleUpdated(allSales);

      return result;

    } catch (error) {
      console.error('--- Sale Processing Error ---');
      console.error(error);
      
      if (error.code === 'P2002') {
        throw new BadRequestException('เลขใบเสร็จซ้ำกัน (Duplicate Invoice Number)');
      }
      
      // If it's already a Nest exception, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`บันทึกไม่สำเร็จ: ${error.message || 'Unknown error'}`);
    }
  }

  async findAll() {
    return this.prisma.sale.findMany({
      orderBy: { id: 'desc' },
      include: {
        items: true,
      },
    });
  }

  async findSummary(date?: string, month?: string) {
    const where: Record<string, any> = {};
    if (date) {
      where['date'] = date;
    } else if (month) {
      where['date'] = { startsWith: month };
    }

    const sales = await this.prisma.sale.groupBy({
      by: ['date'],
      where,
      _sum: {
        total: true,
      },
    });

    return {
      salesByDate: sales.map((s: any) => ({
        date: s.date,
        total: s._sum.total,
      })),
    };
  }

  findOne(id: number) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
  }
}
