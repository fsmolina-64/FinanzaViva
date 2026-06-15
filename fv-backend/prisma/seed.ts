import 'dotenv/config';
import { PrismaClient, UserRank, QuizDifficulty, QuestionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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

  // Eliminar eventos anteriores con cascade manual para evitar FK
  await prisma.simulatorPlayerRound.deleteMany({});
  await prisma.simulatorConsequence.deleteMany({});
  await prisma.simulatorEvent.deleteMany({});
  console.log('🗑️  Eventos anteriores eliminados');

  interface SimulatorOptionSeed {
    text: string;
    explanation: string;
    effectMoney: number;
    effectIncome: number;
    effectExpenses: number;
    effectDebt: number;
    effectScore: number;
    effectSavings: number;
    effectAssets: number;
    effectInvestments: number;
    consequenceRounds: number;
    consequenceDesc: string | null;
  }

  interface SimulatorEventSeed {
    name: string;
    description: string;
    category: string;
    probability: number;
    isGlobal: boolean;
    options: SimulatorOptionSeed[];
  }

  const events: SimulatorEventSeed[] = [

    // ══════════════════════════════ EMPLEO ══════════════════════════════

    {
      name: 'Reduccion de personal',
      description: 'Tu empresa anuncio una restructuracion inesperada. Tu puesto fue eliminado y recibes un mes de indemnizacion equivalente a $800.',
      category: 'RISK',
      probability: 0.15,
      isGlobal: false,
      options: [
        {
          text: 'Vivir de la indemnizacion mientras buscas trabajo por tu cuenta',
          explanation: 'Tomarse tiempo para encontrar el trabajo correcto puede resultar en mejor posicion a largo plazo. El riesgo real es que el proceso tome mas tiempo del esperado y el colchon se agote. Sin ingresos, cada mes cuenta.',
          effectMoney: -800, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: -5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Sin empleo: -$800 mensuales para cubrir gastos de subsistencia'
        },
        {
          text: 'Aceptar el primer trabajo disponible aunque pague un 30% menos',
          explanation: 'Mantener el flujo de ingresos reduce la presion inmediata. El costo es la reduccion permanente de ingresos mientras buscas algo mejor. A veces el trabajo temporal es el puente correcto, otras veces bloquea la busqueda real.',
          effectMoney: 0, effectIncome: -600, effectExpenses: 0, effectDebt: 0, effectScore: -10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Solicitar un prestamo de emergencia al banco para cubrir gastos',
          explanation: 'Endeudarse durante el desempleo acumula presion financiera exactamente cuando los ingresos desaparecen. Los intereses corren independientemente de tu situacion laboral. Es comprensible como ultima opcion pero su costo real es alto.',
          effectMoney: 1200, effectIncome: 0, effectExpenses: 0, effectDebt: 1600, effectScore: -20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota prestamo desempleo: -$150 mensuales por 3 meses'
        }
      ]
    },

    {
      name: 'Oferta de aumento salarial con condiciones',
      description: 'Tu empresa te ofrece un aumento del 25% pero debes asumir mas responsabilidades y trabajar fines de semana. Simultaneamente recibes oferta de otra empresa con 40% de aumento.',
      category: 'OPPORTUNITY',
      probability: 0.18,
      isGlobal: false,
      options: [
        {
          text: 'Aceptar el aumento del 25% con tu empleador actual',
          explanation: 'Quedarte con una empresa conocida reduce el riesgo: mantienes tu red de contactos, evitas la curva de adaptacion y conservas beneficios acumulados. El 25% compuesto durante varios anos tiene impacto significativo.',
          effectMoney: 0, effectIncome: 500, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Aceptar la oferta de la empresa externa con el 40% de aumento',
          explanation: 'Cambiar de empresa puede acelerar el crecimiento salarial significativamente. El primer ano siempre implica costos de adaptacion y mayor incertidumbre. Los beneficios acumulados y relaciones establecidas se pierden.',
          effectMoney: 0, effectIncome: 800, effectExpenses: 100, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Usar la oferta externa como palanca para negociar con tu empresa actual',
          explanation: 'Negociar el salario con una oferta real como respaldo es la herramienta mas poderosa en una negociacion laboral. El riesgo es que el empleador no acepte y la relacion se deteriore o decidan prescindir de ti.',
          effectMoney: 0, effectIncome: 650, effectExpenses: 0, effectDebt: 0, effectScore: 25,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    {
      name: 'Contrato freelance de alto valor',
      description: 'Una empresa te ofrece un proyecto freelance de $2,000 que toma 2 meses. Implica trabajar fines de semana y reducir tiempo libre.',
      category: 'OPPORTUNITY',
      probability: 0.20,
      isGlobal: false,
      options: [
        {
          text: 'Aceptar el contrato y destinar los ingresos a ahorros',
          explanation: 'Los ingresos extraordinarios invertidos o ahorrados tienen el mayor impacto en el patrimonio a largo plazo. Al no ser parte del presupuesto habitual, no afectan el gasto mensual si se gestionan correctamente.',
          effectMoney: 1000, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: 1000, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 1, consequenceDesc: 'Contrato en curso: +$1000 adicional el proximo mes al completar el proyecto'
        },
        {
          text: 'Aceptar el contrato y usar el dinero para saldar deudas',
          explanation: 'Eliminar deuda de alto interes con ingresos extraordinarios garantiza un retorno equivalente a la tasa de esa deuda. Si tus deudas cobran 20% anual, pagarlas genera un retorno garantizado del 20%.',
          effectMoney: 2000, effectIncome: 0, effectExpenses: 0, effectDebt: -1500, effectScore: 25,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Rechazar el contrato por priorizar el descanso y tiempo personal',
          explanation: 'El tiempo tiene valor economico y personal. No toda oportunidad de ingreso debe tomarse. Si tu situacion financiera lo permite y el equilibrio personal es prioritario, es una decision valida aunque implique menor ingreso.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ EMPRENDIMIENTO ══════════════════════════════

    {
      name: 'Propuesta de negocio con un conocido',
      description: 'Un amigo con experiencia en comercio te propone crear juntos una tienda en linea. Tu aporte seria de $500. El negocio podria generar $300 mensuales o podria no despegar.',
      category: 'OPPORTUNITY',
      probability: 0.18,
      isGlobal: false,
      options: [
        {
          text: 'Invertir los $500 y participar activamente en el negocio',
          explanation: 'Emprender con capital propio limita la perdida maxima al monto invertido. El retorno puede ser positivo si el negocio funciona, o perder la inversion si no. Los negocios digitales tienen bajo costo de entrada pero alta tasa de fracaso en el primer ano.',
          effectMoney: -500, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: -500, effectAssets: 0, effectInvestments: 300,
          consequenceRounds: 2, consequenceDesc: 'Negocio en desarrollo: potencial de +$300 mensuales al consolidarse'
        },
        {
          text: 'Participar aportando solo tiempo y habilidades sin capital propio',
          explanation: 'Eliminar el riesgo financiero a cambio de menor participacion puede ser prudente. La clave es acordar de forma clara la distribucion de beneficios si el negocio funciona.',
          effectMoney: 0, effectIncome: 100, effectExpenses: 50, effectDebt: 0, effectScore: 5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Rechazar la propuesta y mantener el foco en el empleo actual',
          explanation: 'No toda oportunidad de negocio es adecuada para cada persona en cada momento. Evaluar el costo de oportunidad del tiempo, el riesgo del capital y si tienes las condiciones correctas es inteligencia financiera aplicada.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 0,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    {
      name: 'Oportunidad de franquicia',
      description: 'Una empresa de comida saludable ofrece una franquicia por $3,000 de inversion. Promete $800 mensuales de ganancia neta y requiere 15 horas semanales de dedicacion.',
      category: 'OPPORTUNITY',
      probability: 0.12,
      isGlobal: false,
      options: [
        {
          text: 'Financiar la franquicia con un credito bancario al 15%',
          explanation: 'Financiar un negocio con deuda amplifica el riesgo: si el negocio no genera lo esperado la deuda persiste. La ecuacion funciona si los ingresos del negocio superan la cuota mas los costos operativos. Muchas franquicias tienen costos ocultos no mencionados en la presentacion inicial.',
          effectMoney: 2700, effectIncome: 0, effectExpenses: 0, effectDebt: 3000, effectScore: -5,
          effectSavings: 0, effectAssets: 500, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota franquicia financiada: -$150 mensuales durante 3 meses de arranque'
        },
        {
          text: 'Pagar la franquicia con ahorros propios sin endeudarse',
          explanation: 'Invertir con capital propio elimina la presion de la deuda pero reduce tu liquidez y fondo de emergencia. Si el negocio funciona el retorno es limpio. Si no funciona, la perdida es real y sin red de seguridad financiera.',
          effectMoney: -3000, effectIncome: 400, effectExpenses: 100, effectDebt: 0, effectScore: 15,
          effectSavings: -3000, effectAssets: 500, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Franquicia en fase de arranque: ingresos creciendo gradualmente'
        },
        {
          text: 'Solicitar mas informacion y hablar con otros franquiciados antes de decidir',
          explanation: 'Hacer diligencia previa antes de invertir en una franquicia es critico. Hablar con franquiciados actuales revela la realidad operativa que los materiales de venta no muestran. El costo de esperar es no comenzar a generar ese ingreso potencial.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ INVERSIONES ══════════════════════════════

    {
      name: 'Caida del mercado de valores',
      description: 'El mercado de valores cayo 22% en las ultimas semanas por una crisis economica internacional. Tienes $700 disponibles y un asesor te senala que historicamente estas caidas son oportunidades.',
      category: 'MARKET',
      probability: 0.15,
      isGlobal: true,
      options: [
        {
          text: 'Invertir los $700 en un fondo indexado que replica el mercado global',
          explanation: 'Comprar cuando el mercado baja es una estrategia respaldada por evidencia historica de largo plazo. No garantiza ganancias inmediatas: el mercado puede seguir cayendo antes de recuperarse. El horizonte temporal es el factor mas importante aqui.',
          effectMoney: -700, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 700,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Mantener el dinero en cuenta de ahorro hasta que el mercado se estabilice',
          explanation: 'Tratar de identificar el momento perfecto para entrar al mercado se llama market timing. La evidencia muestra que predecir el piso de una caida es practicamente imposible incluso para profesionales. Preservar liquidez tambien tiene valor real.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 0,
          effectSavings: 700, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Pedir un prestamo para invertir mayor capital aprovechando la caida',
          explanation: 'Invertir con deuda en mercados volatiles amplifica ganancias si el mercado sube y amplifica perdidas si sigue cayendo. Las cuotas del prestamo corren independientemente del resultado de la inversion. Es una apuesta de riesgo elevado.',
          effectMoney: -150, effectIncome: 0, effectExpenses: 0, effectDebt: 2000, effectScore: -10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 2700,
          consequenceRounds: 3, consequenceDesc: 'Cuota prestamo de inversion: -$150 mensuales por 3 meses'
        }
      ]
    },

    {
      name: 'Inversion en startup tecnologica',
      description: 'Un conocido te invita a invertir en una startup de tecnologia en etapa temprana. La inversion minima es $1,000. Podria multiplicarse por 10 o perder todo el capital.',
      category: 'OPPORTUNITY',
      probability: 0.12,
      isGlobal: false,
      options: [
        {
          text: 'Invertir los $1,000 en la startup',
          explanation: 'Las startups en etapa temprana tienen el mayor potencial de retorno y la mayor tasa de fracaso: estadisticamente mas del 90% no llegan a ser rentables. Esta inversion no debe hacerse con dinero necesario para gastos o emergencias.',
          effectMoney: -1000, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 5,
          effectSavings: -1000, effectAssets: 0, effectInvestments: 1000,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Invertir $250 como maximo tolerable de perdida total',
          explanation: 'Limitar la exposicion a inversiones de alto riesgo a un porcentaje pequeno que puedas perder sin afectar tu estabilidad es gestion de riesgo aplicada. Participas en el potencial sin comprometer tu situacion financiera.',
          effectMoney: -250, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: -250, effectAssets: 0, effectInvestments: 250,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Rechazar por no tener suficiente informacion sobre el modelo de negocio',
          explanation: 'No invertir en lo que no entiendes completamente es un principio fundamental. La presion de tiempo o social para invertir rapido es una senal de alerta clasica. Mas vale perder una oportunidad que perder el capital en algo que no comprendes.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    {
      name: 'Criptomonedas en tendencia viral',
      description: 'Una criptomoneda subio 200% en el ultimo mes. Tus amigos hablan de ella constantemente y algunos dicen haber ganado mucho. Sientes presion de no quedarte afuera.',
      category: 'MARKET',
      probability: 0.15,
      isGlobal: true,
      options: [
        {
          text: 'Invertir $600 de tus ahorros en la criptomoneda mas popular',
          explanation: 'Invertir cuando el activo ya subio 200% y todos hablan de el es comprar en el pico de la mania especulativa. La mayoria de personas que entra en esta etapa pierde dinero cuando el precio corrige. Las subidas pasadas no predicen subidas futuras.',
          effectMoney: -600, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: -10,
          effectSavings: -600, effectAssets: 0, effectInvestments: 600,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Invertir $150 como experimentacion con dinero que puedes perder',
          explanation: 'Destinar un porcentaje pequeno y tolerable a activos especulativos permite participar sin comprometer la estabilidad financiera. La clave es que sea dinero que no necesitas y cuya perdida no afectaria tu plan financiero principal.',
          effectMoney: -150, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 5,
          effectSavings: -150, effectAssets: 0, effectInvestments: 150,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Estudiar el activo a fondo antes de comprometer cualquier capital',
          explanation: 'La diligencia previa es el habito que diferencia a quienes construyen riqueza de quienes la pierden. Entender el modelo tecnico, la utilidad real, el equipo detras y los riesgos regulatorios antes de invertir es lo correcto.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ EDUCACION ══════════════════════════════

    {
      name: 'Bootcamp de especializacion profesional',
      description: 'Una academia reconocida ofrece un programa de 4 meses en tu area por $1,200. Garantizan mejor empleabilidad y el programa tiene buenas referencias verificables.',
      category: 'EDUCATION',
      probability: 0.20,
      isGlobal: false,
      options: [
        {
          text: 'Pagar el bootcamp con tus ahorros actuales',
          explanation: 'La educacion relevante para tu area de trabajo tiene historicamente uno de los mejores retornos de inversion a largo plazo. El costo inmediato en liquidez es real pero un aumento de $300 mensuales en ingresos recupera la inversion en 4 meses.',
          effectMoney: -1200, effectIncome: 300, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: -1200, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Financiarlo con un credito educativo al 12% anual',
          explanation: 'El credito educativo puede tener sentido si el retorno esperado supera el costo del credito. Si el programa genera $300/mes de ingreso adicional y la cuota es $150/mes, la ecuacion es positiva. La deuda educativa es de las mas aceptadas financieramente.',
          effectMoney: 0, effectIncome: 300, effectExpenses: 0, effectDebt: 1200, effectScore: 5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota credito educativo: -$150 mensuales por 3 meses'
        },
        {
          text: 'Buscar cursos gratuitos o de muy bajo costo como alternativa',
          explanation: 'Plataformas de calidad ofrecen contenido de alto nivel a costo cero o minimo. La diferencia con programas pagados suele estar en la estructura, certificacion formal, red de contactos y atencion personalizada.',
          effectMoney: 0, effectIncome: 100, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ CREDITO ══════════════════════════════

    {
      name: 'Credito personal pre-aprobado',
      description: 'Tu banco te ofrece un credito personal de $5,000 al 18% anual pre-aprobado. No requiere justificar el destino y puedes tenerlo disponible en 24 horas.',
      category: 'CREDIT',
      probability: 0.22,
      isGlobal: false,
      options: [
        {
          text: 'Rechazar el credito por no tener necesidad urgente de ese dinero',
          explanation: 'La disponibilidad de credito no es razon para endeudarse. El dinero no solicitado no tiene costo. Tomar deuda sin un proposito claro y bien calculado es uno de los errores mas frecuentes en finanzas personales.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Tomar el credito para consolidar deudas con tasas mas altas',
          explanation: 'Consolidar deudas con una de menor tasa reduce el costo total del endeudamiento. La matematica funciona solo si la tasa nueva es inferior al promedio actual y no generas nueva deuda sobre la consolidada.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: -500, effectScore: 10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 4, consequenceDesc: 'Cuota consolidacion de deuda: -$140 mensuales por 4 meses'
        },
        {
          text: 'Tomar el credito para cubrir gastos del hogar, viajes y consumo general',
          explanation: 'Financiar consumo con deuda al 18% anual significa que cada compra cuesta un 18% mas de lo que parece. Un viaje de $2,000 financiado a 12 meses termina costando cerca de $2,200. El costo real suele ser invisible hasta que las cuotas acumulan.',
          effectMoney: 4000, effectIncome: 0, effectExpenses: 200, effectDebt: 5000, effectScore: -25,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 4, consequenceDesc: 'Cuota credito de consumo: -$200 mensuales por 4 meses'
        }
      ]
    },

    {
      name: 'Limite de tarjeta de credito aumentado',
      description: 'Tu banco aumento automaticamente el limite de tu tarjeta de credito de $1,000 a $3,500. Recibes una notificacion celebrandolo como un logro financiero.',
      category: 'CREDIT',
      probability: 0.20,
      isGlobal: false,
      options: [
        {
          text: 'Aprovechar el limite adicional para compras que tenias postergadas',
          explanation: 'El aumento de limite no es un aumento de ingresos. Gastar hasta el nuevo limite crea deuda real con intereses reales. Muchas personas confunden el credito disponible con dinero propio, lo que lleva a ciclos de endeudamiento progresivo.',
          effectMoney: 1000, effectIncome: 0, effectExpenses: 0, effectDebt: 1500, effectScore: -20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota tarjeta de credito elevada: -$180 mensuales por 3 meses'
        },
        {
          text: 'Mantener el mismo patron de gasto y pagar el saldo completo cada mes',
          explanation: 'Tener mayor limite disponible sin usarlo mejora la razon de utilizacion de credito, componente importante del score crediticio. Pagar el total mensual evita cualquier interes y construye historial positivo.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Solicitar al banco reducir el limite para mayor control del gasto',
          explanation: 'Reconocer los propios habitos de consumo y establecer limites externos es una forma valida y madura de gestion financiera. No todo el mundo se beneficia de tener mayor credito disponible.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ HIPOTECA ══════════════════════════════

    {
      name: 'Oportunidad de primera vivienda',
      description: 'Un departamento de $78,000 esta disponible en tu ciudad. Puedes dar $8,000 de pie y financiar el resto con hipoteca al 8.5% anual a 20 anos. La cuota mensual seria de $590.',
      category: 'MORTGAGE',
      probability: 0.10,
      isGlobal: false,
      options: [
        {
          text: 'Comprar el departamento con hipoteca ahora',
          explanation: 'Una hipoteca bien calculada construye patrimonio: cada cuota reduce la deuda y aumenta el activo. La regla es que la cuota no supere el 30% de tus ingresos y que mantengas fondo de emergencia separado. Comprar cuando los precios suben puede ser ventajoso.',
          effectMoney: -8000, effectIncome: 0, effectExpenses: 590, effectDebt: 70000, effectScore: 10,
          effectSavings: -5000, effectAssets: 78000, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Esperar y ahorrar durante 18 meses para un pie mayor',
          explanation: 'Un pie mas grande reduce la deuda hipotecaria, baja la cuota mensual y reduce los intereses totales pagados en 20 anos. El costo es el tiempo sin construir patrimonio propio y el riesgo de que los precios suban antes de comprar.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: 400, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Modo ahorro vivienda: +$400 adicionales mensuales al fondo de pie'
        },
        {
          text: 'Seguir arrendando e invertir el dinero del pie en bolsa',
          explanation: 'Arrendar vs comprar no tiene respuesta universal. Invertir el capital del pie puede generar retornos superiores a la apreciacion del inmueble en ciertos mercados. Depende del ratio precio-alquiler local, tasa hipotecaria disponible y alternativas de inversion.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 500,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ VEHICULOS ══════════════════════════════

    {
      name: 'Falla mecanica del vehiculo',
      description: 'Tu vehiculo sufrio una falla en el motor. La reparacion cuesta $950. Sin el auto tu movilidad hacia el trabajo se complica significativamente.',
      category: 'RISK',
      probability: 0.20,
      isGlobal: false,
      options: [
        {
          text: 'Pagar la reparacion con el fondo de emergencia',
          explanation: 'Este es exactamente el caso de uso del fondo de emergencia: un gasto inesperado y necesario. Cubrir $950 sin deuda demuestra que la planificacion funciona. La prioridad inmediata siguiente es reconstruir ese fondo.',
          effectMoney: -950, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 25,
          effectSavings: -950, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Financiar la reparacion con tarjeta de credito',
          explanation: 'La tarjeta es una opcion real cuando no hay fondos disponibles. El costo real depende de cuanto tiempo tardas en pagar. Saldado en el mismo mes: costo cero. Financiado a 6 meses al 24% APR: esa reparacion cuesta mas de $1,100.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 950, effectScore: -10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Cuota tarjeta reparacion vehiculo: -$200 mensuales por 2 meses'
        },
        {
          text: 'Vender el vehiculo y adaptarte a transporte publico',
          explanation: 'Eliminar el vehiculo reduce gastos fijos considerablemente: seguro, combustible, mantenimiento, depreciacion. El impacto en calidad de vida depende de la ciudad y la calidad del transporte publico disponible.',
          effectMoney: 1800, effectIncome: 0, effectExpenses: -180, effectDebt: 0, effectScore: 5,
          effectSavings: 1500, effectAssets: -2500, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    {
      name: 'Oportunidad de vehiculo de segunda mano',
      description: 'Un colega vende su auto en buen estado por $5,800. Un mecanico independiente lo reviso y confirma que esta en buenas condiciones. Te da 3 dias para decidir.',
      category: 'OPPORTUNITY',
      probability: 0.15,
      isGlobal: false,
      options: [
        {
          text: 'Comprarlo al contado con los ahorros disponibles',
          explanation: 'Pagar al contado elimina el costo de intereses y la presion de cuotas mensuales. El impacto es una reduccion significativa de liquidez y del fondo de emergencia que tarda meses en reconstruirse.',
          effectMoney: -5800, effectIncome: 0, effectExpenses: 150, effectDebt: 0, effectScore: 10,
          effectSavings: -5800, effectAssets: 5800, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Financiarlo a 3 anos con credito vehicular al 11%',
          explanation: 'El credito vehicular permite adquirir el activo sin agotar los ahorros. A 11% en 3 anos pagaras aproximadamente $7,000 en total por un auto de $5,800. La conveniencia tiene un precio real en intereses.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 150, effectDebt: 5800, effectScore: -5,
          effectSavings: 0, effectAssets: 5800, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota credito vehicular: -$210 mensuales por 3 meses'
        },
        {
          text: 'No comprar y continuar sin vehiculo propio',
          explanation: 'Un vehiculo es un activo que se deprecia: pierde valor desde el momento de la compra. Decidir no comprarlo cuando no es estrictamente necesario libera capital para metas con mejor retorno financiero.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ EMERGENCIAS ══════════════════════════════

    {
      name: 'Emergencia medica con cobertura parcial',
      description: 'Una lesion requiere cirugia ambulatoria urgente con costo total de $2,600. Tu seguro medico cubre el 50%. Debes resolver la diferencia antes de la cirugia.',
      category: 'RISK',
      probability: 0.20,
      isGlobal: false,
      options: [
        {
          text: 'Pagar los $1,300 de diferencia con el fondo de emergencia',
          explanation: 'El fondo de emergencia existe exactamente para esto. Cubrir una emergencia medica sin deuda es el resultado que justifica los meses de ahorro constante. La prioridad es recuperar ese fondo lo antes posible.',
          effectMoney: -1300, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 30,
          effectSavings: -1300, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Negociar un plan de pago directo con el centro medico',
          explanation: 'Muchas instituciones de salud ofrecen planes de pago en cuotas sin interes. Esta opcion requiere proactividad pero puede ser financieramente superior al credito bancario. Preservas el fondo de emergencia para otra situacion.',
          effectMoney: -200, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Plan de pago medico sin interes: -$550 mensuales por 2 meses'
        },
        {
          text: 'Cargar el gasto a la tarjeta de credito y pagar en cuotas',
          explanation: 'La tarjeta en emergencias medicas tiene costo alto si no se paga rapido. Al 24% APR, $1,300 financiados 6 meses suman mas de $1,500. Es una opcion valida cuando no hay alternativa, pero no la primera a elegir.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 1300, effectScore: -15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota medica en tarjeta de credito: -$150 mensuales por 3 meses'
        }
      ]
    },

    {
      name: 'Robo de equipo de trabajo',
      description: 'Te robaron la laptop y equipos que usas para trabajar, valorados en $1,600. Necesitas al menos una laptop operativa para continuar con tus actividades laborales.',
      category: 'RISK',
      probability: 0.12,
      isGlobal: false,
      options: [
        {
          text: 'Reclamar el seguro del hogar y pagar solo el deducible',
          explanation: 'Si tienes seguro de contenido del hogar, este es exactamente el caso de uso. Pagar el deducible y recibir la cobertura demuestra el valor real de los seguros. Sin seguro, este momento es la senal mas clara para contratarlo.',
          effectMoney: -250, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 25,
          effectSavings: -250, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Comprar equipo reacondicionado de segunda mano para reducir el costo',
          explanation: 'Adquirir lo esencial al menor costo posible cuando se trata de un bien de trabajo es prudente. Un equipo de segunda mano funcional puede costar la mitad que uno nuevo y cumplir perfectamente la funcion requerida.',
          effectMoney: -550, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: -550, effectAssets: 300, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Financiar equipos nuevos de alta gama con credito bancario',
          explanation: 'Equipos nuevos y de calidad pueden justificarse si son herramientas de trabajo que generan ingresos. La pregunta es si el incremento de productividad supera el costo del credito. Financiar herramientas de trabajo es diferente a financiar consumo.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 1800, effectScore: -15,
          effectSavings: 0, effectAssets: 1800, effectInvestments: 0,
          consequenceRounds: 3, consequenceDesc: 'Cuota credito equipos de trabajo: -$170 mensuales por 3 meses'
        }
      ]
    },

    // ══════════════════════════════ MACROECONOMIA ══════════════════════════════

    {
      name: 'Inflacion acelerada',
      description: 'La inflacion subio al 11% anual. El costo de alimentos, transporte y servicios basicos aumento considerablemente. Tu salario no ha recibido ajuste alguno.',
      category: 'CRISIS',
      probability: 0.20,
      isGlobal: true,
      options: [
        {
          text: 'Revisar el presupuesto y recortar gastos no esenciales',
          explanation: 'Ajustar el presupuesto ante la inflacion es la respuesta mas directa y sin costo. Identificar y eliminar gastos prescindibles preserva el poder adquisitivo sin necesidad de mas ingresos.',
          effectMoney: 0, effectIncome: 0, effectExpenses: -150, effectDebt: 0, effectScore: 20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Negociar un ajuste salarial por inflacion con tu empleador',
          explanation: 'Sin ajuste salarial, cada punto de inflacion es una reduccion real de ingresos. Negociar activamente es una habilidad financiero-laboral que la mayoria no ejerce. El momento de pedirlo es cuando la inflacion es un tema publico y documentado.',
          effectMoney: 0, effectIncome: 200, effectExpenses: 120, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Mantener el mismo nivel de gasto usando credito para compensar el alza',
          explanation: 'Usar deuda para mantener el nivel de vida ante inflacion es una de las decisiones mas costosas. La inflacion ya reduce el poder real de los ingresos; agregar intereses sobre eso profundiza considerablemente el deterioro financiero.',
          effectMoney: 500, effectIncome: 0, effectExpenses: 120, effectDebt: 800, effectScore: -25,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Deuda de consumo por inflacion: -$150 mensuales por 2 meses'
        }
      ]
    },

    {
      name: 'Recesion economica',
      description: 'El pais entro en recesion. El desempleo subio al 14%, las inversiones cayeron 30% y la incertidumbre es alta. Tu empleo no esta en riesgo inmediato pero el ambiente es tenso.',
      category: 'CRISIS',
      probability: 0.10,
      isGlobal: true,
      options: [
        {
          text: 'Aumentar agresivamente el fondo de emergencia y reducir exposicion al riesgo',
          explanation: 'En recesion la liquidez es el activo mas valioso. Tener 6 meses de gastos cubiertos reduce drasticamente el impacto de un eventual desempleo. Reducir riesgo en inversiones en recesion profunda prioriza conservar capital sobre rentabilidad.',
          effectMoney: 0, effectIncome: 0, effectExpenses: -100, effectDebt: 0, effectScore: 20,
          effectSavings: 300, effectAssets: 0, effectInvestments: -300,
          consequenceRounds: 2, consequenceDesc: 'Modo defensa: +$300 adicionales mensuales al fondo de emergencia'
        },
        {
          text: 'Invertir en activos que cayeron de precio aprovechando la recesion',
          explanation: 'Las recesiones crean oportunidades de compra en activos de calidad a precios reducidos. El riesgo es que la caida continue. Esta estrategia requiere horizonte de inversion de largo plazo, estabilidad laboral y sin necesidad de liquidar antes del tiempo.',
          effectMoney: -800, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 10,
          effectSavings: -800, effectAssets: 0, effectInvestments: 800,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Continuar con el comportamiento financiero habitual sin cambios',
          explanation: 'Si la situacion financiera personal es solida, mantener el rumbo puede ser correcto. Si existen vulnerabilidades como poco fondo de emergencia o deudas altas, ignorar el contexto macroeconomico puede agravar la situacion si la recesion se profundiza.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: -10,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ OPORTUNIDADES INESPERADAS ══════════════════════════════

    {
      name: 'Herencia familiar inesperada',
      description: 'Un familiar fallecido te dejo $4,500 en herencia. Es un ingreso completamente inesperado que no tenias contemplado en ninguna planificacion.',
      category: 'OPPORTUNITY',
      probability: 0.08,
      isGlobal: false,
      options: [
        {
          text: 'Destinar todo al pago de deudas pendientes',
          explanation: 'Eliminar deuda de alto interes con dinero inesperado es matematicamente optimo. Cada deuda pagada genera un retorno garantizado equivalente a la tasa de esa deuda. Sin deudas, el dinero fluye mas libremente hacia metas de largo plazo.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: -4500, effectScore: 40,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Invertir el total en un portafolio diversificado',
          explanation: 'Invertir un monto en un solo momento en lugar de gradualmente se llama lump-sum investing. Historicamente supera a la inversion gradual en la mayoria de escenarios. El unico riesgo es el momento de entrada si el mercado cae inmediatamente.',
          effectMoney: -4500, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 25,
          effectSavings: 0, effectAssets: 0, effectInvestments: 4500,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Distribuirlo entre fondo de emergencia, inversiones y un gasto personal significativo',
          explanation: 'La regla de los ingresos inesperados: primero deuda costosa, luego fondo de emergencia, luego inversion, luego algo para ti. Esta distribucion avanza varias metas simultaneamente y reconoce que el dinero tiene multiples funciones en la vida.',
          effectMoney: -500, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 30,
          effectSavings: 1500, effectAssets: 0, effectInvestments: 2500,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    {
      name: 'Bono de desempeno anual',
      description: 'La empresa tuvo un excelente ano y recibes un bono de desempeno de $1,800. Es un ingreso extraordinario no recurrente y no estaba en tus planes financieros del mes.',
      category: 'OPPORTUNITY',
      probability: 0.18,
      isGlobal: false,
      options: [
        {
          text: 'Invertirlo completamente en instrumentos de largo plazo',
          explanation: 'Los bonos e ingresos no recurrentes son oportunidades ideales para acelerar la inversion porque no afectan el presupuesto mensual. El efecto de ese capital invertido temprano se amplifica significativamente con el tiempo gracias al interes compuesto.',
          effectMoney: -1800, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 30,
          effectSavings: 0, effectAssets: 0, effectInvestments: 1800,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Usarlo para una experiencia o viaje que tenias planeado',
          explanation: 'Usar ingresos extraordinarios para experiencias sin afectar el presupuesto mensual es financieramente responsable si las finanzas base estan solidas. Las experiencias tienen valor real en calidad de vida que no siempre se captura en numeros.',
          effectMoney: -1800, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Distribuirlo entre pago de deuda, ahorro e inversion en partes iguales',
          explanation: 'La distribucion equilibrada de ingresos extraordinarios avanza multiples metas simultaneamente. Reduce deuda, fortalece el colchon de seguridad y hace crecer el patrimonio a largo plazo en una sola decision.',
          effectMoney: -300, effectIncome: 0, effectExpenses: 0, effectDebt: -600, effectScore: 25,
          effectSavings: 600, effectAssets: 0, effectInvestments: 300,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ SEGUROS ══════════════════════════════

    {
      name: 'Propuesta de seguro integral',
      description: 'Una aseguradora te ofrece un paquete de seguro de vida, invalidez y contenido del hogar por $85 mensuales. Actualmente no tienes ningun tipo de seguro contratado.',
      category: 'INSURANCE',
      probability: 0.20,
      isGlobal: false,
      options: [
        {
          text: 'Contratar el paquete completo de cobertura',
          explanation: 'Los seguros transfieren el riesgo de eventos de alta magnitud y baja probabilidad. Ochenta y cinco dolares mensuales pueden evitar una perdida de miles. La pregunta clave es si ese costo cabe en el presupuesto sin comprometer metas mas urgentes.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 85, effectDebt: 0, effectScore: 20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Contratar solo el seguro de vida por ahora y diferir el resto',
          explanation: 'Priorizar el seguro de vida cuando hay personas que dependen economicamente de ti es lo correcto. Los demas seguros pueden agregarse gradualmente segun el presupuesto lo permita. Proteger lo mas critico primero es una estrategia valida.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 30, effectDebt: 0, effectScore: 15,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'No contratar ningun seguro y reforzar el fondo de emergencia en su lugar',
          explanation: 'El fondo de emergencia cubre eventos de magnitud media. Los seguros protegen contra eventos catastroficos que el fondo no podria absorber. Son complementarios, no equivalentes. Sin seguro, una sola emergencia de gran escala puede destruir anos de ahorro.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: -5,
          effectSavings: 85, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ RIESGO Y FRAUDE ══════════════════════════════

    {
      name: 'Esquema de inversion con retornos garantizados',
      description: 'Te contactan via redes sociales con una plataforma que promete retornos garantizados del 25% mensual. Varios contactos conocidos dicen haber recibido pagos.',
      category: 'RISK',
      probability: 0.12,
      isGlobal: false,
      options: [
        {
          text: 'Invertir $500 para probar si realmente funciona',
          explanation: 'Los retornos garantizados del 25% mensual son economicamente imposibles de sostener de forma legitima. Los primeros inversores en esquemas fraudulentos reciben pagos reales que provienen del dinero de nuevos inversores. La mayoria pierde todo cuando el esquema colapsa.',
          effectMoney: -500, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: -30,
          effectSavings: -500, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Verificar la licencia de la empresa ante reguladores financieros antes de cualquier decision',
          explanation: 'Comprobar si una empresa de inversiones esta registrada ante la Superintendencia de Bancos o entidad reguladora equivalente es el primer paso obligatorio. Las senales de alerta incluyen: retornos garantizados altos, urgencia para invertir y estructura de referidos.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Rechazar de inmediato y reportar la oferta ante autoridades financieras',
          explanation: 'Denunciar posibles fraudes financieros protege a otras personas de perder su dinero. Las autoridades financieras tienen canales especificos para recibir denuncias. Actuar contribuye a un sistema financiero mas sano para todos.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 25,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ AHORRO ══════════════════════════════

    {
      name: 'Desafio de ahorro comunitario',
      description: 'Un grupo de ahorro te invita a un desafio de 3 meses donde cada participante se compromete a ahorrar $300 mensuales con seguimiento y responsabilidad mutua.',
      category: 'SAVINGS',
      probability: 0.22,
      isGlobal: false,
      options: [
        {
          text: 'Unirte al desafio con el compromiso de los $300 mensuales',
          explanation: 'Los compromisos publicos aumentan significativamente la probabilidad de cumplimiento por el efecto de responsabilidad social. Novecientos dolares ahorrados en 3 meses puede ser el avance concreto para completar el fondo de emergencia o iniciar una inversion.',
          effectMoney: -300, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 25,
          effectSavings: 300, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Desafio de ahorro activo: +$300 mensuales al fondo durante 2 meses adicionales'
        },
        {
          text: 'Participar con un monto menor adaptado a tu capacidad real',
          explanation: 'Comprometerse a un monto sostenible es mas efectivo que un objetivo ambicioso que se abandona. Un habito de ahorro de $150 mensuales constante durante anos supera a un esfuerzo de $300 que se interrumpe a los 2 meses.',
          effectMoney: -150, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 15,
          effectSavings: 150, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 2, consequenceDesc: 'Habito de ahorro sostenido: +$150 mensuales por 2 meses adicionales'
        },
        {
          text: 'No participar y continuar con tu estrategia de ahorro individual',
          explanation: 'Los grupos de ahorro son herramientas utiles pero no necesarias si ya tienes una estrategia propia funcionando. Lo que importa es la constancia del habito independientemente del formato. Un plan propio bien ejecutado es suficiente.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 0,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        }
      ]
    },

    // ══════════════════════════════ GASTOS DEL HOGAR ══════════════════════════════

    {
      name: 'Dano en el lugar de residencia',
      description: 'Una fuga de agua dano el techo y piso de tu departamento. El costo de reparacion urgente es de $750. Tu arrendador dice que primero debes pagar tu y el gestionara el seguro del edificio.',
      category: 'RISK',
      probability: 0.18,
      isGlobal: false,
      options: [
        {
          text: 'Pagar la reparacion con el fondo de emergencia y recuperar despues',
          explanation: 'El fondo de emergencia absorbe este tipo de gasto sin generar deuda. Pagar rapido evita que el dano se extienda. Si el arrendador tramita correctamente el seguro podrias recuperar parte o todo el desembolso.',
          effectMoney: -750, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 20,
          effectSavings: -750, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Revisar el contrato de arrendamiento y consultar asesoria legal antes de pagar',
          explanation: 'Los contratos de arrendamiento generalmente definen quien responde por danos estructurales vs danos por uso. Pagar algo que legalmente corresponde al arrendador es un error costoso. Conocer tus derechos antes de actuar puede evitar el gasto.',
          effectMoney: -80, effectIncome: 0, effectExpenses: 0, effectDebt: 0, effectScore: 15,
          effectSavings: -80, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 0, consequenceDesc: null
        },
        {
          text: 'Financiar la reparacion con tarjeta de credito y pagar en el siguiente ciclo',
          explanation: 'Si tienes certeza de pagar el saldo completo en el proximo corte, la tarjeta no genera interes. Si no puedes, $750 al 24% APR financiados 3 meses suman aproximadamente $840. Evaluar la capacidad de pago del ciclo siguiente es critico antes de usarla.',
          effectMoney: 0, effectIncome: 0, effectExpenses: 0, effectDebt: 750, effectScore: -5,
          effectSavings: 0, effectAssets: 0, effectInvestments: 0,
          consequenceRounds: 1, consequenceDesc: 'Cuota reparacion en tarjeta: -$375 en los proximos 2 meses'
        }
      ]
    }
  ];

  for (const event of events) {
    await prisma.simulatorEvent.create({
      data: {
        name: event.name,
        description: event.description,
        category: event.category as any,
        probability: event.probability,
        isGlobal: event.isGlobal,
        options: { create: event.options },
      },
    });
  }
  console.log(`OK Eventos del simulador creados: ${events.length} eventos, ${events.reduce((acc, e) => acc + e.options.length, 0)} opciones`);

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
  ];

  for (const achievement of achievements) {
    const exists = await prisma.achievement.findUnique({ where: { key: achievement.key } });
    if (!exists) {
      await prisma.achievement.create({
        data: { ...achievement, category: achievement.category as any },
      });
    }
  }
  console.log('✅ Logros creados');

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

  for (const reward of rewards) {
    const exists = await prisma.reward.findFirst({ where: { name: reward.name } });
    if (!exists) {
      await prisma.reward.create({
        data: { ...reward, type: reward.type as any, unlockType: reward.unlockType as any },
      });
    }
  }
  console.log('✅ Recompensas creadas');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());