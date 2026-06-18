import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, gameStats: true, statistics: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash, ...safeUser } = user;
    const actualCount = await this.prisma.userAchievement.count({ where: { userId } });
    if (safeUser.statistics) safeUser.statistics.achievementsCount = actualCount;

    const totalQuizzes = await this.prisma.quiz.count();
    const distinctPassed = await this.prisma.quizAttempt.groupBy({
      by: ['quizId'],
      where: { userId, passed: true },
    });

    return {
      ...safeUser,
      statistics: {
        ...(safeUser.statistics ?? {}),
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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async deleteAccount(userId: string) {
    const playerIds = (
      await this.prisma.simulatorPlayer.findMany({
        where: { OR: [{ userId }, { game: { createdByUserId: userId } }] },
        select: { id: true },
      })
    ).map(p => p.id);
    if (playerIds.length) {
      await this.prisma.simulatorPlayerRound.deleteMany({ where: { playerId: { in: playerIds } } });
      await this.prisma.simulatorConsequence.deleteMany({ where: { playerId: { in: playerIds } } });
      await this.prisma.simulatorPlayer.deleteMany({ where: { id: { in: playerIds } } });
    }
    await this.prisma.simulatorGame.deleteMany({ where: { createdByUserId: userId } });
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Cuenta eliminada correctamente' };
  }
}