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

interface LandingSlide {
  tab: string;
  img: string;
}

interface AcademyModulePreview {
  name: string;
  pct: number;
  xp: number;
  done: boolean;
}

interface FeatureGridItem {
  label: string;
  hint: string;
  img: string;
  revealDelay: 'd1' | 'd2' | 'd3' | 'd4' | 'd5';
}

interface ProgressionTier {
  name: string;
  subtitle: string;
  img: string;
  size: 'sm' | 'lg';
  current?: boolean;
}

const AUTO_SLIDE_INTERVAL_MS = 4500;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoEl') private videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef>;
  @ViewChildren('tiltEl') private tiltEls!: QueryList<ElementRef>;
  @ViewChildren('slideEl') private slideEls!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;
  private tiltObserver?: IntersectionObserver;
  private autoInterval?: ReturnType<typeof setInterval>;

  constructor(private ngZone: NgZone) { }

  /** Slide activo del carrusel "Qué incluye FinanzaViva". */
  readonly currentSlide = signal(0);
  /** Alto animado del carrusel — evita el salto/espacio vacío entre slides de distinta altura. */
  readonly trackHeightPx = signal(0);
  /** Controla el estilo del navbar al hacer scroll. */
  readonly scrolled = signal(false);

  readonly slides: LandingSlide[] = [
    { tab: 'Dashboard', img: '/dashboard.png' },
    { tab: 'Academia', img: '/academia.png' },
    { tab: 'Simulador', img: '/simulador.png' },
    { tab: 'Finanzas', img: '/billetera-premium.png' },
  ];

  readonly academyModules: AcademyModulePreview[] = [
    { name: 'Presupuesto Personal', pct: 0, xp: 100, done: false },
    { name: 'Ahorro e Interés Compuesto', pct: 50, xp: 120, done: false },
    { name: 'Crédito y Deuda', pct: 100, xp: 130, done: true },
    { name: 'Inversiones Básicas', pct: 25, xp: 150, done: false },
  ];

  readonly featureGrid: FeatureGridItem[] = [
    { label: 'Dashboard', hint: 'Tu progreso', img: '/dashboard.png', revealDelay: 'd1' },
    { label: 'Finanzas', hint: 'Gastos e ingresos', img: '/billetera-premium.png', revealDelay: 'd2' },
    { label: 'Academia', hint: '7 módulos', img: '/academia.png', revealDelay: 'd3' },
    { label: 'Simulador', hint: 'Decisiones', img: '/simulador.png', revealDelay: 'd4' },
    { label: 'Logros', hint: 'Insignias', img: '/logro.png', revealDelay: 'd5' },
    { label: 'Ranking', hint: 'Tabla global', img: '/ranking.png', revealDelay: 'd5' },
  ];

  readonly progressionTiers: ProgressionTier[] = [
    { name: 'Novato', subtitle: 'ROOKIE · 0–100 XP', img: '/novato.png', size: 'sm', current: true },
    { name: 'Principiante', subtitle: '100–300 XP', img: '/principiante.png', size: 'lg' },
    { name: 'Aprendiz', subtitle: 'APPRENTICE · 300+ XP', img: '/aprendiz.png', size: 'lg' },
    { name: 'Avanzado', subtitle: '700+ XP', img: '/avanzado.png', size: 'lg' },
    { name: 'Experto', subtitle: '1500+ XP', img: '/experto.png', size: 'lg' },
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

  /** Única fuente de verdad para cambiar de slide: fija el índice y remide el alto real del contenido. */
  private setSlide(index: number): void {
    this.currentSlide.set(index);
    this.measureActiveSlide();
  }

  private measureActiveSlide(): void {
    const el = this.slideEls?.get(this.currentSlide())?.nativeElement;
    if (el) this.trackHeightPx.set(el.scrollHeight);
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

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngAfterViewInit(): void {
    const video = this.videoEl.nativeElement;
    video.muted = true;
    video.play().catch(() => { });

    this.measureActiveSlide();

    this.observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          this.observer!.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 }
    );
    this.revealEls.forEach(el => this.observer!.observe(el.nativeElement));

    this.tiltObserver = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('tilt-in');
          this.tiltObserver!.unobserve(entry.target);
        }
      }),
      { threshold: 0.18 }
    );
    this.tiltEls.forEach(el => this.tiltObserver!.observe(el.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.tiltObserver?.disconnect();
    this.stopAutoSlide();
  }
}