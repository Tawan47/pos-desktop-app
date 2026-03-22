import { PartialType } from '@nestjs/mapped-types';
import { CreateQuickServiceDto } from './create-quick-service.dto';

export class UpdateQuickServiceDto extends PartialType(CreateQuickServiceDto) {}
