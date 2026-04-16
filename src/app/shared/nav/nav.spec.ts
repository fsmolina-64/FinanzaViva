import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Nav } from './nav';

describe('Nav', () => {
  let component: Nav;
  let fixture: ComponentFixture<Nav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nav, RouterModule.forRoot([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Nav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('should have 6 nav items', () => expect(component.navItems.length).toBe(6));
});
