import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../services/profile.service';
import { Nav } from '../shared/nav/nav';

interface Question { q: string; opts: string[]; correct: number; explanation: string; }
interface QuizTopic { id: string; title: string; icon: string; color: string; questions: Question[]; }

const ALL_TOPICS: QuizTopic[] = [
  {
    id: 'presupuesto', title: 'Presupuesto', icon: '📋', color: '#10B981',
    questions: [
      { q: '¿Qué porcentaje destina la regla 50/30/20 al ahorro?', opts: ['10%','20%','30%','50%'], correct: 1, explanation: 'El 20% va a ahorro y deudas, el 50% a necesidades y el 30% a deseos.' },
      { q: '¿Cuál es el primer paso para crear un presupuesto?', opts: ['Abrir una cuenta','Registrar ingresos y gastos','Pedir un crédito','Invertir en bolsa'], correct: 1, explanation: 'Sin conocer tus números no puedes planificar. Registrar primero es clave.' },
      { q: 'Un gasto fijo es aquel que...', opts: ['Varía cada mes','Se paga solo una vez','No cambia cada mes','Es opcional'], correct: 2, explanation: 'Gastos fijos son constantes: arriendo, servicios, suscripciones mensuales.' },
      { q: '¿Qué significa "flujo de caja positivo"?', opts: ['Más deudas que ingresos','Ingresos mayores que gastos','Solo tener efectivo','No tener inversiones'], correct: 1, explanation: 'El flujo de caja positivo ocurre cuando tus ingresos superan tus gastos.' },
      { q: '¿Cada cuánto deberías revisar tu presupuesto?', opts: ['Una vez al año','Solo cuando tienes problemas','Mensualmente','Cada 5 años'], correct: 2, explanation: 'Revisarlo mensualmente te permite ajustar y mejorar continuamente.' },
    ],
  },
  {
    id: 'ahorro', title: 'Ahorro', icon: '🐷', color: '#8B5CF6',
    questions: [
      { q: '¿Por qué se recomienda automatizar el ahorro?', opts: ['Para ganar más intereses','Para evitar decidir cada mes','Para pagar menos impuestos','Para tener mejor crédito'], correct: 1, explanation: 'Automatizar elimina la tentación de gastar lo que deberías ahorrar.' },
      { q: '¿Cuántos meses de gastos debe tener un fondo de emergencia?', opts: ['1 mes','2 meses','3 a 6 meses','12 meses'], correct: 2, explanation: '3 a 6 meses es el estándar recomendado por expertos financieros.' },
      { q: '¿Qué es el "interés compuesto"?', opts: ['Interés que solo se aplica al capital','Interés que se reinvierte y genera más interés','Un tipo de deuda','Un impuesto bancario'], correct: 1, explanation: 'Einstein lo llamó "la octava maravilla del mundo". El interés sobre el interés crece exponencialmente.' },
      { q: 'Ahorrar primero y gastar el resto se llama...', opts: ['Presupuesto base cero','Pagarte a ti mismo primero','Método 50/30/20','Flujo libre'], correct: 1, explanation: '"Pagar primero a ti mismo" garantiza que el ahorro siempre ocurra.' },
      { q: '¿Cuál es el enemigo más silencioso del ahorro?', opts: ['La inflación','Los impuestos','Los gastos hormiga','Las deudas'], correct: 2, explanation: 'Los pequeños gastos diarios acumulados son devastadores para el ahorro.' },
    ],
  },
  {
    id: 'inversion', title: 'Inversión', icon: '📈', color: '#F59E0B',
    questions: [
      { q: '¿Qué es un ETF?', opts: ['Un tipo de deuda','Fondo que replica un índice bursátil','Cuenta de ahorros','Seguro de vida'], correct: 1, explanation: 'ETF = Exchange Traded Fund. Invierte en múltiples activos con un solo instrumento.' },
      { q: '¿Qué significa "diversificar una cartera"?', opts: ['Poner todo en una sola inversión','No invertir nunca','Distribuir el dinero en varios activos','Guardar todo en efectivo'], correct: 2, explanation: 'Diversificar reduce el riesgo: si un activo cae, los otros pueden compensar.' },
      { q: '¿Qué es el riesgo en una inversión?', opts: ['La comisión del banco','La posibilidad de perder dinero','El plazo de tiempo','La tasa de interés'], correct: 1, explanation: 'Toda inversión tiene riesgo: la posibilidad de que el valor baje.' },
      { q: '¿Qué principio describe "comprar barato y vender caro"?', opts: ['Especulación','Arbitraje','Inversión de valor','Dollar Cost Averaging'], correct: 0, explanation: 'Comprar bajo y vender alto es el concepto básico de la especulación en mercados.' },
      { q: '¿Cuál es la inversión más segura en Ecuador?', opts: ['Criptomonedas','Acciones internacionales','Bonos del Estado','Coleccionables'], correct: 2, explanation: 'Los bonos del Estado tienen respaldo gubernamental, aunque ofrecen menores rendimientos.' },
    ],
  },
  {
    id: 'deuda', title: 'Gestión de Deuda', icon: '⛓️', color: '#EF4444',
    questions: [
      { q: '¿Qué estrategia paga primero la deuda de mayor interés?', opts: ['Bola de nieve','Avalancha','Consolidación','Quiebra'], correct: 1, explanation: 'La estrategia avalancha ahorra más dinero en intereses a largo plazo.' },
      { q: '¿Cuál es el mayor error al usar una tarjeta de crédito?', opts: ['Usarla mucho','Pagar solo el mínimo','Pagar el total cada mes','Tener límite alto'], correct: 1, explanation: 'Pagar solo el mínimo puede multiplicar tu deuda 3x o más en 10 años.' },
      { q: '¿Qué es la tasa de interés anual (TEA)?', opts: ['El monto total de tu deuda','El costo anual del dinero prestado','Tu puntaje crediticio','El plazo del crédito'], correct: 1, explanation: 'La TEA representa el costo real de pedir prestado dinero durante un año.' },
      { q: '¿Qué porcentaje del ingreso se recomienda máximo para deudas?', opts: ['10%','20%','36%','50%'], correct: 2, explanation: 'El ratio deuda-ingreso no debería superar el 36% para mantener salud financiera.' },
      { q: '¿Qué tipo de deuda se considera "buena"?', opts: ['Tarjeta de crédito al 30%','Crédito de consumo','Hipoteca o crédito educativo','Deudas de juego'], correct: 2, explanation: 'La deuda "buena" genera un activo o retorno futuro que supera su costo.' },
    ],
  },
  {
    id: 'credito', title: 'Crédito y Score', icon: '🏦', color: '#06B6D4',
    questions: [
      { q: '¿Qué factor afecta más el puntaje crediticio?', opts: ['Cuántas tarjetas tienes','Historial de pagos','Tu ingreso mensual','El banco donde estás'], correct: 1, explanation: 'El historial de pagos representa el 35% del puntaje crediticio.' },
      { q: '¿Cuál es el porcentaje ideal de utilización de crédito?', opts: ['Máximo 10%','Máximo 30%','Máximo 60%','Máximo 90%'], correct: 1, explanation: 'Usar menos del 30% de tu crédito disponible mejora tu score significativamente.' },
      { q: 'Un puntaje de crédito alto te permite...', opts: ['Pagar más impuestos','Acceder a mejores tasas de interés','Obtener más tarjetas automáticamente','Evitar pagar deudas'], correct: 1, explanation: 'Mejor puntaje = menor tasa = miles de dólares ahorrados en préstamos.' },
      { q: '¿Cuánto tiempo tarda una cuenta morosa en salir del historial?', opts: ['1 año','2 años','5 años','Nunca sale'], correct: 2, explanation: 'En Ecuador, las deudas en mora permanecen en el buró hasta 5 años después de pagadas.' },
      { q: '¿Qué NO hacer para mejorar tu score?', opts: ['Pagar a tiempo','Cerrar todas tus tarjetas viejas','Mantener baja la utilización','Revisar tu reporte anual'], correct: 1, explanation: 'Cerrar tarjetas antiguas reduce tu historial y aumenta la utilización del crédito disponible.' },
    ],
  },
  {
    id: 'impuestos', title: 'Impuestos', icon: '🏛️', color: '#64748B',
    questions: [
      { q: '¿Qué significa IVA?', opts: ['Interés Variable Anual','Impuesto al Valor Agregado','Ingreso Variable Autorizado','Inversión de Valor Adicional'], correct: 1, explanation: 'En Ecuador el IVA es del 12% y se aplica a la mayoría de bienes y servicios.' },
      { q: '¿Quiénes deben declarar impuesto a la renta en Ecuador?', opts: ['Solo empresas','Personas con ingresos mayores a la base exenta','Todos los ciudadanos','Solo asalariados'], correct: 1, explanation: 'Las personas naturales con ingresos sobre la fracción básica deben declarar.' },
      { q: '¿Qué es una deducción fiscal?', opts: ['Un tipo de multa','Un gasto que reduce la base imponible','Un impuesto extra','Un formulario del SRI'], correct: 1, explanation: 'Las deducciones (educación, salud, vivienda) reducen los ingresos sobre los que pagas impuestos.' },
      { q: '¿Cuál es el ente recaudador de impuestos en Ecuador?', opts: ['BCE','Banco del Pacífico','SRI','Ministerio de Finanzas'], correct: 2, explanation: 'El Servicio de Rentas Internas (SRI) es la autoridad tributaria en Ecuador.' },
      { q: '¿Qué pasa si no declaras impuestos a tiempo?', opts: ['Nada','Multas e intereses','Deportación','Pérdida del RUC permanentemente'], correct: 1, explanation: 'Las multas por declaración tardía son el 3% por mes, más intereses acumulados.' },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Component({
  selector: 'app-academia',
  imports: [CommonModule, Nav],
  templateUrl: './academia.html',
  styleUrl: './academia.css',
})
export class Academia {
  profile = inject(ProfileService);

  topics = signal(ALL_TOPICS);
  activeTopic = signal<QuizTopic | null>(null);
  quizQuestions = signal<Question[]>([]);
  currentQ = signal(0);
  selected = signal<number | null>(null);
  answered = signal(false);
  score = signal(0);
  finished = signal(false);

  openTopic(topic: QuizTopic) {
    this.activeTopic.set(topic);
    this.quizQuestions.set(shuffle(topic.questions)); // randomise every time
    this.currentQ.set(0);
    this.selected.set(null);
    this.answered.set(false);
    this.score.set(0);
    this.finished.set(false);
  }

  closeTopic() { this.activeTopic.set(null); }

  selectAnswer(idx: number) {
    if (this.answered()) return;
    this.selected.set(idx);
    this.answered.set(true);
    if (idx === this.quizQuestions()[this.currentQ()].correct) {
      this.score.update(s => s + 1);
    }
  }

  next() {
    const nextIdx = this.currentQ() + 1;
    if (nextIdx >= this.quizQuestions().length) {
      // Award coins + XP
      const coins = this.score() * 150;
      const xp    = this.score() * 40;
      this.profile.completeQuiz(coins, xp);
      this.profile.unlockAchievement('first_quiz');
      this.finished.set(true);
    } else {
      this.currentQ.set(nextIdx);
      this.selected.set(null);
      this.answered.set(false);
    }
  }

  retry() { this.openTopic(this.activeTopic()!); }

  isCorrect = (i: number) => this.answered() && i === this.current?.correct;
  isWrong   = (i: number) => this.answered() && i === this.selected() && i !== this.current?.correct;

  get current(): Question { return this.quizQuestions()[this.currentQ()]; }
  get totalQ(): number { return this.quizQuestions().length; }
  get coinsEarned(): number { return this.score() * 150; }
  get starRating(): string {
    const pct = this.score() / this.totalQ;
    if (pct === 1) return '🏆';
    if (pct >= .6) return '🌟';
    return '📚';
  }
}
