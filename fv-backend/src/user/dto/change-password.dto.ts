import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    currentPassword!: string;

    @IsString()
    @MinLength(8, { message: 'Mínimo 8 caracteres' })
    newPassword!: string;

    @IsString()
    confirmPassword!: string;
}