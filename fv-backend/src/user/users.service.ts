import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { omit } from '../common/utils/object.util';
import { getPasswordStrengthScore } from '../common/utils/password-strength.util';
import * as bcrypt from 'bcrypt';

const DELETION_GRACE_PERIOD_DAYS = 30;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) { }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, gameStats: true, statistics: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { passwordHash, profile, gameStats, statistics, ...rest } = user;

    const [actualCount, totalQuizzes, distinctPassed] = await Promise.all([
      this.prisma.userAchievement.count({ where: { userId } }),
      this.prisma.quiz.count(),
      this.prisma.quizAttempt.groupBy({ by: ['quizId'], where: { userId, passed: true } }),
    ]);

    return {
      ...omit(rest, ['isActive', 'updatedAt']),
      profile: profile ? omit(profile, ['id', 'userId', 'createdAt']) : null,
      gameStats: gameStats ? omit(gameStats, ['id', 'userId', 'lastActivityAt', 'updatedAt']) : null,
      statistics: {
        ...(statistics ? omit(statistics, ['id', 'userId']) : {}),
        achievementsCount: actualCount,
        totalQuizzes,
        distinctPassedQuizzes: distinctPassed.length,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({ where: { userId }, data: dto });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword)
      throw new BadRequestException('Las contraseñas no coinciden');

    if (getPasswordStrengthScore(dto.newPassword) < 2)
      throw new BadRequestException('La contraseña es muy débil. Combina mayúsculas, minúsculas, números y símbolos.');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSamePassword) throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash, passwordChangedAt: new Date() },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async updateOnboarding(userId: string, dto: UpdateOnboardingDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...(dto.onboardingCompleted !== undefined && { onboardingCompleted: dto.onboardingCompleted }),
        ...(dto.onboardingStep !== undefined && { onboardingStep: dto.onboardingStep }),
      },
    });
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) throw new BadRequestException('Contraseña incorrecta');

    if (user.deletionScheduledAt)
      throw new BadRequestException('Ya tienes una eliminación programada');

    const deletionScheduledAt = new Date();
    deletionScheduledAt.setDate(deletionScheduledAt.getDate() + DELETION_GRACE_PERIOD_DAYS);

    await this.prisma.user.update({ where: { id: userId }, data: { deletionScheduledAt } });

    return {
      message: `Cuenta programada para eliminación en ${DELETION_GRACE_PERIOD_DAYS} días`,
      deletionScheduledAt,
    };
  }

  async cancelDeletion(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.deletionScheduledAt) throw new BadRequestException('No tienes una eliminación programada');

    await this.prisma.user.update({ where: { id: userId }, data: { deletionScheduledAt: null } });
    return { message: 'Eliminación cancelada' };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleScheduledDeletions(): Promise<void> {
    const expired = await this.prisma.user.findMany({
      where: { deletionScheduledAt: { lte: new Date() } },
      select: { id: true },
    });

    for (const { id: userId } of expired) {
      await this.hardDeleteUser(userId);
    }

    if (expired.length > 0) {
      this.logger.log(`${expired.length} cuenta(s) eliminada(s) por vencimiento de grace period`);
    }
  }

  private async hardDeleteUser(userId: string): Promise<void> {
    const playerIds = (
      await this.prisma.simulatorPlayer.findMany({
        where: { OR: [{ userId }, { game: { createdByUserId: userId } }] },
        select: { id: true },
      })
    ).map(p => p.id);

    const gameIds = (
      await this.prisma.simulatorGame.findMany({
        where: { createdByUserId: userId },
        select: { id: true },
      })
    ).map(g => g.id);

    await this.prisma.$transaction([
      ...(playerIds.length
        ? [
          this.prisma.playerProperty.deleteMany({ where: { playerId: { in: playerIds } } }),
          this.prisma.simulatorPlayer.deleteMany({ where: { id: { in: playerIds } } }),
        ]
        : []),
      ...(gameIds.length
        ? [
          this.prisma.playerProperty.deleteMany({ where: { gameId: { in: gameIds } } }),
          this.prisma.simulatorGame.deleteMany({ where: { id: { in: gameIds } } }),
        ]
        : []),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}