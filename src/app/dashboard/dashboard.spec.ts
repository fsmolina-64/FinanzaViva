import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to overview tab', () => {
    expect(component.activeTab()).toBe('overview');
  });

  it('should switch tabs', () => {
    component.activeTab.set('transactions');
    expect(component.activeTab()).toBe('transactions');
  });

  it('should format date', () => {
    const result = component.formatDate(new Date());
    expect(result).toBeTruthy();
  });

  it('should get correct transaction color for income', () => {
    expect(component.getTransactionColor('income')).toBe('#00d4aa');
  });

  it('should get correct transaction color for expense', () => {
    expect(component.getTransactionColor('expense')).toBe('#f43f5e');
  });
});
