import { IsString, IsNumber, IsOptional, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemDto {
  @IsNotEmpty()
  id: number | string; // product id (number) or custom/service id (string)

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  qty: number;
}

class CustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  extraCost?: number;

  @IsNumber()
  total: number;

  @IsString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsNumber()
  @IsOptional()
  receivedAmount?: number;

  @IsNumber()
  @IsOptional()
  change?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer?: CustomerDto;
}
