export type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  xpReward: number;
  status: LessonStatus;
  order: number;
}

export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  icon?: string;
  totalLessons: number;
  completedLessons: number;
  xpReward: number;
  order: number;
  lessons?: Lesson[];
}

export interface LessonCompleteResponse {
  xpEarned: number;
  moduleCompleted: boolean;
  nextLesson?: Lesson;
}