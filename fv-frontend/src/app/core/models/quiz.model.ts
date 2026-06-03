export interface QuizOption {
  id: string;
  text: string;
  explanation?: string;
}
export interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  answers: QuizOption[];
}
export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore: number;
  xpReward: number;
  difficulty: string;
  questions: QuizQuestion[];
}
export interface QuizSubmitRequest {
  answers: { questionId: string; answerId: string; timeTaken?: number }[];
  timeTaken: number;
}
export interface QuizQuestionResult {
  questionId: string;
  correct: boolean;
  correctAnswerId: string;
  selectedAnswerId: string;
  explanation: string;
}
export interface QuizSubmitResponse {
  attemptId: string;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  xpEarned: number;
  results: QuizQuestionResult[];
}
export interface QuizHistoryAnswer {
  questionId: string;
  questionText: string;
  selectedAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
  explanation: string;
}
export interface QuizHistoryEntry {
  id: string;
  quizId: string;
  score: number;
  passed: boolean;
  completedAt: string;
  answers?: QuizHistoryAnswer[];
}