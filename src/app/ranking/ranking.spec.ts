import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Ranking } from './ranking';

describe('Ranking', () => {
  let component: Ranking;
  let fixture: ComponentFixture<Ranking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ranking, RouterModule.forRoot([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Ranking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have all players including me', () => {
    const players = component.allPlayers();
    expect(players.some(p => p.name.includes('(Tú)'))).toBe(true);
  });

  it('should default filter to monedas', () => expect(component.activeFilter()).toBe('monedas'));

  it('should switch filters', () => {
    component.activeFilter.set('nivel');
    expect(component.activeFilter()).toBe('nivel');
  });

  it('should detect current player', () => {
    const me = component.allPlayers().find(p => p.name.includes('(Tú)'));
    expect(component.isMe(me!)).toBe(true);
  });

  it('should return medal emoji for top 3', () => {
    expect(component.getMedalEmoji(1)).toBe('🥇');
    expect(component.getMedalEmoji(2)).toBe('🥈');
    expect(component.getMedalEmoji(3)).toBe('🥉');
  });

  it('should return rank number for others', () => {
    expect(component.getMedalEmoji(4)).toBe('#4');
  });
});
