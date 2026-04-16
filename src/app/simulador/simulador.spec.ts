import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Simulador } from './simulador';

describe('Simulador', () => {
  let component: Simulador;
  let fixture: ComponentFixture<Simulador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Simulador, RouterModule.forRoot([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Simulador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => component.ngOnDestroy());

  it('should create', () => expect(component).toBeTruthy());

  it('should default to mercado tab', () => expect(component.activeTab()).toBe('mercado'));

  it('should switch tabs', () => {
    component.activeTab.set('empleos');
    expect(component.activeTab()).toBe('empleos');
  });

  it('should get/set buy quantity', () => {
    component.setBuyQty('TEC', 5);
    expect(component.getBuyQty('TEC')).toBe(5);
  });

  it('should trigger random emergency', () => {
    component.triggerRandomEmergency();
    expect(component.activeEmergency()).toBeTruthy();
  });

  it('should have max stock price', () => {
    expect(component.maxStockPrice).toBeGreaterThan(0);
  });
});
