import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Tablero } from './tablero';

describe('Tablero', () => {
  let component: Tablero;
  let fixture: ComponentFixture<Tablero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tablero, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Tablero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct board layout rows', () => {
    expect(component.topRow.length).toBe(6);
    expect(component.bottomRow.length).toBe(6);
    expect(component.leftCol.length).toBe(6);
    expect(component.rightCol.length).toBe(6);
  });

  it('should detect current position', () => {
    const pos = component.game.boardPosition();
    expect(component.isCurrentPosition(pos)).toBe(true);
    expect(component.isCurrentPosition((pos + 1) % 24)).toBe(false);
  });

  it('should get square type label', () => {
    expect(component.getSquareTypeLabel('bonus')).toBe('BONO');
    expect(component.getSquareTypeLabel('tax')).toBe('IMPUESTO');
  });

  it('should increment turn count after roll', async () => {
    const initial = component.turnCount();
    await component.roll();
    expect(component.turnCount()).toBe(initial + 1);
  });
});
