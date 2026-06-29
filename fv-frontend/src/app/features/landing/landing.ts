import { Component, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  styles: [`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .anim-1 { animation: fadeUp 0.6s ease both; }
    .anim-2 { animation: fadeUp 0.6s 0.12s ease both; }
    .anim-3 { animation: fadeUp 0.6s 0.24s ease both; }
    .anim-4 { animation: fadeUp 0.6s 0.36s ease both; }
    .anim-mockup { animation: scaleIn 0.75s 0.55s cubic-bezier(0.16,1,0.3,1) both; }

    .reveal {
      opacity: 0; transform: translateY(20px);
      transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal.show { opacity: 1; transform: translateY(0); }
    .reveal-l { opacity: 0; transform: translateX(-28px);
      transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
    .reveal-l.show { opacity: 1; transform: translateX(0); }
    .reveal-r { opacity: 0; transform: translateX(28px);
      transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
    .reveal-r.show { opacity: 1; transform: translateX(0); }
    .d1 { transition-delay: 0.06s; } .d2 { transition-delay: 0.14s; }
    .d3 { transition-delay: 0.22s; } .d4 { transition-delay: 0.30s; }
    .d5 { transition-delay: 0.38s; }

    /* ── 3D Perspectiva en scroll (estilo Whisper Money) ── */
    @keyframes floatY {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-10px); }
    }
    .float-hero  { animation: floatY 5s ease-in-out infinite; }
    .perspective-wrap { perspective: 1400px; perspective-origin: 50% 0%; }
    .tilt-card {
      opacity: 0;
      transform: rotateX(26deg) translateY(48px) scale(0.96);
      transition: opacity 1s cubic-bezier(0.16,1,0.3,1),
                  transform 1s cubic-bezier(0.16,1,0.3,1);
      will-change: transform, opacity;
    }
    .tilt-card.tilt-in {
      opacity: 1;
      transform: rotateX(0deg) translateY(0) scale(1);
    }

    /* ── Shimmer en botones ── */
    @keyframes shimmer {
      0%   { transform: translateX(-120%) skewX(-12deg); }
      100% { transform: translateX(230%)  skewX(-12deg); }
    }
    .btn-shimmer { position: relative; overflow: hidden; }
    .btn-shimmer::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
      transform: translateX(-120%) skewX(-12deg);
      pointer-events: none;
    }
    .btn-shimmer:hover::after { animation: shimmer 0.65s ease forwards; }

    .grid-pattern {
      background-image:
        linear-gradient(rgba(148,163,184,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,.04) 1px, transparent 1px);
      background-size: 56px 56px;
    }

    /* ── Paleta dorada ── */
    .gold-text  { color: #E5C158; }
    .gold-border{ border-color: rgba(229,193,88,.3); }
    .gold-bg    { background-color: rgba(229,193,88,.1); }
    .gold-btn {
      background: linear-gradient(135deg,#C9A227 0%,#E5C158 50%,#C9A227 100%);
      color: #1a1400;
      box-shadow: 0 8px 32px rgba(229,193,88,.25);
    }
    .gold-btn:hover {
      background: linear-gradient(135deg,#E5C158 0%,#f0d070 50%,#E5C158 100%);
      box-shadow: 0 12px 40px rgba(229,193,88,.4);
    }
    .icon-gold {
      display: inline-block;
      filter: sepia(1) saturate(5) hue-rotate(2deg) brightness(1.15);
    }
    .gold-glow {
      display: inline-block;
      filter: sepia(1) saturate(6) hue-rotate(2deg) brightness(1.25)
              drop-shadow(0 0 8px rgba(229,193,88,0.45));
    }
    .svg-gold { color: #E5C158; }

    /* ── Carrusel ── */
    .carousel-track {
      display: flex;
      transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;
    }
    .carousel-slide { min-width: 100%; flex-shrink: 0; }
    .carousel-dot {
      width:8px; height:8px; border-radius:9999px;
      background:rgba(229,193,88,.25); cursor:pointer; transition:all .3s;
    }
    .carousel-dot.active { width:24px; background:#E5C158; }

    /* ── Nav icon cards ── */
    .nav-card {
      background: rgba(229,193,88,0.05);
      border: 1px solid rgba(229,193,88,.2);
      transition: all .3s cubic-bezier(0.16,1,0.3,1);
      position: relative; overflow: hidden;
    }
    .nav-card:hover {
      background: linear-gradient(135deg, rgba(37,99,235,0.28) 0%, rgba(59,130,246,0.14) 60%, rgba(229,193,88,0.08) 100%);
      border-color: rgba(59,130,246,0.6);
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(37,99,235,0.22), 0 0 0 1px rgba(59,130,246,0.35), 0 0 24px rgba(37,99,235,0.12);
      color: #93c5fd;
    }
    .nav-card::after {
      content: '';
      position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(96,165,250,0.2), transparent);
      transition: left 0.55s ease;
      pointer-events: none;
    }
    .nav-card:hover::after { left: 140%; }

    /* ══ FUTURISTIC LAYER ══════════════════════════════════════════ */

    /* Dot-matrix background */
    .matrix-bg {
      background-image:
        radial-gradient(rgba(229,193,88,0.07) 1px, transparent 1px),
        linear-gradient(rgba(148,163,184,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,.025) 1px, transparent 1px);
      background-size: 28px 28px, 56px 56px, 56px 56px;
    }

    /* Scan line */
    @keyframes scanLine { from { top: 0; } to { top: 100%; } }
    .scan-line {
      position: absolute; left: 0; right: 0; height: 1px; top: 0;
      background: linear-gradient(90deg, transparent, rgba(229,193,88,.45) 35%, rgba(229,193,88,.45) 65%, transparent);
      animation: scanLine 8s linear infinite;
      pointer-events: none; z-index: 3;
    }

    /* Neon pulse glow on cards */
    @keyframes neonPulse {
      0%,100% { box-shadow: 0 0 12px rgba(229,193,88,.18), 0 0 40px rgba(229,193,88,.07); border-color: rgba(229,193,88,.35); }
      50%     { box-shadow: 0 0 28px rgba(229,193,88,.32), 0 0 70px rgba(229,193,88,.14); border-color: rgba(229,193,88,.6); }
    }
    .neon-card { animation: neonPulse 3.5s ease-in-out infinite; }

    /* Glassmorphism */
    .glass {
      background: rgba(10,18,40,.6) !important;
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    }

    /* HUD corner brackets */
    .hud-frame { position: relative; }
    .hud-frame::before, .hud-frame::after {
      content: ''; position: absolute; width: 18px; height: 18px;
      border-color: rgba(229,193,88,.55); border-style: solid; z-index: 1; pointer-events: none;
    }
    .hud-frame::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    .hud-frame::after  { top: -1px; right: -1px; border-width: 2px 2px 0 0; }

    /* Orbit rings */
    @keyframes orbitCW  { from { transform: translate(-50%,-50%) rotate(0); }   to { transform: translate(-50%,-50%) rotate(360deg); } }
    @keyframes orbitCCW { from { transform: translate(-50%,-50%) rotate(0); }   to { transform: translate(-50%,-50%) rotate(-360deg); } }
    .orbit-cw  { position: absolute; border-radius: 9999px; border: 1px dashed rgba(229,193,88,.08); pointer-events: none; animation: orbitCW 28s linear infinite; }
    .orbit-ccw { position: absolute; border-radius: 9999px; border: 1px dashed rgba(229,193,88,.06); pointer-events: none; animation: orbitCCW 40s linear infinite; }

    /* Glitch on hero title */
    @keyframes glitch {
      0%,87%,100% { clip-path: none; transform: none; color: white; }
      88% { clip-path: polygon(0 10%,100% 10%,100% 30%,0 30%); transform: translateX(-4px); color: #E5C158; }
      90% { clip-path: polygon(0 55%,100% 55%,100% 75%,0 75%); transform: translateX(4px); }
      92% { clip-path: polygon(0 0,100% 0,100% 8%,0 8%); transform: translateX(-2px); color: white; }
      94% { clip-path: none; }
    }
    .glitch-fx { animation: glitch 10s steps(1) infinite; }

    /* Ping ring on badge dot */
    .ping-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    @keyframes pingOut {
      0%   { transform: scale(1); opacity: .6; }
      100% { transform: scale(3); opacity: 0; }
    }
    .ping-wrap::before {
      content: ''; position: absolute; inset: 0; border-radius: 9999px;
      background: rgba(229,193,88,.4); animation: pingOut 2s cubic-bezier(0,0,.2,1) infinite;
    }

    /* XP counter glow */
    .xp-glow { text-shadow: 0 0 14px rgba(229,193,88,.7), 0 0 30px rgba(229,193,88,.4); }

    /* Holographic hover on module cards */
    @keyframes holoShift {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    .holo-card { transition: all .3s cubic-bezier(0.16,1,0.3,1); }
    .holo-card:hover {
      background: linear-gradient(135deg,rgba(229,193,88,.1) 0%,rgba(99,179,237,.07) 50%,rgba(229,193,88,.1) 100%) !important;
      background-size: 300% 300% !important;
      animation: holoShift 2s linear infinite !important;
      box-shadow: 0 0 24px rgba(229,193,88,.12) !important;
    }

    /* Data bars animated fill */
    @keyframes fillBar { from { width: 0; } }
    .bar-anim { animation: fillBar 1.4s cubic-bezier(0.16,1,0.3,1) both; }

    /* Futuristic section divider glow */
    .section-glow { box-shadow: 0 -1px 0 rgba(229,193,88,.1), 0 1px 0 rgba(229,193,88,.05); }
  `],
  template: `

  <!-- ═══ NAVBAR ════════════════════════════════════════════════════════ -->
  <nav class="fixed inset-x-0 top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/60">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="/logo-oficial.png" alt="FinanzaViva" class="w-8 h-8 object-contain">
        <span class="text-lg font-extrabold tracking-tight">
          <span class="gold-text">Finanza</span><span class="text-white">Viva</span>
        </span>
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <a href="https://github.com/fsmolina-64/FinanzaViva" target="_blank" rel="noopener noreferrer"
           aria-label="GitHub" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
        <a routerLink="/auth/login"
           class="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200">
          Iniciar sesión
        </a>
        <a routerLink="/auth/register"
           class="inline-flex px-4 py-2 rounded-xl gold-btn text-sm font-bold transition-all duration-200">
          Crear cuenta
        </a>
      </div>
    </div>
  </nav>

  <!-- ═══ HERO ═══════════════════════════════════════════════════════════ -->
  <section class="min-h-screen bg-slate-900 matrix-bg flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center relative overflow-hidden">
    <!-- Scan line futurista -->
    <div class="scan-line"></div>
    <!-- Órbitas decorativas -->
    <div class="orbit-cw"  style="width:560px;height:560px;top:50%;left:50%"></div>
    <div class="orbit-ccw" style="width:820px;height:820px;top:50%;left:50%"></div>
    <!-- Luces ambiente -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#E5C158]/6 rounded-full blur-[140px]"></div>
      <div class="absolute bottom-0 right-1/4 w-[400px] h-[220px] bg-[#E5C158]/4 rounded-full blur-[100px]"></div>
      <div class="absolute top-1/3 left-1/6 w-[220px] h-[220px] bg-blue-600/3 rounded-full blur-[90px]"></div>
    </div>

    <div class="anim-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border gold-border text-[#E5C158] text-sm font-medium mb-8" style="box-shadow:0 0 20px rgba(229,193,88,.12)">
      <span class="icon-gold">🎮</span>
      <span>Educación Financiera Gamificada</span>
      <span class="ping-wrap w-1.5 h-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#E5C158] block"></span></span>
    </div>

    <h1 class="anim-2 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white max-w-3xl leading-[1.06] tracking-tight glitch-fx">
      Aprende finanzas.<br>
      <span class="gold-text">Gana logros.</span><br>
      Domina tu dinero.
    </h1>

    <p class="anim-3 text-slate-400 text-lg sm:text-xl max-w-lg mt-6 leading-relaxed">
      Academia financiera · Simulador de inversiones · Gestión real de tus finanzas.<br>
      Todo en un solo lugar, sin costo.
    </p>

    <div class="anim-4 mt-9 flex flex-col sm:flex-row gap-4">
      <a routerLink="/auth/register"
         class="px-8 py-4 rounded-xl gold-btn font-bold text-base transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] btn-shimmer">
        Empieza gratis →
      </a>
      <a routerLink="/auth/login"
         class="px-8 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium text-base hover:bg-slate-800 hover:text-white transition-all duration-200 btn-shimmer">
        Iniciar sesión
      </a>
    </div>

    <div class="anim-4 mt-5 flex flex-wrap justify-center gap-5 text-xs text-slate-500">
      <span class="flex items-center gap-1.5"><span class="gold-text">✓</span> Sin tarjeta de crédito</span>
      <span class="flex items-center gap-1.5"><span class="gold-text">✓</span> 100% gratuito</span>
      <span class="flex items-center gap-1.5"><span class="gold-text">✓</span> Acceso inmediato</span>
    </div>

    <!-- Dashboard mockup compacto -->
    <div class="anim-mockup mt-14 w-full max-w-3xl perspective-wrap">
      <div class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-black/60 text-left float-hero tilt-card neon-card hud-frame" #tiltEl>
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-700 bg-slate-900/60">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-full gold-bg border gold-border flex items-center justify-center gold-text text-xs font-bold">S</div>
            <div>
              <div class="text-white font-bold text-sm">Usuario One 👋</div>
              <div class="text-slate-400 text-xs">Nivel 2 · ROOKIE</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full gold-bg gold-text border gold-border text-xs font-semibold"><span class="icon-gold">🔥</span> Racha: 3</span>
            <span class="px-2.5 py-1 rounded-full gold-bg gold-text border gold-border text-xs font-bold xp-glow">450 XP</span>
          </div>
        </div>
        <div class="px-5 py-3 border-b border-slate-700">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-slate-400 text-xs">350 / 500 XP para Nivel 3</span>
            <span class="gold-text text-xs font-bold">70%</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full rounded-full" style="width:70%;background:linear-gradient(90deg,#C9A227,#E5C158,#C9A227)"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border flex flex-col gap-1.5">
            <img src="academia.png" class="w-7 h-7 object-contain" alt="Academia">
            <div class="text-white font-semibold text-sm">Academia</div>
            <div class="text-slate-400 text-xs">3/7 módulos</div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border flex flex-col gap-1.5">
            <img src="billetera-premium.png" class="w-7 h-7 object-contain" alt="Finanzas">
            <div class="text-white font-semibold text-sm">Finanzas</div>
            <div class="text-slate-400 text-xs">$54 balance</div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border flex flex-col gap-1.5">
            <img src="simulador.png" class="w-7 h-7 object-contain" alt="Simulador">
            <div class="text-white font-semibold text-sm">Simulador</div>
            <div class="text-slate-400 text-xs">2 victorias</div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border flex flex-col gap-1.5">
            <img src="logro.png" class="w-7 h-7 object-contain" alt="Logros">
            <div class="text-white font-semibold text-sm">Logros</div>
            <div class="text-slate-400 text-xs">5/23 logros</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CARRUSEL — QUÉ INCLUYE LA APP ═══════════════════════════════ -->
  <section class="bg-slate-900 py-20 px-6 border-t border-slate-800 section-glow">
    <div class="max-w-5xl mx-auto">

      <!-- Header -->
      <div class="text-center mb-10 reveal" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-4">
          <span class="icon-gold">💡</span> ¿Qué incluye FinanzaViva?
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-3">
          Todo lo que necesitas<br><span class="gold-text">en un solo lugar</span>
        </h2>
        <p class="text-slate-400 max-w-xl mx-auto text-sm">
          Desliza para explorar las 4 áreas principales de la app.
        </p>
      </div>

      <!-- Tabs navegación carrusel -->
      <div class="flex items-center justify-center gap-1 p-1 bg-slate-800 rounded-xl border gold-border w-fit mx-auto mb-8 reveal" #revealEl>
        <button *ngFor="let slide of slides; let i = index"
                (click)="goToSlide(i)"
                [class]="i === currentSlide
                  ? 'px-4 py-2 rounded-lg gold-btn text-xs font-bold transition-all duration-200 flex items-center gap-1.5'
                  : 'px-4 py-2 rounded-lg text-xs text-slate-400 font-medium hover:text-white transition-all duration-200 flex items-center gap-1.5'">
          <img [src]="slide.img" class="w-4 h-4 object-contain" style="filter:brightness(0) invert(1)" alt="">
          {{ slide.tab }}
        </button>
      </div>

      <!-- Slide area -->
      <div class="reveal perspective-wrap" #revealEl>
        <div class="bg-slate-800 rounded-2xl border gold-border overflow-hidden shadow-2xl shadow-black/60 tilt-card hud-frame neon-card" #tiltEl>
          <div class="carousel-track" [style.transform]="'translateX(-' + (currentSlide * 100) + '%)'">

          <!-- Slide: Dashboard -->
          <div class="carousel-slide">
            <div class="bg-slate-900/80 px-6 py-4 border-b gold-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm">S</div>
                <div>
                  <div class="text-white font-bold text-sm">Dashboard</div>
                  <div class="text-slate-400 text-xs">Tu centro de control financiero</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full gold-bg gold-text border gold-border text-xs font-semibold"><span class="icon-gold">🔥</span> Racha: 5</span>
                <span class="px-2.5 py-1 rounded-full gold-bg gold-text border gold-border text-xs font-bold">1,250 XP</span>
              </div>
            </div>
            <div class="p-5 grid sm:grid-cols-3 gap-4">
              <div class="sm:col-span-1 flex flex-col gap-3">
                <div class="bg-slate-900/70 rounded-xl p-4 border gold-border">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-white text-xs font-semibold">Nivel 3 → 4</span>
                    <span class="gold-text text-xs font-bold">75%</span>
                  </div>
                  <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" style="width:75%;background:linear-gradient(90deg,#C9A227,#E5C158)"></div>
                  </div>
                  <div class="text-slate-500 text-[10px] mt-1.5">750 / 1000 XP para siguiente nivel</div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex flex-col items-center gap-1.5">
                    <img src="academia.png" class="w-6 h-6 object-contain" alt="Academia">
                    <span class="text-white text-[10px] font-semibold">Academia</span>
                  </div>
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex flex-col items-center gap-1.5">
                    <img src="billetera-premium.png" class="w-6 h-6 object-contain" alt="Finanzas">
                    <span class="text-white text-[10px] font-semibold">Finanzas</span>
                  </div>
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex flex-col items-center gap-1.5">
                    <img src="simulador.png" class="w-6 h-6 object-contain" alt="Simulador">
                    <span class="text-white text-[10px] font-semibold">Simulador</span>
                  </div>
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex flex-col items-center gap-1.5">
                    <img src="logro.png" class="w-6 h-6 object-contain" alt="Logros">
                    <span class="text-white text-[10px] font-semibold">Logros</span>
                  </div>
                </div>
              </div>
              <div class="sm:col-span-2 flex flex-col gap-3">
                <div class="text-xs text-slate-500 font-semibold uppercase tracking-widest">Actividad Reciente</div>
                <div class="flex flex-col gap-2">
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center flex-shrink-0 p-1"><img src="academia.png" class="w-full h-full object-contain" alt="Academia"></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white text-xs font-semibold">Módulo 3 completado</div>
                      <div class="text-slate-500 text-[10px]">Crédito y Deuda · hace 2h</div>
                    </div>
                    <span class="gold-text text-xs font-bold">+130 XP</span>
                  </div>
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center flex-shrink-0 p-1"><img src="simulador.png" class="w-full h-full object-contain" alt="Simulador"></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white text-xs font-semibold">Victoria en Simulador</div>
                      <div class="text-slate-500 text-[10px]">Modo Solo · hace 5h</div>
                    </div>
                    <span class="gold-text text-xs font-bold">+80 XP</span>
                  </div>
                  <div class="bg-slate-900/70 rounded-xl p-3 border gold-border flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center flex-shrink-0 p-1"><img src="logro.png" class="w-full h-full object-contain" alt="Logros"></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white text-xs font-semibold">Logro desbloqueado</div>
                      <div class="text-slate-500 text-[10px]">"Estudiante" · ayer</div>
                    </div>
                    <span class="gold-text text-xs font-bold">+50 XP</span>
                  </div>
                </div>
                <div class="bg-slate-900/70 rounded-xl p-3.5 border gold-border flex items-center justify-between">
                  <div class="text-center">
                    <div class="text-[#4ade80] font-bold text-sm">$2,450</div>
                    <div class="text-slate-500 text-[10px]">Ingresos</div>
                  </div>
                  <div class="text-center">
                    <div class="text-red-400 font-bold text-sm">$1,320</div>
                    <div class="text-slate-500 text-[10px]">Gastos</div>
                  </div>
                  <div class="text-center">
                    <div class="gold-text font-bold text-sm">$1,130</div>
                    <div class="text-slate-500 text-[10px]">Ahorro</div>
                  </div>
                  <div class="text-center">
                    <div class="text-white font-bold text-sm">5/23</div>
                    <div class="text-slate-500 text-[10px]">Logros</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Slide: Academia -->
          <div class="carousel-slide">
            <div class="bg-slate-900/80 px-6 py-4 border-b gold-border">
              <div class="text-white font-bold text-sm">Academia Financiera</div>
              <div class="text-slate-400 text-xs">7 módulos · 28 lecciones · Aprende a tu ritmo</div>
            </div>
            <div class="p-5 flex flex-col gap-3">
              <div *ngFor="let mod of academyModules; let i = index"
                   class="bg-slate-900/60 rounded-xl p-4 border gold-border flex items-center gap-4">
                <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm flex-shrink-0">{{i+1}}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-white text-sm font-semibold">{{mod.name}}</div>
                  <div class="text-slate-400 text-xs mt-0.5">4 lecciones · {{mod.pct}}%</div>
                  <div class="h-1 bg-slate-700 rounded-full mt-2">
                    <div class="h-1 rounded-full bar-anim" [style]="'width:'+mod.pct+'%;background:linear-gradient(90deg,#C9A227,#E5C158)'"></div>
                  </div>
                </div>
                <span [class]="mod.done
                  ? 'px-2 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] text-[11px] font-semibold flex-shrink-0'
                  : 'px-2 py-0.5 rounded-full gold-bg gold-text border gold-border text-[11px] font-semibold flex-shrink-0'">
                  {{mod.done ? '✓ +'+mod.xp+' XP' : '+'+mod.xp+' XP'}}
                </span>
              </div>
            </div>
          </div>

          <!-- Slide: Simulador -->
          <div class="carousel-slide">
            <div class="bg-slate-900/80 px-6 py-4 border-b gold-border">
              <div class="text-white font-bold text-sm">Simulador de Decisiones Financieras</div>
              <div class="text-slate-400 text-xs">Practica sin arriesgar dinero real · Bots IA · Multijugador</div>
            </div>
            <div class="p-5">
              <div class="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4">Elige tu modo de juego</div>
              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="px-4 py-4 rounded-xl border gold-border relative" style="background:rgba(229,193,88,0.08)">
                  <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded gold-btn text-[9px] font-bold">RECOMENDADO</div>
                  <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center mb-3">
                    <svg class="w-5 h-5 svg-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <div class="gold-text font-semibold text-sm">Solo</div>
                  <div class="text-slate-400 text-xs mt-0.5">Tú vs bots IA</div>
                </div>
                <div class="px-4 py-4 rounded-xl border gold-border">
                  <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center mb-3">
                    <svg class="w-5 h-5 svg-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div class="text-white font-semibold text-sm">Multijugador</div>
                  <div class="text-slate-400 text-xs mt-0.5">Contra amigos</div>
                </div>
                <div class="px-4 py-4 rounded-xl border gold-border">
                  <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center mb-3">
                    <svg class="w-5 h-5 svg-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
                  </div>
                  <div class="text-white font-semibold text-sm">Mixto</div>
                  <div class="text-slate-400 text-xs mt-0.5">Humanos y bots</div>
                </div>
                <div class="px-4 py-4 rounded-xl border gold-border">
                  <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center mb-3">
                    <svg class="w-5 h-5 svg-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </div>
                  <div class="text-white font-semibold text-sm">Observar</div>
                  <div class="text-slate-400 text-xs mt-0.5">Mira las IAs jugar</div>
                </div>
              </div>
              <div class="gold-text text-xs font-semibold mb-3">Duración de la partida</div>
              <div class="grid grid-cols-3 gap-2">
                <div class="py-2.5 rounded-xl border gold-border text-center" style="background:rgba(229,193,88,0.08)">
                  <div class="gold-text text-xs font-semibold">Rápido</div>
                  <div class="text-slate-400 text-[10px]">3 rondas</div>
                </div>
                <div class="py-2.5 rounded-xl border border-slate-700 text-center">
                  <div class="text-slate-300 text-xs font-medium">Estándar</div>
                  <div class="text-slate-500 text-[10px]">5 rondas</div>
                </div>
                <div class="py-2.5 rounded-xl border border-slate-700 text-center">
                  <div class="text-slate-300 text-xs font-medium">Intensivo</div>
                  <div class="text-slate-500 text-[10px]">8 rondas</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Slide: Finanzas -->
          <div class="carousel-slide">
            <div class="bg-slate-900/80 px-6 py-4 border-b gold-border">
              <div class="text-white font-bold text-sm">Mis Finanzas</div>
              <div class="text-slate-400 text-xs">Ingresos · Gastos · Presupuestos · Metas de ahorro · PDF</div>
            </div>
            <div class="p-5">
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border text-center">
                  <div class="text-[#4ade80] font-bold text-base">$2,450</div>
                  <div class="text-slate-500 text-xs mt-0.5">Ingresos</div>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border text-center">
                  <div class="text-red-400 font-bold text-base">$1,320</div>
                  <div class="text-slate-500 text-xs mt-0.5">Gastos</div>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border text-center">
                  <div class="gold-text font-bold text-base">$1,130</div>
                  <div class="text-slate-500 text-xs mt-0.5">Ahorro</div>
                </div>
              </div>
              <div class="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">Últimas transacciones</div>
              <div class="flex flex-col gap-2 mb-4">
                <div class="flex items-center gap-3 py-2.5 px-3 bg-slate-900/60 border gold-border rounded-xl">
                  <div class="w-7 h-7 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] text-xs font-bold flex-shrink-0">+</div>
                  <div class="flex-1"><div class="text-white text-xs font-medium">Balance JEP</div><div class="text-slate-500 text-[10px]">23 Jun</div></div>
                  <span class="text-[#4ade80] text-xs font-semibold">+$2.00</span>
                </div>
                <div class="flex items-center gap-3 py-2.5 px-3 bg-slate-900/60 border gold-border rounded-xl">
                  <div class="w-7 h-7 rounded-full gold-bg border gold-border flex items-center justify-center gold-text text-xs font-bold flex-shrink-0">B</div>
                  <div class="flex-1"><div class="text-white text-xs font-medium">Balance billetera digital</div><div class="text-slate-500 text-[10px]">23 Jun</div></div>
                  <span class="text-slate-300 text-xs font-semibold">$52.00</span>
                </div>
              </div>
              <div class="flex items-center justify-between px-4 py-3 rounded-xl gold-bg border gold-border">
                <div>
                  <div class="text-white text-xs font-medium">Meta: Fondo de emergencia</div>
                  <div class="text-slate-400 text-[10px] mt-0.5">$0 / $1,000 · 0% completado</div>
                </div>
                <button class="px-3 py-1.5 gold-btn text-[10px] font-bold rounded-lg">Ahorrar →</button>
              </div>
            </div>
          </div>

          </div><!-- /carousel-track -->
        </div><!-- /card -->

        <!-- Dots y controles -->
        <div class="flex items-center justify-center gap-3 mt-6">
          <button (click)="prevSlide()" class="w-8 h-8 rounded-full bg-slate-800 border gold-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div class="flex items-center gap-2">
            <div *ngFor="let s of slides; let i = index"
                 (click)="goToSlide(i)"
                 [class]="'carousel-dot' + (i === currentSlide ? ' active' : '')"></div>
          </div>
          <button (click)="nextSlide()" class="w-8 h-8 rounded-full bg-slate-800 border gold-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- CTA debajo del carrusel -->
      <div class="mt-10 text-center reveal" #revealEl>
        <a routerLink="/auth/register"
           class="inline-flex items-center gap-2 px-8 py-4 rounded-xl gold-btn font-bold text-base transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
          <span class="icon-gold"></span> Comenzar gratis ahora
        </a>
        <p class="mt-3 text-slate-500 text-xs">Sin tarjeta de crédito · Sin costo · Acceso inmediato</p>
      </div>
    </div>
  </section>

  <!-- ═══ ICONOS / ACCESOS ══════════════════════════════════════════════ -->
  <section class="bg-slate-800 py-16 px-6 border-t border-slate-700">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-10 reveal" #revealEl>
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">Accede a todo desde un solo lugar</h2>
        <p class="text-slate-400 text-sm">Cuatro módulos que trabajan juntos para tu libertad financiera.</p>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">

        <!-- Dashboard -->
        <div class="nav-card holo-card rounded-2xl p-6 flex flex-col items-center gap-4 cursor-default reveal d1" #revealEl>
          <div class="w-14 h-14 rounded-2xl gold-bg border gold-border flex items-center justify-center">
            <img src="dashboard.png" class="w-9 h-9 object-contain" alt="Dashboard">
          </div>
          <div class="text-center">
            <div class="text-white font-bold text-sm">Dashboard</div>
            <div class="text-slate-400 text-xs mt-1">Tu progreso general</div>
          </div>
        </div>

        <!-- Finanzas -->
        <div class="nav-card holo-card rounded-2xl p-6 flex flex-col items-center gap-4 cursor-default reveal d2" #revealEl>
          <div class="w-14 h-14 rounded-2xl gold-bg border gold-border flex items-center justify-center">
            <img src="billetera-premium.png" class="w-9 h-9 object-contain" alt="Finanzas">
          </div>
          <div class="text-center">
            <div class="text-white font-bold text-sm">Finanzas</div>
            <div class="text-slate-400 text-xs mt-1">Gastos e ingresos</div>
          </div>
        </div>

        <!-- Academia -->
        <div class="nav-card holo-card rounded-2xl p-6 flex flex-col items-center gap-4 cursor-default reveal d3" #revealEl>
          <div class="w-14 h-14 rounded-2xl gold-bg border gold-border flex items-center justify-center">
            <img src="academia.png" class="w-9 h-9 object-contain" alt="Academia">
          </div>
          <div class="text-center">
            <div class="text-white font-bold text-sm">Academia</div>
            <div class="text-slate-400 text-xs mt-1">7 módulos y quizzes</div>
          </div>
        </div>

        <!-- Simulador -->
        <div class="nav-card holo-card rounded-2xl p-6 flex flex-col items-center gap-4 cursor-default reveal d4" #revealEl>
          <div class="w-14 h-14 rounded-2xl gold-bg border gold-border flex items-center justify-center">
            <img src="simulador.png" class="w-9 h-9 object-contain" alt="Simulador">
          </div>
          <div class="text-center">
            <div class="text-white font-bold text-sm">Simulador</div>
            <div class="text-slate-400 text-xs mt-1">Decisiones financieras</div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ═══ NIVELES ══════════════════════════════════════════════════════ -->
  <section class="bg-slate-900 py-16 px-6 border-t border-slate-800 section-glow">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-10 reveal" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-4">⭐ Tu Progresión</span>
        <h2 class="text-2xl sm:text-3xl font-bold text-white">Tu camino hacia la libertad financiera</h2>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border relative reveal d1 holo-card neon-card" #revealEl style="background:rgba(229,193,88,0.07)">
          <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-slate-900 text-[9px] font-bold whitespace-nowrap gold-btn">TÚ AQUÍ</div>
          <img src="novato.png" class="w-28 h-28 object-contain mt-2" alt="Novato">
          <div class="gold-text text-xs font-semibold text-center">Novato</div>
          <div class="text-[9px] text-slate-400 text-center">ROOKIE · 0–100 XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border reveal d2 holo-card neon-card" #revealEl style="background:rgba(229,193,88,0.07)">
          <img src="principiante.png" class="w-20 h-20 object-contain mt-2" alt="Principiante">
          <div class="gold-text text-xs font-semibold text-center">Principiante</div>
          <div class="text-[9px] text-slate-400 text-center">100–300 XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border reveal d3 holo-card neon-card" #revealEl style="background:rgba(229,193,88,0.07)">
          <img src="aprendiz.png" class="w-20 h-20 object-contain mt-2" alt="Aprendiz">
          <div class="gold-text text-xs font-semibold text-center">Aprendiz</div>
          <div class="text-[9px] text-slate-400 text-center">APPRENTICE · 300+ XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border reveal d4 holo-card neon-card" #revealEl style="background:rgba(229,193,88,0.07)">
          <img src="avanzado.png" class="w-20 h-20 object-contain mt-2" alt="Avanzado">
          <div class="gold-text text-xs font-semibold text-center">Avanzado</div>
          <div class="text-[9px] text-slate-400 text-center">700+ XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border reveal d5 holo-card neon-card" #revealEl style="background:rgba(229,193,88,0.07)">
          <img src="experto.png" class="w-20 h-20 object-contain mt-2" alt="Experto">
          <div class="gold-text text-xs font-bold text-center">Experto</div>
          <div class="text-[9px] text-slate-400 text-center">1500+ XP</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CTA FINAL ════════════════════════════════════════════════════ -->
  <section class="border-t border-slate-700 relative overflow-hidden" style="min-height:520px">
    <!-- Video de fondo -->
    <video src="video.mp4" autoplay loop muted playsinline
           class="absolute inset-0 w-full h-full object-cover"
           style="z-index:0; transform:scale(1.18); transform-origin:center center"></video>
    <!-- Overlay oscuro para legibilidad del texto -->
    <div class="absolute inset-0" style="background:linear-gradient(to bottom, rgba(10,18,40,0.72) 0%, rgba(10,18,40,0.82) 100%);z-index:1"></div>
    <!-- Brillo dorado central -->
    <div class="absolute inset-0 pointer-events-none" style="z-index:2">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-[#E5C158]/8 rounded-full blur-[100px]"></div>
    </div>
    <!-- Contenido encima del video -->
    <div class="relative flex items-center justify-center px-6" style="z-index:3; min-height:520px">
      <div class="max-w-2xl mx-auto text-center reveal" #revealEl>
        <h2 class="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
          ¿Listo para subir<br><span class="gold-text">de nivel?</span>
        </h2>
        <p class="mt-5 text-slate-300 text-lg max-w-md mx-auto">
          Crea tu cuenta, empieza tu primer módulo y gana tus primeros XP en menos de 5 minutos.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/auth/register"
             class="px-8 py-4 rounded-xl gold-btn font-bold text-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] btn-shimmer">
            Crear cuenta gratis →
          </a>
          <a routerLink="/auth/login"
             class="px-8 py-4 rounded-xl border border-slate-500 text-white font-medium text-lg hover:bg-white/10 transition-all duration-200 btn-shimmer">
            Ya tengo una cuenta
          </a>
        </div>
        <p class="mt-6 text-slate-400 text-sm">
          <span class="gold-text">✓</span> Sin tarjeta de crédito &nbsp;·&nbsp;
          <span class="gold-text">✓</span> Sin costo &nbsp;·&nbsp;
          <span class="gold-text">✓</span> Acceso inmediato
        </p>
      </div>
    </div>
  </section>

  <!-- ═══ FOOTER ════════════════════════════════════════════════════════ -->
  <footer class="bg-slate-900 border-t border-slate-800 py-8 px-6">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
      <div class="flex items-center gap-2">
        <img src="/logo-oficial.png" alt="FinanzaViva" class="w-6 h-6 object-contain opacity-80">
        <span class="font-extrabold tracking-tight">
          <span class="gold-text">Finanza</span><span class="text-slate-400">Viva</span>
        </span>
      </div>
      <span class="text-center text-xs">© 2026 FinanzaViva · Hecho para jóvenes ecuatorianos</span>
      <div class="flex gap-5 text-xs">
        <a href="https://github.com/fsmolina-64/FinanzaViva" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition-colors">GitHub</a>
        <a routerLink="/auth/login" class="hover:text-slate-300 transition-colors">Iniciar sesión</a>
        <a routerLink="/auth/register" class="hover:text-slate-300 transition-colors">Registrarse</a>
      </div>
    </div>
  </footer>

  `
})
export class Landing implements AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef>;
  @ViewChildren('tiltEl')   private tiltEls!:   QueryList<ElementRef>;
  private observer?: IntersectionObserver;
  private tiltObserver?: IntersectionObserver;
  private autoInterval?: ReturnType<typeof setInterval>;

  currentSlide = 0;
  isTransitioning = false;

  slides = [
    { tab: 'Dashboard', img: 'dashboard.png'         },
    { tab: 'Academia',  img: 'academia.png'           },
    { tab: 'Simulador', img: 'simulador.png'          },
    { tab: 'Finanzas',  img: 'billetera-premium.png'  },
  ];

  academyModules = [
    { name: 'Presupuesto Personal',       pct: 0,   xp: 100, done: false },
    { name: 'Ahorro e Interés Compuesto', pct: 50,  xp: 120, done: false },
    { name: 'Crédito y Deuda',            pct: 100, xp: 130, done: true  },
    { name: 'Inversiones Básicas',        pct: 25,  xp: 150, done: false },
  ];

  goToSlide(i: number) { this.setSlide(i); this.resetAuto(); }
  nextSlide()          { this.setSlide((this.currentSlide + 1) % this.slides.length); this.resetAuto(); }
  prevSlide()          { this.setSlide((this.currentSlide - 1 + this.slides.length) % this.slides.length); this.resetAuto(); }

  private setSlide(index: number) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentSlide = index;
    setTimeout(() => { this.isTransitioning = false; }, 450);
  }

  private resetAuto() {
    clearInterval(this.autoInterval);
    this.autoInterval = setInterval(() => {
      this.setSlide((this.currentSlide + 1) % this.slides.length);
    }, 3000);
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('show'); this.observer!.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    this.revealEls.forEach(el => this.observer!.observe(el.nativeElement));

    this.tiltObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('tilt-in'); this.tiltObserver!.unobserve(e.target); }
      }),
      { threshold: 0.18 }
    );
    this.tiltEls.forEach(el => this.tiltObserver!.observe(el.nativeElement));

    this.resetAuto();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.tiltObserver?.disconnect();
    clearInterval(this.autoInterval);
  }
}
