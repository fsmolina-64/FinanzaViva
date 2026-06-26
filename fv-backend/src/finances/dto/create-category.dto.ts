import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  icon: string = '';

  @IsString()
  color: string = '';

  @IsIn(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';
}
