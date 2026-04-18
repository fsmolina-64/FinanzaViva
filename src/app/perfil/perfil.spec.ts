import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Perfil } from './perfil';
describe('Perfil', () => {
  let c: Perfil; let f: ComponentFixture<Perfil>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Perfil, RouterModule.forRoot([]), FormsModule] }).compileComponents();
    f = TestBed.createComponent(Perfil); c = f.componentInstance; await f.whenStable();
  });
  it('should create', () => expect(c).toBeTruthy());
  it('should open edit modal', () => { c.openEdit(); expect(c.editing()).toBe(true); });
  it('should close edit modal', () => { c.openEdit(); c.editing.set(false); expect(c.editing()).toBe(false); });
  it('should have 6 achievements', () => expect(c.achievements.length).toBe(6));
  it('should toggle interests', () => { c.editInterests = []; c.toggleInterest('Ahorro'); expect(c.editInterests.includes('Ahorro')).toBe(true); });
  it('should un-toggle interests', () => { c.editInterests = ['Ahorro']; c.toggleInterest('Ahorro'); expect(c.editInterests.includes('Ahorro')).toBe(false); });
  it('should format age', () => { const age = c.calcAge('2000-01-01'); expect(age).toBeGreaterThan(20); });
});
