import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Finanzas } from './finanzas';
describe('Finanzas', () => {
  let c: Finanzas; let f: ComponentFixture<Finanzas>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Finanzas, RouterModule.forRoot([]), FormsModule] }).compileComponents();
    f = TestBed.createComponent(Finanzas); c = f.componentInstance; await f.whenStable();
  });
  it('should create', () => expect(c).toBeTruthy());
  it('should open form', () => { c.openForm('ingreso'); expect(c.showForm()).toBe(true); });
  it('should default tipo to ingreso', () => { c.openForm(); expect(c.formTipo()).toBe('ingreso'); });
  it('should show error on empty submit', () => { c.openForm(); c.submitForm(); expect(c.formError()).toBeTruthy(); });
  it('should add movement', () => {
    c.openForm('ingreso'); c.formMonto.set('100'); c.formConcepto.set('Test'); c.formFecha.set('2025-01-01'); c.formCategoria.set('Salario');
    c.submitForm();
    expect(c.svc.movimientos().some(m => m.concepto === 'Test')).toBe(true);
  });
  it('should return category icon', () => expect(c.categoryIcon('Salario')).toBe('💼'));
});
