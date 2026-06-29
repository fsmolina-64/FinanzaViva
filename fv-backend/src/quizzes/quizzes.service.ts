import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { XpSource } from '@prisma/client';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService, private gamification: GamificationService) { }

  async getQuizzesByModule(moduleId: string) {
    return this.prisma.quiz.findMany({
      where: { moduleId },
      include: { questions: { include: { answers: true }, orderBy: { order: 'asc' } } },
    });
  }

  async getQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' }, include: { answers: true } } },
    });
    if (!quiz) throw new NotFoundException('Quiz no encontrado');
    quiz.questions = quiz.questions.map(q => ({ ...q, answers: q.answers.sort(() => Math.random() - 0.5) }));
    return quiz;
  }

  async submitQuiz(userId: string, quizId: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { answers: true } } },
    });
    if (!quiz) throw new NotFoundException('Quiz no encontrado');

    let correct = 0;
    const attemptAnswers: { questionId: string; answerId: string; isCorrect: boolean; timeTaken?: number }[] = [];
    const results: { questionId: string; correct: boolean; correctAnswerId: string; selectedAnswerId: string; explanation: string }[] = [];

    const quizQuestions = quiz.questions;
    for (const submitted of dto.answers) {
      const question = quizQuestions.find(q => q.id === submitted.questionId);
      if (!question) {
        throw new BadRequestException(`La pregunta ${submitted.questionId} no pertenece a este quiz`);
      }

      const answer = question.answers.find(a => a.id === submitted.answerId);
      if (!answer) {
        throw new BadRequestException(`La respuesta ${submitted.answerId} no pertenece a la pregunta ${submitted.questionId}`);
      }

      const isCorrect = answer.isCorrect;
      if (isCorrect) correct++;

      attemptAnswers.push({
        questionId: submitted.questionId,
        answerId: submitted.answerId,
        isCorrect,
        timeTaken: submitted.timeTaken,
      });

      const correctAnswer = question.answers.find(a => a.isCorrect);
      results.push({
        questionId: submitted.questionId,
        correct: isCorrect,
        correctAnswerId: correctAnswer?.id ?? '',
        selectedAnswerId: submitted.answerId,
        explanation: correctAnswer?.explanation ?? '',
      });
    }

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId, quizId, score, passed, timeTaken: dto.timeTaken,
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

    return { attemptId: attempt.id, score, passed, correct, total: totalQuestions, xpEarned: passed ? quiz.xpReward : 0, results };
  }

  async getAttemptHistory(userId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { answers: true } } },
    });

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, quizId },
      orderBy: { completedAt: 'desc' },
      include: { answers: { include: { question: true, answer: true } } },
    });

    return attempts.map(attempt => ({
      id: attempt.id,
      quizId: attempt.quizId,
      score: attempt.score,
      passed: attempt.passed,
      completedAt: attempt.completedAt,
      answers: attempt.answers.map(a => {
        const question = quiz?.questions.find(q => q.id === a.questionId);
        const correctAnswer = question?.answers.find(ans => ans.isCorrect);
        return {
          questionId: a.questionId,
          questionText: a.question.text,
          selectedAnswerId: a.answerId,
          correctAnswerId: correctAnswer?.id ?? '',
          selectedAnswerText: a.answer.text,
          correctAnswerText: correctAnswer?.text ?? '',
          allOptions: question?.answers.map(ans => ({ id: ans.id, text: ans.text })) ?? [],
          isCorrect: a.isCorrect,
          explanation: correctAnswer?.explanation ?? '',
        };
      }),
    }));
  }
}