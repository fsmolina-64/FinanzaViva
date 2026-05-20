export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}


export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizSubmitRequest {
  answers: {
    questionId: string;
    optionId: string;
  }[];
}

export interface QuizQuestionResult {
  questionId: string;
  correct: boolean;
  correctOptionId: string;
  selectedOptionId: string;
}

export interface QuizSubmitResponse {
  score: number;
  passed: boolean;
  xpEarned: number;
  results: QuizQuestionResult[];
}

export interface QuizHistoryEntry {
  id: string;
  quizId: string;
  score: number;
  passed: boolean;
  completedAt: string;
}