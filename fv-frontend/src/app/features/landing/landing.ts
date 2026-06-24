import { Component, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
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
    .anim-5 { animation: fadeUp 0.6s 0.48s ease both; }
    .anim-mockup { animation: scaleIn 0.75s 0.55s cubic-bezier(0.16,1,0.3,1) both; }

    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1),
                  transform 0.65s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal.show { opacity: 1; transform: translateY(0); }

    .reveal-l {
      opacity: 0;
      transform: translateX(-28px);
      transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1),
                  transform 0.65s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal-l.show { opacity: 1; transform: translateX(0); }

    .reveal-r {
      opacity: 0;
      transform: translateX(28px);
      transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1),
                  transform 0.65s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal-r.show { opacity: 1; transform: translateX(0); }

    .d1 { transition-delay: 0.08s; }
    .d2 { transition-delay: 0.16s; }
    .d3 { transition-delay: 0.24s; }
    .d4 { transition-delay: 0.32s; }

    .grid-pattern {
      background-image:
        linear-gradient(rgba(148,163,184,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,.04) 1px, transparent 1px);
      background-size: 56px 56px;
    }
    .gold-text { color: #E5C158; }
    .gold-border { border-color: rgba(229,193,88,.3); }
    .gold-bg { background-color: rgba(229,193,88,.1); }
    .icon-gold {
      display: inline-block;
      filter: sepia(1) saturate(5) hue-rotate(2deg) brightness(1.15);
    }
    .gold-glow {
      display: inline-block;
      filter: sepia(1) saturate(6) hue-rotate(2deg) brightness(1.25) drop-shadow(0 0 8px rgba(229,193,88,0.45));
    }
    .gold-btn {
      background: linear-gradient(135deg, #C9A227 0%, #E5C158 50%, #C9A227 100%);
      color: #1a1400;
      box-shadow: 0 8px 32px rgba(229,193,88,0.25);
    }
    .gold-btn:hover {
      background: linear-gradient(135deg, #E5C158 0%, #f0d070 50%, #E5C158 100%);
      box-shadow: 0 12px 40px rgba(229,193,88,0.4);
    }
  `],
  template: `

  <!-- ═══ NAVBAR ════════════════════════════════════════════════════════ -->
  <nav class="fixed inset-x-0 top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
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
           class="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200">
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
  <section class="min-h-screen bg-slate-900 grid-pattern flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-blue-600/6 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-[#E5C158]/4 rounded-full blur-[80px]"></div>
    </div>

    <div class="anim-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border gold-border text-[#E5C158] text-sm font-medium mb-8">
      <span class="icon-gold">🎮</span>
      <span>Educación Financiera Gamificada</span>
      <span class="w-1.5 h-1.5 rounded-full bg-[#E5C158] animate-pulse"></span>
    </div>

    <h1 class="anim-2 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white max-w-3xl leading-[1.06] tracking-tight">
      Aprende finanzas.<br>
      <span class="gold-text">Gana logros.</span><br>
      Domina tu dinero.
    </h1>

    <p class="anim-3 text-slate-400 text-lg sm:text-xl max-w-lg mt-7 leading-relaxed">
      Academia financiera, quizzes interactivos, simulador de inversiones y gestión real de tus finanzas — todo en un solo lugar.
    </p>

    <div class="anim-4 mt-10 flex flex-col sm:flex-row gap-4">
      <a routerLink="/auth/register"
         class="px-8 py-4 rounded-xl gold-btn font-bold text-base transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
        Empieza gratis — sin costo →
      </a>
      <a routerLink="/auth/login"
         class="px-8 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium text-base hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200">
        Iniciar sesión
      </a>
    </div>

    <div class="anim-4 mt-5 flex flex-wrap justify-center gap-5 text-xs text-slate-500">
      <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Sin tarjeta de crédito</span>
      <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> 100% gratuito</span>
      <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Acceso inmediato</span>
    </div>

    <!-- Dashboard mockup -->
    <div class="anim-mockup mt-14 w-full max-w-4xl">
      <div class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-black/60 text-left">
        <!-- Top bar -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-700 bg-slate-900/60">
          <div>
            <div class="text-white font-bold text-sm">Hola, Sofía 👋</div>
            <div class="text-slate-400 text-xs">Tu resumen de progreso</div>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="px-2.5 py-1 rounded-full gold-bg gold-text border gold-border text-xs font-semibold"><span class="icon-gold">🔥</span> Racha: 3</span>
            <div class="w-8 h-8 rounded-full gold-bg border gold-border flex items-center justify-center gold-text text-sm font-bold">S</div>
          </div>
        </div>
        <!-- XP bar -->
        <div class="px-5 py-4 border-b border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-white font-semibold text-sm">Nivel 2</span>
              <span class="px-2 py-0.5 rounded-full gold-bg gold-text border gold-border text-[11px] font-semibold">ROOKIE</span>
            </div>
            <span class="gold-text font-bold text-sm">450 XP Total</span>
          </div>
          <div class="text-slate-500 text-[11px] mb-2">350 / 500 XP para Nivel 3</div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full rounded-full" style="width:70%;background:linear-gradient(90deg,#C9A227,#E5C158,#C9A227)"></div>
          </div>
        </div>
        <!-- Stat cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border">
            <div class="text-xl mb-2 icon-gold">🎓</div>
            <div class="text-white font-semibold text-sm">Academia</div>
            <div class="text-slate-400 text-xs mt-1">3 / 7 módulos</div>
            <div class="text-slate-500 text-xs">12 / 28 lecciones</div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border">
            <div class="text-xl mb-2 icon-gold">🧠</div>
            <div class="text-white font-semibold text-sm">Quizzes</div>
            <div class="text-slate-400 text-xs mt-1">4 / 7 aprobados</div>
            <div class="gold-text text-xs font-medium">78% tasa</div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border">
            <div class="text-xl mb-2 icon-gold">🎮</div>
            <div class="text-white font-semibold text-sm">Simulador</div>
            <div class="text-slate-400 text-xs mt-1">2 victorias</div>
            <div class="text-slate-500 text-xs">5 partidas jugadas</div>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-3.5 border gold-border">
            <div class="text-xl mb-2 icon-gold">🏆</div>
            <div class="text-white font-semibold text-sm">Logros</div>
            <div class="text-slate-400 text-xs mt-1">5 / 23</div>
            <div class="gold-text text-xs font-medium">+850 XP ganados</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ STATS ════════════════════════════════════════════════════════ -->
  <section class="bg-slate-800 border-y border-slate-700 py-10 px-6">
    <div class="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
      <div class="reveal" #revealEl>
        <div class="text-3xl font-extrabold gold-text">500<span class="text-white">+</span></div>
        <div class="text-sm text-slate-400 mt-1">Usuarios activos</div>
      </div>
      <div class="reveal d1" #revealEl>
        <div class="text-3xl font-extrabold gold-text">7</div>
        <div class="text-sm text-slate-400 mt-1">Módulos disponibles</div>
      </div>
      <div class="reveal d2" #revealEl>
        <div class="text-3xl font-extrabold gold-text">28</div>
        <div class="text-sm text-slate-400 mt-1">Lecciones interactivas</div>
      </div>
      <div class="reveal d3" #revealEl>
        <div class="text-3xl font-extrabold gold-text">23</div>
        <div class="text-sm text-slate-400 mt-1">Logros desbloqueables</div>
      </div>
    </div>
  </section>

  <!-- ═══ FEATURE: ACADEMIA ════════════════════════════════════════════ -->
  <section class="bg-slate-900 py-24 px-6 border-t border-slate-800">
    <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

      <div class="reveal-l" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-5"><span class="icon-gold">📚</span> Academia Financiera</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
          7 módulos para dominar<br>tus finanzas personales
        </h2>
        <p class="text-slate-400 leading-relaxed mb-7">Desde presupuesto hasta mercado de valores — aprende a tu ritmo con lecciones cortas y contenido diseñado para jóvenes ecuatorianos.</p>
        <ul class="flex flex-col gap-3.5">
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Presupuesto personal, ahorro e interés compuesto</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Crédito, deuda, inversiones y mercado de valores</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Seguros, protección financiera y planificación</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">+100 XP por módulo completado, progreso guardado</span>
          </li>
        </ul>
      </div>

      <!-- Modules mockup -->
      <div class="reveal-r" #revealEl>
        <div class="flex flex-col gap-2.5">
          <div class="bg-slate-800 rounded-xl p-4 border gold-border flex items-center gap-4">
            <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm flex-shrink-0">1</div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold">Presupuesto Personal</div>
              <div class="text-slate-400 text-xs mt-0.5">4 lecciones · 0%</div>
              <div class="h-1 bg-slate-700 rounded-full mt-2">
                <div class="h-1 bg-[#E5C158]/40 rounded-full" style="width:0%"></div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full gold-bg gold-text border gold-border text-[11px] font-semibold flex-shrink-0">+100 XP</span>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 border gold-border flex items-center gap-4">
            <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm flex-shrink-0">2</div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold">Ahorro e Interés Compuesto</div>
              <div class="text-slate-400 text-xs mt-0.5">4 lecciones · 50%</div>
              <div class="h-1 bg-slate-700 rounded-full mt-2">
                <div class="h-1 rounded-full" style="width:50%;background:linear-gradient(90deg,#C9A227,#E5C158)"></div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full gold-bg gold-text border gold-border text-[11px] font-semibold flex-shrink-0">+120 XP</span>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 border gold-border flex items-center gap-4" style="background:rgba(229,193,88,0.06)">
            <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm flex-shrink-0">3</div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold">Crédito y Deuda</div>
              <div class="text-slate-400 text-xs mt-0.5">4 lecciones · 100%</div>
              <div class="h-1 bg-slate-700 rounded-full mt-2">
                <div class="h-1 rounded-full" style="width:100%;background:linear-gradient(90deg,#C9A227,#E5C158)"></div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold flex-shrink-0">✓ +130 XP</span>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 border gold-border flex items-center gap-4">
            <div class="w-9 h-9 rounded-lg gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm flex-shrink-0">4</div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold">Inversiones Básicas</div>
              <div class="text-slate-400 text-xs mt-0.5">4 lecciones · 25%</div>
              <div class="h-1 bg-slate-700 rounded-full mt-2">
                <div class="h-1 rounded-full" style="width:25%;background:linear-gradient(90deg,#C9A227,#E5C158)"></div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full gold-bg gold-text border gold-border text-[11px] font-semibold flex-shrink-0">+150 XP</span>
          </div>
          <div class="text-center gold-text text-xs pt-1 opacity-60">+ 3 módulos más disponibles</div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═══ FEATURE: QUIZZES ════════════════════════════════════════════ -->
  <section class="bg-slate-800 py-24 px-6 border-t border-slate-700">
    <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

      <!-- Quiz mockup -->
      <div class="reveal-l" #revealEl>
        <div class="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl shadow-black/40">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">Módulo 2 · Pregunta 3/5</span>
              <span class="gold-text text-sm font-semibold"><span class="icon-gold">🔥</span> ×5</span>
            </div>
            <span class="px-2 py-0.5 rounded-full gold-bg gold-text border gold-border text-xs font-semibold">+50 XP</span>
          </div>
          <div class="h-1.5 bg-slate-800 rounded-full mb-5">
            <div class="h-1.5 rounded-full" style="width:60%;background:linear-gradient(90deg,#C9A227,#E5C158)"></div>
          </div>
          <p class="text-white font-semibold mb-4">¿Qué es el interés compuesto?</p>
          <div class="flex flex-col gap-2 mb-4">
            <div class="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 cursor-pointer hover:border-slate-600 transition-colors">A) Interés solo sobre el capital inicial</div>
            <div class="px-4 py-2.5 rounded-xl border gold-border text-sm text-white font-medium flex items-center justify-between" style="background:rgba(229,193,88,0.08)">
              <span>B) Interés sobre capital e intereses acumulados</span>
              <span class="gold-text ml-2">✓</span>
            </div>
            <div class="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400">C) Un tipo de préstamo bancario</div>
            <div class="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400">D) Una estrategia de trading avanzada</div>
          </div>
          <div class="px-4 py-2.5 rounded-xl border gold-border text-xs gold-text mb-4" style="background:rgba(229,193,88,0.06)">
            <span class="icon-gold">✅</span> ¡Correcto! El interés compuesto es el "octavo milagro del mundo".
          </div>
          <button class="w-full py-2.5 gold-btn text-sm font-bold rounded-xl transition-all duration-200">
            Siguiente pregunta →
          </button>
        </div>
      </div>

      <div class="reveal-r" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-5"><span class="icon-gold">🧠</span> Quizzes Interactivos</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
          Aprende haciendo,<br>no memorizando
        </h2>
        <p class="text-slate-400 leading-relaxed mb-7">Quizzes cortos con retroalimentación inmediata. Cada módulo tiene su propio quiz que te desafía y te enseña al mismo tiempo.</p>
        <ul class="flex flex-col gap-3.5">
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">7 quizzes disponibles — uno por módulo</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Retroalimentación inmediata y explicaciones claras</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Rachas de racha y XP extra por respuestas correctas</span>
          </li>
        </ul>
      </div>

    </div>
  </section>

  <!-- ═══ FEATURE: GAMIFICACIÓN ════════════════════════════════════════ -->
  <section class="bg-slate-900 py-24 px-6 border-t border-slate-800">
    <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

      <div class="reveal-l" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-5">🏆 Gamificación</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
          Finanzas que te<br>
          <span class="gold-text">mantienen motivado</span>
        </h2>
        <p class="text-slate-400 leading-relaxed mb-7">XP, niveles, rachas, logros y recompensas — nuestro sistema de gamificación convierte aprender en algo que realmente quieres seguir haciendo.</p>
        <ul class="flex flex-col gap-3.5">
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full gold-bg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Sistema de XP: gana puntos en cada lección, quiz y simulador</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full gold-bg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">23 logros desbloqueables + 20 recompensas exclusivas</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full gold-bg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Racha diaria para mantener la constancia</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full gold-bg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Ranking global — compite con otros usuarios</span>
          </li>
        </ul>
      </div>

      <!-- Achievements mockup -->
      <div class="reveal-r" #revealEl>
        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl shadow-black/40">
          <!-- User bar -->
          <div class="flex items-center gap-3 mb-5">
            <div class="w-12 h-12 rounded-xl gold-bg border-2 gold-border flex items-center justify-center text-2xl"><span class="icon-gold">👤</span></div>
            <div class="flex-1">
              <div class="text-white font-semibold text-sm">Juan Pérez</div>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="gold-text text-xs font-medium">Nivel 3</span>
                <span class="text-slate-500 text-xs">·</span>
                <span class="text-slate-400 text-xs">APPRENTICE</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-white font-bold">1,250</div>
              <div class="text-xs text-slate-500">XP total</div>
            </div>
          </div>
          <!-- XP bar -->
          <div class="mb-5">
            <div class="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progreso al Nivel 4</span>
              <span class="text-[#2563EB] font-medium">750 / 1000 XP</span>
            </div>
            <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width:75%;background:linear-gradient(90deg,#C9A227,#E5C158,#C9A227)"></div>
            </div>
          </div>
          <!-- Achievements -->
          <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3">Logros desbloqueados · 5/23</div>
          <div class="grid grid-cols-5 gap-2 mb-5">
            <div class="flex flex-col items-center gap-1">
              <div class="w-11 h-11 rounded-xl gold-bg border gold-border flex items-center justify-center text-xl"><span class="icon-gold">🏆</span></div>
              <span class="text-[9px] text-slate-500 text-center leading-tight">1er quiz</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-11 h-11 rounded-xl gold-bg border gold-border flex items-center justify-center text-xl"><span class="icon-gold">🎯</span></div>
              <span class="text-[9px] text-slate-500 text-center leading-tight">100% módulo</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-11 h-11 rounded-xl gold-bg border gold-border flex items-center justify-center text-xl"><span class="icon-gold">💰</span></div>
              <span class="text-[9px] text-slate-500 text-center leading-tight">Ahorrador</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-11 h-11 rounded-xl gold-bg border gold-border flex items-center justify-center text-xl"><span class="icon-gold">🔥</span></div>
              <span class="text-[9px] text-slate-500 text-center leading-tight">Racha 7d</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-11 h-11 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-xl opacity-30"><span>🔒</span></div>
              <span class="text-[9px] text-slate-600 text-center leading-tight">Próximo</span>
            </div>
          </div>
          <!-- Notification -->
          <div class="flex items-center gap-3 px-4 py-3 rounded-xl gold-bg border gold-border">
            <span class="text-xl flex-shrink-0 icon-gold">🎉</span>
            <div>
              <div class="text-[#E5C158] text-xs font-semibold">¡Módulo 2 completado!</div>
              <div class="text-slate-400 text-xs">+200 XP · Logro "Estudiante" desbloqueado</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═══ FEATURE: SIMULADOR ══════════════════════════════════════════ -->
  <section class="bg-slate-800 py-24 px-6 border-t border-slate-700">
    <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

      <!-- Simulator mockup -->
      <div class="reveal-l order-last md:order-first" #revealEl>
        <div class="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-2xl shadow-black/40">
          <div class="text-white font-semibold text-sm mb-4">Modo de juego</div>
          <div class="grid grid-cols-2 gap-2.5 mb-5">
            <div class="px-4 py-3.5 rounded-xl border gold-border relative" style="background:rgba(229,193,88,0.08)">
              <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded gold-btn text-[9px] font-bold">RECOMENDADO</div>
              <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center gold-text font-bold text-sm mb-2"><span class="icon-gold">🎮</span></div>
              <div class="gold-text font-semibold text-sm">Solo</div>
              <div class="text-slate-400 text-xs mt-0.5">Tú vs bots IA</div>
            </div>
            <div class="px-4 py-3.5 rounded-xl border gold-border">
              <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center text-xl mb-2"><span class="icon-gold">👥</span></div>
              <div class="text-white font-semibold text-sm">Multijugador</div>
              <div class="text-slate-400 text-xs mt-0.5">Contra amigos</div>
            </div>
            <div class="px-4 py-3.5 rounded-xl border gold-border">
              <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center text-xl mb-2"><span class="icon-gold">🤝</span></div>
              <div class="text-white font-semibold text-sm">Mixto</div>
              <div class="text-slate-400 text-xs mt-0.5">Humanos y bots</div>
            </div>
            <div class="px-4 py-3.5 rounded-xl border gold-border">
              <div class="w-8 h-8 rounded-lg gold-bg border gold-border flex items-center justify-center text-xl mb-2"><span class="icon-gold">👁️</span></div>
              <div class="text-white font-semibold text-sm">Observar</div>
              <div class="text-slate-400 text-xs mt-0.5">Mira las IAs</div>
            </div>
          </div>
          <div class="gold-text font-semibold text-sm mb-3">Duración</div>
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

      <div class="reveal-r" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-5"><span class="icon-gold">📈</span> Simulador de Decisiones</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
          Practica sin<br>
          <span class="text-emerald-400">arriesgar dinero real</span>
        </h2>
        <p class="text-slate-400 leading-relaxed mb-7">Toma decisiones financieras en escenarios reales. Compite contra bots IA con distintas personalidades financieras o reta a tus amigos.</p>
        <ul class="flex flex-col gap-3.5">
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">4 modos: Solo, Multijugador, Mixto y Observar</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Bots IA con personalidades financieras distintas</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Gana XP y victorias que mejoran tu ranking</span>
          </li>
        </ul>
      </div>

    </div>
  </section>

  <!-- ═══ FEATURE: FINANZAS ════════════════════════════════════════════ -->
  <section class="bg-slate-900 py-24 px-6 border-t border-slate-800">
    <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

      <div class="reveal-l" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-5"><span class="icon-gold">💳</span> Finanzas Personales</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
          Controla tu dinero<br>en tiempo real
        </h2>
        <p class="text-slate-400 leading-relaxed mb-7">Registra gastos, ingresos y transferencias. Crea presupuestos por categoría, define metas financieras y exporta todo a PDF con un clic.</p>
        <ul class="flex flex-col gap-3.5">
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Múltiples cuentas: efectivo, billetera digital, banco</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Presupuestos inteligentes con alertas automáticas</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Metas de ahorro con progreso visual en tiempo real</span>
          </li>
          <li class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span class="text-slate-300 text-sm">Exporta reportes en PDF con un solo clic</span>
          </li>
        </ul>
      </div>

      <!-- Finanzas mockup -->
      <div class="reveal-r" #revealEl>
        <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-2xl shadow-black/40">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-white font-bold text-sm">Mis Finanzas</div>
              <div class="text-slate-400 text-xs">Control completo de tu dinero</div>
            </div>
            <div class="px-3 py-1.5 rounded-xl bg-slate-700 text-center">
              <div class="text-white font-bold text-sm">$54.00</div>
              <div class="text-slate-400 text-[10px]">Balance</div>
            </div>
          </div>
          <!-- Summary cards -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700 text-center">
              <div class="text-emerald-400 font-bold text-sm">$2.00</div>
              <div class="text-slate-500 text-[10px]">Ingresos</div>
            </div>
            <div class="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700 text-center">
              <div class="text-red-400 font-bold text-sm">$0.00</div>
              <div class="text-slate-500 text-[10px]">Gastos</div>
            </div>
            <div class="bg-slate-900/60 rounded-lg p-2.5 border border-emerald-500/30 text-center">
              <div class="text-emerald-400 font-bold text-sm">HEALTHY</div>
              <div class="text-slate-500 text-[10px]">Salud</div>
            </div>
          </div>
          <!-- Transactions -->
          <div class="text-xs text-slate-400 font-semibold mb-2.5">Últimas transacciones</div>
          <div class="flex flex-col gap-2 mb-4">
            <div class="flex items-center gap-3 py-2 border-b border-slate-700">
              <div class="w-7 h-7 rounded-full gold-bg border gold-border flex items-center justify-center text-sm flex-shrink-0 gold-text font-bold">+</div>
              <div class="flex-1">
                <div class="text-white text-xs font-medium">Balance inicial de JEP</div>
                <div class="text-slate-500 text-[10px]">Sin categoría · 23 Jun</div>
              </div>
              <span class="text-emerald-400 text-xs font-semibold">+$2.00</span>
            </div>
            <div class="flex items-center gap-3 py-2">
              <div class="w-7 h-7 rounded-full gold-bg border gold-border flex items-center justify-center text-sm flex-shrink-0 gold-text font-bold">B</div>
              <div class="flex-1">
                <div class="text-white text-xs font-medium">Balance inicial de billetera</div>
                <div class="text-slate-500 text-[10px]">Balance inicial · 23 Jun</div>
              </div>
              <span class="text-purple-400 text-xs font-semibold">$52.00</span>
            </div>
          </div>
          <!-- Meta -->
          <div class="px-3 py-2.5 rounded-xl bg-[#2563EB]/8 border border-[#2563EB]/20 flex items-center justify-between">
            <div>
              <div class="text-white text-xs font-medium">Meta: Fondo de emergencia</div>
              <div class="text-slate-400 text-[10px]">Ahorrado: $0.00 / $1,000.00</div>
            </div>
            <button class="px-2.5 py-1 gold-btn text-[10px] font-bold rounded-lg">Ahorrar</button>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═══ RANKING ══════════════════════════════════════════════════════ -->
  <section class="bg-slate-800 py-24 px-6 border-t border-slate-700">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12 reveal" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-4"><span class="icon-gold">🏅</span> Ranking Global</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white">Compite con toda la comunidad</h2>
        <p class="mt-3 text-slate-400 max-w-sm mx-auto text-sm">Clasificación basada en actividad y progreso. ¿Hasta dónde puedes llegar?</p>
      </div>

      <div class="reveal" #revealEl>
        <div class="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-black/40">
          <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <span class="text-white font-semibold text-sm">Ranking Global</span>
            <span class="text-slate-400 text-xs">Clasificación basada en actividad y progreso</span>
          </div>
          <div class="flex flex-col divide-y divide-slate-800">
            <div class="flex items-center gap-4 px-5 py-3.5 bg-amber-500/5 border-l-2 border-amber-400">
              <span class="w-7 text-center font-bold text-amber-400 text-sm">1</span>
              <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-white text-xs font-bold">P</div>
              <div class="flex-1">
                <div class="text-white text-sm font-semibold">prueba6</div>
                <div class="text-slate-400 text-xs">Nivel 4 · APPRENTICE</div>
              </div>
              <span class="text-amber-400 font-bold text-sm">7.1 pts</span>
            </div>
            <div class="flex items-center gap-4 px-5 py-3.5 bg-slate-500/5 border-l-2 border-slate-500">
              <span class="w-7 text-center font-bold text-slate-400 text-sm">2</span>
              <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">F</div>
              <div class="flex-1">
                <div class="text-white text-sm font-semibold">fasf</div>
                <div class="text-slate-400 text-xs">Nivel 4 · APPRENTICE</div>
              </div>
              <span class="text-slate-300 font-bold text-sm">5.9 pts</span>
            </div>
            <div class="flex items-center gap-4 px-5 py-3.5">
              <span class="w-7 text-center font-semibold text-slate-500 text-sm">3</span>
              <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">P</div>
              <div class="flex-1">
                <div class="text-slate-300 text-sm">prueba</div>
                <div class="text-slate-500 text-xs">Nivel 2 · ROOKIE</div>
              </div>
              <span class="text-slate-400 font-semibold text-sm">4.2 pts</span>
            </div>
            <div class="flex items-center gap-4 px-5 py-3.5 bg-[#2563EB]/5 border-l-2 border-[#2563EB]">
              <span class="w-7 text-center font-semibold text-[#2563EB] text-sm">?</span>
              <div class="w-8 h-8 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#2563EB] text-xs font-bold">Tú</div>
              <div class="flex-1">
                <div class="text-white text-sm font-semibold">Tu posición</div>
                <div class="text-slate-400 text-xs">Empieza hoy para entrar al ranking</div>
              </div>
              <span class="px-2.5 py-1 rounded-full gold-btn text-[10px] font-bold">Únete →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ NIVELES ══════════════════════════════════════════════════════ -->
  <section class="bg-slate-900 py-24 px-6 border-t border-slate-800">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12 reveal" #revealEl>
        <span class="inline-block px-3 py-1 rounded-full gold-bg border gold-border text-[#E5C158] text-xs font-medium mb-4">⭐ Tu Progresión</span>
        <h2 class="text-3xl font-bold text-white">Tu camino hacia la libertad financiera</h2>
        <p class="mt-3 text-slate-400 max-w-sm mx-auto text-sm">Cada nivel desbloquea contenido y simuladores más avanzados.</p>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 reveal" #revealEl>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border relative" style="background:rgba(229,193,88,0.06)">
          <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-slate-900 text-[9px] font-bold whitespace-nowrap gold-btn">TÚ AQUÍ</div>
          <span class="text-4xl mt-2 gold-glow">🌱</span>
          <div class="gold-text text-xs font-semibold text-center">Novato</div>
          <div class="text-[9px] text-slate-400 text-center">ROOKIE · 0 – 100 XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border">
          <span class="text-4xl mt-2 icon-gold">📘</span>
          <div class="gold-text text-xs font-semibold text-center">Principiante</div>
          <div class="text-[9px] text-slate-400 text-center">100 – 300 XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border">
          <span class="text-4xl mt-2 icon-gold">⭐</span>
          <div class="gold-text text-xs font-semibold text-center">Aprendiz</div>
          <div class="text-[9px] text-slate-400 text-center">APPRENTICE · 300+ XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border">
          <span class="text-4xl mt-2 icon-gold">🚀</span>
          <div class="gold-text text-xs font-semibold text-center">Avanzado</div>
          <div class="text-[9px] text-slate-400 text-center">700+ XP</div>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 border gold-border" style="background:rgba(229,193,88,0.08)">
          <span class="text-4xl mt-2 gold-glow">🏆</span>
          <div class="gold-text text-xs font-bold text-center">Experto</div>
          <div class="text-[9px] text-slate-400 text-center">1500+ XP</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CTA FINAL ════════════════════════════════════════════════════ -->
  <section class="bg-slate-800 py-28 px-6 border-t border-slate-700 relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-blue-600/8 rounded-full blur-[90px]"></div>
    </div>
    <div class="max-w-2xl mx-auto text-center relative reveal" #revealEl>
      <div class="text-5xl mb-6 gold-glow">🚀</div>
      <h2 class="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
        ¿Listo para subir<br>
        <span class="gold-text">de nivel?</span>
      </h2>
      <p class="mt-5 text-slate-400 text-lg max-w-md mx-auto">
        Crea tu cuenta, empieza tu primer módulo y gana tus primeros XP en menos de 5 minutos.
      </p>
      <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <a routerLink="/auth/register"
           class="px-8 py-4 rounded-xl gold-btn font-bold text-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
          Crear cuenta gratis →
        </a>
        <a routerLink="/auth/login"
           class="px-8 py-4 rounded-xl border border-slate-600 text-slate-300 font-medium text-lg hover:bg-slate-700 hover:text-white transition-all duration-200">
          Ya tengo una cuenta
        </a>
      </div>
      <p class="mt-6 text-slate-500 text-sm">✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Sin costo &nbsp;·&nbsp; ✓ Acceso inmediato</p>
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
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          this.observer!.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    this.revealEls.forEach(el => this.observer!.observe(el.nativeElement));
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
