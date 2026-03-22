import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateQuickServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;
}
