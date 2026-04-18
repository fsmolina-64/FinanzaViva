import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from './auth';
describe('Auth', () => {
  let component: Auth; let fixture: ComponentFixture<Auth>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Auth, RouterModule.forRoot([]), FormsModule] }).compileComponents();
    fixture = TestBed.createComponent(Auth); component = fixture.componentInstance; await fixture.whenStable();
  });
  it('should create', () => expect(component).toBeTruthy());
  it('should default to login mode', () => expect(component.mode()).toBe('login'));
  it('should toggle mode', () => { component.toggle(); expect(component.mode()).toBe('register'); });
  it('should show error on empty submit', async () => { await component.submit(); expect(component.error()).toBeTruthy(); });
});
