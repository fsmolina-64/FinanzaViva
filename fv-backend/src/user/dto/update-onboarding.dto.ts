import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateOnboardingDto {
  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  onboardingStep?: number;
}
