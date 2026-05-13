import { IsArray, IsUUID, ValidateNested, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsUUID()
  answerId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeTaken?: number;
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];

  @IsInt()
  @Min(0)
  timeTaken!: number;
}