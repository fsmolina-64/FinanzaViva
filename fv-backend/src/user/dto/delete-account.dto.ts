import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteAccountDto {
    @IsString()
    @IsNotEmpty({ message: 'Contraseña requerida' })
    password!: string;
}