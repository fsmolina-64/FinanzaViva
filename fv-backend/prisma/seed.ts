import 'dotenv/config';
import { PrismaClient, UserRank, QuizDifficulty, QuestionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedLessons } from './seed-lessons';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface A { text: string; isCorrect: boolean; explanation?: string; }
interface Q { text: string; type: QuestionType; answers: A[]; }
interface ModuleData {
  order: number; title: string; description: string; icon: string; xpReward: number;
  quiz: { title: string; difficulty: QuizDifficulty; xpReward: number; questions: Q[]; };
}

const c = (text: string, explanation: string): A => ({ text, isCorrect: true, explanation });
const w = (text: string): A => ({ text, isCorrect: false });
const mc = (text: string, answers: A[]): Q => ({ text, type: QuestionType.MULTIPLE_CHOICE, answers });
const tf = (text: string, correctIsTrue: boolean, explanation: string): Q => ({
  text, type: QuestionType.TRUE_FALSE,
  answers: [
    { text: 'Verdadero', isCorrect: correctIsTrue, explanation: correctIsTrue ? explanation : undefined },
    { text: 'Falso', isCorrect: !correctIsTrue, explanation: !correctIsTrue ? explanation : undefined },
  ],
});

const MODULES_DATA: ModuleData[] = [
  {
    order: 1, title: 'Presupuesto Personal',
    description: 'Controla ingresos y gastos con metodos probados', icon: 'wallet', xpReward: 100,
    quiz: {
      title: 'Domina tu Presupuesto', difficulty: QuizDifficulty.EASY, xpReward: 50,
      questions: [
        mc('Segun la regla 50/30/20, que porcentaje va a necesidades basicas?', [
          w('30%'), c('50%', 'La regla 50/30/20 destina el 50% del ingreso neto a necesidades como renta, alimentacion y transporte.'), w('20%'), w('40%'),
        ]),
        mc('Si ganas $800/mes, cuanto destinas a necesidades segun 50/30/20?', [
          w('$200'), c('$400', 'El 50% de $800 son $400. Eso cubre gastos no negociables como arriendo, comida y servicios.'), w('$240'), w('$160'),
        ]),
        mc('Que son los gastos fijos?', [
          w('Gastos que varian cada mes'), c('Gastos que se repiten con el mismo valor mensual', 'Los gastos fijos no cambian: arriendo, cuota de prestamo, suscripciones. Son predecibles y faciles de presupuestar.'), w('Gastos opcionales'), w('Gastos de emergencia'),
        ]),
        mc('Cual de estos es un gasto variable?', [
          w('Arriendo'), c('Salidas a restaurantes', 'Los gastos variables cambian cada mes segun tus decisiones. Son los primeros a ajustar cuando hay deficit.'), w('Cuota del prestamo'), w('Seguro mensual'),
        ]),
        mc('Que significa "ingreso neto"?', [
          w('Ingreso antes de impuestos'), w('Ingreso total de todas las fuentes'), c('Ingreso despues de descuentos e impuestos', 'El ingreso neto es lo que realmente recibes en tu cuenta. Siempre presupuesta sobre el neto, nunca el bruto.'), w('Ingreso proyectado'),
        ]),
        mc('Cual es el primer paso para crear un presupuesto?', [
          w('Reducir gastos inmediatamente'), c('Calcular tus ingresos netos mensuales', 'Sin saber cuanto entra exactamente, cualquier presupuesto sera impreciso. El ingreso neto es la base de todo.'), w('Abrir una cuenta de ahorro'), w('Pagar todas las deudas primero'),
        ]),
        mc('Si tus gastos superan tus ingresos, tienes:', [
          w('Superavit'), c('Deficit', 'Deficit significa que gastas mas de lo que ganas. Esto lleva al endeudamiento progresivo si no se corrige.'), w('Balance neutro'), w('Apalancamiento positivo'),
        ]),
        mc('Segun 50/30/20, que porcentaje va para deseos y entretenimiento?', [
          w('50%'), w('20%'), c('30%', 'El 30% cubre gastos deseados pero no esenciales: salidas, ropa extra, hobbies. Es ajustable segun tu situacion.'), w('10%'),
        ]),
        mc('Cual herramienta ayuda mas a controlar gastos diarios?', [
          w('Recordar mentalmente'), c('Aplicacion de registro de gastos', 'Registrar cada gasto en tiempo real elimina la "fuga invisible" de dinero. Lo que no se mide no se puede mejorar.'), w('Una caja fuerte'), w('Una tarjeta de credito premium'),
        ]),
        tf('El presupuesto base cero asigna cada dolar de ingreso a una categoria especifica.', true,
          'En el presupuesto base cero, ingresos menos gastos asignados = 0. Cada dolar tiene un proposito, evitando el gasto impulsivo.'),
        tf('El presupuesto mensual solo debe revisarse una vez al año.', false,
          'Debe revisarse mensualmente o cada vez que cambien los ingresos. La vida cambia y el presupuesto debe adaptarse.'),
        tf('El ingreso bruto es lo que recibes despues de impuestos y deducciones.', false,
          'El ingreso BRUTO es antes de descuentos. El NETO es lo que realmente recibes. Siempre presupuesta sobre el neto.'),
        mc('Cual NO es un gasto fijo tipico?', [
          w('Arriendo'), c('Salidas al cine', 'Las salidas al cine son gasto variable porque dependen de tu decision cada mes, no son obligatorias ni fijas.'), w('Cuota del prestamo'), w('Plan de internet'),
        ]),
        mc('Que es el "superavit" en un presupuesto?', [
          w('Cuando los gastos superan ingresos'), c('Cuando los ingresos superan los gastos', 'El superavit es dinero sobrante despues de cubrir todos los gastos. Ese excedente debe dirigirse a ahorro o inversion, no a gasto impulsivo.'), w('Cuando gastos e ingresos son iguales'), w('Una deuda a largo plazo'),
        ]),
      ],
    },
  },
  {
    order: 2, title: 'Ahorro e Interes Compuesto',
    description: 'Descubre como el tiempo multiplica tu dinero', icon: 'piggy-bank', xpReward: 120,
    quiz: {
      title: 'El Poder del Ahorro', difficulty: QuizDifficulty.EASY, xpReward: 60,
      questions: [
        mc('Que es el interes compuesto?', [
          w('Interes calculado solo sobre el capital inicial'), c('Interes calculado sobre capital mas intereses acumulados', 'El interes compuesto genera "interes sobre interes". Con el tiempo, este efecto es exponencial y es la base de la construccion de riqueza.'), w('Un impuesto al ahorro'), w('Interes que cobra el banco mensualmente'),
        ]),
        mc('Cuantos meses de gastos recomienda tener un fondo de emergencia?', [
          w('1-2 meses'), c('3-6 meses', 'Con 3-6 meses cubiertos puedes enfrentar perdida de empleo, enfermedad o emergencias sin endeudarte. Es tu primera red de seguridad.'), w('12 meses'), w('24 meses'),
        ]),
        mc('Con la Regla del 72, cuantos años tarda en duplicarse dinero al 8% anual?', [
          w('10 años'), c('9 años', 'La Regla del 72 dice: divide 72 entre la tasa de interes. 72/8 = 9 años. Es una aproximacion rapida muy util.'), w('6 años'), w('12 años'),
        ]),
        mc('Cuanto deberia ahorrar quien gana $600/mes segun 50/30/20?', [
          w('$60'), c('$120', 'El 20% de $600 son $120. Este dinero va a ahorro e inversion antes de gastar en deseos.'), w('$300'), w('$180'),
        ]),
        mc('Donde debe guardarse el fondo de emergencia?', [
          w('En inversiones de alto riesgo'), c('En cuenta de facil acceso y bajo riesgo', 'El fondo de emergencia necesita liquidez inmediata. No busca rentabilidad alta, busca estar disponible cuando lo necesites.'), w('En efectivo en casa'), w('En criptomonedas'),
        ]),
        mc('Cual tipo de ahorro ofrece mayor interes generalmente?', [
          w('Cuenta corriente'), c('Cuenta de ahorro a plazo fijo', 'Los plazos fijos ofrecen mayor tasa porque comprometes el dinero por un periodo. A mayor plazo y monto, mayor tasa.'), w('Guardar en efectivo'), w('Cuenta vista sin rendimiento'),
        ]),
        mc('Si ahorras $200/mes durante 30 años al 6% anual con interes compuesto, el resultado es:', [
          w('Exactamente $72,000'), c('Mucho mayor a $72,000', 'Con interes compuesto al 6%, $200/mes durante 30 años genera aproximadamente $200,000. El tiempo es el factor mas poderoso.'), w('Igual a $72,000'), w('Menor por comisiones bancarias'),
        ]),
        mc('Que es la "liquidez" de un activo?', [
          w('Su rendimiento anual'), c('La facilidad de convertirlo en efectivo rapidamente', 'Un activo liquido se convierte en dinero sin perder valor. El efectivo es el mas liquido; una casa es poco liquida.'), w('Su nivel de riesgo'), w('El plazo minimo de inversion'),
        ]),
        tf('Empezar a ahorrar a los 20 años da mejores resultados que empezar a los 30.', true,
          'Cada año extra de interes compuesto tiene efecto exponencial. Una decada mas de tiempo puede duplicar o triplicar el resultado final.'),
        tf('El interes simple siempre genera mas ganancias que el interes compuesto en el largo plazo.', false,
          'El interes compuesto supera al simple en cualquier plazo mayor a un periodo porque acumula interes sobre interes.'),
        tf('La Regla del 72 sirve para estimar en cuantos años se duplica un ahorro.', true,
          'Divide 72 entre la tasa de rendimiento anual y obtienes los años aproximados para duplicar tu dinero. Simple y util.'),
        tf('El APY siempre es mayor o igual al APR cuando hay capitalizacion frecuente.', true,
          'APY incluye el efecto de la capitalizacion compuesta. Si el banco capitaliza mensualmente, el APY sera mayor que el APR nominal.'),
        mc('Cual es el primer paso antes de comenzar a invertir?', [
          w('Comprar acciones del mercado'), c('Tener fondo de emergencia completo', 'Invertir sin fondo de emergencia es peligroso: ante una crisis deberias liquidar inversiones en mal momento. Primero el colchon, luego invertir.'), w('Pagar todas las deudas incluyendo hipoteca'), w('Abrir cuenta en una corredora'),
        ]),
        mc('Que hace que el interes compuesto sea mas poderoso con el tiempo?', [
          w('Las tasas de interes suben con los años'), c('Los intereses generan nuevos intereses de forma acumulativa', 'Cada periodo los intereses se suman al capital y generan nuevos intereses. Este ciclo se acelera con el tiempo de forma geometrica.'), w('Los bancos dan mejores tasas a clientes antiguos'), w('La inflacion favorece al ahorrador'),
        ]),
      ],
    },
  },
  {
    order: 3, title: 'Credito y Deuda',
    description: 'Usa el credito a tu favor sin caer en trampas', icon: 'credit-card', xpReward: 130,
    quiz: {
      title: 'Manejo Inteligente del Credito', difficulty: QuizDifficulty.MEDIUM, xpReward: 65,
      questions: [
        mc('Que mide el historial crediticio?', [
          w('Tu salario mensual'), c('Tu comportamiento al pagar deudas en el pasado', 'El historial crediticio registra si pagas a tiempo, cuanto debes y cuantos creditos tienes. Es tu "reputacion financiera" ante prestamistas.'), w('El saldo de tu cuenta bancaria'), w('Cuantas tarjetas de credito tienes'),
        ]),
        mc('Que es la tasa de interes anual (APR) de un credito?', [
          w('El interes que gana tu cuenta de ahorro'), c('El costo anual de un credito expresado en porcentaje', 'El APR te dice cuanto te cuesta realmente el dinero prestado por año. Siempre compara APR, no cuotas mensuales, al elegir un credito.'), w('El impuesto sobre prestamos'), w('El plazo de pago del credito'),
        ]),
        mc('El metodo "avalancha" para pagar deudas consiste en:', [
          w('Pagar primero la deuda mas pequena'), c('Pagar primero la deuda con mayor tasa de interes', 'La avalancha elimina primero la deuda mas cara matematicamente. Ahorra mas dinero en intereses totales que cualquier otro metodo.'), w('Pagar cuotas iguales a todas las deudas'), w('Negociar con todos los acreedores simultaneamente'),
        ]),
        mc('El metodo "bola de nieve" para pagar deudas consiste en:', [
          w('Pagar primero la deuda con mayor interes'), c('Pagar primero la deuda mas pequena para ganar motivacion', 'La bola de nieve prioriza victorias psicologicas. Al eliminar deudas pequenas rapido, el dinero liberado se suma al siguiente pago.'), w('Pagar cuotas iguales a todas'), w('Ignorar las deudas mas grandes'),
        ]),
        mc('Cual accion dania mas el historial crediticio?', [
          w('Consultar tu propio score'), c('No pagar una cuota en la fecha acordada', 'Los pagos tardios o incumplidos quedan registrados por años. El factor mas importante del historial es el cumplimiento en fechas.'), w('Tener varias cuentas de ahorro'), w('Cambiar de banco'),
        ]),
        mc('Que es el "periodo de gracia" en una tarjeta de credito?', [
          c('El tiempo para pagar el saldo completo sin intereses adicionales', 'Si pagas el total de tu estado de cuenta antes del vencimiento, no pagas intereses. El periodo de gracia es tu aliado si lo usas bien.'), w('El tiempo para solicitar aumento de limite'), w('La penalizacion por pago tardio'), w('El plazo para cambiar la fecha de corte'),
        ]),
        mc('Que porcentaje maximo de ingresos deberia destinarse al pago de deudas?', [
          w('50%'), c('36% o menos', 'Expertos recomiendan que la deuda total no supere el 36% del ingreso bruto. Sobre el 50% es zona critica de sobreendeudamiento.'), w('60%'), w('25% exactamente'),
        ]),
        mc('Que significa "consolidar deudas"?', [
          w('Tomar mas prestamos para invertir'), c('Unir varias deudas en un solo prestamo con menor tasa', 'La consolidacion simplifica los pagos y puede reducir la tasa promedio. Funciona si la nueva tasa es menor que el promedio actual.'), w('Cancelar todas las deudas de una vez'), w('Negociar eliminar los intereses acumulados'),
        ]),
        mc('Cual es la diferencia clave entre "deuda buena" y "deuda mala"?', [
          w('La deuda buena siempre tiene tasa baja'), c('La deuda buena financia activos que generan valor o ingresos', 'Un prestamo estudiantil o hipoteca pueden ser "deuda buena" si generan retorno. Deuda para consumo depreciable es "mala".'), w('La deuda mala siempre es de mayor monto'), w('No existe diferencia real entre ambas'),
        ]),
        tf('Pagar solo el minimo de la tarjeta de credito evita intereses adicionales.', false,
          'Pagar el minimo mantiene el saldo restante acumulando interes. En tarjetas con 25%+ APR, una deuda pequena puede triplicarse en años.'),
        tf('Un score crediticio alto indica mayor riesgo para el prestamista.', false,
          'Score alto = menor riesgo para el prestamista = mejores tasas para ti. Score bajo = mayor riesgo percibido = tasas mas altas o rechazo.'),
        tf('Las deudas de tarjeta de credito suelen tener tasas mas altas que los prestamos hipotecarios.', true,
          'Las hipotecas tienen colateral (el inmueble), lo que reduce el riesgo del banco y permite tasas menores. Las tarjetas son credito sin garantia, por eso cobran mas.'),
        tf('Un prestamo con cuota mensual menor es siempre mejor opcion.', false,
          'Cuota menor generalmente significa plazo mas largo, lo que resulta en mas intereses totales pagados. Siempre compara el costo total, no solo la cuota.'),
        tf('El sobreendeudamiento ocurre cuando las deudas superan la capacidad de pago regular.', true,
          'Cuando el servicio de deuda consume mas del 50% del ingreso, cualquier imprevisto puede desencadenar incumplimiento en cadena.'),
      ],
    },
  },
  {
    order: 4, title: 'Inversiones Basicas',
    description: 'Pon tu dinero a trabajar con estrategia', icon: 'trending-up', xpReward: 150,
    quiz: {
      title: 'Primeros Pasos en Inversiones', difficulty: QuizDifficulty.MEDIUM, xpReward: 75,
      questions: [
        mc('Cual es la relacion entre riesgo y rentabilidad en inversiones?', [
          w('A mayor riesgo, menor rentabilidad esperada'), c('A mayor riesgo, mayor rentabilidad esperada', 'Esta relacion es fundamental. Los inversores exigen mayor retorno para aceptar mayor incertidumbre. Sin riesgo, no hay rentabilidad real.'), w('No tienen ninguna relacion'), w('A menor riesgo, siempre mayor rentabilidad'),
        ]),
        mc('Que es un activo financiero?', [
          w('Una deuda que debes pagar'), c('Algo de valor que posees y puede generar ingresos o apreciarse', 'Los activos son el lado positivo de tu balance: acciones, propiedades, fondos. Acumular activos es la base de la construccion de riqueza.'), w('Una tarjeta bancaria especial'), w('El saldo minimo requerido en una cuenta'),
        ]),
        mc('Cual inversion tiene generalmente el menor riesgo?', [
          w('Criptomonedas'), w('Acciones de startups'), c('Bonos del gobierno', 'Los bonos soberanos tienen el respaldo del Estado. Su riesgo de impago es muy bajo aunque su rentabilidad tambien es menor.'), w('Acciones de empresas pequenas nuevas'),
        ]),
        mc('Que es la "diversificacion" en una cartera de inversiones?', [
          w('Invertir todo en el activo de mayor rendimiento historico'), c('Distribuir la inversion en diferentes activos para reducir riesgo', 'Si un activo cae, otros pueden compensar. La diversificacion no elimina el riesgo pero evita que un solo evento destruya toda tu cartera.'), w('Cambiar de inversiones frecuentemente'), w('Invertir solo en tu pais de origen'),
        ]),
        mc('Que es el "horizonte de inversion"?', [
          w('El maximo que puedes perder sin quebrarte'), c('El tiempo que planeas mantener una inversion antes de necesitar el dinero', 'A mayor horizonte, mas riesgo puedes asumir porque tienes tiempo para recuperarte de caidas. A menor horizonte, mas conservador debes ser.'), w('La rentabilidad esperada de la cartera'), w('El tipo de activo que mejor te conviene'),
        ]),
        mc('Como afecta la inflacion al dinero guardado en efectivo?', [
          w('Lo protege de perdidas'), c('Reduce su poder adquisitivo con el tiempo', 'Si la inflacion es 5% anual y tu dinero no rinde nada, efectivamente pierdes 5% de poder de compra cada ano. El efectivo sin invertir pierde valor.'), w('No tiene efecto sobre el efectivo'), w('Aumenta su valor en forma proporcional'),
        ]),
        mc('Que es un fondo de inversion?', [
          w('Un prestamo bancario para invertir en bolsa'), c('Un conjunto de activos administrado colectivamente por multiples inversores', 'Los fondos permiten acceder a carteras diversificadas con poco capital. Un gestor profesional toma las decisiones de compra y venta.'), w('Una cuenta de ahorro con interes garantizado'), w('Un seguro de vida con componente de ahorro'),
        ]),
        mc('Que es el ROI (retorno sobre inversion)?', [
          w('El riesgo relativo de una inversion'), c('La ganancia o perdida generada en relacion al capital invertido', 'ROI = (Ganancia - Costo) / Costo x 100. Un ROI del 20% significa que por cada $100 invertidos ganaste $20 adicionales.'), w('El plazo de recuperacion del capital'), w('La tasa de interes del mercado actual'),
        ]),
        mc('Para un joven de 22 años con horizonte de 30 años, que cartera es mas adecuada?', [
          w('100% bonos del gobierno, maxima seguridad'), c('Mayor proporcion en acciones con algo de renta fija', 'Con 30 años por delante, puedes tolerar la volatilidad de las acciones. Historicamente las acciones superan a los bonos en plazos largos.'), w('Solo criptomonedas de alta volatilidad'), w('Solo efectivo en cuenta de ahorro tradicional'),
        ]),
        tf('Diversificar una cartera de inversiones reduce el riesgo total.', true,
          'La diversificacion elimina el "riesgo especifico" de un activo. Si diversificas bien, el mal desempeno de uno se compensa con otros.'),
        tf('El plazo de inversion no afecta la estrategia que debes elegir.', false,
          'El horizonte temporal es el factor mas determinante. A corto plazo necesitas estabilidad; a largo plazo puedes asumir mas riesgo por mayor rentabilidad esperada.'),
        tf('Invertir todo en una sola empresa es estrategia recomendada para principiantes.', false,
          'Concentrar en un solo activo es el maximo riesgo especifico. Si esa empresa quiebra, pierdes todo. La diversificacion es principio basico para cualquier inversor.'),
        tf('Las inversiones garantizan siempre ganancias.', false,
          'Ninguna inversion garantiza ganancias excepto instrumentos con garantia del Estado. Mayor rentabilidad esperada siempre conlleva posibilidad de perdida.'),
        tf('Un ETF permite invertir en multiples activos con una sola compra.', true,
          'Un ETF replica un indice (como el S&P 500) dando exposicion a cientos de empresas en una sola transaccion, con comisiones muy bajas.'),
      ],
    },
  },
  {
    order: 5, title: 'Mercado de Valores',
    description: 'Entiende como funciona la bolsa de valores', icon: 'bar-chart', xpReward: 160,
    quiz: {
      title: 'Bolsa y Mercado Bursatil', difficulty: QuizDifficulty.MEDIUM, xpReward: 80,
      questions: [
        mc('Que representa comprar una accion de una empresa?', [
          w('Prestarle dinero a la empresa'), c('Convertirse en propietario de una fraccion de la empresa', 'Al comprar acciones eres accionista: tienes derecho a voto y participas en las ganancias (dividendos) y en el crecimiento del valor.'), w('Comprar los productos de la empresa con descuento'), w('Asegurar un retorno fijo garantizado'),
        ]),
        mc('Que son los dividendos?', [
          w('Comisiones que cobran los brokers por cada operacion'), c('Pagos periodicos que una empresa hace a sus accionistas con sus ganancias', 'Empresas maduras y rentables distribuyen parte de sus utilidades como dividendos. Es una forma de ingresos pasivos para el accionista.'), w('Impuestos sobre las ganancias en bolsa'), w('Perdidas temporales en la cartera'),
        ]),
        mc('Que mide el indice S&P 500?', [
          w('Las 500 empresas mas pequenas de EE.UU.'), c('El rendimiento de las 500 empresas mas grandes de EE.UU. por capitalizacion', 'El S&P 500 es el indicador mas seguido del mercado americano. Invertir en un ETF que lo replica da exposicion a las mayores empresas del mundo.'), w('Solo empresas tecnologicas del Nasdaq'), w('El precio promedio del petroleo'),
        ]),
        mc('Que es la relacion precio-ganancia (P/E ratio)?', [
          c('El precio de la accion dividido entre las ganancias por accion', 'Un P/E de 20 significa que pagas $20 por cada $1 de ganancia anual. P/E alto puede indicar sobrevaluacion o grandes expectativas de crecimiento.'), w('El precio total de mercado de la empresa'), w('El rendimiento de los dividendos pagados'), w('El volumen diario de acciones negociadas'),
        ]),
        mc('Que estrategia de inversion es mas recomendada para principiantes?', [
          w('Trading diario buscando ganancias rapidas'), c('Inversion pasiva en fondos indexados a largo plazo', 'Los fondos indexados tienen bajas comisiones y han superado historicamente a la mayoria de gestores activos en periodos largos. Ideal para principiantes.'), w('Compra de penny stocks de alto riesgo'), w('Concentrarse en las 3 acciones mas populares del momento'),
        ]),
        mc('Que es una "correccion de mercado"?', [
          w('Un error en los precios que corrige el sistema'), c('Una caida del 10% o mas desde el ultimo maximo registrado', 'Las correcciones son normales y ocurren frecuentemente. Para inversores de largo plazo son oportunidades de compra, no motivo de panico.'), w('El cierre temporal de la bolsa'), w('Una alza repentina de precios'),
        ]),
        mc('Que ventaja clave tienen los fondos indexados frente a gestores activos?', [
          w('Mayor rentabilidad garantizada'), c('Menores comisiones y resultados frecuentemente similares o superiores', 'Estudios muestran que mas del 80% de gestores activos no superan al indice en periodos de 10+ años. Las comisiones bajas marcan la diferencia.'), w('Acceso exclusivo a empresas privadas'), w('Proteccion total contra caidas del mercado'),
        ]),
        mc('Que es un broker de valores?', [
          w('Una empresa que emite acciones al mercado'), c('Un intermediario que ejecuta ordenes de compra y venta en bolsa', 'Sin broker no puedes operar en bolsa. Hoy existen brokers online con comisiones muy bajas o cero, democratizando el acceso a la inversion.'), w('Un indice que mide el mercado'), w('Un tipo de bono corporativo'),
        ]),
        tf('Los bonos representan una deuda que la empresa u gobierno tiene contigo.', true,
          'Al comprar un bono eres acreedor: la empresa te debe el capital mas intereses pactados. Es menos riesgoso que accion pero con menor potencial de ganancia.'),
        tf('Un mercado alcista (bull market) significa que los precios estan cayendo.', false,
          'Bull market = precios subiendo sostenidamente. Bear market = precios cayando. El toro ataca hacia arriba, el oso hacia abajo: facil de recordar.'),
        tf('El precio de las acciones puede bajar hasta cero si la empresa quiebra.', true,
          'En una quiebra, los accionistas son los ultimos en cobrar. Si no quedan activos despues de pagar deudas, las acciones valen cero y se pierde toda la inversion.'),
        tf('El day trading tiene mayor riesgo que la inversion a largo plazo.', true,
          'El trading diario requiere predecir movimientos de corto plazo, que son esencialmente aleatorios. Estudios muestran que mas del 90% de day traders pierden dinero.'),
        tf('Invertir durante caidas del mercado puede ser oportunidad si tu horizonte es largo.', true,
          'Comprar cuando el mercado cae significa comprar a descuento. Si tu horizonte es 10+ años, esas caidas son ruido temporal y oportunidades de acumulacion.'),
        mc('Que diferencia a una accion de un bono como instrumento de inversion?', [
          w('Los bonos dan mas rentabilidad que las acciones siempre'), c('Las acciones dan participacion en la empresa; los bonos son prestamos con interes fijo', 'Acciones = renta variable (potencial ilimitado, riesgo mayor). Bonos = renta fija (retorno predecible, menor riesgo). Ambos tienen lugar en una cartera diversificada.'), w('Las acciones garantizan dividendos, los bonos no'), w('Los bonos son exclusivos para gobiernos'),
        ]),
      ],
    },
  },
  {
    order: 6, title: 'Seguros y Proteccion Financiera',
    description: 'Protege tu patrimonio ante imprevistos', icon: 'shield', xpReward: 140,
    quiz: {
      title: 'Gestiona tu Riesgo con Seguros', difficulty: QuizDifficulty.MEDIUM, xpReward: 70,
      questions: [
        mc('Que es una prima de seguro?', [
          w('El pago que hace la aseguradora cuando ocurre un siniestro'), c('El pago periodico que haces para mantener el seguro activo', 'La prima es tu costo por transferir el riesgo a la aseguradora. A mayor cobertura o riesgo del asegurado, mayor la prima.'), w('El valor maximo cubierto por la poliza'), w('El descuento por buen historial de conductor'),
        ]),
        mc('Que es el deducible en un seguro?', [
          w('Lo que paga la aseguradora antes de que tu pagues'), c('El monto que tu pagas primero antes de que el seguro cubra el resto', 'Si tienes deducible de $500 y el siniestro es $2,000, tu pagas $500 y el seguro cubre $1,500. Deducible mas alto = prima mas baja.'), w('El limite maximo de cobertura anual'), w('La penalizacion por cancelar la poliza'),
        ]),
        mc('Cual es el objetivo principal de un seguro?', [
          w('Generar ganancias al asegurado'), c('Transferir el riesgo financiero de eventos adversos a la aseguradora', 'El seguro no evita que ocurran eventos, pero evita que te destruyan financieramente. Es proteccion, no inversion.'), w('Evitar que ocurran accidentes'), w('Sustituir completamente el fondo de emergencia'),
        ]),
        mc('Que tipo de seguro cubre daños causados por ti a terceros?', [
          w('Seguro de vida a termino'), c('Seguro de responsabilidad civil', 'La responsabilidad civil cubre daños que causes a otras personas o su propiedad. Es obligatorio para vehiculos en la mayoria de paises.'), w('Seguro medico personal'), w('Seguro de contenido del hogar'),
        ]),
        mc('Que es el coaseguro en una poliza de salud?', [
          w('Un seguro compartido entre dos companias aseguradoras'), c('El porcentaje del costo que el asegurado paga despues de cubrir el deducible', 'Ejemplo: 80/20 significa el seguro paga 80% y tu pagas 20% de los gastos medicos tras el deducible. Define cuanto compartes el riesgo.'), w('Una penalizacion por usar el seguro frecuentemente'), w('El limite maximo de cobertura de por vida'),
        ]),
        mc('Cual es la diferencia entre seguro de vida a termino y permanente?', [
          w('El de termino cubre toda la vida, el permanente por años definidos'), c('El de termino cubre un periodo definido, el permanente cubre toda la vida', 'El termino es mas barato y suficiente si tienes dependientes temporales. El permanente acumula valor en efectivo pero cuesta mucho mas.'), w('No hay diferencia practica entre ambos'), w('El de termino acumula valor en efectivo con el tiempo'),
        ]),
        mc('Cuando tiene mas sentido contratar seguro de vida?', [
          w('Cuando no tienes personas que dependan de tus ingresos'), c('Cuando tienes dependientes economicos que quedarian desprotegidos sin tus ingresos', 'El seguro de vida reemplaza tus ingresos para quienes dependen de ti: hijos, conyuge, padres. Si nadie depende de ti economicamente, no es urgente.'), w('Solo despues de los 60 años'), w('Nunca, es mejor ahorrar ese dinero'),
        ]),
        mc('Que significa "exclusion" en una poliza de seguro?', [
          w('Una condicion que duplica la cobertura en emergencias'), c('Situaciones especificas o daños que la poliza NO cubre', 'Siempre lee las exclusiones antes de firmar. Una poliza medica puede excluir condiciones preexistentes. Conocerlas evita sorpresas al reclamar.'), w('Un descuento especial por fidelidad al asegurador'), w('La cancelacion automatica del seguro por impago'),
        ]),
        tf('Tener un deducible mas alto generalmente reduce el valor de la prima mensual.', true,
          'Al aceptar pagar mas de tu bolsillo antes de que el seguro actue, el asegurador reduce tu prima. Es equilibrio entre costo mensual y riesgo asumido.'),
        tf('Es recomendable comparar varias polizas antes de contratar un seguro.', true,
          'Coberturas, deducibles, exclusiones y primas varian enormemente entre companias. Comparar puede ahorrarte cientos de dolares al año con mejor cobertura.'),
        tf('El seguro de salud es innecesario para jovenes sanos porque no se enferman.', false,
          'Los accidentes no distinguen edad ni salud. Una hospitalizacion sin seguro puede generar deudas de miles de dolares. El seguro es para lo inesperado, no lo esperado.'),
        tf('El infraaseguramiento puede generar perdidas financieras graves en un siniestro.', true,
          'Si aseguras tu vehiculo por menos de su valor real, la aseguradora cubre solo la proporcion asegurada. Siempre asegura por el valor real del activo.'),
        mc('Por que los jovenes deberian tener seguro medico aunque sean sanos?', [
          w('Porque la ley siempre los obliga a tenerlo'), c('Porque accidentes e imprevistos ocurren a cualquier edad y el costo sin seguro puede ser devastador', 'Un accidente de transito o una apendicitis puede costar miles de dolares. El seguro convierte un costo potencialmente catastrofico en uno predecible y manejable.'), w('Porque acumula dinero que pueden retirar despues'), w('No deberian, es un gasto innecesario a esa edad'),
        ]),
        mc('Que es el "limite de cobertura" en una poliza de seguro?', [
          w('El deducible maximo del periodo'), c('El monto maximo que la aseguradora pagara en caso de siniestro', 'Si tu limite es $50,000 y el daño es $80,000, tu cubres los $30,000 restantes. Elegir limite adecuado es tan importante como elegir la prima.'), w('El numero maximo de reclamaciones por año'), w('El descuento maximo aplicable a la prima'),
        ]),
      ],
    },
  },
  {
    order: 7, title: 'Planificacion Financiera',
    description: 'Construye tu futuro financiero paso a paso', icon: 'target', xpReward: 180,
    quiz: {
      title: 'Tu Plan Financiero de Largo Plazo', difficulty: QuizDifficulty.HARD, xpReward: 90,
      questions: [
        mc('Que son las metas financieras SMART?', [
          w('Metas solo para personas con ingresos altos'), c('Metas Especificas, Medibles, Alcanzables, Relevantes y con Tiempo definido', 'Una meta SMART no es "quiero ahorrar mas" sino "ahorrare $200/mes durante 12 meses para fondo de emergencia de $2,400". Concreta y verificable.'), w('Metas de ahorro exclusivamente, no de inversion'), w('Metas establecidas por asesores financieros certificados'),
        ]),
        mc('Como se calcula el patrimonio neto?', [
          w('Sumando todos tus ingresos anuales'), c('Restando tus deudas totales al valor de todos tus activos', 'Patrimonio neto = Activos - Pasivos. Es la fotografia real de tu riqueza. Puede ser negativo al inicio y debe crecer con el tiempo.'), w('Sumando activos mas deudas'), w('Dividiendo ingresos entre gastos mensuales'),
        ]),
        mc('Cuando es el mejor momento para empezar a planificar la jubilacion?', [
          w('A los 50 años cuando ya tienes experiencia laboral'), c('Lo antes posible, idealmente desde los primeros ingresos regulares', 'Cada año de retraso tiene costo enorme por el interes compuesto perdido. Empezar a los 25 vs 35 puede duplicar el fondo de retiro final.'), w('A los 40 cuando ya tienes familia estable'), w('Cuando hayas pagado todas tus deudas'),
        ]),
        mc('Que es la "regla del 4%" en planificacion de jubilacion?', [
          w('Ahorrar el 4% del ingreso cada mes para la vejez'), c('Retirar el 4% anual del fondo de retiro para que dure aproximadamente 30 años', 'Si tienes $500,000 ahorrados, puedes retirar $20,000/año (4%) con alta probabilidad de que el fondo dure 30 años asumiendo rendimientos normales.'), w('Invertir el 4% en activos de alto riesgo'), w('Pagar el 4% de interes maximo en prestamos'),
        ]),
        mc('Que es el "costo de oportunidad"?', [
          w('El costo de administrar una cartera de inversiones'), c('El valor de la mejor alternativa que sacrificas al tomar una decision', 'Si usas $10,000 para vacaciones en lugar de invertirlos al 8%, el costo de oportunidad es todo el rendimiento futuro perdido de esa inversion.'), w('Los impuestos sobre ganancias de capital'), w('El precio de una oportunidad de negocio'),
        ]),
        mc('Cual es un hito financiero recomendado antes de los 30 años?', [
          w('Tener un millon de dolares en inversiones'), c('Fondo de emergencia completo, cero deuda de consumo e inversiones iniciadas', 'Estos tres pilares a los 30 son el punto de lanzamiento ideal: red de seguridad, sin lastres de deuda cara, y el tiempo trabajando a tu favor.'), w('Tener casa propia totalmente pagada'), w('Haber iniciado al menos un negocio propio'),
        ]),
        mc('Que significa "independencia financiera"?', [
          w('No tener ninguna deuda pendiente'), c('Tener suficiente riqueza para vivir sin depender de ingresos laborales activos', 'Independencia financiera (IF) significa que tus activos generan suficientes ingresos pasivos para cubrir tus gastos. Trabajar pasa a ser eleccion, no obligacion.'), w('Ganar un salario muy alto'), w('No necesitar ninguna institucion bancaria'),
        ]),
        mc('Que es el "interes compuesto negativo" en el contexto de deudas?', [
          w('Que la deuda se reduce sola con el paso del tiempo'), c('Que los intereses se acumulan sobre el saldo pendiente haciendo crecer la deuda exponencialmente', 'El mismo efecto del interes compuesto que construye riqueza en inversiones destruye riqueza en deudas impagadas. Es identico mecanismo, opuesto resultado.'), w('Un beneficio especial de ciertos prestamos personales'), w('Intereses menores al promedio del mercado actual'),
        ]),
        mc('Cual es la principal ventaja de comenzar a invertir joven?', [
          w('Acceso a mejores productos financieros exclusivos'), c('El tiempo amplifica el interes compuesto generando mayor riqueza final', 'Quien invierte $200/mes de los 22 a los 65 años acumula aproximadamente el doble que quien invierte $400/mes de los 35 a los 65. El tiempo vale mas que el monto.'), w('Pagar menos impuestos sobre ganancias'), w('Tener mayor tolerancia legal al riesgo'),
        ]),
        tf('El patrimonio neto se calcula restando pasivos a activos.', true,
          'Patrimonio neto = Activos - Pasivos. Es la medida real de tu posicion financiera. Aumentarlo sistematicamente es el objetivo de la planificacion financiera.'),
        tf('Un plan financiero solo debe incluir metas de ahorro, no de inversion.', false,
          'Un plan financiero completo incluye: presupuesto, fondo de emergencia, eliminacion de deudas, ahorro, inversion y planificacion del retiro. Solo ahorrar no es suficiente.'),
        tf('La inflacion reduce el poder de compra del dinero en el tiempo.', true,
          'Si la inflacion es 5% anual, con $100 hoy compras lo que en un año costara $105. Por eso el dinero sin invertir pierde valor real sistematicamente.'),
        tf('Las metas financieras deben revisarse y ajustarse periodicamente.', true,
          'La vida cambia: ingresos, familia, objetivos. Un plan financiero rigido que no se adapta falla. Revision semestral o anual es minimo recomendado.'),
        tf('La planificacion financiera es solo util para personas con ingresos altos.', false,
          'La planificacion es mas importante con ingresos limitados porque el margen de error es menor. Con poco margen, cada decision importa mas y el plan guia mejor el uso de recursos.'),
      ],
    },
  },
];

async function main() {

  const levels = [
    { number: 1, name: 'Novato', xpRequired: 0, rank: UserRank.ROOKIE, badge: '🌱' },
    { number: 2, name: 'Aprendiz', xpRequired: 100, rank: UserRank.ROOKIE, badge: '📘' },
    { number: 3, name: 'Estudiante', xpRequired: 250, rank: UserRank.APPRENTICE, badge: '📗' },
    { number: 4, name: 'Ahorrador', xpRequired: 500, rank: UserRank.APPRENTICE, badge: '💰' },
    { number: 5, name: 'Planificador', xpRequired: 900, rank: UserRank.INTERMEDIATE, badge: '📊' },
    { number: 6, name: 'Inversor', xpRequired: 1400, rank: UserRank.INTERMEDIATE, badge: '📈' },
    { number: 7, name: 'Estratega', xpRequired: 2000, rank: UserRank.ADVANCED, badge: '🧠' },
    { number: 8, name: 'Experto', xpRequired: 2800, rank: UserRank.ADVANCED, badge: '⚡' },
    { number: 9, name: 'Maestro', xpRequired: 4000, rank: UserRank.EXPERT, badge: '🏆' },
    { number: 10, name: 'Leyenda', xpRequired: 6000, rank: UserRank.MASTER, badge: '👑' },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { number: level.number },
      update: {},
      create: level,
    });
  }
  console.log('✅ Niveles creados');

  const categories = [
    { name: 'Salario', icon: '💼', color: '#10B981', type: 'INCOME', isGlobal: true },
    { name: 'Freelance', icon: '💻', color: '#10B981', type: 'INCOME', isGlobal: true },
    { name: 'Inversiones', icon: '📈', color: '#10B981', type: 'INCOME', isGlobal: true },
    { name: 'Alimentación', icon: '🍔', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Transporte', icon: '🚌', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Entretenimiento', icon: '🎮', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Salud', icon: '🏥', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Educación', icon: '📚', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Servicios', icon: '💡', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Ropa', icon: '👕', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
  ];

  for (const category of categories) {
    const exists = await prisma.category.findFirst({
      where: { name: category.name, isGlobal: true },
    });
    if (!exists) {
      await prisma.category.create({
        data: { ...category, type: category.type as any },
      });
    }
  }
  console.log('✅ Categorías creadas');

  for (const mod of MODULES_DATA) {
    const module = await prisma.module.upsert({
      where: { order: mod.order },
      update: {
        title: mod.title,
        description: mod.description,
        icon: mod.icon,
        xpReward: mod.xpReward,
        isPublished: true,
      },
      create: {
        title: mod.title,
        description: mod.description,
        icon: mod.icon,
        order: mod.order,
        xpReward: mod.xpReward,
        isPublished: true,
      },
    });

    const existingQuiz = await prisma.quiz.findFirst({ where: { moduleId: module.id } });
    if (existingQuiz) {
      console.log(`  [SKIP] Módulo ${mod.order}: ${mod.title} — quiz ya existe`);
      continue;
    }

    await prisma.quiz.create({
      data: {
        moduleId: module.id,
        title: mod.quiz.title,
        difficulty: mod.quiz.difficulty,
        xpReward: mod.quiz.xpReward,
        passingScore: 70,
        questions: {
          create: mod.quiz.questions.map((q, qi) => ({
            text: q.text,
            type: q.type,
            order: qi + 1,
            answers: { create: q.answers },
          })),
        },
      },
    });

    console.log(`  [OK] Módulo ${mod.order}: ${mod.title} — ${mod.quiz.questions.length} preguntas`);
  }
  console.log('✅ Módulos y quizzes creados');



  const achievements = [
    { key: 'first_lesson', name: 'Primer Paso', description: 'Completa tu primera lección.', icon: '📘', category: 'LEARNING', xpReward: 30, condition: { metric: 'lessons_completed', threshold: 1 } },
    { key: 'student', name: 'Estudiante', description: 'Completa 10 lecciones.', icon: '📖', category: 'LEARNING', xpReward: 60, condition: { metric: 'lessons_completed', threshold: 10 } },
    { key: 'avid_reader', name: 'Lector Voraz', description: 'Completa 20 lecciones.', icon: '📚', category: 'LEARNING', xpReward: 100, condition: { metric: 'lessons_completed', threshold: 20 } },
    { key: 'graduated', name: 'Graduado', description: 'Completa las 28 lecciones.', icon: '🎓', category: 'LEARNING', xpReward: 200, condition: { metric: 'lessons_completed', threshold: 28 } },
    { key: 'academic', name: 'Académico', description: 'Completa 3 módulos.', icon: '🏫', category: 'LEARNING', xpReward: 80, condition: { metric: 'modules_completed', threshold: 3 } },
    { key: 'scholar', name: 'Scholar', description: 'Completa 5 módulos.', icon: '🔬', category: 'LEARNING', xpReward: 120, condition: { metric: 'modules_completed', threshold: 5 } },
    { key: 'master_total', name: 'Maestro Total', description: 'Completa los 7 módulos.', icon: '🧠', category: 'LEARNING', xpReward: 300, condition: { metric: 'modules_completed', threshold: 7 } },
    { key: 'quiz_perfect', name: 'Quiz Perfecto', description: 'Aprueba 5 quizzes.', icon: '🎯', category: 'LEARNING', xpReward: 100, condition: { metric: 'quizzes_passed', threshold: 5 } },
    { key: 'organizer', name: 'Organizador', description: 'Registra 10 transacciones.', icon: '📋', category: 'FINANCES', xpReward: 40, condition: { metric: 'total_transactions', threshold: 10 } },
    { key: 'active_counter', name: 'Contador Activo', description: 'Registra 25 transacciones.', icon: '📊', category: 'FINANCES', xpReward: 80, condition: { metric: 'total_transactions', threshold: 25 } },
    { key: 'personal_cfo', name: 'CFO Personal', description: 'Registra 100 transacciones.', icon: '💼', category: 'FINANCES', xpReward: 150, condition: { metric: 'total_transactions', threshold: 100 } },
    { key: 'data_millionaire', name: 'Millonario de Datos', description: 'Registra 200 transacciones.', icon: '💎', category: 'FINANCES', xpReward: 300, condition: { metric: 'total_transactions', threshold: 200 } },
    { key: 'first_game', name: 'Primera Decisión', description: 'Completa tu primera partida.', icon: '🎮', category: 'SIMULATOR', xpReward: 50, condition: { metric: 'games_played', threshold: 1 } },
    { key: 'active_player', name: 'Jugador Activo', description: 'Completa 5 partidas.', icon: '🕹️', category: 'SIMULATOR', xpReward: 80, condition: { metric: 'games_played', threshold: 5 } },
    { key: 'veteran', name: 'Veterano', description: 'Completa 10 partidas.', icon: '⚔️', category: 'SIMULATOR', xpReward: 150, condition: { metric: 'games_played', threshold: 10 } },
    { key: 'first_win', name: 'Primera Victoria', description: 'Gana tu primera partida.', icon: '🥇', category: 'SIMULATOR', xpReward: 80, condition: { metric: 'games_won', threshold: 1 } },
    { key: 'champion', name: 'Campeón', description: 'Gana 5 partidas.', icon: '🏆', category: 'SIMULATOR', xpReward: 200, condition: { metric: 'games_won', threshold: 5 } },
    { key: 'first_habit', name: 'Primer Hábito', description: 'Mantén una racha de 3 días.', icon: '🌱', category: 'STREAK', xpReward: 40, condition: { metric: 'current_streak', threshold: 3 } },
    { key: 'disciplined', name: 'Disciplinado', description: 'Mantén una racha de 14 días.', icon: '🔥', category: 'STREAK', xpReward: 150, condition: { metric: 'current_streak', threshold: 14 } },
    { key: 'unstoppable', name: 'Imparable', description: 'Alcanza una racha máxima de 30 días.', icon: '⚡', category: 'STREAK', xpReward: 300, condition: { metric: 'longest_streak', threshold: 30 } },
    { key: 'accumulator', name: 'Acumulador', description: 'Gana 500 XP en total.', icon: '⭐', category: 'GENERAL', xpReward: 50, condition: { metric: 'total_xp', threshold: 500 } },
    { key: 'knowledge_investor', name: 'Inversor de Conocimiento', description: 'Gana 2000 XP en total.', icon: '👑', category: 'GENERAL', xpReward: 200, condition: { metric: 'total_xp', threshold: 2000 } },
    { key: 'quiz_master', name: 'Quiz Master', description: 'Aprueba los 7 quizzes.', icon: '🏅', category: 'LEARNING', xpReward: 150, condition: { metric: 'quizzes_passed', threshold: 7 } },
  ];

  const knownKeys = new Set(achievements.map(a => a.key));
  await prisma.achievement.updateMany({
    where: { key: { notIn: Array.from(knownKeys) }, isActive: true },
    data: { isActive: false },
  });

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category as any,
        xpReward: achievement.xpReward,
        condition: achievement.condition,
        isActive: true,
      },
      create: { ...achievement, category: achievement.category as any, isActive: true },
    });
  }
  console.log('✅ Logros sincronizados');

  const rewards = [
    { name: 'Novato Financiero', description: 'Título inicial de bienvenida.', icon: '🌱', type: 'TITLE', unlockType: 'LEVEL', unlockValue: '2' },
    { name: 'Analista', description: 'Título por completar 3 módulos.', icon: '🔍', type: 'TITLE', unlockType: 'ACHIEVEMENT', unlockValue: 'academic' },
    { name: 'Inversor', description: 'Título por aprobar 5 quizzes.', icon: '📈', type: 'TITLE', unlockType: 'ACHIEVEMENT', unlockValue: 'quiz_perfect' },
    { name: 'Estratega', description: 'Título por ganar 3 partidas.', icon: '♟️', type: 'TITLE', unlockType: 'ACHIEVEMENT', unlockValue: 'first_win' },
    { name: 'Magnate', description: 'Título por alcanzar nivel 10.', icon: '💰', type: 'TITLE', unlockType: 'LEVEL', unlockValue: '10' },
    { name: 'Aura Azul', description: 'Brillo azul en tu avatar.', icon: '💙', type: 'AURA', unlockType: 'RANK', unlockValue: 'INTERMEDIATE' },
    { name: 'Aura Dorada', description: 'Brillo dorado en tu avatar.', icon: '✨', type: 'AURA', unlockType: 'RANK', unlockValue: 'EXPERT' },
    { name: 'Aura Legendaria', description: 'Brillo morado animado en tu avatar.', icon: '🔮', type: 'AURA', unlockType: 'RANK', unlockValue: 'MASTER' },
    { name: 'Marco Bronce', description: 'Marco de perfil bronce.', icon: '🥉', type: 'FRAME', unlockType: 'LEVEL', unlockValue: '2' },
    { name: 'Marco Plata', description: 'Marco de perfil plateado.', icon: '🥈', type: 'FRAME', unlockType: 'LEVEL', unlockValue: '3' },
    { name: 'Marco Oro', description: 'Marco de perfil dorado.', icon: '🥇', type: 'FRAME', unlockType: 'RANK', unlockValue: 'ADVANCED' },
    { name: 'Marco Diamante', description: 'Marco de perfil cyan brillante.', icon: '💠', type: 'FRAME', unlockType: 'ACHIEVEMENT', unlockValue: 'master_total' },
    { name: 'Avatar Inversor', description: 'Avatar de inversor profesional.', icon: '👔', type: 'AVATAR', unlockType: 'LEVEL', unlockValue: '5' },
    { name: 'Avatar Pro', description: 'Avatar exclusivo por aprobar 7 quizzes.', icon: '💼', type: 'AVATAR', unlockType: 'ACHIEVEMENT', unlockValue: 'quiz_perfect' },
    { name: 'Avatar Maestro', description: 'Avatar de maestro financiero.', icon: '🎓', type: 'AVATAR', unlockType: 'LEVEL', unlockValue: '10' },
    { name: 'Avatar Leyenda', description: 'Avatar legendario.', icon: '👑', type: 'AVATAR', unlockType: 'ACHIEVEMENT', unlockValue: 'knowledge_investor' },
    { name: 'Insignia Quiz Master', description: 'Insignia exclusiva de Quiz Master.', icon: '🏆', type: 'BADGE', unlockType: 'ACHIEVEMENT', unlockValue: 'quiz_perfect' },
    { name: 'Insignia Constante', description: 'Insignia por racha de 30 días.', icon: '🔥', type: 'BADGE', unlockType: 'ACHIEVEMENT', unlockValue: 'unstoppable' },
    { name: 'Insignia Graduado', description: 'Insignia por completar todas las lecciones.', icon: '🎓', type: 'BADGE', unlockType: 'ACHIEVEMENT', unlockValue: 'graduated' },
    { name: 'Insignia Campeón', description: 'Insignia por ganar 5 partidas.', icon: '⚔️', type: 'BADGE', unlockType: 'ACHIEVEMENT', unlockValue: 'champion' },
  ];

  const knownRewardNames = new Set(rewards.map(r => r.name));
  await prisma.reward.updateMany({
    where: { name: { notIn: Array.from(knownRewardNames) }, isActive: true },
    data: { isActive: false },
  });

  for (const reward of rewards) {
    const achievement = reward.unlockType === 'ACHIEVEMENT'
      ? await prisma.achievement.findUnique({ where: { key: reward.unlockValue } })
      : null;
    const existing = await prisma.reward.findFirst({ where: { name: reward.name } });
    if (existing) {
      await prisma.reward.update({
        where: { id: existing.id },
        data: {
          description: reward.description,
          icon: reward.icon,
          type: reward.type as any,
          unlockType: reward.unlockType as any,
          unlockValue: reward.unlockValue,
          achievementId: achievement?.id ?? null,
          isActive: true,
        },
      });
    } else {
      await prisma.reward.create({
        data: {
          ...reward,
          type: reward.type as any,
          unlockType: reward.unlockType as any,
          achievementId: achievement?.id ?? null,
        },
      });
    }
  }
  console.log('✅ Recompensas sincronizadas');

  await seedLessons(prisma);

  // ── Board cells ──────────────────────────────────────────────
  const cells: { position: number; name: string; type: string; group: string | null; price: number | null; rent: number | null; amount: number | null; description: string }[] = [
    { position: 0,  name: 'Inicio',                     type: 'INICIO',            group: null,     price: null, rent: null, amount: null,   description: 'Punto de salida' },
    { position: 1,  name: 'Cuenta de Ahorros',          type: 'PROPERTY',          group: 'purple', price: 60,   rent: 10,  amount: null,  description: 'Propiedad grupo purple' },
    { position: 2,  name: 'Dividendos',                 type: 'LOTTERY',           group: null,     price: null, rent: null, amount: 100,   description: 'Recibes dividendos de tus inversiones' },
    { position: 3,  name: 'Fondo Mutuo',                type: 'PROPERTY',          group: 'purple', price: 60,   rent: 10,  amount: null,  description: 'Propiedad grupo purple' },
    { position: 4,  name: 'Impuesto IVA',               type: 'TAX',               group: null,     price: null, rent: null, amount: -100,  description: 'Pagas IVA' },
    { position: 5,  name: 'Evento Financiero',          type: 'WILDCARD',          group: null,     price: null, rent: null, amount: null,  description: 'Toma una carta del mazo' },
    { position: 6,  name: 'Startup Digital',            type: 'PROPERTY',          group: 'blue',   price: 100,  rent: 20,  amount: null,  description: 'Propiedad grupo blue' },
    { position: 7,  name: 'App Fintech',                type: 'PROPERTY',          group: 'blue',   price: 100,  rent: 20,  amount: null,  description: 'Propiedad grupo blue' },
    { position: 8,  name: 'Ingreso Freelance',          type: 'PENSION',           group: null,     price: null, rent: null, amount: 150,  description: 'Recibes ingreso freelance' },
    { position: 9,  name: 'Negocio Online',             type: 'PROPERTY',          group: 'blue',   price: 120,  rent: 25,  amount: null,  description: 'Propiedad grupo blue' },
    { position: 10, name: 'Cárcel / Visita',            type: 'JAIL',              group: null,     price: null, rent: null, amount: null,  description: 'Solo de visita' },
    { position: 11, name: 'Food Truck',                 type: 'PROPERTY',          group: 'pink',   price: 140,  rent: 30,  amount: null,  description: 'Propiedad grupo pink' },
    { position: 12, name: 'Evento Financiero',          type: 'WILDCARD',          group: null,     price: null, rent: null, amount: null,  description: 'Toma una carta del mazo' },
    { position: 13, name: 'Café Boutique',              type: 'PROPERTY',          group: 'pink',   price: 140,  rent: 30,  amount: null,  description: 'Propiedad grupo pink' },
    { position: 14, name: 'Tasa Municipal',             type: 'TAX',               group: null,     price: null, rent: null, amount: -150,  description: 'Pagas tasa municipal' },
    { position: 15, name: 'Restaurante',                type: 'PROPERTY',          group: 'pink',   price: 160,  rent: 35,  amount: null,  description: 'Propiedad grupo pink' },
    { position: 16, name: 'Herencia Familiar',          type: 'LOTTERY',           group: null,     price: null, rent: null, amount: 200,  description: 'Recibes una herencia familiar' },
    { position: 17, name: 'Plaza Comercial',            type: 'PROPERTY',          group: 'orange', price: 180,  rent: 40,  amount: null,  description: 'Propiedad grupo orange' },
    { position: 18, name: 'Evento Financiero',          type: 'WILDCARD',          group: null,     price: null, rent: null, amount: null,  description: 'Toma una carta del mazo' },
    { position: 19, name: 'Tienda Ancla',               type: 'PROPERTY',          group: 'orange', price: 180,  rent: 40,  amount: null,  description: 'Propiedad grupo orange' },
    { position: 20, name: 'Salario y Renta',            type: 'PENSION_ESPECIAL',  group: null,     price: null, rent: null, amount: 300,  description: 'Recibes salario y renta' },
    { position: 21, name: 'Centro Comercial',           type: 'PROPERTY',          group: 'orange', price: 200,  rent: 45,  amount: null,  description: 'Propiedad grupo orange' },
    { position: 22, name: 'Esquema Ponzi',              type: 'SCAM',              group: null,     price: null, rent: null, amount: -200,  description: 'Caíste en un esquema Ponzi' },
    { position: 23, name: 'Oficinas Clase A',           type: 'PROPERTY',          group: 'red',    price: 220,  rent: 50,  amount: null,  description: 'Propiedad grupo red' },
    { position: 24, name: 'Impuesto Predial',           type: 'TAX',               group: null,     price: null, rent: null, amount: -200,  description: 'Pagas impuesto predial' },
    { position: 25, name: 'Residencial Premium',        type: 'PROPERTY',          group: 'red',    price: 220,  rent: 50,  amount: null,  description: 'Propiedad grupo red' },
    { position: 26, name: 'Evento Financiero',          type: 'WILDCARD',          group: null,     price: null, rent: null, amount: null,  description: 'Toma una carta del mazo' },
    { position: 27, name: 'Torre Empresarial',          type: 'PROPERTY',          group: 'red',    price: 240,  rent: 55,  amount: null,  description: 'Propiedad grupo red' },
    { position: 28, name: 'IPO Exitosa',                type: 'LOTTERY',           group: null,     price: null, rent: null, amount: 250,  description: 'Tu IPO fue exitosa' },
    { position: 29, name: 'ETF Dividendos',             type: 'PROPERTY',          group: 'yellow', price: 260,  rent: 60,  amount: null,  description: 'Propiedad grupo yellow' },
    { position: 30, name: 'Ir a Cárcel',                type: 'GO_TO_JAIL',        group: null,     price: null, rent: null, amount: null,  description: 'Ve a la cárcel' },
    { position: 31, name: 'Fondo Indexado',             type: 'PROPERTY',          group: 'yellow', price: 260,  rent: 60,  amount: null,  description: 'Propiedad grupo yellow' },
    { position: 32, name: 'Fraude Financiero',          type: 'SCAM',              group: null,     price: null, rent: null, amount: -300,  description: 'Fuiste víctima de fraude financiero' },
    { position: 33, name: 'Portafolio Bonos',           type: 'PROPERTY',          group: 'yellow', price: 280,  rent: 65,  amount: null,  description: 'Propiedad grupo yellow' },
    { position: 34, name: 'Retención Fiscal',           type: 'TAX',               group: null,     price: null, rent: null, amount: -250,  description: 'Pagas retención fiscal' },
    { position: 35, name: 'Fondo Diversificado',        type: 'PROPERTY',          group: 'green',  price: 300,  rent: 70,  amount: null,  description: 'Propiedad grupo green' },
    { position: 36, name: 'Bono Extraordinario',        type: 'LOTTERY',           group: null,     price: null, rent: null, amount: 300,  description: 'Recibes un bono extraordinario' },
    { position: 37, name: 'Venture Capital',            type: 'PROPERTY',          group: 'green',  price: 320,  rent: 75,  amount: null,  description: 'Propiedad grupo green' },
    { position: 38, name: 'Renta Pasiva',               type: 'PENSION',           group: null,     price: null, rent: null, amount: 200,  description: 'Recibes renta pasiva' },
    { position: 39, name: 'Fondo Soberano',             type: 'PROPERTY',          group: 'green',  price: 350,  rent: 90,  amount: null,  description: 'Propiedad grupo green' },
  ];

  for (const c of cells) {
    await prisma.boardCell.upsert({
      where: { position: c.position },
      update: { name: c.name, type: c.type as any, group: c.group, price: c.price, rent: c.rent, amount: c.amount, description: c.description },
      create: { position: c.position, name: c.name, type: c.type as any, group: c.group, price: c.price, rent: c.rent, amount: c.amount, description: c.description },
    });
  }

  // ── Board wildcards ──────────────────────────────────────────
  const wildcards: { text: string; type: string; effectAmount: number; explanation: string }[] = [
    { text: 'Ganaste un concurso de ahorro', type: 'POSITIVE', effectAmount: 100, explanation: 'Recibes $100 por tu buen hábito de ahorro' },
    { text: 'Te multaron por mal estacionamiento', type: 'NEGATIVE', effectAmount: -50, explanation: 'Pagas una multa de $50' },
    { text: 'Vendes tu auto usado', type: 'POSITIVE', effectAmount: 200, explanation: 'Recibes $200 por la venta' },
    { text: 'Se daña tu refrigerador', type: 'NEGATIVE', effectAmount: -150, explanation: 'Pagas $150 por reparación' },
    { text: 'Ganas un sorteo de la empresa', type: 'POSITIVE', effectAmount: 150, explanation: 'Recibes un bono de $150' },
    { text: 'Te roban el celular', type: 'NEGATIVE', effectAmount: -100, explanation: 'Pierdes $100 por el robo' },
    { text: 'Cobras una deuda olvidada', type: 'POSITIVE', effectAmount: 120, explanation: 'Recibes $120 de una deuda antigua' },
    { text: 'Tienes una emergencia dental', type: 'NEGATIVE', effectAmount: -200, explanation: 'Pagas $200 por la emergencia' },
    { text: 'Recibes cashback de tus tarjetas', type: 'POSITIVE', effectAmount: 80, explanation: 'Recibes $80 de cashback' },
    { text: 'Aumenta la prima de tu seguro', type: 'NEGATIVE', effectAmount: -120, explanation: 'Pagas $120 más de seguro' },
    { text: 'Ganas un premio por fidelidad', type: 'POSITIVE', effectAmount: 90, explanation: 'Recibes $90 por tu fidelidad' },
    { text: 'Te hackean una cuenta', type: 'NEGATIVE', effectAmount: -180, explanation: 'Pierdes $180 por el hackeo' },
    { text: 'Cada jugador te paga $50', type: 'COLLECT_FROM_ALL', effectAmount: 50, explanation: 'Cada jugador te paga $50' },
    { text: 'pagas $75 a cada jugador', type: 'PAY_TO_ALL', effectAmount: 75, explanation: 'pagas $75 a cada jugador' },
    { text: 'Ve a la cárcel. No cobras salario', type: 'GO_TO_JAIL', effectAmount: 0, explanation: 'Ve directamente a la cárcel' },
  ];

  for (const w of wildcards) {
    await prisma.boardWildcard.create({
      data: { text: w.text, type: w.type as any, effectAmount: w.effectAmount, explanation: w.explanation },
    });
  }

  console.log('✓ Board cells and wildcards seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());