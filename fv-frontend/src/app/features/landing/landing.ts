import { Component, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim-1 { animation: fadeUp 0.55s ease both; }
    .anim-2 { animation: fadeUp 0.55s 0.10s ease both; }
    .anim-3 { animation: fadeUp 0.55s 0.22s ease both; }
    .anim-4 { animation: fadeUp 0.55s 0.34s ease both; }
    .anim-5 { animation: fadeUp 0.55s 0.48s ease both; }
    .reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .reveal.show { opacity: 1; transform: translateY(0); }
    .grid-bg {
      background-image:
        linear-gradient(rgba(37,99,235,0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37,99,235,0.045) 1px, transparent 1px);
      background-size: 48px 48px;
    }
  `],
  template: `

    <!-- ── NAVBAR ──────────────────────────────────────────────── -->
    <nav class="fixed inset-x-0 top-0 z-50 bg-[#060913]/85 backdrop-blur-md border-b border-slate-800">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/logo-oficial.png" alt="FinanzaViva" class="w-8 h-8 object-contain">
          <span class="text-lg font-extrabold tracking-tight">
            <span class="text-[#E5C158]">Finanza</span><span class="text-white">Viva</span>
          </span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <a href="https://github.com/fsmolina-64/FinanzaViva" target="_blank" rel="noopener noreferrer"
             aria-label="GitHub"
             class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <a routerLink="/auth/login"
             class="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200">
            Iniciar sesión
          </a>
          <a routerLink="/auth/register"
             class="inline-flex px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
            Crear cuenta
          </a>
        </div>
      </div>
    </nav>

    <!-- ── HERO ────────────────────────────────────────────────── -->
    <section class="min-h-screen bg-[#060913] grid-bg flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#2563EB]/7 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-[#2563EB]/5 rounded-full blur-3xl"></div>
      </div>

      <!-- Badge -->
      <div class="anim-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25 text-[#2563EB] text-sm font-medium mb-8">
        <span>🎮</span>
        <span>Educación Financiera Gamificada</span>
        <span class="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse"></span>
      </div>

      <h1 class="anim-2 text-5xl sm:text-7xl font-extrabold text-white max-w-4xl leading-[1.08] tracking-tight">
        Aprende finanzas,<br>
        <span class="bg-gradient-to-r from-[#2563EB] to-blue-400 bg-clip-text text-transparent">gana logros,</span><br>
        sube de nivel
      </h1>

      <p class="anim-3 text-slate-400 text-xl max-w-lg mt-7 leading-relaxed">
        Domina tus finanzas personales a través de lecciones interactivas, quizzes y un simulador de inversiones. Aprende jugando.
      </p>

      <div class="anim-4 mt-10 flex flex-col sm:flex-row gap-4">
        <a routerLink="/auth/register"
           class="px-8 py-4 rounded-xl bg-[#2563EB] text-white font-semibold text-base hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-500/35 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.97]">
          Empieza gratis — sin costo →
        </a>
        <a routerLink="/auth/login"
           class="px-8 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium text-base hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200">
          Iniciar sesión
        </a>
      </div>

      <div class="anim-4 mt-6 flex flex-wrap justify-center gap-5 text-xs text-slate-500">
        <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Sin tarjeta de crédito</span>
        <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Acceso inmediato</span>
        <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> 100% gratuito</span>
      </div>

      <!-- Dual mockup: quiz + achievements -->
      <div class="anim-5 mt-16 w-full max-w-5xl grid sm:grid-cols-2 gap-4">

        <!-- Quiz card -->
        <div class="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 text-left shadow-2xl shadow-black/50">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs text-slate-400">Módulo 2 · Pregunta 3/10</span>
            <span class="px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] text-xs font-semibold">+50 XP</span>
          </div>
          <div class="h-1.5 bg-slate-800 rounded-full mb-4">
            <div class="h-1.5 bg-gradient-to-r from-[#2563EB] to-blue-400 rounded-full" style="width:30%"></div>
          </div>
          <p class="text-white font-semibold text-sm mb-4">¿Qué es el interés compuesto?</p>
          <div class="flex flex-col gap-2 mb-4">
            <div class="px-3 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400">A) Interés solo sobre el capital inicial</div>
            <div class="px-3 py-2.5 rounded-xl border border-[#2563EB] bg-[#2563EB]/10 text-xs text-white font-medium flex items-center justify-between">
              <span>B) Interés sobre capital e intereses acumulados</span>
              <span class="text-emerald-400 ml-2">✓</span>
            </div>
            <div class="px-3 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400">C) Un tipo de préstamo bancario</div>
            <div class="px-3 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400">D) Una estrategia de trading avanzada</div>
          </div>
          <div class="px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-400 mb-4">
            ✅ ¡Correcto! El interés compuesto es el "octavo milagro del mundo".
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#E5C158]">🔥 Racha: 5 días</span>
            <button class="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors">Siguiente →</button>
          </div>
        </div>

        <!-- XP / Achievements card -->
        <div class="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 text-left shadow-2xl shadow-black/50">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-11 h-11 rounded-xl bg-[#2563EB]/20 border-2 border-[#2563EB]/40 flex items-center justify-center text-2xl">👤</div>
            <div class="flex-1">
              <div class="text-white text-sm font-semibold">Juan Pérez</div>
              <div class="text-[#E5C158] text-xs font-medium">⭐ Nivel 3 · Intermedio</div>
            </div>
            <div class="text-right">
              <div class="text-white font-bold">1,250</div>
              <div class="text-xs text-slate-500">XP total</div>
            </div>
          </div>
          <div class="mb-5">
            <div class="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progreso al Nivel 4</span>
              <span class="text-[#2563EB] font-medium">750 / 1000 XP</span>
            </div>
            <div class="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-[#2563EB] to-blue-400 rounded-full" style="width:75%"></div>
            </div>
          </div>
          <div class="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-3">Logros desbloqueados</div>
          <div class="grid grid-cols-5 gap-2 mb-4">
            <div class="flex flex-col items-center gap-1">
              <div class="w-10 h-10 rounded-xl bg-[#E5C158]/15 border border-[#E5C158]/30 flex items-center justify-center text-lg">🏆</div>
              <span class="text-[9px] text-slate-500 text-center">1er quiz</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-10 h-10 rounded-xl bg-[#E5C158]/15 border border-[#E5C158]/30 flex items-center justify-center text-lg">🎯</div>
              <span class="text-[9px] text-slate-500 text-center">100% módulo</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">💰</div>
              <span class="text-[9px] text-slate-500 text-center">Ahorrador</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-lg">🔥</div>
              <span class="text-[9px] text-slate-500 text-center">Racha 7d</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg opacity-30">🔒</div>
              <span class="text-[9px] text-slate-500 text-center opacity-50">Próximo</span>
            </div>
          </div>
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#E5C158]/8 border border-[#E5C158]/20">
            <span class="text-lg">🎉</span>
            <div>
              <div class="text-[#E5C158] text-xs font-semibold">¡Módulo 2 completado!</div>
              <div class="text-slate-400 text-xs">+200 XP · Logro "Estudiante" desbloqueado</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── STATS ───────────────────────────────────────────────── -->
    <section class="bg-[#0f172a] border-y border-slate-800 py-10 px-6">
      <div class="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        <div class="reveal" #revealEl>
          <div class="text-3xl font-extrabold text-white">500<span class="text-[#2563EB]">+</span></div>
          <div class="text-sm text-slate-400 mt-1">Usuarios activos</div>
        </div>
        <div class="reveal" #revealEl>
          <div class="text-3xl font-extrabold text-white">30<span class="text-[#2563EB]">+</span></div>
          <div class="text-sm text-slate-400 mt-1">Lecciones disponibles</div>
        </div>
        <div class="reveal" #revealEl>
          <div class="text-3xl font-extrabold text-white">15<span class="text-[#2563EB]">+</span></div>
          <div class="text-sm text-slate-400 mt-1">Logros desbloqueables</div>
        </div>
        <div class="reveal" #revealEl>
          <div class="text-3xl font-extrabold text-white">3</div>
          <div class="text-sm text-slate-400 mt-1">Simuladores de inversión</div>
        </div>
      </div>
    </section>

    <!-- ── CÓMO FUNCIONA ───────────────────────────────────────── -->
    <section class="bg-[#060913] py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-14 reveal" #revealEl>
          <span class="inline-block px-3 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25 text-[#2563EB] text-xs font-medium mb-4">¿Cómo funciona?</span>
          <h2 class="text-3xl sm:text-4xl font-bold text-white">Aprende en 4 pasos simples</h2>
          <p class="mt-4 text-slate-400 max-w-sm mx-auto">Sin complicaciones. Empieza en minutos y progresa a tu propio ritmo.</p>
        </div>

        <div class="grid sm:grid-cols-4 gap-6 relative">
          <!-- Línea conectora desktop -->
          <div class="hidden sm:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

          <div class="reveal flex flex-col items-center text-center group" #revealEl>
            <div class="w-14 h-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-2xl mb-4 group-hover:bg-[#2563EB]/20 transition-colors relative z-10 bg-[#060913]">📝</div>
            <div class="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center mb-3">1</div>
            <h3 class="text-white font-semibold text-sm mb-2">Crea tu cuenta</h3>
            <p class="text-slate-400 text-xs leading-relaxed">Regístrate gratis en menos de un minuto. Sin tarjeta de crédito.</p>
          </div>

          <div class="reveal flex flex-col items-center text-center group" #revealEl>
            <div class="w-14 h-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-2xl mb-4 group-hover:bg-[#2563EB]/20 transition-colors relative z-10 bg-[#060913]">📚</div>
            <div class="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center mb-3">2</div>
            <h3 class="text-white font-semibold text-sm mb-2">Aprende con módulos</h3>
            <p class="text-slate-400 text-xs leading-relaxed">Completa lecciones cortas y quizzes diseñados para retener el conocimiento.</p>
          </div>

          <div class="reveal flex flex-col items-center text-center group" #revealEl>
            <div class="w-14 h-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-2xl mb-4 group-hover:bg-[#2563EB]/20 transition-colors relative z-10 bg-[#060913]">📈</div>
            <div class="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center mb-3">3</div>
            <h3 class="text-white font-semibold text-sm mb-2">Practica y simula</h3>
            <p class="text-slate-400 text-xs leading-relaxed">Usa el simulador de inversiones sin arriesgar dinero real.</p>
          </div>

          <div class="reveal flex flex-col items-center text-center group" #revealEl>
            <div class="w-14 h-14 rounded-2xl bg-[#E5C158]/10 border border-[#E5C158]/20 flex items-center justify-center text-2xl mb-4 group-hover:bg-[#E5C158]/20 transition-colors relative z-10 bg-[#060913]">🏆</div>
            <div class="w-6 h-6 rounded-full bg-[#E5C158] text-[#060913] text-xs font-bold flex items-center justify-center mb-3">4</div>
            <h3 class="text-white font-semibold text-sm mb-2">Gana logros</h3>
            <p class="text-slate-400 text-xs leading-relaxed">Desbloquea insignias y sube de nivel mientras dominas tus finanzas.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FEATURE: QUIZZES ────────────────────────────────────── -->
    <section class="bg-[#060913] py-24 px-6 border-t border-slate-800/50">
      <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

        <div class="reveal" #revealEl>
          <span class="inline-block px-3 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25 text-[#2563EB] text-xs font-medium mb-5">🧠 Quizzes & Lecciones</span>
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">Aprende haciendo,<br>no memorizando</h2>
          <p class="text-slate-400 leading-relaxed mb-7">Quizzes cortos con retroalimentación inmediata diseñados con microaprendizaje para que el conocimiento se quede contigo.</p>
          <ul class="flex flex-col gap-3.5">
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Quizzes interactivos por módulo con retroalimentación inmediata</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Progreso guardado automáticamente, aprende a tu ritmo</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Temáticas: ahorro, inversión, presupuesto y más</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Gana XP en cada quiz completado correctamente</span>
            </li>
          </ul>
        </div>

        <!-- Quiz mockup detallado -->
        <div class="reveal" #revealEl>
          <div class="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-2xl shadow-black/50">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-slate-400">Módulo 2 · Ahorro</span>
                <span class="text-[#E5C158] text-sm">🔥 ×5</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] text-xs font-semibold">+50 XP</span>
            </div>
            <div class="h-1.5 bg-slate-800 rounded-full mb-5">
              <div class="h-1.5 bg-gradient-to-r from-[#2563EB] to-blue-400 rounded-full" style="width:30%"></div>
            </div>
            <p class="text-white font-semibold mb-4">¿Qué es el interés compuesto?</p>
            <div class="flex flex-col gap-2 mb-4">
              <div class="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 cursor-pointer hover:border-slate-600 transition-colors">A) Interés solo sobre el capital inicial</div>
              <div class="px-4 py-2.5 rounded-xl border border-[#2563EB] bg-[#2563EB]/10 text-sm text-white font-medium flex items-center justify-between">
                <span>B) Interés sobre capital e intereses acumulados</span>
                <span class="text-emerald-400 ml-2 text-base">✓</span>
              </div>
              <div class="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 cursor-pointer">C) Un tipo de préstamo bancario</div>
              <div class="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 cursor-pointer">D) Una estrategia de trading avanzada</div>
            </div>
            <div class="px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-400 mb-4">
              ✅ ¡Correcto! El interés compuesto es el "octavo milagro del mundo" según Einstein.
            </div>
            <button class="w-full py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-all duration-200">
              Siguiente pregunta →
            </button>
          </div>
        </div>

      </div>
    </section>

    <!-- ── FEATURE: GAMIFICACIÓN ───────────────────────────────── -->
    <section class="bg-[#060913] py-24 px-6 border-t border-slate-800/50">
      <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

        <!-- Mockup -->
        <div class="reveal order-last md:order-first" #revealEl>
          <div class="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-2xl shadow-black/50">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-12 h-12 rounded-xl bg-[#2563EB]/20 border-2 border-[#2563EB]/40 flex items-center justify-center text-2xl">👤</div>
              <div class="flex-1">
                <div class="text-white font-semibold">Juan Pérez</div>
                <div class="text-[#E5C158] text-xs font-medium flex items-center gap-1">⭐ Nivel 3 · Intermedio</div>
              </div>
              <div class="text-right">
                <div class="text-white font-bold">1,250</div>
                <div class="text-xs text-slate-500">XP total</div>
              </div>
            </div>

            <div class="mb-5">
              <div class="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progreso al Nivel 4</span>
                <span class="text-[#2563EB] font-medium">750 / 1000 XP</span>
              </div>
              <div class="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#2563EB] to-blue-400 rounded-full" style="width:75%"></div>
              </div>
            </div>

            <div class="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-3">Logros desbloqueados (6/15)</div>
            <div class="grid grid-cols-5 gap-2 mb-5">
              <div class="flex flex-col items-center gap-1">
                <div class="w-11 h-11 rounded-xl bg-[#E5C158]/15 border border-[#E5C158]/30 flex items-center justify-center text-xl">🏆</div>
                <span class="text-[9px] text-slate-500 text-center">1er quiz</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="w-11 h-11 rounded-xl bg-[#E5C158]/15 border border-[#E5C158]/30 flex items-center justify-center text-xl">🎯</div>
                <span class="text-[9px] text-slate-500 text-center">100% módulo</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">💰</div>
                <span class="text-[9px] text-slate-500 text-center">Ahorrador</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xl">🔥</div>
                <span class="text-[9px] text-slate-500 text-center">Racha 7d</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl opacity-30">🔒</div>
                <span class="text-[9px] text-slate-500 opacity-40 text-center">Próximo</span>
              </div>
            </div>

            <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#E5C158]/8 border border-[#E5C158]/20">
              <span class="text-xl flex-shrink-0">🎉</span>
              <div>
                <div class="text-[#E5C158] text-xs font-semibold">¡Módulo 2 completado!</div>
                <div class="text-slate-400 text-xs">+200 XP · Logro "Estudiante" desbloqueado</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Text -->
        <div class="reveal" #revealEl>
          <span class="inline-block px-3 py-1 rounded-full bg-[#E5C158]/10 border border-[#E5C158]/25 text-[#E5C158] text-xs font-medium mb-5">🏆 Gamificación</span>
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
            Finanzas que te<br>
            <span class="bg-gradient-to-r from-[#E5C158] to-yellow-400 bg-clip-text text-transparent">mantienen motivado</span>
          </h2>
          <p class="text-slate-400 leading-relaxed mb-7">Aprender es más efectivo cuando hay recompensas. Nuestro sistema de gamificación te mantiene enganchado mientras dominas conceptos financieros reales.</p>
          <ul class="flex flex-col gap-3.5">
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#E5C158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Sistema de XP: gana puntos por cada lección y quiz completado</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#E5C158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Niveles progresivos: de Principiante a Experto Financiero</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#E5C158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">15+ logros desbloqueables por alcanzar metas financieras</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-[#E5C158]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-[#E5C158]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Rachas diarias y recompensas por constancia</span>
            </li>
          </ul>
        </div>

      </div>
    </section>

    <!-- ── FEATURE: SIMULADOR ──────────────────────────────────── -->
    <section class="bg-[#060913] py-24 px-6 border-t border-slate-800/50">
      <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

        <div class="reveal" #revealEl>
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium mb-5">📈 Simulador de Inversiones</span>
          <h2 class="text-3xl sm:text-4xl font-bold text-white mb-5">
            Practica sin<br>
            <span class="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">arriesgar dinero real</span>
          </h2>
          <p class="text-slate-400 leading-relaxed mb-7">Toma decisiones de inversión en escenarios reales sin consecuencias económicas. Aprende de tus errores en un entorno 100% seguro.</p>
          <ul class="flex flex-col gap-3.5">
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Simulación de cartera de inversiones con datos reales</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Escenarios de riesgo y rentabilidad ajustables</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-slate-300 text-sm">Gana XP extra por resultados positivos en el simulador</span>
            </li>
          </ul>
        </div>

        <!-- Simulator mockup -->
        <div class="reveal" #revealEl>
          <div class="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-2xl shadow-black/50">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="text-white font-semibold text-sm">Mi Cartera Simulada</div>
                <div class="text-emerald-400 text-xs">+12.4% este mes</div>
              </div>
              <div class="text-right">
                <div class="text-white font-bold text-xl">$5,240</div>
                <div class="text-xs text-slate-500">Balance simulado</div>
              </div>
            </div>
            <div class="relative h-24 mb-4 rounded-xl overflow-hidden bg-slate-900/50">
              <svg viewBox="0 0 300 80" class="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2563EB" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,65 L30,60 L60,55 L90,50 L120,45 L150,38 L180,35 L210,28 L240,20 L270,16 L300,10"
                      stroke="#2563EB" stroke-width="2" fill="none"/>
                <path d="M0,65 L30,60 L60,55 L90,50 L120,45 L150,38 L180,35 L210,28 L240,20 L270,16 L300,10 L300,80 L0,80Z"
                      fill="url(#chartG)"/>
              </svg>
            </div>
            <div class="flex flex-col gap-2 mb-4">
              <div class="flex items-center justify-between py-2 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">📊</div>
                  <span class="text-slate-300 text-xs">S&P 500 ETF</span>
                </div>
                <div class="text-right">
                  <div class="text-white text-xs font-medium">$2,100</div>
                  <div class="text-emerald-400 text-[10px]">+18.2%</div>
                </div>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs">🟡</div>
                  <span class="text-slate-300 text-xs">Oro (XAU)</span>
                </div>
                <div class="text-right">
                  <div class="text-white text-xs font-medium">$1,640</div>
                  <div class="text-emerald-400 text-[10px]">+5.1%</div>
                </div>
              </div>
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">💵</div>
                  <span class="text-slate-300 text-xs">Efectivo</span>
                </div>
                <div class="text-right">
                  <div class="text-white text-xs font-medium">$1,500</div>
                  <div class="text-slate-500 text-[10px]">Reserva</div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="py-2 text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg">Comprar</div>
              <div class="py-2 text-center bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg">Vender</div>
              <div class="py-2 text-center bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-medium rounded-lg">Análisis</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── NIVELES ─────────────────────────────────────────────── -->
    <section class="bg-[#0f172a] py-24 px-6 border-t border-slate-800">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12 reveal" #revealEl>
          <span class="inline-block px-3 py-1 rounded-full bg-[#E5C158]/10 border border-[#E5C158]/25 text-[#E5C158] text-xs font-medium mb-4">⭐ Tu Progresión</span>
          <h2 class="text-3xl font-bold text-white">Tu camino hacia la libertad financiera</h2>
          <p class="mt-3 text-slate-400 max-w-sm mx-auto text-sm">Cada nivel desbloquea contenidos y simuladores más avanzados.</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 reveal" #revealEl>
          <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#060913] border border-emerald-500/30 relative">
            <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500 text-[#060913] text-[9px] font-bold whitespace-nowrap">TÚ AQUÍ</div>
            <div class="text-3xl mt-2">🌱</div>
            <div class="text-white text-xs font-semibold text-center">Principiante</div>
            <div class="text-[9px] text-slate-500 text-center">0 – 200 XP</div>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#060913] border border-slate-700">
            <div class="text-3xl mt-2">📘</div>
            <div class="text-slate-300 text-xs font-semibold text-center">Básico</div>
            <div class="text-[9px] text-slate-500 text-center">200 – 500 XP</div>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#060913] border border-slate-700">
            <div class="text-3xl mt-2">⭐</div>
            <div class="text-slate-300 text-xs font-semibold text-center">Intermedio</div>
            <div class="text-[9px] text-slate-500 text-center">500 – 1000 XP</div>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#060913] border border-slate-700">
            <div class="text-3xl mt-2">🚀</div>
            <div class="text-slate-300 text-xs font-semibold text-center">Avanzado</div>
            <div class="text-[9px] text-slate-500 text-center">1000 – 2000 XP</div>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#060913] border border-[#E5C158]/30">
            <div class="text-3xl mt-2">🏆</div>
            <div class="text-[#E5C158] text-xs font-semibold text-center">Experto</div>
            <div class="text-[9px] text-slate-500 text-center">2000+ XP</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA FINAL ───────────────────────────────────────────── -->
    <section class="bg-[#060913] py-28 px-6 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#2563EB]/10 rounded-full blur-[100px]"></div>
      </div>
      <div class="max-w-2xl mx-auto text-center relative reveal" #revealEl>
        <div class="text-5xl mb-6">🎮</div>
        <h2 class="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
          ¿Listo para subir<br>
          <span class="bg-gradient-to-r from-[#2563EB] to-blue-400 bg-clip-text text-transparent">de nivel?</span>
        </h2>
        <p class="mt-5 text-slate-400 text-lg max-w-md mx-auto">
          Únete hoy, empieza tu primer quiz y gana tus primeros 100 XP en menos de 5 minutos.
        </p>
        <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/auth/register"
             class="px-8 py-4 rounded-xl bg-[#2563EB] text-white font-bold text-lg hover:bg-blue-500 transition-all duration-200 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-[1.03] active:scale-[0.97]">
            Crear cuenta gratis 🚀
          </a>
          <a routerLink="/auth/login"
             class="px-8 py-4 rounded-xl border border-slate-700 text-slate-300 font-medium text-lg hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200">
            Ya tengo una cuenta
          </a>
        </div>
        <p class="mt-6 text-slate-500 text-sm">✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Sin costo &nbsp;·&nbsp; ✓ Acceso inmediato</p>
      </div>
    </section>

    <!-- ── FOOTER ──────────────────────────────────────────────── -->
    <footer class="bg-[#060913] border-t border-slate-800 py-8 px-6">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div class="flex items-center gap-2">
          <img src="/logo-oficial.png" alt="FinanzaViva" class="w-6 h-6 object-contain opacity-75">
          <span class="font-extrabold tracking-tight">
            <span class="text-[#E5C158]">Finanza</span><span class="text-slate-400">Viva</span>
          </span>
        </div>
        <span class="text-center">© 2026 FinanzaViva · whisper.money · Hecho para jóvenes ecuatorianos</span>
        <div class="flex gap-5">
          <a href="https://github.com/fsmolina-64/FinanzaViva" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition-colors duration-200">GitHub</a>
          <a routerLink="/auth/login" class="hover:text-slate-300 transition-colors duration-200">Iniciar sesión</a>
          <a routerLink="/auth/register" class="hover:text-slate-300 transition-colors duration-200">Registrarse</a>
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
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); }),
      { threshold: 0.1 }
    );
    this.revealEls.forEach(el => this.observer!.observe(el.nativeElement));
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
