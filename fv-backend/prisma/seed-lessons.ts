import 'dotenv/config';
import { PrismaClient, LessonType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type B = { type: string; text?: string; title?: string; items?: string[]; url?: string; question?: string; hint?: string; };
type L = { title: string; order: number; duration: number; xpReward: number; content: B[]; };
type MD = { order: number; lessons: L[]; };

const t = (text: string): B => ({ type: 'text', text });
const h = (text: string): B => ({ type: 'heading', text });
const kc = (title: string, text: string): B => ({ type: 'key_concept', title, text });
const ex = (title: string, text: string): B => ({ type: 'example', title, text });
const tip = (text: string): B => ({ type: 'tip', text });
const warn = (text: string): B => ({ type: 'warning', text });
const vid = (title: string, url: string): B => ({ type: 'video', title, url });
const lst = (title: string, items: string[]): B => ({ type: 'list', title, items });
const exc = (question: string, hint: string): B => ({ type: 'exercise', question, hint });

const DATA: MD[] = [
    {
        order: 1,
        lessons: [
            {
                title: 'Por que necesitas un presupuesto', order: 1, duration: 8, xpReward: 25,
                content: [
                    h('El punto de partida de tus finanzas'),
                    t('Sin saber cuanto ganas, cuanto gastas y en que, cualquier decision financiera es un disparo a ciegas. El presupuesto es el mapa que te dice donde estas y hacia donde vas.'),
                    kc('Presupuesto', 'Plan que asigna tus ingresos a categorias especificas de gasto y ahorro antes de que el mes comience.'),
                    t('La mayoria de personas con problemas financieros no los tienen por ganar poco, sino por no saber en que se va su dinero. El presupuesto resuelve exactamente ese problema.'),
                    ex('La fuga invisible', 'Si compras un cafe de $3 cada dia laboral, gastas $780 al ano sin notarlo. Un presupuesto hace visible este tipo de fuga.'),
                    tip('Registra todos tus gastos durante una semana antes de hacer tu presupuesto. Los resultados te sorprenderan.'),
                    vid('Como hacer un presupuesto personal desde cero', 'https://www.youtube.com/results?search_query=como+hacer+presupuesto+personal+desde+cero'),
                    exc('Anota todo lo que gastaste ayer, desde el transporte hasta el mas pequeno consumo. Suma el total.', 'Incluye pagos digitales, efectivo y transferencias.'),
                ]
            },
            {
                title: 'La Regla 50/30/20', order: 2, duration: 10, xpReward: 30,
                content: [
                    h('El sistema de presupuesto mas sencillo que existe'),
                    t('La regla 50/30/20 es el punto de partida ideal para quien nunca ha presupuestado. Divide cada dolar que recibes en tres grandes categorias con porcentajes fijos.'),
                    kc('Regla 50/30/20', 'El 50% del ingreso neto va a necesidades, el 30% a deseos, y el 20% a ahorro e inversion.'),
                    lst('Las tres categorias', [
                        '50% Necesidades: renta, alimentacion, transporte, servicios — lo que no puedes eliminar',
                        '30% Deseos: entretenimiento, ropa extra, salidas, suscripciones opcionales',
                        '20% Ahorro e inversion: fondo de emergencia, metas, inversion a largo plazo',
                    ]),
                    ex('Ingreso neto $700/mes', 'Necesidades: $350. Deseos: $210. Ahorro: $140. El 20% de ahorro es el minimo no negociable.'),
                    tip('Si el 50% no alcanza para necesidades, revisa si algunas son realmente deseos disfrazados.'),
                    warn('El 20% de ahorro es un minimo, no un maximo. Si puedes ahorrar mas, hazlo siempre.'),
                    vid('Regla 50 30 20 para manejar tu dinero', 'https://www.youtube.com/results?search_query=regla+50+30+20+presupuesto+personal'),
                    exc('Calcula cuanto deberia ir a cada categoria con tu ingreso mensual actual.', 'Usa tu ingreso neto: lo que llega a tu cuenta despues de descuentos.'),
                ]
            },
            {
                title: 'Gastos fijos vs gastos variables', order: 3, duration: 8, xpReward: 25,
                content: [
                    h('Conoce la naturaleza de tus gastos'),
                    t('Entender la diferencia entre gastos fijos y variables te permite saber donde tienes control real. Solo puedes recortar lo que puedes controlar.'),
                    kc('Gasto fijo', 'Se repite cada mes con el mismo valor y es dificil de eliminar a corto plazo. Ejemplo: arriendo, cuota de prestamo, plan de datos.'),
                    kc('Gasto variable', 'Cambia cada mes segun tus decisiones. Son los primeros candidatos a recortar cuando el presupuesto esta ajustado.'),
                    lst('Ejemplos practicos', [
                        'Fijos: arriendo $250, internet $25, cuota prestamo $80, seguro $30',
                        'Variables: alimentacion $120-180, transporte $40-70, entretenimiento $20-80',
                        'Semivariables: electricidad y agua (varian pero son necesidades)',
                    ]),
                    ex('Estrategia de recorte', 'Si necesitas reducir $100/mes: 2 suscripciones ($20) + menos salidas ($50) + cocinar mas en casa ($30) = $100. Mas facil que intentar bajar el arriendo.'),
                    tip('Lista todos tus gastos fijos. Ese total es tu piso financiero mensual minimo. Lo que sobre es con lo que tienes margen de decision.'),
                    exc('Clasifica tus ultimos 10 gastos en fijos o variables. Cual categoria suma mas?', 'Revisa tus extractos bancarios o app de pagos.'),
                ]
            },
            {
                title: 'Construye tu presupuesto real', order: 4, duration: 12, xpReward: 35,
                content: [
                    h('De la teoria a los numeros reales'),
                    t('Un presupuesto existe para ser usado, no guardado. Esta leccion te guia por el proceso completo para crear uno que se ajuste a tu vida real.'),
                    lst('Pasos para crear tu presupuesto', [
                        '1. Calcula tu ingreso neto real del mes',
                        '2. Lista todos los gastos fijos del mes',
                        '3. Estima gastos variables promedio de los ultimos 3 meses',
                        '4. Asigna porcentajes segun 50/30/20',
                        '5. Ingreso menos todos los gastos asignados debe ser cero',
                        '6. Registra gastos reales y compara con lo planeado al final del mes',
                    ]),
                    kc('Presupuesto base cero', 'Metodo donde cada dolar del ingreso tiene asignacion especifica. Ingreso menos gastos asignados = 0. Cada dolar tiene un proposito.'),
                    ex('Presupuesto real de $650/mes', 'Fijos: $255 (68%). Variables necesidades: $190. Total necesidades: $445. Deseos: $100. Ahorro: $105 (16%). Ajuste: reducir deseos $35 para llegar al 20% de ahorro.'),
                    warn('El primer presupuesto nunca es perfecto. El objetivo es aprender de la diferencia entre lo planeado y lo real.'),
                    tip('Revisa tu presupuesto los primeros 5 dias de cada mes, no al final: a fin de mes ya no puedes corregir nada.'),
                    vid('Metodo presupuesto base cero explicado', 'https://www.youtube.com/results?search_query=presupuesto+base+cero+finanzas+personales'),
                    exc('Crea tu presupuesto para el proximo mes siguiendo los 6 pasos. Guardalo para comparar al final del mes.', 'Usa la seccion de Finanzas de FinanzaViva para registrar tus metas de presupuesto.'),
                ]
            },
        ]
    },
    {
        order: 2,
        lessons: [
            {
                title: 'El habito del ahorro', order: 1, duration: 8, xpReward: 25,
                content: [
                    h('Ahorrar no es cuanto ganas, es cuanto conservas'),
                    t('El ahorro no es lo que sobra despues de gastar. Es lo que apartas primero. Este cambio de perspectiva es lo que separa a quienes acumulan riqueza de quienes no.'),
                    kc('Pagarte primero', 'Estrategia donde el ahorro se aparta automaticamente el dia que recibes tu ingreso, antes de pagar cualquier otro gasto.'),
                    ex('La diferencia en accion', 'Juan espera el sobrante para ahorrar y termina con $0. Maria aparta $80 el dia de cobro y al ano tiene $960 mas rendimientos. Mismo ingreso, resultado opuesto.'),
                    t('La automatizacion es el mejor aliado del ahorro. Una transferencia automatica el dia de cobro elimina la decision y la tentacion.'),
                    lst('Por que la gente no ahorra y como evitarlo', [
                        '"No me alcanza": revisa primero si hay deseos clasificados como necesidades',
                        '"Lo hare cuando gane mas": quien no ahorra con poco no ahorra con mucho',
                        '"Es muy poco para importar": $50/mes = $600/ano + interes compuesto',
                        '"No se donde guardar": cuenta de ahorro separada sin tarjeta de debito asociada',
                    ]),
                    tip('Comienza con el 5% si es todo lo que puedes. El habito importa mas que el monto. El porcentaje lo aumentas con el tiempo.'),
                    vid('Por que no puedes ahorrar y como cambiar eso', 'https://www.youtube.com/results?search_query=como+ahorrar+dinero+desde+cero+habito'),
                ]
            },
            {
                title: 'El poder del interes compuesto', order: 2, duration: 12, xpReward: 40,
                content: [
                    h('La formula que multiplica tu dinero con el tiempo'),
                    kc('Interes compuesto', 'Interes calculado sobre el capital inicial mas todos los intereses previamente acumulados. Genera crecimiento exponencial, no lineal.'),
                    t('En inversiones el interes compuesto construye riqueza. En deudas, la destruye. Es el mismo mecanismo funcionando a tu favor o en tu contra segun tus decisiones.'),
                    ex('El poder del tiempo sobre el dinero', 'Sofia invierte $100/mes desde los 22 al 8% anual. A los 65 tiene $389,000. Pedro invierte $200/mes desde los 35 al mismo 8%. A los 65 tiene $298,000. Sofia invirtio menos dinero total pero empezo antes.'),
                    kc('Regla del 72', 'Divide 72 entre la tasa de rendimiento anual para obtener los anos aproximados que tarda en duplicarse tu dinero. Al 8%: 72/8 = 9 anos.'),
                    lst('Frecuencias de capitalizacion', [
                        'Anual: el interes se suma al capital una vez al ano',
                        'Mensual: mas frecuente significa mas crecimiento',
                        'Diaria: la capitalizacion mas frecuente y beneficiosa para el inversor',
                    ]),
                    warn('El interes compuesto funciona en tu contra cuando tienes deudas. Una tarjeta al 25% APR puede triplicar una deuda en pocos anos si solo pagas el minimo.'),
                    vid('Interes compuesto la formula que cambia tu vida financiera', 'https://www.youtube.com/results?search_query=interes+compuesto+explicado+ejemplo+practico'),
                    exc('Calcula cuanto dinero tendras en 10 anos si ahorras $50/mes al 6% anual. Usa la Regla del 72 para estimar cuando se duplicara.', 'Busca "calculadora de interes compuesto" en Google para verificar el resultado.'),
                ]
            },
            {
                title: 'El fondo de emergencia', order: 3, duration: 10, xpReward: 30,
                content: [
                    h('Tu red de seguridad financiera'),
                    t('El fondo de emergencia es lo primero que debes construir antes de cualquier otra meta. Sin el, cualquier imprevisto destruye tu progreso y te mete en deuda.'),
                    kc('Fondo de emergencia', 'Dinero liquido guardado exclusivamente para gastos imprevistos urgentes: perdida de empleo, enfermedad, accidente o reparacion critica.'),
                    lst('Cuanto necesitas', [
                        'Minimo urgente: 1 mes de gastos totales',
                        'Basico recomendado: 3 meses de gastos totales',
                        'Ideal: 6 meses de gastos totales',
                        'Freelance o ingresos variables: 6-12 meses',
                    ]),
                    ex('El fondo en accion', 'Carlos tiene $900 (3 meses de gastos). Su telefono se rompe y necesita uno ($300). Lo paga con el fondo y lo reconstruye en 3 meses. Sin fondo habria usado la tarjeta y pagado intereses por meses.'),
                    warn('El fondo NO es para vacaciones, electrodomesticos nuevos ni oportunidades. Solo para emergencias reales. Si lo usas para otra cosa, dejas de tener proteccion.'),
                    tip('Guarda el fondo en una cuenta separada de tu cuenta corriente. La separacion fisica reduce la tentacion de gastarlo.'),
                    exc('Suma todos tus gastos fijos y variables de un mes y multiplicalo por 3. Ese es tu fondo ideal. Cuanto tienes actualmente vs cuanto necesitas?', 'Se honesto. Esta cifra es tu meta de ahorro prioritaria antes que cualquier inversion.'),
                ]
            },
            {
                title: 'Estrategias para ahorrar mas', order: 4, duration: 12, xpReward: 35,
                content: [
                    h('Tecnicas que funcionan incluso cuando la motivacion falta'),
                    t('Saber que debes ahorrar no es suficiente. Necesitas sistemas que funcionen sin depender de la fuerza de voluntad.'),
                    lst('Estrategias de alto impacto', [
                        'Ahorro automatico: transferencia programada el dia de cobro sin decision manual',
                        'Cuenta separada sin debito: el fondo no tiene tarjeta para acceder facilmente',
                        'Regla 48 horas: espera 2 dias antes de cualquier compra no planeada',
                        'Reto del dinero extra: cada ingreso extra va 50% a ahorro',
                        'Dias sin gastar: 1-2 dias por semana de cero gastos discrecionales',
                    ]),
                    ex('Reto de ahorro de $1,000 en 52 semanas', 'Semana 1: $1, semana 2: $2... semana 52: $52. Total al final del ano: $1,378. Un sistema gradual que construye habito antes de que los montos sean grandes.'),
                    kc('APY (Annual Percentage Yield)', 'Tasa de rendimiento real de una cuenta de ahorro considerando la capitalizacion compuesta. Siempre compara APY, no la tasa nominal, al elegir donde guardar tu ahorro.'),
                    t('La diferencia entre un APY de 0.1% y uno de 5% en $5,000 es $245 adicionales al ano en intereses. Vale la pena buscar cuentas con mayor APY.'),
                    tip('Gamifica tu ahorro: celebra cada hito con algo pequeno, comparte tu progreso con alguien de confianza y usa metas visuales para mantener la motivacion.'),
                    vid('Estrategias para ahorrar mas dinero cada mes', 'https://www.youtube.com/results?search_query=estrategias+ahorro+dinero+mensual+finanzas+personales'),
                ]
            },
        ]
    },
    {
        order: 3,
        lessons: [
            {
                title: 'Como funciona el credito', order: 1, duration: 10, xpReward: 30,
                content: [
                    h('El credito: herramienta o trampa segun como lo uses'),
                    t('El credito no es bueno ni malo por si mismo. Es una herramienta que puede acelerar tus metas o destruir tu economia dependiendo de como lo manejes.'),
                    kc('Credito', 'Acuerdo por el cual un prestamista entrega dinero hoy a cambio del compromiso de devolver ese monto mas intereses en el futuro.'),
                    lst('Componentes clave de cualquier credito', [
                        'Capital: el monto que pides prestado',
                        'Tasa de interes (APR): el costo anual del credito en porcentaje',
                        'Plazo: el tiempo que tienes para devolver el dinero',
                        'Cuota: pago periodico que cubre capital e intereses',
                        'Total pagado: capital + todos los intereses = lo que realmente cuesta el credito',
                    ]),
                    ex('El costo real de un credito', 'Pides $1,000 al 24% anual a 12 meses. Cuota: ~$94/mes. Total pagado: ~$1,128. Costo real del credito: $128. A mayor plazo el costo crece exponencialmente.'),
                    warn('Antes de firmar, calcula el total que pagaras (cuota x numero de pagos). Ese numero, no la cuota mensual, es lo que realmente cuesta el prestamo.'),
                    vid('Como funciona el credito y los prestamos', 'https://www.youtube.com/results?search_query=como+funciona+el+credito+prestamos+interes+cuota'),
                ]
            },
            {
                title: 'Tarjetas de credito sin endeudarse', order: 2, duration: 12, xpReward: 35,
                content: [
                    h('Como usar tarjetas de credito a tu favor'),
                    t('Las tarjetas tienen tasas de 20-50% anual. Usadas correctamente son herramientas valiosas; usadas mal, son la via rapida al sobreendeudamiento.'),
                    kc('Periodo de gracia', 'Tiempo entre el cierre del ciclo de facturacion y la fecha limite de pago donde puedes saldar el saldo total SIN pagar intereses.'),
                    lst('Las 3 reglas de oro', [
                        'Nunca compres con tarjeta lo que no puedes pagar en efectivo ese mismo dia',
                        'Paga el saldo TOTAL antes del vencimiento, nunca solo el minimo',
                        'Tu limite de credito no es tu presupuesto: ignorar esto es el error mas comun',
                    ]),
                    ex('El error del pago minimo', 'Deuda de $500 al 30% anual pagando solo $15/mes: tardas mas de 4 anos y pagas casi $300 en intereses. Pagando $80/mes: saldada en 7 meses con $60 en intereses.'),
                    tip('Usa la tarjeta SOLO para gastos ya presupuestados. La tarjeta es el medio de pago, no una ampliacion de tu presupuesto.'),
                    warn('La cuota sin interes puede convenirte si la tienda asume el costo financiero. Si no, estas pagando ese interes disfrazado en el precio del producto.'),
                    vid('Como usar tarjeta de credito correctamente y sin deudas', 'https://www.youtube.com/results?search_query=como+usar+tarjeta+credito+sin+endeudarse'),
                    exc('Revisa tu ultimo estado de cuenta. Cual fue el saldo que pagaste vs el saldo total? Calculaste los intereses que pagaste ese mes?', 'El estado de cuenta muestra el cargo por interes de forma explicita.'),
                ]
            },
            {
                title: 'Metodos para salir de deudas', order: 3, duration: 12, xpReward: 40,
                content: [
                    h('Estrategias para eliminar deudas de consumo'),
                    t('Las deudas de consumo (tarjetas, prestamos personales) son como remar con un ancla. Eliminarlas debe ser prioridad antes de empezar a invertir en serio.'),
                    kc('Metodo Avalancha', 'Pagar primero la deuda con mayor tasa de interes mientras se hacen pagos minimos en las demas. Matematicamente optimo: ahorra mas en intereses totales.'),
                    kc('Metodo Bola de Nieve', 'Pagar primero la deuda mas pequena para eliminarla rapido. Psicologicamente efectivo: las victorias rapidas mantienen la motivacion.'),
                    ex('Avalancha en accion', 'Deudas: Tarjeta A $1,200 al 28%, Tarjeta B $3,000 al 18%, Prestamo $800 al 12%. Ataca Tarjeta A primero. Al eliminarla, ese dinero va a Tarjeta B. Ahorras mas en intereses que con bola de nieve.'),
                    lst('Paso a paso para salir de deudas', [
                        '1. Lista todas tus deudas: monto, tasa, cuota minima',
                        '2. Elige tu metodo: avalancha (menor costo) o bola de nieve (mayor motivacion)',
                        '3. Paga minimos en TODAS las deudas menos la objetivo',
                        '4. Cada peso extra disponible va a la deuda objetivo',
                        '5. Al liquidar una deuda, su cuota pasa completa a la siguiente',
                    ]),
                    tip('Consolidar deudas puede ser util si obtienes tasa menor al promedio actual. Pero sin cambiar el habito que genero las deudas, en 2 anos puedes volver al mismo punto.'),
                    vid('Metodo avalancha vs bola de nieve para pagar deudas', 'https://www.youtube.com/results?search_query=metodo+avalancha+bola+nieve+pagar+deudas+rapido'),
                ]
            },
            {
                title: 'Tu historial crediticio', order: 4, duration: 10, xpReward: 35,
                content: [
                    h('Tu reputacion financiera importa'),
                    t('El historial crediticio es el registro de como has manejado tus deudas. Un buen historial abre puertas: mejores tasas, mas acceso a credito y mejor consideracion en ciertos empleos.'),
                    kc('Score crediticio', 'Numero que resume tu historial en una escala. Los buros de credito (como Equifax) calculan este puntaje basandose en tu comportamiento de pago.'),
                    lst('Factores que construyen buen historial', [
                        'Pagos a tiempo: el factor mas importante, ~35% del score',
                        'Nivel de utilizacion: usar menos del 30% de tu limite es ideal',
                        'Antiguedad del historial: cuentas mas antiguas suman puntos',
                        'Tipos de credito: variedad de productos suma al score',
                        'Consultas recientes: muchas solicitudes en poco tiempo pueden bajarlo',
                    ]),
                    ex('Construir historial desde cero', 'Solicita una tarjeta de credito asegurada (depositas tu propio dinero como garantia). Usala para compras pequenas y paga el saldo completo cada mes. En 6-12 meses tendras historial positivo.'),
                    warn('Un solo pago tardio puede afectar tu score por hasta 7 anos. Si no puedes pagar, llama a tu banco ANTES del vencimiento para renegociar. No esperes a que venza.'),
                    tip('Revisa tu buro de credito al menos una vez al ano. Detecta errores y reportalos inmediatamente: los errores en el buro son mas comunes de lo que crees.'),
                    vid('Como mejorar tu historial crediticio y score', 'https://www.youtube.com/results?search_query=como+mejorar+historial+crediticio+score+burocredito'),
                ]
            },
        ]
    },
    {
        order: 4,
        lessons: [
            {
                title: 'Por que invertir es mejor que solo ahorrar', order: 1, duration: 10, xpReward: 35,
                content: [
                    h('El dinero que no trabaja pierde valor'),
                    t('Ahorrar es necesario pero no suficiente. La inflacion reduce el poder de compra de tu dinero cada ano. Invertir es la unica forma de hacer que crezca mas rapido que la inflacion.'),
                    kc('Inflacion', 'Aumento generalizado y sostenido de los precios. Si la inflacion es 5% anual y tu ahorro rinde 2%, pierdes 3% de poder adquisitivo cada ano aunque el numero en tu cuenta suba.'),
                    ex('El costo de no invertir', '$10,000 al 1% durante 20 anos: $12,200. Los mismos $10,000 al 8% durante 20 anos: $46,610. Diferencia de $34,000 solo por tomar la decision de invertir.'),
                    kc('ROI (Return on Investment)', '(Ganancia - Costo) / Costo x 100. Un ROI del 20% significa que por cada $100 invertidos ganaste $20 adicionales.'),
                    lst('La jerarquia de las finanzas personales', [
                        '1. Fondo de emergencia (3-6 meses) — prioridad maxima',
                        '2. Eliminar deudas de alto interes (+15%) — antes de invertir',
                        '3. Invertir para largo plazo — una vez estabilizado lo anterior',
                        '4. Pagar deudas de bajo interes — en paralelo con la inversion',
                    ]),
                    tip('No necesitas mucho dinero para empezar. Muchos fondos permiten desde $10-50/mes. El habito importa mas que el monto inicial.'),
                    vid('Por que invertir en lugar de solo ahorrar', 'https://www.youtube.com/results?search_query=por+que+invertir+dinero+lugar+ahorrar+inflacion'),
                ]
            },
            {
                title: 'Tipos de activos financieros', order: 2, duration: 12, xpReward: 40,
                content: [
                    h('El universo de opciones para invertir'),
                    t('Un activo es algo que posees y que genera valor o ingresos. Entender los principales tipos te permite construir una cartera diversificada adecuada a tus objetivos.'),
                    kc('Acciones (renta variable)', 'Fraccion de propiedad en una empresa. Su valor sube o baja segun el desempeno de la empresa y el mercado. Mayor riesgo, mayor potencial de retorno.'),
                    kc('Bonos (renta fija)', 'Prestamo que le haces a una empresa o gobierno. Te pagan interes fijo periodico y devuelven el capital al vencimiento. Menor riesgo y retorno que acciones.'),
                    kc('Fondos de inversion', 'Conjunto de activos administrado colectivamente. Permiten diversificacion con pequenas cantidades de capital.'),
                    lst('Comparativa rapida', [
                        'Efectivo/depositos: riesgo minimo, rendimiento minimo, liquidez alta',
                        'Bonos gobierno: riesgo bajo, rendimiento bajo-moderado',
                        'Acciones establecidas: riesgo moderado, rendimiento moderado-alto',
                        'Acciones pequenas: riesgo alto, rendimiento potencial alto',
                        'Criptomonedas: riesgo muy alto, volatilidad extrema, imprevisible',
                    ]),
                    warn('No inviertas en lo que no entiendes. Si no puedes explicar como funciona un activo y como podrias perder dinero, no deberias invertir en el todavia.'),
                    vid('Tipos de activos financieros para principiantes', 'https://www.youtube.com/results?search_query=tipos+activos+financieros+acciones+bonos+principiantes'),
                ]
            },
            {
                title: 'Riesgo, rendimiento y diversificacion', order: 3, duration: 12, xpReward: 40,
                content: [
                    h('La trifecta que define toda decision de inversion'),
                    kc('Relacion riesgo-rendimiento', 'A mayor riesgo asumido, mayor rendimiento esperado. No existe alto rendimiento con bajo riesgo. Si alguien te lo ofrece, es una estafa.'),
                    t('Tu tolerancia al riesgo depende de: tu horizonte de inversion, tu capacidad de asumir perdidas economicamente, y tu temperamento (podrias dormir si tu cartera cae 30%?).'),
                    kc('Diversificacion', 'Distribuir inversiones en diferentes activos, sectores y geografias para reducir el impacto de que un solo activo caiga.'),
                    ex('Diversificacion en practica', 'Cartera concentrada: 100% en una empresa tecnologica. Si cae 50%, perdiste el 50%. Cartera diversificada: 40% acciones varios sectores + 30% bonos + 20% ETF global + 10% efectivo. Si tecnologicas caen 50%, tu cartera cae ~10%.'),
                    lst('Tipos de riesgo a conocer', [
                        'Riesgo especifico: de una empresa (se elimina diversificando)',
                        'Riesgo de mercado: afecta todo el mercado (no se puede eliminar, solo tolerar)',
                        'Riesgo de liquidez: no poder vender rapidamente sin perder valor',
                        'Riesgo de inflacion: que el rendimiento no supere la inflacion',
                    ]),
                    tip('El horizonte temporal es el parametro mas importante. Con 30 anos puedes tolerar alta volatilidad. Con 2 anos necesitas estabilidad.'),
                    vid('Como diversificar tu cartera de inversiones', 'https://www.youtube.com/results?search_query=diversificacion+cartera+inversiones+como+reducir+riesgo'),
                ]
            },
            {
                title: 'Tu primera inversion paso a paso', order: 4, duration: 15, xpReward: 45,
                content: [
                    h('Del conocimiento a la accion'),
                    t('El mayor error de principiantes es esperar el momento perfecto o tener suficiente dinero. El mejor momento para empezar a invertir es hoy, con lo que tienes.'),
                    lst('Lista de verificacion antes de invertir', [
                        'Tienes fondo de emergencia de al menos 1 mes? Si no, construyelo primero',
                        'Tienes deudas al +15%? Si, prioriza pagarlas. Si no, puedes invertir en paralelo',
                        'Entiendes el activo? Si no, educate primero',
                        'Tienes horizonte de inversion definido? Define para que y cuando necesitas el dinero',
                    ]),
                    kc('DCA (Dollar Cost Averaging)', 'Estrategia de invertir una cantidad fija periodicamente sin importar el precio. Reduce el riesgo de invertir todo en el peor momento.'),
                    ex('DCA en practica', 'En lugar de invertir $1,200 de una vez, inviertes $100 cada mes durante 12 meses. Cuando el precio baja, compras mas unidades. Cuando sube, compras menos. El costo promedio es mejor que el de quien invirtio todo en un dia.'),
                    warn('Desconfia de plataformas que prometen rendimientos garantizados del 10-30% mensual. Son piramides o fraudes. Las inversiones legitimas no garantizan rendimientos.'),
                    tip('Lee el prospecto de cualquier fondo antes de invertir. Si no entiendes los riesgos descritos ahi, busca uno mas sencillo.'),
                    vid('Como empezar a invertir desde cero guia completa', 'https://www.youtube.com/results?search_query=como+empezar+invertir+desde+cero+paso+a+paso'),
                ]
            },
        ]
    },
    {
        order: 5,
        lessons: [
            {
                title: 'La bolsa de valores explicada', order: 1, duration: 12, xpReward: 40,
                content: [
                    h('Donde se compran y venden participaciones de empresas'),
                    kc('Bolsa de valores', 'Mercado organizado donde inversores compran y venden acciones, bonos y otros instrumentos. Permite a empresas obtener capital del publico.'),
                    t('La bolsa no es un casino. A largo plazo refleja el crecimiento real de empresas y la economia. El S&P 500 ha retornado en promedio 10% anual durante los ultimos 100 anos a pesar de guerras, crisis y pandemias.'),
                    lst('Como funciona una transaccion', [
                        '1. El inversor da una orden de compra a su broker',
                        '2. El broker ejecuta la orden al precio disponible en mercado',
                        '3. La transaccion se liquida en 1-2 dias habiles',
                        '4. El inversor recibe las acciones en su cuenta',
                    ]),
                    kc('Capitalizacion de mercado', 'Precio de la accion multiplicado por el total de acciones. Indica el tamano relativo de una empresa.'),
                    ex('Indices como termometros del mercado', 'El S&P 500 mide las 500 empresas mas grandes de EE.UU. Cuando sube, el mercado va bien en general. Es el indice mas seguido del mundo.'),
                    tip('El mercado siempre se recupera a largo plazo. Las crisis de 2008 y 2020 generaron caidas severas pero quienes mantuvieron sus inversiones recuperaron todo en 1-5 anos.'),
                    vid('Como funciona la bolsa de valores explicacion simple', 'https://www.youtube.com/results?search_query=como+funciona+bolsa+valores+explicacion+simple+principiantes'),
                ]
            },
            {
                title: 'Acciones vs bonos', order: 2, duration: 12, xpReward: 40,
                content: [
                    h('Los dos pilares de cualquier cartera de inversion'),
                    kc('Accion', 'Titulo de propiedad en una empresa. Si la empresa crece, el valor de tu accion sube y puedes recibir dividendos.'),
                    kc('Bono', 'Instrumento de deuda: le prestas dinero a una empresa o gobierno y te pagan interes fijo periodico mas devolucion del capital al vencimiento.'),
                    lst('Comparativa directa', [
                        'Acciones: mayor riesgo, mayor retorno potencial, volatilidad alta, sin vencimiento fijo',
                        'Bonos: menor riesgo, retorno predecible, volatilidad baja, vencimiento definido',
                        'Acciones: ganas por apreciacion del precio y dividendos (variables)',
                        'Bonos: ganas por pagos de cupon (fijos) y devolucion del capital',
                    ]),
                    ex('Por que tener ambos', 'En 2008 las acciones cayeron 50%. Los bonos del gobierno subieron porque los inversores buscaron seguridad. Una cartera 60/40 cayo solo 25% en esa crisis.'),
                    kc('P/E Ratio (Precio/Ganancia)', 'Precio de la accion dividido entre ganancias por accion. P/E alto puede indicar sobrevaluacion o grandes expectativas de crecimiento.'),
                    tip('Para horizontes mayores a 10 anos: mayor peso en acciones. Para menores a 5 anos: mayor peso en bonos. Ajusta segun tu tolerancia al riesgo.'),
                    vid('Diferencias entre acciones y bonos para inversores', 'https://www.youtube.com/results?search_query=acciones+vs+bonos+diferencias+inversion+principiantes'),
                ]
            },
            {
                title: 'ETFs e indices bursatiles', order: 3, duration: 12, xpReward: 45,
                content: [
                    h('La forma mas inteligente de invertir para principiantes'),
                    kc('Indice bursatil', 'Indicador que mide el desempeno de un grupo de acciones. Ejemplos: S&P 500 (500 mayores EE.UU.), NASDAQ (tecnologicas), MSCI World (global).'),
                    kc('ETF (Exchange Traded Fund)', 'Fondo que replica un indice y se negocia en bolsa como una accion. Te da exposicion a cientos de empresas en una sola compra con comisiones muy bajas.'),
                    ex('El impacto brutal de las comisiones', 'Fondo activo al 1.5% anual vs ETF al 0.1%. En $10,000 durante 30 anos al 8%: el fondo activo deja $74,000. El ETF deja $96,000. La diferencia de 1.4% en comision cuesta $22,000.'),
                    lst('ETFs conocidos para empezar', [
                        'SPY o VOO: replica el S&P 500, las 500 mayores empresas de EE.UU.',
                        'QQQ: replica el NASDAQ 100, enfocado en tecnologicas',
                        'VTI: cubre todo el mercado de EE.UU.',
                        'VT: mercado global completo (desarrollados y emergentes)',
                        'BND: bonos diversificados de EE.UU. para balancear la cartera',
                    ]),
                    tip('John Bogle, fundador de Vanguard, demostro que la mayoria de gestores activos no superan al indice en 10+ anos. Los ETFs de bajo costo ganan a largo plazo.'),
                    vid('Que son los ETFs y como invertir en ellos', 'https://www.youtube.com/results?search_query=que+son+ETFs+como+invertir+fondos+indexados+principiantes'),
                ]
            },
            {
                title: 'Estrategia para invertir en bolsa', order: 4, duration: 15, xpReward: 45,
                content: [
                    h('Principios de inversion que sobreviven el paso del tiempo'),
                    t('La estrategia mas exitosa para el inversor promedio no es compleja: inversion periodica, diversificacion global, horizontes largos y costos bajos. Todo lo demas es ruido.'),
                    lst('Las 5 reglas del inversor inteligente', [
                        '1. Invierte regularmente (DCA) sin importar si el mercado sube o baja',
                        '2. Nunca vendas por panico durante caidas del mercado',
                        '3. Mantén costos bajos: fondos indexados, evita trading activo',
                        '4. Diversifica globalmente: no solo tu pais ni un solo sector',
                        '5. Reinvierte los dividendos para maximizar el interes compuesto',
                    ]),
                    kc('Bull y Bear market', 'Bull market: tendencia de alza sostenida. Bear market: caida del 20%+ desde el maximo. Los bear markets son normales, temporales y necesarios.'),
                    warn('El day trading es altamente especulativo. Mas del 90% de day traders pierden dinero en el primer ano. No es inversion, es especulacion.'),
                    ex('La estrategia simple que gana', 'Invierte $200/mes en ETF del S&P 500 desde los 25 hasta los 65 anos. Sin analizar stocks ni hacer market timing. Resultado estimado al 8% anual: $700,000+.'),
                    tip('El mayor enemigo del inversor es el inversor mismo. El impulso de hacer algo durante la volatilidad suele destruir valor. La mejor accion frecuentemente es no hacer nada.'),
                    vid('Estrategia de inversion en bolsa largo plazo para principiantes', 'https://www.youtube.com/results?search_query=estrategia+inversion+bolsa+largo+plazo+principiantes+ETF'),
                ]
            },
        ]
    },
    {
        order: 6,
        lessons: [
            {
                title: 'Por que necesitas seguros', order: 1, duration: 8, xpReward: 30,
                content: [
                    h('Proteger lo que construiste'),
                    t('Puedes hacer todo bien: presupuestar, ahorrar, invertir. Un solo evento sin seguro puede destruir anos de progreso financiero en un instante.'),
                    kc('Seguro', 'Contrato que transfiere el riesgo financiero de eventos adversos desde el asegurado hacia la aseguradora, a cambio del pago periodico de una prima.'),
                    t('El objetivo del seguro NO es generar ganancia. Es proteccion: convertir una perdida potencialmente catastrofica en un costo predecible y manejable.'),
                    ex('El seguro que evita la ruina', 'Sin seguro medico, una hospitalizacion de 3 dias por apendicitis puede costar $4,000-8,000. Con seguro con deducible $200, tu costo es $200. La prima anual podria ser $600. Costo-beneficio claro.'),
                    lst('Eventos que un seguro protege', [
                        'Enfermedad o accidente: seguro medico',
                        'Muerte o invalidez: seguro de vida y accidentes',
                        'Dano a vehiculo propio o ajeno: seguro de auto',
                        'Incendio o robo en el hogar: seguro de hogar',
                        'Demandas por dano a terceros: responsabilidad civil',
                    ]),
                    tip('Piensa en los seguros como una suscripcion a la tranquilidad financiera. Evalualos por lo que te protegen cuando pasa lo peor, no por lo que gastas cuando no pasa nada.'),
                    vid('Por que los seguros son importantes para tus finanzas', 'https://www.youtube.com/results?search_query=importancia+seguros+finanzas+personales+jovenes'),
                ]
            },
            {
                title: 'Los seguros que todo joven necesita', order: 2, duration: 10, xpReward: 35,
                content: [
                    h('Prioridades de cobertura segun tu etapa de vida'),
                    t('No todos los seguros son necesarios para todos. La clave es identificar cuales riesgos, si ocurrieran, te destruirian financieramente y asegurar esos primero.'),
                    lst('Prioridad 1: esenciales para jovenes', [
                        'Seguro medico: el mas urgente, sin el cualquier emergencia de salud es ruinosa',
                        'Seguro de vida: urgente solo si tienes personas que dependen de tus ingresos',
                        'Seguro de auto: obligatorio si tienes vehiculo, incluyendo responsabilidad civil',
                    ]),
                    lst('Prioridad 2: recomendados', [
                        'Accidentes personales: cubre invalidez temporal, muy accesible en precio',
                        'Seguro de desempleo: disponible en algunos paises para cubrir ingresos si perdes el trabajo',
                        'Seguro de contenidos: si rentas, protege tus bienes personales',
                    ]),
                    kc('Principio del peor escenario', 'Si X ocurriera, podria recuperarme financieramente sin seguro? Si la respuesta es no, eso necesitas asegurar. Si si (puedes pagarlo de tu fondo de emergencia), el seguro es opcional.'),
                    ex('Joven 22 anos sin dependientes, sueldo $600', 'Prioridades: seguro medico ($50-80/mes) + si tiene auto, seguro de auto ($40-60/mes). Seguro de vida: puede esperar hasta tener dependientes. Total: ~$120-140/mes de proteccion basica.'),
                    warn('El seguro del empleador puede no cubrir todos tus riesgos. Revisar que cubre y que no es parte fundamental de entender tu proteccion real.'),
                    vid('Que seguros necesita un joven adulto', 'https://www.youtube.com/results?search_query=que+seguros+necesita+joven+adulto+finanzas'),
                ]
            },
            {
                title: 'Como leer y elegir una poliza', order: 3, duration: 12, xpReward: 40,
                content: [
                    h('El contrato que necesitas entender antes de firmar'),
                    t('La mayoria compra seguros sin leer la poliza. Luego, en la emergencia, descubren que su caso era una exclusion. Entender la poliza es proteccion adicional.'),
                    lst('Terminos clave de cualquier poliza', [
                        'Prima: lo que pagas periodicamente para mantener el seguro',
                        'Deducible: lo que pagas tu primero antes de que el seguro cubra el resto',
                        'Limite de cobertura: maximo que la aseguradora pagara por siniestro o al ano',
                        'Coaseguro: porcentaje del costo que compartes con la aseguradora tras el deducible',
                        'Exclusiones: situaciones que la poliza NO cubre (leer siempre con atencion)',
                    ]),
                    kc('Coaseguro 80/20', 'El seguro paga 80% de los costos cubiertos despues del deducible y tu pagas 20%. Existe para que el asegurado no use el seguro de forma excesiva.'),
                    ex('El deducible como herramienta de ahorro', 'Poliza con deducible $200: prima $60/mes. Poliza con deducible $1,000: prima $35/mes. Si usas el seguro una vez al ano, con deducible alto ahorras $300/ano en primas pero pagas $800 mas en emergencia. Ideal si eres sano y tienes fondo de emergencia.'),
                    lst('Checklist antes de contratar', [
                        'Lee las exclusiones: que situaciones especificas no cubre?',
                        'Verifica el limite anual: es suficiente para el peor escenario?',
                        'Compara al menos 3 aseguradoras con la misma cobertura',
                        'Revisa la reputacion de la aseguradora en pago de siniestros',
                    ]),
                    vid('Como leer y comparar polizas de seguro', 'https://www.youtube.com/results?search_query=como+leer+poliza+seguro+terminos+deducible+cobertura'),
                ]
            },
            {
                title: 'Seguro medico y de vida a fondo', order: 4, duration: 12, xpReward: 40,
                content: [
                    h('Los dos seguros que mas impacto tienen'),
                    t('El seguro medico protege tu patrimonio de los costos de enfermedad. El seguro de vida protege a quienes dependen de tus ingresos. Juntos cubren los dos riesgos mas devastadores.'),
                    kc('Seguro de vida a termino', 'Cubre por un periodo definido (10, 20, 30 anos). Mas barato que el permanente. Ideal si tienes dependientes temporales.'),
                    kc('Seguro de vida permanente', 'Cubre toda la vida y acumula valor en efectivo. Mucho mas costoso. Solo tiene sentido para planificacion patrimonial especifica.'),
                    ex('Cuanto seguro de vida necesito', 'Regla general: 10-12 veces tu ingreso anual. Si ganas $800/mes ($9,600/ano), necesitas seguro de $96,000-115,000. Cubre los anos que tus dependientes necesitarian tu ingreso.'),
                    lst('Tipos de seguros medicos', [
                        'Privado individual: contratado directamente, mayor flexibilidad de cobertura',
                        'Colectivo del empleador: generalmente mas economico, cubre solo mientras empleado',
                        'IESS (Ecuador): cobertura basica obligatoria para empleados formales',
                        'Complementario: se suma al estatal para ampliar coberturas y reducir copagos',
                    ]),
                    tip('Para jovenes sanos sin dependientes: prioriza seguro medico. Cuando tengas dependientes, agrega seguro de vida a termino. El costo es mucho menor cuando eres joven y sano.'),
                    warn('El seguro de vida permanente suele venderse como inversion. En la gran mayoria de casos, es mejor seguro de vida a termino barato e invertir la diferencia por tu cuenta.'),
                    vid('Seguro de vida termino vs permanente cual elegir', 'https://www.youtube.com/results?search_query=seguro+vida+termino+vs+permanente+cual+elegir'),
                ]
            },
        ]
    },
    {
        order: 7,
        lessons: [
            {
                title: 'Metas financieras SMART', order: 1, duration: 12, xpReward: 45,
                content: [
                    h('La diferencia entre deseos y metas reales'),
                    t('"Quiero ahorrar mas" no es una meta. "Ahorrare $150/mes durante 8 meses para tener $1,200 de fondo de emergencia el 31 de diciembre" si lo es. La precision convierte un deseo en un plan.'),
                    kc('Meta SMART', 'Especifica, Medible, Alcanzable, Relevante y con Tiempo definido. Estos 5 criterios son la diferencia entre una intencion y un compromiso concreto.'),
                    ex('Transformar deseos en metas SMART', 'Deseo: quiero salir de deudas. Meta SMART: pagare $120 adicionales a mi tarjeta (saldo $800 al 28%) cada mes durante 8 meses para liquidarla antes del 31 de agosto, ahorrando $150 en intereses.'),
                    lst('Las 3 categorias de metas financieras', [
                        'Corto plazo (0-1 ano): fondo de emergencia, pagar deuda especifica, compra planeada',
                        'Mediano plazo (1-5 anos): enganche de vivienda, auto, maestria, negocio',
                        'Largo plazo (+5 anos): retiro, independencia financiera, educacion de hijos',
                    ]),
                    tip('Trabaja en paralelo una meta de cada plazo. La de corto plazo da victorias rapidas. La de largo plazo mantiene el norte. Sin las dos, el sistema no funciona.'),
                    exc('Escribe una meta SMART para cada plazo. Deben incluir monto especifico, fecha limite y la razon por la que importa.', 'Se lo mas especifico posible. Metas vagas fallan, metas especificas funcionan.'),
                    vid('Como establecer metas financieras SMART que funcionen', 'https://www.youtube.com/results?search_query=metas+financieras+SMART+como+establecer+objetivos'),
                ]
            },
            {
                title: 'Calcula tu patrimonio neto', order: 2, duration: 10, xpReward: 40,
                content: [
                    h('La unica metrica que mide tu riqueza real'),
                    kc('Patrimonio neto', 'Valor total de tus activos menos el total de tus deudas. Es la medida mas honesta de tu posicion financiera, sin importar cuanto ganas.'),
                    t('Personas con altos ingresos pueden tener patrimonio neto negativo si gastan mas de lo que invierten. Personas con ingresos modestos pueden tener alto patrimonio si ahorran e invierten consistentemente.'),
                    lst('Paso a paso para calcularlo', [
                        '1. Lista todos tus activos: efectivo, ahorros, inversiones, vehiculo (valor real de mercado)',
                        '2. Lista todas tus deudas: tarjetas, prestamos, credito estudiantil con saldo actual',
                        '3. Patrimonio neto = Total activos - Total deudas',
                    ]),
                    ex('Joven de 24 anos: primer calculo', 'Activos: ahorro $800, computador $500, fondo emergencia $1,200 = $2,500. Deudas: tarjeta $600, prestamo estudiantil $2,000 = $2,600. Patrimonio neto: -$100. Negativo pero normal a esa edad. El objetivo es que crezca cada mes.'),
                    kc('El patrimonio neto como brujula', 'Si tu ingreso sube pero tu patrimonio neto no crece, el aumento de ingreso se esta yendo en mas gastos, no en construir riqueza.'),
                    tip('Calcula tu patrimonio neto el primero de cada mes. Ver como crece o cae es el mejor indicador de si tus decisiones financieras van en la direccion correcta.'),
                    exc('Calcula tu patrimonio neto ahora mismo. Lista todos tus activos con valor real y todas tus deudas con saldo actual. Cual es tu numero?', 'Si es negativo no te alarmes. El punto de partida no importa tanto como la tendencia mensual.'),
                ]
            },
            {
                title: 'Planifica tu retiro hoy', order: 3, duration: 15, xpReward: 50,
                content: [
                    h('El futuro que construyes desde hoy'),
                    t('El retiro parece lejano a los 22 anos. Pero cada ano que demoras en planificarlo tiene un costo enorme por el interes compuesto perdido. Empezar hoy con poco es dramaticamente mejor que empezar a los 40 con mas.'),
                    kc('Regla del 4%', 'Al retiro puedes retirar el 4% de tu fondo anualmente con alta probabilidad de que dure 30 anos. Para vivir $1,000/mes necesitas $300,000 ahorrados ($1,000 x 12 / 0.04).'),
                    ex('Cuanto necesito para jubilarme', 'Si necesitas $800/mes en retiro: $800 x 12 = $9,600/ano. $9,600 / 0.04 = $240,000 es tu numero objetivo. Invirtiendo $150/mes al 8% desde los 25, llegas a $600,000+ a los 65.'),
                    kc('Tasa de reemplazo', 'Porcentaje de tu ingreso activo que recibiras en el retiro del sistema estatal. En Latinoamerica suele ser 40-60%, no el 100%. La brecha la cubres tu con ahorro propio.'),
                    lst('Instrumentos para el retiro en Ecuador', [
                        'IESS: obligatorio para empleados formales, cobertura basica',
                        'Fondos de cesantia: disponibles en cooperativas y algunas empresas',
                        'Inversion propia en fondos/ETFs: complementa el sistema estatal',
                        'Propiedades para renta: ingresos pasivos en el retiro',
                    ]),
                    warn('El IESS generalmente no es suficiente para mantener tu nivel de vida actual en el retiro. La brecha entre lo que provee el estado y lo que necesitas la debes cubrir tu.'),
                    vid('Como planificar el retiro a los 20 y 30 anos', 'https://www.youtube.com/results?search_query=como+planificar+retiro+jubilacion+joven+adulto+latinoamerica'),
                ]
            },
            {
                title: 'El camino a la independencia financiera', order: 4, duration: 15, xpReward: 50,
                content: [
                    h('Cuando el dinero trabaja para ti y no al reves'),
                    kc('Independencia financiera', 'Estado en que tus activos generan suficientes ingresos pasivos para cubrir todos tus gastos de vida sin necesidad de ingresos laborales activos.'),
                    t('Independencia financiera no significa dejar de trabajar necesariamente. Significa que trabajar pasa a ser una eleccion, no una obligacion. Esa libertad es el objetivo final de la planificacion.'),
                    kc('Movimiento FIRE', 'Financial Independence Retire Early: busca alcanzar la IF antes de los 40-50 anos mediante ahorro agresivo (50-70% del ingreso) e inversion en activos generadores de renta pasiva.'),
                    ex('El numero de la independencia financiera', 'Gastos mensuales $1,200 ($14,400/ano). Multiplicado por 25 (inversa del 4%): necesitas $360,000. Con $360,000 invertidos retiras $14,400/ano indefinidamente con alta probabilidad.'),
                    lst('Los 5 pilares de la independencia financiera', [
                        '1. Aumentar ingresos: trabajo, negocio, habilidades adicionales',
                        '2. Reducir gastos: vivir deliberadamente por debajo de tus posibilidades',
                        '3. Invertir la diferencia: el gap ingreso-gasto se invierte, no se gasta',
                        '4. Generar ingresos pasivos: dividendos, renta, royalties',
                        '5. Mantener disciplina en el tiempo: anos de consistencia, no meses',
                    ]),
                    tip('No necesitas FIRE para beneficiarte de sus principios. Ahorrar 20-30% e invertir consistentemente te pone en posicion financiera excelente aunque tardes 35 anos.'),
                    vid('Como alcanzar la independencia financiera FIRE', 'https://www.youtube.com/results?search_query=independencia+financiera+retiro+temprano+FIRE+como+lograrlo'),
                    exc('Calcula tu numero FIRE: gastos mensuales x 12 x 25. Con tu tasa de ahorro actual, en cuantos anos llegarias? Usa una calculadora de inversion online.', 'No te asustes con el numero. El objetivo es entender el horizonte y ajustar la estrategia.'),
                ]
            },
        ]
    },
];

async function main() {
    console.log('Iniciando seed de lecciones...');

    for (const modData of DATA) {
        const module = await prisma.module.findFirst({ where: { order: modData.order } });
        if (!module) { console.log(`  [SKIP] Modulo ${modData.order} no encontrado en DB`); continue; }

        const existing = await prisma.lesson.count({ where: { moduleId: module.id } });
        if (existing > 0) {
            const lessons = await prisma.lesson.findMany({ where: { moduleId: module.id }, select: { id: true } });
            const ids = lessons.map(l => l.id);
            await prisma.userLessonProgress.deleteMany({ where: { lessonId: { in: ids } } });
            await prisma.lesson.deleteMany({ where: { moduleId: module.id } });
            console.log(`  [RESET] Modulo ${modData.order}: ${existing} lecciones borradas`);
        }

        for (const l of modData.lessons) {
            await prisma.lesson.create({
                data: {
                    moduleId: module.id,
                    title: l.title,
                    content: l.content,
                    type: LessonType.READING,
                    order: l.order,
                    duration: l.duration,
                    xpReward: l.xpReward,
                }
            });
        }
        console.log(`  [OK] Modulo ${modData.order}: ${modData.lessons.length} lecciones creadas`);
    }

    console.log('Seed completado. Total: 28 lecciones en 7 modulos.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());