import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Academia } from './academia';
describe('Academia', () => {
  let c: Academia; let f: ComponentFixture<Academia>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Academia, RouterModule.forRoot([])] }).compileComponents();
    f = TestBed.createComponent(Academia); c = f.componentInstance; await f.whenStable();
  });
  it('should create', () => expect(c).toBeTruthy());
  it('should have 6 topics', () => expect(c.topics().length).toBe(6));
  it('should open topic', () => { c.openTopic(c.topics()[0]); expect(c.activeTopic()).toBeTruthy(); });
  it('should close topic', () => { c.openTopic(c.topics()[0]); c.closeTopic(); expect(c.activeTopic()).toBeNull(); });
  it('should count correct answers', () => {
    c.openTopic(c.topics()[0]);
    const correct = c.current?.correct;
    c.selectAnswer(correct!);
    expect(c.score()).toBe(1);
  });
  it('should not allow re-answering', () => {
    c.openTopic(c.topics()[0]);
    c.selectAnswer(0);
    const scoreAfterFirst = c.score();
    c.selectAnswer(1);
    expect(c.score()).toBe(scoreAfterFirst);
  });
});
