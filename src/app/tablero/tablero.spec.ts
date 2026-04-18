import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Tablero } from './tablero';
describe('Tablero', () => {
  let c: Tablero; let f: ComponentFixture<Tablero>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Tablero, RouterModule.forRoot([]), FormsModule] }).compileComponents();
    f = TestBed.createComponent(Tablero); c = f.componentInstance; await f.whenStable();
  });
  it('should create', () => expect(c).toBeTruthy());
  it('should start in setup mode', () => expect(c.setupMode()).toBe(true));
  it('should start game and exit setup', () => { c.startGame(); expect(c.setupMode()).toBe(false); });
  it('should reset to setup mode', () => { c.startGame(); c.resetGame(); expect(c.setupMode()).toBe(true); });
  it('should have correct board row lengths', () => {
    expect(c.topIds.length).toBe(8);
    expect(c.bottomIds.length).toBe(8);
    expect(c.leftIds.length).toBe(4);
    expect(c.rightIds.length).toBe(4);
  });
});
