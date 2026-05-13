import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { XpSource } from '@prisma/client';

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async getQuizzesByModule(moduleId: string) {
    return this.prisma.quiz.findMany({
      where: { moduleId },
      include: { questions: { include: { answers: true }, orderBy: { order: 'asc' } } },
    });
  }

  async getQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { answers: true },
        },
      },
    });

    if (!quiz) throw new NotFoundException('Quiz no encontrado');

    quiz.questions = quiz.questions.map((q) => ({
      ...q,
      answers: q.answers.sort(() => Math.random() - 0.5),
    }));

    return quiz;
  }

  async submitQuiz(userId: string, quizId: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { answers: true } } },
    });

    if (!quiz) throw new NotFoundException('Quiz no encontrado');

    let correct = 0;
    const attemptAnswers = [];

    for (const submitted of dto.answers) {
      const answer = await this.prisma.answer.findUnique({
        where: { id: submitted.answerId },
      });

      const isCorrect = answer?.isCorrect ?? false;
      if (isCorrect) correct++;

const attemptAnswers: {
  questionId: string;
  answerId: string;
  isCorrect: boolean;
  timeTaken?: number;
}[] = [];
    }

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        passed,
        timeTaken: dto.timeTaken,
        answers: { create: attemptAnswers },
      },
    });

    await this.prisma.userStatistics.update({
      where: { userId },
      data: {
        quizzesCompleted: { increment: 1 },
        ...(passed && { quizzesPassed: { increment: 1 } }),
      },
    });

    if (passed) {
      await this.gamification.addXp(userId, {
        amount: quiz.xpReward,
        source: XpSource.QUIZ_PASSED,
        referenceId: attempt.id,
        description: `Quiz aprobado: ${quiz.title}`,
      });
    }

    return {
      attemptId: attempt.id,
      score,
      passed,
      correct,
      total: totalQuestions,
      xpEarned: passed ? quiz.xpReward : 0,
    };
  }

  async getAttemptHistory(userId: string, quizId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { userId, quizId },
      orderBy: { completedAt: 'desc' },
    });
  }
}