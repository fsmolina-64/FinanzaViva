export type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED';

export type ContentBlockType =
  | 'heading'
  | 'text'
  | 'key_concept'
  | 'example'
  | 'tip'
  | 'warning'
  | 'video'
  | 'list'
  | 'exercise';

export interface ContentBlock {
  type: ContentBlockType;
  text?: string;
  title?: string;
  items?: string[];
  url?: string;
  question?: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: ContentBlock[];
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
  lessonXpEarned: number;
  moduleXpEarned: number;
  totalXpEarned: number;
  moduleCompleted: boolean;
  leveledUp: boolean;
  nextLesson?: Lesson | null;
}

export interface LessonResetResponse {
  success: boolean;
}