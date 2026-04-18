import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Home } from './home';
describe('Home', () => {
  let c: Home; let f: ComponentFixture<Home>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Home, RouterModule.forRoot([])] }).compileComponents();
    f = TestBed.createComponent(Home); c = f.componentInstance; await f.whenStable();
  });
  it('should create', () => expect(c).toBeTruthy());
  it('should have 4 quick actions', () => expect(c.quickActions.length).toBe(4));
  it('should return a greeting', () => expect(c.greeting).toBeTruthy());
  it('should check achievement unlock', () => expect(typeof c.isUnlocked('first_login')).toBe('boolean'));
});
