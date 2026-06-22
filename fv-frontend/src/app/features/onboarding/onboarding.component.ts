import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService, OnboardingCategory } from '../../core/services/onboarding.service';
import { StepWelcomeComponent }      from './steps/step-welcome/step-welcome.component';
import { StepAccountComponent }      from './steps/step-account/step-account.component';
import { StepTransactionsComponent } from './steps/step-transactions/step-transactions.component';
import { StepCategoriesComponent }   from './steps/step-categories/step-categories.component';
import { StepBudgetsComponent }      from './steps/step-budgets/step-budgets.component';
import { StepGoalsComponent }        from './steps/step-goals/step-goals.component';
import { StepSummaryComponent }      from './steps/step-summary/step-summary.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    StepWelcomeComponent,
    StepAccountComponent,
    StepTransactionsComponent,
    StepCategoriesComponent,
    StepBudgetsComponent,
    StepGoalsComponent,
    StepSummaryComponent,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent implements OnInit {
  private onboardingService = inject(OnboardingService);
  private router            = inject(Router);

  readonly TOTAL_STEPS = 7;
  currentStep    = signal<number>(0);
  transitioning  = signal<boolean>(false);
  isCompleting   = signal<boolean>(false);
  private isAnimating = false;

  steps         = Array.from({ length: this.TOTAL_STEPS });
  collectedData = computed(() => this.onboardingService.collectedData());

  constructor() {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = '';
    });
  }

  ngOnInit(): void {
    this.currentStep.set(this.onboardingService.getSavedStep());
  }

  private async animateStep(callback: () => void): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.transitioning.set(true);
    await new Promise(r => setTimeout(r, 180));
    callback();
    this.transitioning.set(false);
    this.isAnimating = false;
  }

  async nextStep(): Promise<void> {
    if (this.currentStep() >= this.TOTAL_STEPS - 1) return;
    await this.animateStep(() => {
      const next = this.currentStep() + 1;
      this.currentStep.set(next);
      this.onboardingService.saveStep(next);
    });
  }

  async prevStep(): Promise<void> {
    if (this.currentStep() <= 0) return;
    await this.animateStep(() => {
      const prev = this.currentStep() - 1;
      this.currentStep.set(prev);
      this.onboardingService.saveStep(prev);
    });
  }

  onCategoryCreated(cat: OnboardingCategory): void {
    this.onboardingService.addCustomCategory(cat);
  }

  onComplete(): void {
    if (this.isCompleting()) return;
    this.isCompleting.set(true);
    this.onboardingService.completeOnboarding().subscribe({
      next:  () => this.finish(),
      error: () => this.finish(),
    });
  }

  private finish(): void {
    this.onboardingService.setCompleted();
    this.router.navigate(['/dashboard']);
  }
}
