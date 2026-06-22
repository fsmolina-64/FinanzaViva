import { Component, input, output } from '@angular/core';
import { OnboardingData } from '../../../../core/services/onboarding.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector:    'app-step-summary',
  standalone:  true,
  imports:     [CurrencyPipe],
  templateUrl: './step-summary.component.html',
})
export class StepSummaryComponent {
  data      = input.required<OnboardingData>();
  isLoading = input<boolean>(false);
  complete  = output<void>();
}
