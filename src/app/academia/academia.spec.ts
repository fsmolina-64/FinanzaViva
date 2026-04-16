import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Academia } from './academia';

describe('Academia', () => {
  let component: Academia;
  let fixture: ComponentFixture<Academia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Academia, RouterModule.forRoot([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Academia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have 6 lessons', () => expect(component.lessons().length).toBe(6));

  it('should open lesson', () => {
    component.openLesson(component.lessons()[0]);
    expect(component.activeLesson()).toBeTruthy();
  });

  it('should close lesson', () => {
    component.openLesson(component.lessons()[0]);
    component.closeLesson();
    expect(component.activeLesson()).toBeNull();
  });

  it('should start quiz', () => {
    component.openLesson(component.lessons()[0]);
    component.startQuiz();
    expect(component.showQuiz()).toBe(true);
  });

  it('should count correct answers', () => {
    component.openLesson(component.lessons()[0]);
    component.startQuiz();
    const correctIdx = component.currentQ?.correct ?? 0;
    component.selectAnswer(correctIdx);
    expect(component.quizScore()).toBe(1);
  });

  it('should track completed lessons', () => {
    expect(component.completedCount).toBe(0);
  });
});
