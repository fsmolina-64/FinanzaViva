import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { staggerCards } from '../../core/animations/animations';
import { GamificationService } from '../../core/services/gamification.service';
import { StreakLog, StreakStatus } from '../../core/models/gamification.model';

interface CalendarDay {
    day: number | null;
    dateKey: string | null;
    status: StreakStatus | null;
    streakValue: number;
    isToday: boolean;
    isFuture: boolean;
    isPadding: boolean;
}

@Component({
    selector: 'app-streak-calendar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './streak-calendar.html',
    styleUrl: './streak-calendar.css',
    animations: [staggerCards]
})
export class StreakCalendar implements OnInit {

    currentMonth = signal(new Date().getMonth() + 1);
    currentYear = signal(new Date().getFullYear());
    streakLogs = signal<StreakLog[]>([]);
    loading = signal(true);
    slideClass = signal('');
    animating = signal(false);

    stats = computed(() => this.gamificationService.stats());

    monthLabel = computed(() => {
        const d = new Date(this.currentYear(), this.currentMonth() - 1, 1);
        const name = d.toLocaleDateString('es-ES', { month: 'long' });
        return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + this.currentYear();
    });

    private logMap = computed(() => {
        const m = new Map<string, StreakLog>();
        for (const log of this.streakLogs()) m.set(log.date.substring(0, 10), log);
        return m;
    });

    calendarDays = computed((): CalendarDay[] => {
        const year = this.currentYear();
        const month = this.currentMonth();
        const today = new Date();
        const todayKey = this.toKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const map = this.logMap();

        const firstDow = new Date(year, month - 1, 1).getDay();
        const totalDays = new Date(year, month, 0).getDate();
        const startPad = firstDow === 0 ? 6 : firstDow - 1;

        const days: CalendarDay[] = [];

        for (let i = 0; i < startPad; i++) {
            days.push({
                day: null, dateKey: null, status: null,
                streakValue: 0, isToday: false, isFuture: false, isPadding: true
            });
        }

        for (let d = 1; d <= totalDays; d++) {
            const key = this.toKey(year, month, d);
            const log = map.get(key);
            const cellTs = new Date(year, month - 1, d).getTime();
            days.push({
                day: d,
                dateKey: key,
                status: log?.status ?? null,
                streakValue: log?.streak ?? 0,
                isToday: key === todayKey,
                isFuture: cellTs > todayMidnight,
                isPadding: false,
            });
        }

        return days;
    });

    activeDaysCount = computed(() =>
        this.streakLogs().filter(l => l.status === 'ACTIVE').length
    );

    isCurrentMonth = computed(() => {
        const n = new Date();
        return this.currentMonth() === n.getMonth() + 1
            && this.currentYear() === n.getFullYear();
    });

    readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    readonly skeletonCells = Array.from({ length: 42 }, (_, i) => i);

    constructor(public gamificationService: GamificationService) { }

    ngOnInit(): void {
        if (!this.gamificationService.stats()) {
            this.gamificationService.loadStats().subscribe();
        }
        this.loadMonth();
    }

    private loadMonth(): void {
        this.loading.set(true);
        this.gamificationService
            .getStreakHistory(this.currentMonth(), this.currentYear())
            .subscribe({
                next: (logs) => { this.streakLogs.set(logs); this.loading.set(false); },
                error: () => { this.streakLogs.set([]); this.loading.set(false); },
            });
    }

    prevMonth(): void {
        if (this.animating()) return;
        this.navigate('right', () => {
            if (this.currentMonth() === 1) {
                this.currentMonth.set(12);
                this.currentYear.update(y => y - 1);
            } else {
                this.currentMonth.update(m => m - 1);
            }
        });
    }

    nextMonth(): void {
        if (this.animating() || this.isCurrentMonth()) return;
        this.navigate('left', () => {
            if (this.currentMonth() === 12) {
                this.currentMonth.set(1);
                this.currentYear.update(y => y + 1);
            } else {
                this.currentMonth.update(m => m + 1);
            }
        });
    }

    private navigate(exitDir: 'left' | 'right', updateFn: () => void): void {
        this.animating.set(true);
        this.slideClass.set(exitDir === 'left' ? 'cal-exit-left' : 'cal-exit-right');
        setTimeout(() => {
            updateFn();
            this.loadMonth();
            this.slideClass.set(exitDir === 'left' ? 'cal-enter-right' : 'cal-enter-left');
            setTimeout(() => {
                this.slideClass.set('');
                this.animating.set(false);
            }, 380);
        }, 260);
    }

    private toKey(y: number, m: number, d: number): string {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    cellDelay(index: number): number {
        return Math.min(index * 10, 260);
    }

    cellTooltip(cell: CalendarDay): string {
        if (!cell.status || cell.isFuture) return '';
        if (cell.status === 'ACTIVE') return `Racha: ${cell.streakValue} días`;
        if (cell.status === 'AT_RISK') return 'Racha congelada este día';
        if (cell.status === 'LOST') return 'Racha perdida este día';
        return '';
    }

    heroFlame(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'AT_RISK') return '/llamacongelada.png';
        if (s === 'LOST') return '/llamaapagada.png';
        return streak > 0 ? '/llamaprendida.png' : '/llamaapagada.png';
    }

    heroFlameClass(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'AT_RISK') return 'flame-hero-frozen';
        if (s === 'LOST') return 'flame-hero-dim';
        return streak > 0 ? 'flame-hero-active' : 'flame-hero-dim';
    }

    heroGlowClass(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'AT_RISK') return 'glow-blue';
        if (s === 'LOST') return 'glow-red';
        return streak > 0 ? 'glow-amber' : 'glow-dim';
    }

    heroNumberClass(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'AT_RISK') return 'text-blue-400';
        if (s === 'LOST') return 'text-red-400';
        return streak > 0 ? 'text-amber-400' : 'text-muted';
    }

    heroCardGradient(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'AT_RISK') return 'hero-gradient-blue';
        if (s === 'LOST') return 'hero-gradient-red';
        return streak > 0 ? 'hero-gradient-amber' : 'hero-gradient-red';
    }

    progressBarClass(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'LOST' || streak === 0) return 'sc-progress-lost';
        if (s === 'AT_RISK') return 'sc-progress-risk';
        return 'sc-progress-active';
    }

    streakMessage(): string {
        const s = this.gamificationService.streakStatus();
        const streak = this.stats()?.currentStreak ?? 0;
        if (s === 'AT_RISK') return 'Racha congelada — vuelve hoy para mantenerla viva';
        if (s === 'LOST') return 'Racha reiniciada — hoy empieza una nueva oportunidad';
        if (streak === 0) return 'Ingresa cada día para encender tu primera racha';
        if (streak >= 365) return 'Un año de disciplina financiera — eres una leyenda';
        if (streak >= 30) return 'Más de un mes imparable — el hábito ya es parte de ti';
        if (streak >= 7) return 'Una semana de constancia — el hábito se está fortaleciendo';
        if (streak === 1) return 'Primer día de tu racha — ¡grandes cosas comienzan así!';
        return 'Sigue así — cada día cuenta en tu camino financiero';
    }

    xpProgress(): number {
        const streak = this.stats()?.currentStreak ?? 0;
        const longest = this.stats()?.longestStreak ?? 0;
        if (longest === 0) return streak > 0 ? 100 : 0;
        return Math.round(Math.min(100, (streak / longest) * 100));
    }

    flameIcon(status: StreakStatus | null): string {
        if (status === 'ACTIVE') return '/llamaprendida.png';
        if (status === 'AT_RISK') return '/llamacongelada.png';
        if (status === 'LOST') return '/llamaapagada.png';
        return '';
    }
}