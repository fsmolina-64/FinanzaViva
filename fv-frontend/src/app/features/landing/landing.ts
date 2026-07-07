import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  QueryList,
  ViewChildren,
  ViewChild,
  NgZone,
  signal,
  HostListener
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

interface LandingSlide {
  tab: string;
  img: string;
}

interface FeatureGridItem {
  label: string;
  hint: string;
  img: string;
  revealDelay: 'd1' | 'd2' | 'd3' | 'd4' | 'd5';
}

/** Rango real del enum UserRank (backend). Se muestran 5 de los 6 —
 *  se omite INTERMEDIATE en este path visual para no saturar una tarjeta
 *  de 5 columnas; los 6 rangos siguen intactos dentro de la app. */
interface ProgressionRank {
  name: string;
  tag: string;
  xpLabel: string;
  img: string;
  width: number;
  height: number;
  current?: boolean;
}

interface StatItem {
  target: number;
  label: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

const AUTO_SLIDE_INTERVAL_MS = 4500;
const COUNT_UP_DURATION_MS = 1400;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoEl') private videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('heroEl') private heroEl!: ElementRef<HTMLElement>;
  @ViewChild('statsEl') private statsEl?: ElementRef<HTMLElement>;
  @ViewChild('tabProgressEl') private tabProgressEl?: ElementRef<HTMLDivElement>;
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef>;
  @ViewChildren('tiltEl') private tiltEls!: QueryList<ElementRef>;
  @ViewChildren('slideEl') private slideEls!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;
  private tiltObserver?: IntersectionObserver;
  private statsObserver?: IntersectionObserver;
  private autoInterval?: ReturnType<typeof setInterval>;
  private onPointerMove?: (e: PointerEvent) => void;
  private statsAnimated = false;

  constructor(private ngZone: NgZone) { }

  readonly currentSlide = signal(0);
  readonly trackHeightPx = signal(0);
  readonly scrolled = signal(false);
  readonly openFaq = signal<number | null>(null);
  readonly AUTO_SLIDE_INTERVAL_MS = AUTO_SLIDE_INTERVAL_MS;

  readonly slides: LandingSlide[] = [
    { tab: 'Dashboard', img: '/dashboard.png' },
    { tab: 'Academia', img: '/academia.png' },
    { tab: 'Simulador', img: '/simulador.png' },
    { tab: 'Finanzas', img: '/billetera-premium.png' },
  ];

  readonly featureGrid: FeatureGridItem[] = [
    { label: 'Dashboard', hint: 'Tu progreso en vivo', img: '/dashboard.png', revealDelay: 'd1' },
    { label: 'Finanzas', hint: 'Ingresos y gastos', img: '/billetera-premium.png', revealDelay: 'd2' },
    { label: 'Academia', hint: '7 módulos', img: '/academia.png', revealDelay: 'd3' },
    { label: 'Simulador', hint: 'Decisiones sin riesgo', img: '/simulador.png', revealDelay: 'd4' },
    { label: 'Logros', hint: '23 insignias', img: '/logro.png', revealDelay: 'd5' },
    { label: 'Ranking', hint: 'Tabla global', img: '/ranking.png', revealDelay: 'd5' },
  ];

  readonly ranks: ProgressionRank[] = [
    { name: 'Novato', tag: 'ROOKIE', xpLabel: '0 XP', img: '/novato.png', width: 110, height: 128, current: true },
    { name: 'Aprendiz', tag: 'APPRENTICE', xpLabel: '250 XP', img: '/aprendiz.png', width: 234, height: 128 },
    { name: 'Avanzado', tag: 'ADVANCED', xpLabel: '2,000 XP', img: '/avanzado.png', width: 96, height: 128 },
    { name: 'Experto', tag: 'EXPERT', xpLabel: '4,000 XP', img: '/experto.png', width: 227, height: 128 },
    { name: 'Maestro', tag: 'MASTER', xpLabel: '6,000 XP', img: '/maestro.png', width: 110, height: 128 },
  ];

  readonly stats: StatItem[] = [
    { target: 7, label: 'Módulos de academia' },
    { target: 28, label: 'Lecciones interactivas' },
    { target: 23, label: 'Logros por desbloquear' },
    { target: 6, label: 'Rangos de progreso' },
  ];
  readonly statValues = this.stats.map(() => signal(0));

  readonly faqs: FaqItem[] = [
    { question: '¿FinanzaViva es gratis?', answer: 'Sí, completamente. Academia, simulador, gestión financiera y gamificación, sin límites de tiempo ni funciones bloqueadas.' },
    { question: '¿Necesito saber de finanzas para empezar?', answer: 'No. La Academia parte desde cero y el simulador te deja tomar decisiones financieras sin arriesgar dinero real.' },
    { question: '¿Se conecta a mi cuenta bancaria?', answer: 'No. Registras tus ingresos y gastos manualmente, así que decides exactamente qué información entra a la app.' },
    { question: '¿Cómo funciona la gamificación?', answer: 'Ganas XP al completar lecciones, quizzes y partidas del simulador. Subes de rango, desbloqueas logros y apareces en el ranking global.' },
    { question: '¿Para quién es FinanzaViva?', answer: 'Para jóvenes de 18 a 25 años en Ecuador que quieren aprender a manejar su dinero sin aburrirse en el intento.' },
  ];

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.measureActiveSlide();
  }

  goToSlide(index: number): void {
    this.setSlide(index);
    this.restartAutoSlide();
  }

  nextSlide(): void {
    this.setSlide((this.currentSlide() + 1) % this.slides.length);
    this.restartAutoSlide();
  }

  prevSlide(): void {
    this.setSlide((this.currentSlide() - 1 + this.slides.length) % this.slides.length);
    this.restartAutoSlide();
  }

  toggleFaq(index: number): void {
    this.openFaq.set(this.openFaq() === index ? null : index);
  }

  /** Única fuente de verdad para cambiar de slide: fija el índice, remide el alto real
   *  y reinicia la barra de progreso del tab activo. */
  private setSlide(index: number): void {
    this.currentSlide.set(index);
    this.measureActiveSlide();
    this.restartTabProgress();
  }

  private measureActiveSlide(): void {
    const el = this.slideEls?.get(this.currentSlide())?.nativeElement;
    if (el) this.trackHeightPx.set(el.scrollHeight);
  }

  /** Quita la animación, fuerza reflow y la devuelve — así el fill de progreso
   *  del tab siempre arranca en 0% al cambiar de slide, manual o automático. */
  private restartTabProgress(): void {
    const el = this.tabProgressEl?.nativeElement;
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  private restartAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  private startAutoSlide(): void {
    this.ngZone.runOutsideAngular(() => {
      this.autoInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.setSlide((this.currentSlide() + 1) % this.slides.length);
        });
      }, AUTO_SLIDE_INTERVAL_MS);
    });
  }

  private stopAutoSlide(): void {
    if (this.autoInterval) clearInterval(this.autoInterval);
  }

  /** Spotlight del hero: el brillo sigue el cursor vía variables CSS.
   *  Corre fuera de Angular porque no toca ningún estado — es puro DOM/CSS. */
  private setupSpotlight(): void {
    const el = this.heroEl?.nativeElement;
    if (!el) return;
    this.ngZone.runOutsideAngular(() => {
      this.onPointerMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--spot-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        el.style.setProperty('--spot-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      };
      el.addEventListener('pointermove', this.onPointerMove);
    });
  }

  /** Cuenta ascendente de los stats reales al entrar en pantalla, una sola vez. */
  private startCountUp(): void {
    if (this.statsAnimated) return;
    this.statsAnimated = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.stats.forEach((stat, i) => this.statValues[i].set(Math.round(stat.target * eased)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngAfterViewInit(): void {
    const video = this.videoEl.nativeElement;
    video.muted = true;
    video.play().catch(() => { });

    this.measureActiveSlide();
    this.setupSpotlight();

    this.observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        entry.target.classList.toggle('show', entry.isIntersecting);
      }),
      { threshold: 0.12 }
    );
    this.revealEls.forEach(el => this.observer!.observe(el.nativeElement));

    this.tiltObserver = new IntersectionObserver(
      entries => entries.forEach(entry => {
        entry.target.classList.toggle('tilt-in', entry.isIntersecting);
      }),
      { threshold: 0.18 }
    );
    this.tiltEls.forEach(el => this.tiltObserver!.observe(el.nativeElement));

    if (this.statsEl) {
      this.statsObserver = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if (entry.isIntersecting) this.startCountUp();
          else this.statsAnimated = false;
        }),
        { threshold: 0.4 }
      );
      this.statsObserver.observe(this.statsEl.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.tiltObserver?.disconnect();
    this.statsObserver?.disconnect();
    this.stopAutoSlide();
    if (this.onPointerMove && this.heroEl) {
      this.heroEl.nativeElement.removeEventListener('pointermove', this.onPointerMove);
    }
  }
}