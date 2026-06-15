import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateTransferDto {
    @IsUUID()
    fromAccountId!: string;

    @IsUUID()
    toAccountId!: string;

    @IsNumber()
    @Min(0.01)
    amount!: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    date!: string;
}