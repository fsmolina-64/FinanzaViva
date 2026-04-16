import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService, FinancialProfile } from '../services/game.service';
import { Nav } from '../shared/nav/nav';

interface QuizQuestion {
  question: string;
  options: { label: string; value: string }[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  game = inject(GameService);

  showQuiz = signal(false);
  quizStep = signal(0);
  answers = signal<string[]>([]);
  profileResult = signal<FinancialProfile | null>(null);
  toastMessage = signal<string | null>(null);

  readonly features = [
    { icon: '🎲', title: 'Tablero Interactivo', text: 'Juega al Monopoly financiero, tira dados y toma decisiones reales.', route: '/tablero' },
    { icon: '📈', title: 'Mercado de Acciones', text: 'Compra y vende acciones que suben y bajan en tiempo real.', route: '/simulador' },
    { icon: '🎓', title: 'Academia Express', text: 'Aprende conceptos financieros y gana monedas mientras estudias.', route: '/academia' },
    { icon: '🏆', title: 'Ranking Global', text: 'Compite con otros jugadores y sube en la tabla de posiciones.', route: '/ranking' },
    { icon: '💎', title: 'Tu Bóveda', text: 'Visualiza tu patrimonio, logros y progreso en tiempo real.', route: '/dashboard' },
    { icon: '🌍', title: 'Simulador de Vida', text: 'Elige tu empleo, gestiona emergencias y construye tu futuro.', route: '/simulador' },
  ];

  readonly quizQuestions: QuizQuestion[] = [
    {
      question: '¿Recibes dinero y tu primera reacción es...?',
      options: [
        { label: '🐷 Guardarlo inmediatamente', value: 'ahorrista' },
        { label: '📈 Buscar dónde invertirlo', value: 'inversor' },
        { label: '🛍️ Comprar algo que quería', value: 'gastador' },
        { label: '⚖️ Una parte ahorro, otra gasto', value: 'equilibrado' },
      ],
    },
    {
      question: '¿Cómo defines tu relación con el riesgo financiero?',
      options: [
        { label: '🛡️ Prefiero lo seguro, aunque gane menos', value: 'ahorrista' },
        { label: '🚀 Me gusta arriesgar por grandes ganancias', value: 'inversor' },
        { label: '🎉 Vivo el momento, el futuro se verá', value: 'gastador' },
        { label: '🎯 Busco el balance entre seguridad y ganancia', value: 'equilibrado' },
      ],
    },
    {
      question: '¿Con qué frase te identificas más?',
      options: [
        { label: '"Un centavo ahorrado es un centavo ganado"', value: 'ahorrista' },
        { label: '"El dinero trabaja para mí, no yo para el dinero"', value: 'inversor' },
        { label: '"Solo se vive una vez, disfrútalo"', value: 'gastador' },
        { label: '"Disfruto hoy planificando el mañana"', value: 'equilibrado' },
      ],
    },
  ];

  readonly profileDescriptions: Record<FinancialProfile, { emoji: string; title: string; text: string; bonus: number }> = {
    ahorrista: { emoji: '🐷', title: 'El Ahorrador Maestro', text: 'Eres disciplinado y constante. Tu superpoder es la seguridad financiera.', bonus: 1000 },
    inversor: { emoji: '📈', title: 'El Inversor Audaz', text: 'Ves oportunidades donde otros ven riesgo. Tu capital trabaja por ti.', bonus: 750 },
    gastador: { emoji: '🛍️', title: 'El Vividor Consciente', text: 'Amas la vida. Aquí aprenderás a disfrutarla sin comprometer tu futuro.', bonus: 300 },
    equilibrado: { emoji: '⚖️', title: 'El Equilibrista Financiero', text: 'Tienes la mentalidad correcta. El balance es la clave del éxito.', bonus: 800 },
  };

  openQuiz() {
    if (this.game.financialProfile()) {
      this.showToast('Ya completaste tu perfil financiero 🎯');
      return;
    }
    this.showQuiz.set(true);
    this.quizStep.set(0);
    this.answers.set([]);
    this.profileResult.set(null);
  }

  closeQuiz() {
    this.showQuiz.set(false);
  }

  selectAnswer(value: string) {
    this.answers.update(a => [...a, value]);
    if (this.quizStep() < this.quizQuestions.length - 1) {
      this.quizStep.update(s => s + 1);
    } else {
      this.calculateProfile();
    }
  }

  calculateProfile() {
    const answers = this.answers();
    const counts: Record<string, number> = { ahorrista: 0, inversor: 0, gastador: 0, equilibrado: 0 };
    answers.forEach(a => counts[a]++);
    const profile = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as FinancialProfile;
    this.profileResult.set(profile);
  }

  confirmProfile() {
    const profile = this.profileResult();
    if (!profile) return;
    this.game.setProfile(profile);
    const desc = this.profileDescriptions[profile];
    this.showQuiz.set(false);
    this.showToast(`¡Perfil asignado! +$${desc.bonus} de bono inicial 🎉`);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  get currentQuestion() {
    return this.quizQuestions[this.quizStep()];
  }

  get profileInfo() {
    const p = this.profileResult();
    return p ? this.profileDescriptions[p] : null;
  }
}
