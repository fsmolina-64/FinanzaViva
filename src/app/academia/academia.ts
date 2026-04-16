import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';
import { Nav } from '../shared/nav/nav';

interface Lesson {
  id: string;
  title: string;
  emoji: string;
  category: string;
  content: string;
  tip: string;
  completed: boolean;
}

interface QuizQuestion {
  id: string;
  lessonId: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

@Component({
  selector: 'app-academia',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './academia.html',
  styleUrl: './academia.css',
})
export class Academia {
  game = inject(GameService);

  activeLesson = signal<Lesson | null>(null);
  showQuiz = signal(false);
  currentQuestion = signal(0);
  selectedAnswer = signal<number | null>(null);
  answered = signal(false);
  quizScore = signal(0);
  quizFinished = signal(false);
  toastMsg = signal<string | null>(null);

  readonly lessons = signal<Lesson[]>([
    {
      id: 'presupuesto', title: 'El Arte del Presupuesto', emoji: '📋', category: 'Fundamentos',
      content: 'Un presupuesto no es una prisión: es un mapa. La regla 50/30/20 divide tus ingresos en Necesidades (50%), Deseos (30%) y Ahorro/Deuda (20%). Esta simple estructura te da claridad sin hacerte sentir restringido.',
      tip: 'Empieza por registrar gastos solo 7 días. El solo hecho de observarlos ya cambia tu comportamiento.',
      completed: false,
    },
    {
      id: 'ahorro', title: 'El Poder del Ahorro Automático', emoji: '🐷', category: 'Ahorro',
      content: 'La psicología del ahorro exitoso tiene un secreto: automatizarlo. Cuando el dinero llega a tu cuenta y una parte se va inmediatamente a ahorros, no tienes que tomar la decisión de ahorrar cada vez. Tu cerebro lo acepta como un gasto fijo.',
      tip: 'Abre una cuenta separada SOLO para ahorros. La fricción de accederla reduce el gasto impulsivo un 40%.',
      completed: false,
    },
    {
      id: 'inversion', title: 'Inversión para No Inversores', emoji: '📈', category: 'Inversión',
      content: 'No necesitas saber analizar balances para invertir. Los ETFs indexados como el S&P 500 te dan exposición a 500 empresas con una sola compra. Históricamente han rendido un 10% anual promedio. La clave: tiempo en el mercado, no timing del mercado.',
      tip: 'Invierte aunque sea $10 al mes. El hábito vale más que el monto. Luego escala cuando puedas.',
      completed: false,
    },
    {
      id: 'deuda', title: 'Cómo Domar la Deuda', emoji: '⛓️', category: 'Deuda',
      content: 'Hay deuda buena (hipoteca, educación con retorno) y deuda mala (tarjeta de crédito al 30% anual). La estrategia avalancha: paga mínimos en todas y el exceso en la de mayor interés. Ahorra miles en comparación con la estrategia bola de nieve.',
      tip: 'Pagar el mínimo de tu tarjeta de crédito hace que una deuda de $1,000 cueste $3,000 en 10 años.',
      completed: false,
    },
    {
      id: 'fondo', title: 'El Fondo de Emergencia', emoji: '🛡️', category: 'Protección',
      content: 'Tu fondo de emergencia es tu red de seguridad financiera. La meta: 3-6 meses de gastos fijos en una cuenta líquida y separada. Sin este fondo, cada emergencia se convierte en deuda. Con él, es solo un inconveniente.',
      tip: 'Empieza con la meta de $500. Es suficiente para cubrir la mayoría de emergencias menores.',
      completed: false,
    },
    {
      id: 'credito', title: 'Construye tu Historial de Crédito', emoji: '🏦', category: 'Crédito',
      content: 'Tu puntaje de crédito es como tu reputación financiera. Factores clave: historial de pagos (35%), utilización del crédito (30%), antigüedad (15%), tipos de crédito (10%) y consultas nuevas (10%). Pagar a tiempo es el factor más importante.',
      tip: 'Usa tu tarjeta de crédito para gastos que ya harías en efectivo, y paga el saldo completo cada mes.',
      completed: false,
    },
  ]);

  readonly allQuestions: QuizQuestion[] = [
    {
      id: 'q1', lessonId: 'presupuesto',
      question: 'En la regla 50/30/20, ¿qué porcentaje va destinado al ahorro?',
      options: ['50%', '30%', '20%', '10%'],
      correct: 2,
      explanation: 'La regla 50/30/20 destina el 20% para ahorro y pago de deudas, el 50% para necesidades y el 30% para deseos.',
    },
    {
      id: 'q2', lessonId: 'ahorro',
      question: '¿Por qué se recomienda automatizar el ahorro?',
      options: ['Para ganar más intereses', 'Para evitar tomar la decisión cada vez', 'Para tener mejor crédito', 'Para pagar menos impuestos'],
      correct: 1,
      explanation: 'Automatizar elimina la "fatiga de decisión". Si el dinero sale automáticamente, nunca tienes que elegir entre gastarlo o ahorrarlo.',
    },
    {
      id: 'q3', lessonId: 'inversion',
      question: '¿Qué es un ETF indexado?',
      options: ['Una cuenta de ahorros con alto interés', 'Un préstamo del banco', 'Un fondo que replica un índice de mercado', 'Un seguro de vida'],
      correct: 2,
      explanation: 'Un ETF indexado (como el S&P 500) invierte en todas las empresas de un índice, dando diversificación instantánea con bajos costos.',
    },
    {
      id: 'q4', lessonId: 'deuda',
      question: '¿Qué es la estrategia "avalancha" para pagar deudas?',
      options: ['Pagar la deuda más pequeña primero', 'Pagar solo los mínimos', 'Pagar primero la deuda con mayor tasa de interés', 'Ignorar las deudas hasta poder pagarlas'],
      correct: 2,
      explanation: 'La estrategia avalancha paga primero la deuda con mayor tasa, ahorrando más dinero en intereses totales.',
    },
    {
      id: 'q5', lessonId: 'fondo',
      question: '¿Cuántos meses de gastos debe tener tu fondo de emergencia?',
      options: ['1 mes', '2 meses', '3-6 meses', '12 meses'],
      correct: 2,
      explanation: 'Un fondo de 3-6 meses es el estándar recomendado. Cubre la mayoría de emergencias sin ser tan difícil de acumular.',
    },
    {
      id: 'q6', lessonId: 'credito',
      question: '¿Cuál es el factor más importante en tu puntaje de crédito?',
      options: ['Cuántas tarjetas tienes', 'Historial de pagos', 'Tu ingreso mensual', 'El banco donde tienes cuenta'],
      correct: 1,
      explanation: 'El historial de pagos representa el 35% del puntaje crediticio, siendo el factor más determinante.',
    },
  ];

  get currentQuestions() {
    const lesson = this.activeLesson();
    if (!lesson) return [];
    return this.allQuestions.filter(q => q.lessonId === lesson.id);
  }

  get currentQ() {
    return this.currentQuestions[this.currentQuestion()];
  }

  openLesson(lesson: Lesson) {
    this.activeLesson.set(lesson);
    this.showQuiz.set(false);
    this.quizFinished.set(false);
    this.currentQuestion.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.quizScore.set(0);
  }

  closeLesson() {
    this.activeLesson.set(null);
  }

  startQuiz() {
    this.showQuiz.set(true);
    this.currentQuestion.set(0);
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.quizScore.set(0);
    this.quizFinished.set(false);
  }

  selectAnswer(idx: number) {
    if (this.answered()) return;
    this.selectedAnswer.set(idx);
    this.answered.set(true);
    if (idx === this.currentQ.correct) {
      this.quizScore.update(s => s + 1);
      this.game.addQuizCorrect();
    }
  }

  nextQuestion() {
    const next = this.currentQuestion() + 1;
    if (next >= this.currentQuestions.length) {
      this.quizFinished.set(true);
      const lesson = this.activeLesson();
      if (lesson) {
        this.lessons.update(arr => arr.map(l => l.id === lesson.id ? { ...l, completed: true } : l));
        const bonus = this.quizScore() * 200;
        this.showToast(`¡Quiz completado! +${bonus} monedas ganadas 🎓`);
      }
    } else {
      this.currentQuestion.set(next);
      this.selectedAnswer.set(null);
      this.answered.set(false);
    }
  }

  isCorrect(idx: number): boolean {
    return this.answered() && idx === this.currentQ?.correct;
  }

  isWrong(idx: number): boolean {
    return this.answered() && idx === this.selectedAnswer() && idx !== this.currentQ?.correct;
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 3500);
  }

  get completedCount() {
    return this.lessons().filter(l => l.completed).length;
  }
}
