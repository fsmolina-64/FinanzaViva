import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have features list', () => {
    expect(component.features.length).toBeGreaterThan(0);
  });

  it('should open quiz when no profile set', () => {
    component.openQuiz();
    expect(component.showQuiz()).toBe(true);
  });

  it('should advance quiz step on answer', () => {
    component.openQuiz();
    expect(component.quizStep()).toBe(0);
    component.selectAnswer('ahorrista');
    expect(component.quizStep()).toBe(1);
  });

  it('should calculate profile after all answers', () => {
    component.openQuiz();
    component.selectAnswer('ahorrista');
    component.selectAnswer('ahorrista');
    component.selectAnswer('ahorrista');
    expect(component.profileResult()).toBe('ahorrista');
  });

  it('should close quiz', () => {
    component.openQuiz();
    component.closeQuiz();
    expect(component.showQuiz()).toBe(false);
  });
});
