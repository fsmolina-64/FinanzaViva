import 'dotenv/config';
import { PrismaClient, LessonType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type B = {
    type: string; text?: string; title?: string; items?: string[];
    url?: string; question?: string; hint?: string;
    leftLabel?: string; rightLabel?: string; leftItems?: string[]; rightItems?: string[];
    formula?: string; variables?: string[];
};
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
const cmp = (leftLabel: string, rightLabel: string, leftItems: string[], rightItems: string[]): B =>
    ({ type: 'comparison', leftLabel, rightLabel, leftItems, rightItems });
const fml = (formula: string, variables: string[]): B =>
    ({ type: 'formula', formula, variables });

const DATA: MD[] = [
    // ─── MODULO 1: PRESUPUESTO PERSONAL ───────────────────────────────────────
    {
        order: 1,
        lessons: [
            {
                title: 'Por que necesitas un presupuesto', order: 1, duration: 12, xpReward: 30,
                content: [
                    h('El mapa que le falta a tu dinero'),
                    t('Sin saber exactamente cuanto entra y en que se va tu dinero, cualquier decision financiera es un disparo a ciegas. La mayoria de personas con problemas economicos no los tienen por ganar poco, sino porque nunca han trazado el mapa de su propio dinero.'),
                    kc('Presupuesto', 'Plan que asigna tus ingresos a categorias especificas de gasto y ahorro antes de que el mes comience. No es un registro de lo que ya gastaste: es una decision anticipada sobre a donde va cada peso.'),
                    t('La diferencia entre un presupuesto y un registro de gastos es fundamental. El registro te dice a donde fue el dinero. El presupuesto decide a donde va antes de que llegue. Solo el segundo te da control real sobre tu economia.'),
                    exc('Antes de continuar: anota mentalmente cuanto crees que gastaste ayer en total (transporte, comida, cualquier compra). Luego revisa tu historial bancario o billetera movil del dia anterior y compara. Cual fue la diferencia entre tu estimacion y la realidad?', 'La brecha entre lo que crees que gastas y lo que realmente gastas es la razon principal por la que existe este modulo.'),
                    h('La fuga invisible: el enemigo que no ves'),
                    t('Los grandes gastos no destruyen el presupuesto. Son los pequenos gastos diarios, repetitivos e invisibles, los que consumen semanas de trabajo sin que los contemos. Este fenomeno se llama fuga invisible y le pasa a personas de todos los niveles de ingreso.'),
                    ex('El cafe diario en Ecuador', 'Un cafe con leche de $1.50 cada dia laboral (22 dias/mes) cuesta $33 al mes y $396 al ano. Agrega una gaseosa o jugo de $0.75 diario y sumas $198 mas al ano. Solo en esos dos habitos: $594 anuales que casi nadie contabiliza en su presupuesto. Si eres freelance y facturas $600/mes, esos dos habitos te cuestan un mes entero de trabajo al ano.'),
                    kc('Ingreso neto', 'El dinero que realmente llega a tu cuenta despues de descuentos, aportes al IESS y retenciones. En Ecuador el aporte personal al IESS es del 9.45% del sueldo bruto. Si tu sueldo es $500, tu neto real es aproximadamente $453. Siempre presupuesta sobre el neto, jamas sobre el bruto del contrato.'),
                    exc('Calcula tu ingreso neto real: toma el valor de tu ultimo deposito o acreditacion bancaria, no el numero del contrato. Si tienes ingresos variables (freelance, ventas, comisiones), calcula el promedio de los ultimos 3 meses. Ese numero, no otro, es tu base de presupuesto.', 'Revisa tu app bancaria o el correo de confirmacion de tu ultimo pago. Si tienes rol de pagos, busca la columna de "liquido a recibir".'),
                    h('Lo que un presupuesto te dice y lo que no puede comprarte'),
                    lst('Lo que un buen presupuesto revela cada mes', [
                        'Cuanto dinero tienes disponible realmente, no el bruto del contrato sino el neto que llega a tu cuenta',
                        'Cuanto de ese dinero ya esta comprometido en gastos fijos antes de tomar ninguna decision',
                        'En que categorias gastas mas de lo que crees o de lo que te conviene',
                        'Si estas viviendo dentro o fuera de tus posibilidades reales',
                        'Cuanto podrias ahorrar si eliminaras o redujeras un gasto especifico',
                        'Si tienes margen para una meta nueva o si primero necesitas reestructurar',
                    ]),
                    ex('Maria y Juan: mismo ingreso, resultados opuestos', 'Maria ($600 neto/mes) presupuesta el primer dia de cada mes: $300 a necesidades, $120 a ahorro automatico, $180 a deseos. Al final del mes tiene $118 ahorrados. Juan (mismo ingreso, mismo costo de vida) no presupuesta. Al final del mes tiene $22 y no sabe por que. La diferencia no es el salario ni el nivel de vida. Es el sistema.'),
                    tip('Registra absolutamente todos tus gastos durante 7 dias antes de hacer tu primer presupuesto. Incluye el pasaje de bus, el chicle, la transferencia de $2. Los resultados de esa semana cambian la percepcion que tienes de tus habitos de forma permanente.'),
                    exc('Descarga los movimientos de tu cuenta bancaria o app de pagos (Nequi, PayPhone, Banco del Barrio, tarjeta) de los ultimos 30 dias. Clasifica cada movimiento en tres columnas: Necesidad, Deseo, Ahorro/Inversion. Cual categoria suma mas? Cual te sorprendio?', 'Si no tienes historial digital, usa una libreta durante los proximos 7 dias y anota todo. Una semana de datos reales vale mas que cualquier estimacion.'),
                    vid('Por que necesitas un presupuesto personal aunque ganes poco', 'https://www.youtube.com/results?search_query=por+que+necesitas+presupuesto+personal+finanzas'),
                ],
            },
            {
                title: 'La Regla 50/30/20', order: 2, duration: 15, xpReward: 35,
                content: [
                    h('El sistema de tres categorias que simplifica todo'),
                    t('La mayoria de sistemas de presupuesto fallan por ser demasiado complejos: 40 categorias, hojas de calculo elaboradas, actualizaciones diarias. La Regla 50/30/20 funciona porque es simple, memorable y lo suficientemente flexible para cualquier nivel de ingreso.'),
                    kc('Regla 50/30/20', 'Metodo de presupuesto que divide el ingreso neto en tres categorias: 50% para necesidades, 30% para deseos y 20% para ahorro e inversion. Creada por la profesora Elizabeth Warren. Su fuerza esta en la simplicidad: tres numeros que cualquiera puede recordar y aplicar hoy.'),
                    fml('Ingreso neto = Necesidades (50%) + Deseos (30%) + Ahorro (20%)', [
                        'Necesidades: gastos no negociables que no puedes eliminar sin afectar tu vida basica',
                        'Deseos: gastos opcionales que mejoran tu calidad de vida pero no son esenciales',
                        'Ahorro: dinero que construye tu futuro, paga deudas extra o te protege ante emergencias',
                    ]),
                    h('Que entra en cada categoria'),
                    lst('50% — Necesidades (lo no negociable)', [
                        'Arriendo o cuota de hipoteca: el costo de donde vives',
                        'Alimentacion basica: mercado semanal, no delivery ni restaurantes',
                        'Transporte al trabajo o estudio: bus, metro, gasolina si es indispensable',
                        'Servicios basicos: electricidad, agua, internet de trabajo, plan de datos minimo',
                        'Aportes al IESS y seguros de salud: proteccion no negociable',
                        'Cuotas de prestamos previos: ya son una obligacion fija, van aqui',
                    ]),
                    lst('30% — Deseos (lo que mejora la vida)', [
                        'Salidas a restaurantes, cafeterias y delivery',
                        'Entretenimiento: cine, conciertos, eventos, hobbies',
                        'Ropa mas alla de lo estrictamente necesario',
                        'Suscripciones opcionales: streaming, gym, apps premium',
                        'Viajes, escapadas de fin de semana, vacaciones',
                        'Tecnologia nueva cuando la que tienes funciona',
                    ]),
                    lst('20% — Ahorro e inversion (tu futuro)', [
                        'Fondo de emergencia: prioridad maxima hasta completar 3 meses de gastos',
                        'Ahorro para metas especificas: viaje, enganche de vehiculo, maestria',
                        'Inversion a largo plazo: fondos, acciones, cooperativas a plazo',
                        'Pago extra a deudas costosas: acelerar liquidacion de tarjetas y prestamos caros',
                    ]),
                    ex('Presupuesto con $650 neto al mes (salario tipico joven Ecuador)', 'NECESIDADES $325 (50%): arriendo habitacion compartida $170, mercado y comida en casa $80, bus mensual $30, internet $20, plan celular $15, medicamentos $10. DESEOS $195 (30%): delivery y restaurantes $65, entretenimiento y salidas $50, ropa $40, streaming $15, miscelaneos $25. AHORRO $130 (20%): fondo emergencia $80, meta maestria $50. Total asignado: $650. Cada dolar tiene nombre.'),
                    exc('Toma tu ingreso neto mensual real y calcula cuanto corresponderia a cada una de las tres categorias segun la regla. No uses tus gastos actuales: solo aplica los porcentajes puros. Luego compara esos numeros ideales con lo que realmente gastas hoy en cada categoria.', 'Si no sabes exactamente cuanto gastas, usa tu mejor estimacion. La brecha entre el ideal 50/30/20 y tu realidad actual es informacion valiosisima para saber por donde empezar.'),
                    h('Cuando el 50% no cubre tus necesidades basicas'),
                    t('Si tus necesidades reales superan el 50% de tu ingreso, tienes dos posibles escenarios. Primero: realmente vives en una ciudad cara para tu nivel de ingreso actual, lo cual require aumentar ingresos o cambiar de vivienda. Segundo: algunos gastos que clasificas como necesidades son en realidad deseos disfrazados. Revisar esto con honestidad es el primer ejercicio de autoconocimiento financiero.'),
                    cmp('Necesidades reales', 'Deseos disfrazados de necesidades', [
                        'Arriendo en el lugar mas economico funcional disponible',
                        'Bus o transporte publico al trabajo',
                        'Mercado con lista de compra sin marca premium',
                        'Plan de datos de 10-15 GB (suficiente para trabajar)',
                        'Internet de velocidad basica funcional',
                    ], [
                        'Arriendo en zona premium porque "me queda mas cerca"',
                        'Uber/InDriver cuando el bus existe y funciona',
                        'Supermercado con marcas premium sin comparar precios',
                        'Plan de datos ilimitados del operador mas caro',
                        'Fibra optica de maxima velocidad cuando trabajas desde casa ocasionalmente',
                    ]),
                    exc('Revisa tu categoria de necesidades con ojo critico. Hay algun gasto que honestamente podrias reducir o reubicar a la categoria de deseos? Identificar y mover aunque sea un gasto puede liberar $20-50 al mes para ahorro. Ese dinero, invertido en interes compuesto, cambia el largo plazo.', 'Ejemplo concreto: si pagas $40 de plan de datos y podrias funcionar con uno de $15, esos $25 extra son un deseo, no una necesidad. Reubicarlos a la categoria de deseos y reducirlos libera $25 para ahorro.'),
                    tip('Si tus necesidades son el 60% de tu ingreso, aplica 60/20/20 temporalmente mientras reduces algun fijo o aumentas ingresos. La estructura de tres categorias importa mas que los porcentajes exactos. El 20% de ahorro es el piso, no el techo.'),
                    warn('El 20% de ahorro es el minimo, no el objetivo final. Personas que logran libertad financiera antes de los 50 anos tipicamente ahorran entre el 30% y el 50% de su ingreso. El 20% es donde empiezas, no donde te quedas.'),
                    vid('La Regla 50 30 20 con ejemplos reales paso a paso', 'https://www.youtube.com/results?search_query=regla+50+30+20+presupuesto+ejemplos+reales'),
                    exc('Disenha tu presupuesto 50/30/20 para el proximo mes. Ponle nombres y montos especificos a cada subcategoria dentro de los tres bloques. Guarda esos numeros. Al final del mes compara lo planeado con lo real y anota las diferencias.', 'Usa la seccion Presupuestos de FinanzaViva para registrar tus metas por categoria y hacer seguimiento durante el mes.'),
                ],
            },
            {
                title: 'Gastos fijos vs gastos variables', order: 3, duration: 12, xpReward: 30,
                content: [
                    h('El control real esta donde el dinero es mas flexible'),
                    t('Para tomar decisiones de presupuesto efectivas necesitas entender la naturaleza de cada gasto. No todos son iguales: algunos son compromisos inamovibles, otros cambian completamente segun tus decisiones diarias. Distinguirlos es lo que hace posible recortar sin destruir tu calidad de vida.'),
                    kc('Gasto fijo', 'Se repite cada mes con el mismo valor, independiente de tus decisiones del mes. Son compromisos ya adquiridos: arriendo, cuota de prestamo, plan de datos contratado, seguro. No puedes eliminarlos a corto plazo sin consecuencias significativas.'),
                    kc('Gasto variable', 'Cambia mes a mes segun tus elecciones y habitos. Alimentacion, entretenimiento, transporte opcional, compras de ropa. Son los primeros candidatos a ajustar cuando el presupuesto esta apretado porque su valor esta directamente bajo tu control.'),
                    exc('Sin buscar en ningun lado: estima cuanto gastaste el mes pasado en gastos fijos (los mismos cada mes) vs gastos variables (que cambian). Escribe dos numeros. Luego revisa tus movimientos bancarios reales y compara. Cual fue la diferencia entre tu estimacion y la realidad en cada categoria?', 'La mayoria de personas sobreestima sus fijos y subestima sus variables. Los variables son donde mas se "evapora" el dinero.'),
                    cmp('Gasto fijo', 'Gasto variable', [
                        'Arriendo o cuota de hipoteca',
                        'Cuota de prestamo bancario',
                        'Plan de internet o datos contratado',
                        'Seguro mensual del vehiculo',
                        'Suscripcion anual prorrateada mensual',
                    ], [
                        'Alimentacion: varia segun donde y cuanto compras',
                        'Transporte: cambia si usas bus, Uber o combinaciones',
                        'Entretenimiento: salidas, eventos, restaurantes',
                        'Ropa y calzado: compras opcionales con frecuencia variable',
                        'Gastos medicos: consultas, medicamentos ocasionales',
                    ]),
                    h('El tercer tipo que nadie menciona: gastos semivariables'),
                    kc('Gasto semivariable', 'Tiene componente fija (siempre existe) y componente variable (su valor fluctua). La electricidad siempre la pagas, pero cuanto pagas depende de tu consumo. Estos gastos requieren presupuestar un promedio o un maximo razonable, no un numero exacto.'),
                    lst('Ejemplos de gastos semivariables comunes', [
                        'Electricidad: tarifa base fija mas consumo variable segun uso de electrodomesticos',
                        'Agua: cargo minimo fijo mas consumo adicional por metro cubico',
                        'Telefono celular: plan base fijo mas cargos por exceso de datos o llamadas',
                        'Combustible: si tienes vehiculo siempre gastas algo, pero el monto depende del uso',
                        'Alimentacion familiar: hay un minimo semanal, pero puede subir mucho con visitas o antojos',
                    ]),
                    ex('Andrea recorta $100 sin tocar ningun gasto fijo', 'Andrea gana $550 neto. Sus fijos suman $310 (56%). Necesita liberar $100 para completar su fondo de emergencia. Estrategia solo en variables: reduce delivery de 4 veces a 1 vez por semana ($42 menos), pausa el gimnasio que usa menos de 3 veces/semana ($25), cocina almuerzo en casa 3 dias mas ($33). Total recuperado: $100 exactos. Sin cambiar arriendo, prestamo ni internet.'),
                    tip('Calcula tu piso financiero: suma SOLO tus gastos fijos reales. Ese numero es lo minimo que necesitas ganar mensualmente para no entrar en deficit. Si cambias de trabajo o reduces horas, comparar ese piso con el nuevo ingreso neto te dice inmediatamente si la decision es financieramente viable.'),
                    lst('Jerarquia para recortar cuando hay deficit mensual', [
                        'Primero: deseos dentro de variables (delivery, entretenimiento, salidas)',
                        'Segundo: reducir gastos semivariables (bajar consumo de electricidad, agua)',
                        'Tercero: suscripciones opcionales que antes eran fijas (gym que no usas, streaming extra)',
                        'Cuarto: renegociar o cambiar gastos fijos (mudarte a lugar mas economico, refinanciar prestamo)',
                        'Nunca primero: los fijos esenciales son lo ultimo que tocas, no lo primero',
                    ]),
                    warn('Confundir gastos de estilo de vida con gastos fijos es una trampa. Si financies un telefono nuevo cada ano, la cuota mensual se vuelve "fija" pero es una eleccion repetida, no una obligacion real. La inflacion de estilo de vida convierte deseos en obligaciones artificiales y sube tu piso financiero sin que te des cuenta.'),
                    exc('Calcula tu piso financiero real: lista todos tus gastos fijos de este mes con su valor exacto y sumalos. Ese es el minimo absoluto que necesitas ganar. Ahora compara con tu ingreso neto. El espacio entre los dos es tu margen de decision mensual real.', 'Incluye: arriendo/hipoteca, cuotas de prestamos, planes de datos e internet, seguros mensuales, cualquier suscripcion con fecha fija de cobro.'),
                    vid('Como clasificar gastos fijos y variables para controlar tu dinero', 'https://www.youtube.com/results?search_query=gastos+fijos+vs+variables+presupuesto+control'),
                ],
            },
            {
                title: 'Construye tu presupuesto real', order: 4, duration: 18, xpReward: 40,
                content: [
                    h('Del concepto al sistema que funciona con tus numeros'),
                    t('Un presupuesto no es una hoja de calculo en un cajón que revisas una vez al año. Es un sistema vivo que guia cada decision de gasto antes de que el dinero llegue a tu cuenta. Esta leccion te lleva del concepto abstracto al presupuesto real con tus numeros, tus categorias y tu vida.'),
                    lst('Los 6 pasos para construir tu primer presupuesto funcional', [
                        'Paso 1: Calcula tu ingreso neto real del mes (deposito real en cuenta, no bruto del contrato)',
                        'Paso 2: Lista todos los gastos fijos con nombre, valor exacto y fecha de cobro',
                        'Paso 3: Estima gastos variables usando el promedio real de los ultimos 3 meses (no lo que crees)',
                        'Paso 4: Asigna porcentajes usando 50/30/20 como guia, ajustado a tu realidad',
                        'Paso 5: Ingreso menos todos los gastos asignados debe resultar en cero',
                        'Paso 6: Registra gastos reales durante el mes y compara con lo planeado el dia 28',
                    ]),
                    kc('Presupuesto base cero', 'Sistema donde cada dolar del ingreso tiene una asignacion especifica. Ingresos menos todos los gastos planeados (incluyendo ahorro) debe ser igual a cero. Si sobra dinero al final, no es ganancia: significa que no asignaste correctamente ese dinero al inicio del mes.'),
                    fml('Ingresos - (Necesidades + Deseos + Ahorro + Extra a deudas) = 0', [
                        'Si el resultado es positivo: asigna ese sobrante explicitamente a ahorro o deuda adicional',
                        'Si el resultado es negativo: tienes deficit y debes recortar en deseos o renegociar un fijo',
                        'El objetivo es que cada dolar tenga nombre antes de que llegue a tu cuenta',
                    ]),
                    exc('Ejecuta los Pasos 1 y 2 ahora: anota tu ingreso neto del ultimo mes y lista todos tus gastos fijos con su valor exacto. Si no recuerdas todos, revisa los movimientos bancarios de los ultimos 30 dias. No necesitas perfeccion: una estimacion cercana es infinitamente mejor que ningun presupuesto.', 'Para los fijos: busca los cargos que aparecen exactamente o aproximadamente el mismo dia cada mes. Esos son tus fijos.'),
                    h('El presupuesto real de un joven en Ecuador'),
                    ex('Presupuesto mensual con $620 neto', 'NECESIDADES $310 (50%): arriendo habitacion $160, mercado semanal $70, bus y transporte $35, internet casa $20, plan datos $15, medicamentos recurrentes $10. DESEOS $186 (30%): comida fuera y delivery $65, entretenimiento y salidas $45, ropa $35, streaming $18, miscelaneos y emergencias menores $23. AHORRO $124 (20%): fondo de emergencia $75, meta bicicleta/equipo trabajo $49. Total: exactamente $620. Resultado: $0 sin asignar.'),
                    t('Lo que hace poderoso este presupuesto no es la exactitud de los numeros sino la decision previa. Cuando llega una oportunidad de gasto a mitad de mes, ya sabes si ese dinero tiene destino o no. La decision ya fue tomada el dia 1, no el dia que surge la tentacion.'),
                    exc('Con tu ingreso real y los gastos que identificaste, construye tu presupuesto para el proximo mes. Asigna cada dolar. Si alguna categoria no te cierra, escribe "por definir" y dejalo pendiente hasta completar esta leccion. El objetivo es tener al menos un borrador antes de terminar.', 'Usa la funcion Presupuestos en FinanzaViva para guardar tus metas por categoria. Ahi podras hacer seguimiento cuando registres transacciones.'),
                    h('El seguimiento: donde muere el 80% de los presupuestos'),
                    t('Crear el presupuesto es el 20% del trabajo. El 80% restante es el seguimiento durante el mes. La mayoria de personas hace el presupuesto con entusiasmo el dia 1 y no lo vuelve a ver hasta que ya es fin de mes y no se puede corregir nada.'),
                    kc('Varianza presupuestaria', 'Diferencia entre lo planeado y lo real en cada categoria. Varianza positiva: gastaste menos de lo planeado, puedes reasignar. Varianza negativa: gastaste mas, necesitas compensar reduciendo en otra categoria. Detectar varianzas temprano (dias 5-8) es lo que convierte un plan en resultados reales.'),
                    lst('Sistema de seguimiento en 5 minutos al dia', [
                        'Registra cada gasto el mismo dia en que ocurre: no dejes para el dia siguiente porque olvidaras detalles',
                        'Revisa el estado de cada categoria cada 5-7 dias, no esperes hasta fin de mes',
                        'Si una categoria se agota antes de fin de mes, decide conscientemente de donde compensas',
                        'Los dias 5-8 del mes siguiente: analiza varianzas y ajusta el proximo presupuesto con esa informacion',
                        'Una categoria que consistentemente excede el presupuesto necesita mas dinero asignado, no mas fuerza de voluntad',
                    ]),
                    ex('La revision de los primeros 5 dias hace la diferencia', 'Andrea reviso su presupuesto el dia 6 del mes. Detecto que habia gastado $38 en delivery cuando tenia $15 presupuestados para el mes completo. Todavia habia 24 dias. Redujo salidas esa semana para compensar y termino el mes $4 sobre el presupuesto en esa categoria, no $60. La revision temprana convirtio un problema en un ajuste menor.'),
                    tip('Pon una alarma recurrente en tu telefono para los dias 6-7 de cada mes: "10 minutos revisando mi presupuesto". A fin de mes ya no puedes corregir nada. A principios de mes puedes ajustar todo. Este unico habito mensual, aplicado consistentemente, es mas valioso que cualquier hoja de calculo perfecta.'),
                    warn('El primer presupuesto nunca es perfecto y eso es completamente normal. El objetivo del primer mes no es ejecutarlo a la perfeccion, es aprender donde estan tus puntos ciegos de gasto. Usa ese conocimiento para hacer el del proximo mes mas preciso. El presupuesto mejora cada mes que lo revisas con honestidad.'),
                    exc('Define ahora mismo el dia de tu revision mensual de presupuesto. Pon un recordatorio recurrente en tu telefono para el dia 6 o 7 de cada mes. Solo 10 minutos. Este unico habito, mantenido por 6 meses, puede cambiar completamente tus resultados financieros.', 'Si usas FinanzaViva, la seccion Finanzas te muestra automaticamente el estado de tu presupuesto vs lo real cuando registras transacciones.'),
                    vid('Como hacer un presupuesto mensual que realmente funcione', 'https://www.youtube.com/results?search_query=como+hacer+presupuesto+mensual+que+funcione+finanzas+personales'),
                ],
            },
        ],
    },

    // ─── MODULO 2: AHORRO E INTERES COMPUESTO ─────────────────────────────────
    {
        order: 2,
        lessons: [
            {
                title: 'El habito del ahorro', order: 1, duration: 12, xpReward: 30,
                content: [
                    h('El ahorro no es lo que sobra: es lo que apartas primero'),
                    t('Existe una diferencia fundamental entre dos formas de ahorrar. La primera: esperar el sobrante al final del mes. La segunda: apartar el ahorro el mismo dia que recibes tu ingreso, antes de cualquier gasto. La primera casi nunca funciona. La segunda es la base de toda fortuna construida de forma sistematica, sin importar el nivel de ingreso.'),
                    kc('Pagarte primero (Pay Yourself First)', 'Estrategia donde el ahorro se transfiere automaticamente el mismo dia en que recibes tu ingreso, antes de pagar cualquier otro gasto. El ahorro se trata como una obligacion fija, no como un sobrante opcional. Si esperas el sobrante, casi nunca hay sobrante.'),
                    ex('Maria y Juan con exactamente el mismo sueldo de $550 neto', 'Juan espera el sobrante. Mes 1: sobran $40. Mes 2: $0 (imprevisto). Mes 3: $15. Total 3 meses: $55. Maria aparta $80 automaticamente el dia de cobro. Mes 1: $80. Mes 2: $80 (ajusta otros gastos ante el imprevisto). Mes 3: $80. Total 3 meses: $240. Mismo sueldo, mismo costo de vida, resultado 4 veces mayor. El habito sistematico vence a la intencion repetida.'),
                    exc('Calcula el 5% de tu ingreso neto mensual. Ese es tu ahorro minimo de arranque. Ahora proyectalo: 5% durante 12 meses, y durante 3 anos con un rendimiento conservador del 5% anual. El numero a 3 anos, incluso con montos pequenos, suele sorprender.', 'Ejemplo de referencia: 5% de $460 (SBU) = $23/mes. En 12 meses: $276. En 3 anos al 5% anual: aproximadamente $955. Con ese fondo ya tienes mas de 2 meses de gastos esenciales.'),
                    h('Las 4 razones por las que la gente no ahorra y como neutralizarlas'),
                    lst('Las trampas mentales mas comunes y su solucion directa', [
                        'Trampa 1 - No me alcanza: Revisa primero si hay deseos clasificados como necesidades. Un plan de datos de $35 cuando uno de $15 cubre lo mismo libera $20 inmediatamente.',
                        'Trampa 2 - Lo hare cuando gane mas: Quien no ahorra el 5% de $500 tampoco ahorra el 20% de $1,500. El porcentaje importa mas que el monto. El habito se construye ahora, no despues.',
                        'Trampa 3 - Es muy poco para importar: $40/mes son $480 al ano, mas de $1,600 en 3 anos con rendimiento. Los habitos pequenos acumulan resultados grandes a traves del tiempo.',
                        'Trampa 4 - No se donde guardarlo: Cuenta de ahorro separada de tu cuenta corriente, sin tarjeta de debito disponible. La friccion de acceder reduce el uso impulsivo drasticamente.',
                    ]),
                    h('La automatizacion elimina la fuerza de voluntad de la ecuacion'),
                    t('La fuerza de voluntad es un recurso limitado que se agota con cada decision del dia. Si ahorrar depende de acordarte, querer y ejecutar una transferencia manual cada mes, eventualmente fallara. La automatizacion convierte una decision repetida en un sistema que funciona solo.'),
                    kc('Automatizacion financiera', 'Configurar transferencias, descuentos o inversiones que se ejecutan automaticamente en fecha fija sin requerir accion manual. Elimina el riesgo de olvidar, de gastar antes de ahorrar, o de ceder a la tentacion de "este mes no ahorro".'),
                    lst('Como automatizar el ahorro en Ecuador', [
                        'Transferencia programada en tu banco: configura una salida automatica a cuenta de ahorro el dia despues de que recibes tu sueldo',
                        'Cuenta en banco diferente sin tarjeta: la separacion fisica e institucional crea la friccion necesaria para no tocarlo',
                        'Fondos de cesantia en cooperativas (JEP, Jardin Azuayo, Cooprogreso): el descuento es automatico y recuperas con rendimiento al retirarte o en caso de desempleo',
                        'Aporte voluntario al IESS: adicional al obligatorio del 9.45%, queda en tu cuenta individual con rendimiento del sistema',
                    ]),
                    tip('Comienza con el porcentaje mas pequeno que no duela: 3% o 5%. El habito importa mas que el monto durante los primeros 3 meses. Una vez que el habito existe y el sistema funciona solo, aumentar el porcentaje es relativamente facil. Construir el habito desde cero es lo verdaderamente dificil.'),
                    exc('Define hoy los tres datos de tu proximo ahorro: (1) cuanto vas a apartar en tu proximo cobro, (2) a que cuenta o instrumento va ese dinero, (3) si lo haras manualmente o de forma automatica. Escribe los tres datos. Una decision no escrita y con sistema definido es solo una intencion que probablemente no se cumple.', 'Si puedes configurar la automatizacion antes de tu proximo pago, hazlo ahora. El mejor momento para configurar un ahorro automatico es cuando no tienes hambre de ese dinero.'),
                    vid('Como crear el habito del ahorro aunque ganes poco', 'https://www.youtube.com/results?search_query=habito+ahorro+automatico+finanzas+personales+desde+cero'),
                ],
            },
            {
                title: 'El poder del interes compuesto', order: 2, duration: 18, xpReward: 45,
                content: [
                    h('La formula que multiplica tu dinero con el tiempo'),
                    t('El interes compuesto es el mecanismo mas poderoso tanto para construir riqueza como para destruirla. En inversiones, trabaja a tu favor generando crecimiento exponencial. En deudas, trabaja en tu contra multiplicando lo que debes. Entender como funciona en ambas direcciones cambia la forma en que tomas decisiones financieras.'),
                    kc('Interes compuesto', 'Calculo de interes sobre el capital inicial mas todos los intereses previamente acumulados. A diferencia del interes simple, el capital crece de forma exponencial porque cada periodo los intereses ganados se suman al capital y generan nuevos intereses en el siguiente periodo.'),
                    cmp('Interes simple', 'Interes compuesto', [
                        'Calcula interes solo sobre el capital original siempre',
                        'Crecimiento lineal: la misma cantidad de interes cada ano',
                        '$1,000 al 10%: siempre genera $100 de interes por ano',
                        'Despues de 10 anos: $2,000 ($1,000 capital + $1,000 intereses)',
                    ], [
                        'Calcula interes sobre capital mas intereses acumulados',
                        'Crecimiento exponencial: cada ano genera mas que el anterior',
                        'Ano 1: $100. Ano 2: $110 (sobre $1,100). Ano 3: $121 (sobre $1,210)',
                        'Despues de 10 anos: $2,594 con la misma tasa del 10%',
                    ]),
                    fml('A = P × (1 + r/n)^(n × t)', [
                        'A = monto final acumulado (lo que tendras)',
                        'P = capital inicial o principal (lo que pones)',
                        'r = tasa de interes anual en decimal (8% = 0.08)',
                        'n = veces que se capitaliza por ano (mensual = 12, anual = 1)',
                        't = numero de anos de la inversion',
                    ]),
                    h('El ingrediente mas poderoso: el tiempo'),
                    ex('Sofia vs Pedro: tiempo contra monto', 'Sofia invierte $100/mes desde los 22 anos hasta los 65 al 8% anual. Pedro invierte el doble, $200/mes, pero empieza a los 35 y llega igualmente a los 65. Sofia invierte $51,600 en total durante 43 anos. Pedro invierte $72,000 durante 30 anos. Resultado a los 65: Sofia acumula $389,000. Pedro acumula $298,000. Sofia invirtio $20,400 menos pero tiene $91,000 mas. El tiempo le gano al monto con claridad.'),
                    kc('Regla del 72', 'Herramienta de calculo mental rapido: divide 72 entre la tasa de rendimiento anual para obtener los anos aproximados en que tu dinero se duplica. Simple, util y suficientemente precisa para tomar decisiones rapidas de comparacion.'),
                    fml('Anos para duplicar el dinero = 72 / Tasa de rendimiento anual', [
                        'Al 4% (cuenta de ahorro bancaria tipica): 72/4 = 18 anos para duplicarse',
                        'Al 6% (cooperativa a plazo en Ecuador): 72/6 = 12 anos',
                        'Al 10% (S&P500 promedio historico): 72/10 = 7.2 anos',
                        'Al 24% (tarjeta de credito): tu deuda se duplica en solo 3 anos si no la pagas',
                    ]),
                    exc('Aplica la Regla del 72 a dos escenarios concretos: (1) Si ahorras en una cuenta bancaria al 2%, en cuantos anos se duplicara tu dinero? (2) Si tienes una deuda de tarjeta al 24% y no la pagas, en cuantos anos sera el doble? Calcula ambos numeros y compara el impacto de cada tasa.', 'Respuestas: Al 2% tardas 36 anos en duplicar. Al 24% tu deuda se duplica en 3 anos. Esa asimetria es la razon por la que eliminar deudas costosas tiene prioridad sobre muchas inversiones.'),
                    h('Frecuencia de capitalizacion: cada detalle suma'),
                    lst('El impacto de capitalizar con mayor frecuencia: $10,000 al 10% durante 10 anos', [
                        'Capitalizacion anual (1 vez/ano): resultado final $25,937',
                        'Capitalizacion semestral (2 veces/ano): resultado final $26,533',
                        'Capitalizacion mensual (12 veces/ano): resultado final $27,070',
                        'Capitalizacion diaria (365 veces/ano): resultado final $27,182',
                        'Diferencia entre anual y diaria: $1,245 adicionales con el mismo capital y tasa',
                    ]),
                    kc('APY (Annual Percentage Yield)', 'Tasa de rendimiento real que ya incluye el efecto de la capitalizacion compuesta. Siempre compara el APY de diferentes instrumentos, nunca la tasa nominal. Un banco que capitaliza mensualmente al 9.9% nominal tiene un APY de 10.36% efectivo.'),
                    exc('Busca en el sitio web de tu banco actual cual es el APY que ofrece en cuenta de ahorro. Luego busca el APY de al menos dos cooperativas reguladas (JEP, Jardin Azuayo, Cooprogreso). Calcula cuanto dinero extra generaria la diferencia sobre $2,000 durante 3 anos.', 'Las cooperativas en Ecuador tipicamente ofrecen APY entre 4-7% en depositos a plazo vs 0.5-2% en bancos comerciales para cuentas de ahorro normales.'),
                    h('El lado oscuro: el interes compuesto que trabaja en tu contra'),
                    ex('La tarjeta que crece sin que la toques', 'Deuda de $500 en tarjeta de credito al 24% APR. Si no haces ningun pago: despues de 1 ano debes $620. Despues de 2 anos: $768. Despues de 3 anos: $952. Despues de 5 anos: $1,465. La deuda casi se triplica en 5 anos sin comprar nada adicional. Si pagas solo el minimo del 3% ($15/mes), tardas mas de 5 anos y terminas pagando casi el valor original en puros intereses.'),
                    warn('Eliminar una deuda al 24% es matematicamente equivalente a una inversion garantizada al 24%, algo que ningun instrumento convencional ofrece. Si tienes simultaneamente $1,000 en cuenta de ahorro al 4% y $1,000 de deuda de tarjeta al 24%, estas perdiendo 20% anual neto. Pagar esa deuda primero es la mejor inversion disponible.'),
                    tip('El interes compuesto necesita tres cosas para funcionar al maximo: capital inicial (aunque sea pequeno), tasa de rendimiento razonable, y tiempo. De las tres, el tiempo es el que menos control tienes una vez que lo dejas pasar. Cada año de retraso en empezar a invertir tiene un costo exponencial que se hace evidente 20 anos despues.'),
                    exc('Calcula el poder del tiempo en tu caso especifico: si empezaras hoy a invertir $60/mes en un instrumento al 7% anual, cuanto tendrias en 10, 20 y 30 anos? Usa una calculadora de interes compuesto online y anota los tres numeros. La diferencia entre los 10 y 30 anos deberia sorprenderte.', 'Busca "calculadora interes compuesto" en Google. El resultado de $60/mes al 7% durante 30 anos es aproximadamente $68,000, contra $10,442 en 10 anos y $31,696 en 20 anos.'),
                    vid('Interes compuesto explicado con ejemplos reales', 'https://www.youtube.com/results?search_query=interes+compuesto+como+funciona+ejemplo+practico'),
                ],
            },
            {
                title: 'El fondo de emergencia', order: 3, duration: 15, xpReward: 35,
                content: [
                    h('Tu primera linea de defensa financiera'),
                    t('Puedes tener el mejor presupuesto, los mejores habitos de ahorro y conocimiento solido de inversiones. Sin fondo de emergencia, un solo evento inesperado puede destruir meses de progreso y meterte en deuda. El fondo de emergencia no es opcional: es el cimiento sobre el cual se construye cualquier plan financiero que funcione.'),
                    kc('Fondo de emergencia', 'Dinero liquido guardado exclusivamente para gastos imprevistos urgentes e inesperados. Su funcion principal no es crecer sino estar disponible cuando mas lo necesitas. No es para oportunidades, vacaciones ni compras planificadas: solo para emergencias reales que no podias prever.'),
                    lst('Que cuenta como emergencia real', [
                        'Perdida inesperada de empleo o reduccion significativa y no planificada de ingresos',
                        'Enfermedad o accidente que genera gastos medicos no cubiertos por seguro o IESS',
                        'Dano critico en vehiculo indispensable para trabajar o para emergencia familiar',
                        'Reparacion urgente e imprevista del lugar donde vives (fuga de agua, problema electrico)',
                        'Emergencia familiar que requiere traslado urgente o ayuda economica inmediata',
                    ]),
                    lst('Que NO es una emergencia financiera', [
                        'Vacaciones o viaje planificado con anticipacion (para eso existe el ahorro de metas)',
                        'Compra de electrodomestico cuando el actual funciona aunque sea lento',
                        'Descuento irresistible en tecnologia o ropa (las oportunidades no son emergencias)',
                        'Pago de deudas regulares ya incluidas en tu presupuesto',
                        'Cualquier gasto que podias prever con semanas de anticipacion',
                    ]),
                    exc('Define cual seria tu emergencia financiera mas probable en los proximos 12 meses. Puede ser perdida de empleo, gasto medico mayor, dano en vehiculo o algo especifico de tu situacion. Estima cuanto costaria esa emergencia. Ese numero es tu primer objetivo de fondo.', 'Referencia de costos en Ecuador: hospitalizacion 3 dias sin seguro privado: $500-3,000. Reparacion de vehiculo promedio: $200-800. 1 mes de gastos esenciales tuyo: calculalo en base a tu presupuesto.'),
                    h('Cuanto necesitas: los tres niveles de proteccion'),
                    lst('Los tres umbrales del fondo de emergencia', [
                        'Nivel 1 - Minimo urgente: 1 mes de gastos totales. Proteccion basica contra imprevistos menores. Meta inicial para quien empieza desde cero.',
                        'Nivel 2 - Estandar recomendado: 3 meses de gastos. Cubre la duracion media de desempleo y emergencias medianas sin entrar en deuda.',
                        'Nivel 3 - Ideal: 6 meses de gastos. Proteccion amplia para cualquier escenario incluida enfermedad prolongada o transition de carrera.',
                        'Nivel 4 - Freelance o ingresos variables: 6-12 meses. Ingresos impredecibles requieren mayor colchon de seguridad.',
                    ]),
                    fml('Fondo objetivo = Gastos mensuales esenciales × Meses de cobertura deseados', [
                        'Gastos esenciales: arriendo + comida + transporte + servicios + cuotas de deuda',
                        'Meses de cobertura: 3 como minimo recomendado, 6 como ideal',
                        'Ejemplo: $380 gastos esenciales × 3 meses = $1,140 de fondo objetivo nivel 2',
                    ]),
                    ex('Carlos: el fondo que evito 6 meses de deuda', 'Carlos tenia $1,050 de fondo de emergencia (3 meses a $350/mes de gastos esenciales). En octubre su empleador redujo su sueldo por restructuracion durante 2 meses. Carlos uso $700 del fondo para cubrir la diferencia. En enero lo habia reconstruido completamente sin haber tomado ningun prestamo, sin haber usado la tarjeta de credito. Sin el fondo, una deuda de $700 al 20% le habria costado 8 meses en pagar y $50 adicionales en intereses.'),
                    tip('Guarda el fondo en una cuenta separada de tu cuenta corriente, idealmente en otra institucion financiera. La separacion fisica y la pequena friccion de hacer una transferencia inter-institucional actuan como barrera psicologica que reduce significativamente el uso impulsivo del fondo para no-emergencias.'),
                    warn('El fondo de emergencia no es inversion. No busques rentabilidad con este dinero. Guardarlo en cuenta de ahorro con liquidez inmediata y rendimiento bajo es exactamente lo correcto. Si lo inviertes en algo menos liquido buscando mejor rendimiento, el dia que lo necesites urgente puede estar bloqueado o haberse devaluado.'),
                    exc('Calcula tu fondo objetivo ahora: suma arriendo + comida + transporte + servicios + cuotas de deuda de un mes. Esos son tus gastos esenciales. Multiplicalo por 3 para el Nivel 2. Cuanto tienes actualmente disponible en efectivo o cuenta de facil acceso? Cual es la brecha entre lo que tienes y lo que necesitas?', 'Se honesto con el numero. Si la brecha es grande, el objetivo inmediato (proximos 3-6 meses) es construir el Nivel 1. El Nivel 2 puede tardar 12-18 meses si empiezas desde cero. Esta bien: lo importante es empezar.'),
                    h('Como construir el fondo en 6 a 12 meses'),
                    lst('Plan de construccion del fondo paso a paso', [
                        'Define el numero exacto: cuanto es el Nivel 1 (1 mes) con tus gastos reales',
                        'Destina entre el 50% y el 70% de tu ahorro mensual al fondo hasta completar el Nivel 1',
                        'Abre una cuenta separada sin tarjeta de debito en otra institucion (cooperativa, banco diferente)',
                        'Automatiza la transferencia: el dia de cobro, antes de cualquier otro gasto',
                        'Si recibes ingresos extraordinarios (13ro, 14to sueldo, bono): deposita el 60% directamente al fondo hasta completarlo',
                        'Cuando uses el fondo, reconstruirlo pasa a ser tu primera prioridad financiera inmediata',
                    ]),
                    exc('Define tu plan especifico de construccion: cuanto necesitas para el Nivel 1, cuanto vas a aportar mensualmente, en cuantos meses llegaras a ese objetivo. Si tu meta es $450 y aportas $75/mes, llegas en 6 meses. Escribe la fecha estimada de llegada al Nivel 1 en tu calendario.', 'Agrega el objetivo en la seccion Metas de FinanzaViva para visualizar el progreso. Ver la barra llenarse cada mes es un motivador subestimado.'),
                    vid('Fondo de emergencia: cuanto necesitas y como construirlo', 'https://www.youtube.com/results?search_query=fondo+emergencia+cuanto+necesitas+como+construirlo'),
                ],
            },
            {
                title: 'Estrategias para ahorrar mas', order: 4, duration: 15, xpReward: 40,
                content: [
                    h('Sistemas que funcionan cuando la motivacion no alcanza'),
                    t('El problema con el ahorro no es saber que hay que hacerlo: todo el mundo lo sabe. El problema real es hacerlo de forma consistente mes tras mes, incluso cuando hay tentaciones, imprevistos o simplemente ganas de gastar en otra cosa. La solucion no es tener mas fuerza de voluntad, es construir sistemas que no dependan de ella.'),
                    lst('Las 5 estrategias de mayor impacto real documentadas', [
                        'Ahorro automatico: transferencia programada el dia de cobro, sin decision manual requerida cada mes',
                        'Cuenta inaccesible: guardar en cuenta sin tarjeta de debito en institucion diferente a tu banco principal',
                        'Regla 48 horas: esperar 2 dias antes de cualquier compra no planeada mayor a $20 reduce compras impulsivas en 70%',
                        'Porcentaje fijo en lugar de monto fijo: si tu ingreso sube, tu ahorro sube automaticamente con el',
                        'Ahorro de diferencias: cuando gastas menos de lo presupuestado en una categoria, la diferencia va directo al ahorro',
                    ]),
                    kc('Inflacion del estilo de vida (Lifestyle Creep)', 'Fenomeno donde los gastos crecen automaticamente al mismo ritmo que los ingresos, dejando el margen de ahorro exactamente igual o incluso menor. El aumento de sueldo se evapora en mejoras de estilo de vida antes de llegar al ahorro o la inversion.'),
                    ex('El aumento que desaparecio sin que nadie lo gastara conscientemente', 'Andrea gana $500 y ahorra $50 (10%). Recibe un aumento a $650 en marzo. Sin decision consciente: mejora su plan de datos (+$15), empieza a pedir delivery mas seguido (+$40), se suscribe a otro streaming (+$12), va a mejores restaurantes habitualmente (+$35). Total aumento absorbido: $102. Su ahorro sigue siendo $50/mes. Con el aumento del 30%, su tasa de ahorro bajo del 10% al 7.7%. Eso es el lifestyle creep.'),
                    exc('Revisa los ultimos 6 meses: ha subido tu ingreso en ese periodo? Si es si, ha subido proporcionalmente tu porcentaje de ahorro o solo ha subido tu gasto? Calcula tu porcentaje de ahorro actual (ahorro/ingreso neto x 100) y comparalo con hace 6 meses.', 'Si no recuerdas el dato exacto de hace 6 meses, estimalo. El patron importa mas que el numero exacto.'),
                    h('Tecnicas avanzadas de ahorro que funcionan'),
                    kc('Metodo del sobre (Envelope Budgeting)', 'Sistema donde asignas efectivo fisico a categorias en sobres separados al inicio del mes. Cuando el sobre se vacia, no puedes gastar mas en esa categoria hasta el proximo mes. El dinero fisico se siente mas real que el digital y activa mecanismos psicologicos de freno que la tarjeta no activa.'),
                    lst('Retos de ahorro para distintas situaciones y temperamentos', [
                        'Reto 52 semanas clasico: semana 1 ahorras $1, semana 2 ahorras $2... semana 52 ahorras $52. Total al ano: $1,378.',
                        'Reto inverso: empieza con $52 la semana 1 y disminuye. Util si la motivacion cae a fin de ano con los gastos navidenos.',
                        'Reto redondeo: cada gasto lo redondeas al siguiente dolar y la diferencia va al ahorro. Automatizable en algunas apps bancarias.',
                        'Reto del dia sin gastar: 1-2 dias por semana de cero gastos discrecionales. $10-20 semanales que se acumulan.',
                        'Reto del 1%: aumenta tu tasa de ahorro en 1 punto porcentual cada trimestre hasta llegar al 20%.',
                    ]),
                    kc('APY: la tasa que realmente importa al elegir donde guardar', 'Annual Percentage Yield incluye el efecto de capitalizacion. Siempre compara APY al elegir donde depositar tu ahorro. La diferencia entre una cuenta al 1% APY y una al 6% en $3,000 durante 5 anos es $1,100 adicionales sin hacer nada extra.'),
                    ex('Marco mueve $4,000 de banco a cooperativa en 30 minutos', 'Marco tiene $4,000 en una cuenta de ahorro de banco comercial al 0.5% APY. Una cooperativa regulada por la SEPS le ofrece 5.5% APY en deposito a plazo de 180 dias. Resultado a 3 anos: banco $4,060 vs cooperativa $4,693. La diferencia es $633 extra. El tramite para abrir la cuenta en la cooperativa tomo 30 minutos. ROI del tiempo invertido: $633.'),
                    lst('Donde guardar el ahorro en Ecuador con mayor rendimiento', [
                        'Cooperativas SEPS (JEP, Jardin Azuayo, Cooprogreso, 29 de Octubre): 4-7% APY en plazo fijo de 90-360 dias',
                        'Mutualistas (Pichincha, Ambato, Azuay): 3-6% en depositos a plazo, buena reputacion historica',
                        'Fondos de cesantia: rendimiento historico 5-8%, descuento automatico en nomina para empleados',
                        'Bancos comerciales cuenta de ahorro: 0.5-2% APY, maxima liquidez pero minimo rendimiento',
                        'Bolsa de Valores de Quito: renta fija corporativa y gubernamental para montos mayores a $5,000',
                    ]),
                    warn('Plataformas informales que prometen rendimientos del 5-10% mensual (60-120% anual) son piramides o fraudes, no inversiones. En Ecuador han quebrado cooperativas ilegales llevandose los ahorros de miles de personas. Solo deposita en instituciones reguladas por la Superintendencia de Economia Popular y Solidaria (SEPS) o la Superintendencia de Bancos. Verifica el registro en seps.gob.ec o superbancos.gob.ec antes de depositar.'),
                    tip('Cuando recibas el 13ro o 14to sueldo, decreta de inmediato a donde va el 60% antes de tocarlo. El dia que entra ese dinero extra, ya tienes asignado mentalmente su destino: fondo de emergencia, deuda costosa, o meta especifica. El 40% restante puede ir a disfrute. Sin esa decision previa, los bonos desaparecen en gastos menores en 2-3 semanas.'),
                    exc('Investiga hoy: compara el APY de tu cuenta de ahorro actual con el de al menos 2 cooperativas reguladas por la SEPS en tu ciudad o region. Si la diferencia supera 2 puntos porcentuales, calcula cuanto dinero extra generaria sobre tu saldo actual en los proximos 2 anos. La informacion concreta convierte la intencion en accion.', 'Busca las tasas en el sitio web de cada institucion o llama directamente. Pregunta especificamente por el APY de depositos a plazo de 90 o 180 dias, que suelen ser los mas accesibles.'),
                    vid('Como ahorrar mas dinero con estrategias que funcionan de verdad', 'https://www.youtube.com/results?search_query=estrategias+ahorro+dinero+mensual+practicas'),
                ],
            },
        ],
    },

    // ─── MODULO 3: CREDITO Y DEUDA ────────────────────────────────────────────
    {
        order: 3,
        lessons: [
            {
                title: 'Como funciona el credito', order: 1, duration: 15, xpReward: 35,
                content: [
                    h('El credito es una herramienta, no un recurso extra'),
                    t('El credito no es bueno ni malo por si mismo. Es una herramienta que puede acelerar metas reales cuando se usa con criterio, o destruir anos de progreso financiero cuando se usa para cubrir gasto corriente. La diferencia entre ambos resultados esta en entender exactamente como funciona antes de firmarlo.'),
                    kc('Credito', 'Acuerdo por el cual un prestamista entrega dinero hoy a cambio del compromiso del deudor de devolver ese monto mas intereses en el futuro. El costo de ese acuerdo se expresa principalmente a traves de la tasa de interes y el plazo.'),
                    lst('Los 5 componentes de cualquier credito que debes entender antes de firmar', [
                        'Capital: el monto exacto que recibes o que financia el prestamo',
                        'Tasa de interes (APR): el costo anual del credito expresado en porcentaje del capital',
                        'Plazo: el numero de meses o anos que tienes para devolver el dinero',
                        'Cuota: el pago periodico que combina una parte de capital mas intereses del periodo',
                        'Costo total: el numero que mas importa = cuota multiplicada por todos los pagos',
                    ]),
                    fml('Costo total del credito = Cuota mensual × Numero total de cuotas', [
                        'Lo que pagas por encima del capital = Costo total - Capital original',
                        'Ejemplo: cuota $94 × 12 meses = $1,128 total por $1,000 prestados',
                        'Costo real del prestamo en ese ejemplo: $128 (12.8% del capital en 12 meses)',
                    ]),
                    ex('El costo invisible del plazo extendido', 'Prestamo de $2,000 al 18% anual. Opcion A: 12 meses, cuota $184/mes, costo total $2,208, pagas $208 en intereses. Opcion B: 24 meses, cuota $100/mes, costo total $2,400, pagas $400 en intereses. La cuota de la opcion B es casi la mitad, pero el costo total es el doble de intereses. Siempre compara el costo total, no solo la cuota mensual.'),
                    exc('Busca el contrato o el estado de cuenta de algun credito que tengas actualmente (prestamo personal, cuotas de un electrodomestico, tarjeta). Calcula cuota x numero de cuotas para conocer el costo total real. Cuanto es el capital que recibiste y cuanto es lo que terminarias pagando?', 'Si no tienes creditos activos, practica con este escenario: $800 al 20% anual a 18 meses. La cuota aproximada es $52. Calcula el costo total.'),
                    h('Tipos de credito: garantizado vs no garantizado'),
                    cmp('Credito garantizado', 'Credito sin garantia (no garantizado)', [
                        'Respaldado por un activo (vehiculo, inmueble)',
                        'Si no pagas, el prestamista puede tomar el activo',
                        'Tasa de interes generalmente menor por el respaldo',
                        'Hipotecas, creditos prendarios de vehiculo',
                    ], [
                        'Sin respaldo de activo: solo tu firma y tu historial',
                        'Si no pagas, afecta tu historial y el prestamista demanda',
                        'Tasa de interes generalmente mayor por mayor riesgo',
                        'Tarjetas de credito, prestamos personales, microfinanciero',
                    ]),
                    kc('APR (Annual Percentage Rate)', 'Tasa de interes anual que representa el costo total del credito en porcentaje. Siempre compara el APR entre diferentes ofertas de credito, nunca solo la cuota mensual. Un APR del 18% en un banco puede equivaler a cuota similar que un APR del 36% en una financiera con plazo diferente.'),
                    t('En Ecuador, las tasas maximas de interes son reguladas por el Banco Central. Para credito de consumo ordinario el techo es alrededor del 17% anual. Las tarjetas de credito pueden llegar al 22-25%. Los creditos informales o financieras no reguladas pueden cobrar 40-80% anual de forma encubierta.'),
                    lst('Cuando el credito tiene sentido y cuando no', [
                        'TIENE SENTIDO: financiar educacion que aumentara significativamente tus ingresos futuros',
                        'TIENE SENTIDO: vehiculo necesario para generar ingresos cuando no hay otra forma de conseguirlo',
                        'TIENE SENTIDO: equipo de trabajo productivo con retorno calculable mayor al costo del credito',
                        'NO TIENE SENTIDO: financiar vacaciones, ropa, electrodomesticos nuevos o cualquier consumo inmediato',
                        'NO TIENE SENTIDO: cuando el costo del credito supera el beneficio economico del bien adquirido',
                        'NO TIENE SENTIDO: cuando no tienes certeza de poder pagar la cuota aunque cambien las circunstancias',
                    ]),
                    tip('Antes de firmar cualquier credito, calcula el costo total (cuota x meses) y preguntate: si te dieran ese bien o servicio de forma gratuita pero tuvieras que pagar igual esa diferencia entre el capital y el costo total, lo harias? Si la respuesta es no, el credito es demasiado caro para lo que estas comprando.'),
                    warn('Los creditos rapidos online, gota a gota y prestamistas informales en Ecuador tienen tasas efectivas de 100-300% anual. Un prestamo de $100 por 30 dias puede costar $130-150 en intereses y comisiones. Son la forma mas cara de acceder a dinero y estan disenados para crear dependencia, no para resolver emergencias.'),
                    exc('Compara dos opciones de credito para la misma necesidad hipotetica de $1,500: Opcion A - banco comercial al 16% anual a 18 meses. Opcion B - financiera informal al 3% mensual a 18 meses. Calcula el costo total de cada una. La diferencia te dara una perspectiva clara del valor de elegir bien el prestamista.', 'El 3% mensual parece poco pero es el 36% anual efectivo. Cuota opcion A: ~$92. Cuota opcion B: ~$106. El costo total en intereses casi se duplica aunque la cuota mensual no se vea tan diferente.'),
                    vid('Como funciona el credito y los prestamos bancarios', 'https://www.youtube.com/results?search_query=como+funciona+credito+prestamos+interes+cuota+banco'),
                ],
            },
            {
                title: 'Tarjetas de credito sin endeudarse', order: 2, duration: 15, xpReward: 40,
                content: [
                    h('Como convertir la tarjeta en herramienta y no en trampa'),
                    t('Las tarjetas de credito tienen tasas de interes de entre el 18% y el 25% anual en Ecuador. Usadas incorrectamente son el camino mas rapido al sobreendeudamiento. Usadas correctamente son una herramienta de gestion de liquidez, seguridad en compras online y acumulacion de beneficios sin costo extra.'),
                    kc('Periodo de gracia', 'Tiempo entre el cierre del ciclo de facturacion y la fecha limite de pago durante el cual puedes saldar el saldo total sin pagar ningun interes adicional. Si pagas el total antes de esa fecha, la tarjeta es efectivamente un prestamo a cero interes. Si no lo pagas, el interes se aplica retroactivamente desde el dia de cada compra.'),
                    lst('Las 3 reglas de oro del uso inteligente de tarjeta de credito', [
                        'Regla 1: Nunca compres con tarjeta algo que no podrias pagar en efectivo ese mismo dia. La tarjeta es medio de pago, no ampliacion de presupuesto.',
                        'Regla 2: Paga el saldo TOTAL antes de la fecha de vencimiento, sin excepcion. El pago minimo es la trampa mas costosa del sistema financiero.',
                        'Regla 3: Tu limite de credito no es tu presupuesto. El banco te da un limite segun tu perfil de riesgo, no segun lo que puedes permitirte gastar.',
                    ]),
                    ex('El error del pago minimo: el calculo que cambia todo', 'Deuda de $600 en tarjeta al 22% APR. Pagando solo el minimo del 3% ($18/mes al inicio, bajando con el saldo): tardas 4 anos y 3 meses en liquidarla y pagas $314 en intereses. Pagando $80/mes fijos: la liquidas en 9 meses y pagas $54 en intereses. Diferencia: $260 ahorrados y 3.5 anos menos de deuda. La misma deuda, resultados completamente distintos segun el comportamiento de pago.'),
                    fml('Interes mensual = Saldo pendiente × (APR / 12)', [
                        'Con APR 22% y saldo $600: interes mensual = $600 × (0.22/12) = $11 el primer mes',
                        'Si pagas el minimo ($18), solo $7 van a reducir el capital: $11 de interes + $7 de capital = $18',
                        'El saldo baja de $600 a $593. El mes siguiente el interes se calcula sobre $593, no sobre cero',
                    ]),
                    exc('Si tienes una o mas tarjetas de credito activas, revisa tu ultimo estado de cuenta. Busca: (1) el saldo total actual, (2) el pago minimo que te piden, (3) la tasa de interes que aplican. Calcula cuanto pagarias en intereses si pagaras solo el minimo durante 6 meses vs si pagaras el doble del minimo.', 'La diferencia entre pagar el minimo y pagar el doble del minimo en intereses totales suele ser entre 3x y 5x en horizontes de 12-24 meses.'),
                    h('Cuotas sin interes: cuando son reales y cuando son un espejismo'),
                    t('La cuota sin interes es real cuando el establecimiento asume el costo financiero y no lo traslada al precio del producto. Es un espejismo cuando el precio ya incluye ese costo financiero y pagando al contado no recibes descuento. El segundo caso es el mas comun en Ecuador.'),
                    lst('Como saber si una cuota sin interes es realmente sin interes', [
                        'Pregunta directamente: cual es el precio al contado con efectivo o transferencia?',
                        'Si el precio contado es menor al precio en cuotas: las cuotas SÍ tienen interes incluido en el precio',
                        'Si el precio es identico independiente del modo de pago: el establecimiento absorbe el costo y la cuota es real',
                        'El diferencial tipico en Ecuador entre precio contado y cuotas suele ser 10-18% del valor del producto',
                        'Siempre calcula: precio contado vs (cuota × numero de cuotas). La diferencia es el costo real del financiamiento.',
                    ]),
                    tip('Usa la tarjeta exclusivamente para gastos que ya estan en tu presupuesto y para los que tienes el dinero disponible en cuenta corriente. Pagala siempre en su totalidad antes del vencimiento. Bajo ese esquema, la tarjeta es un instrumento gratuito que ademas ofrece proteccion en compras online y eventual acumulacion de millas o cashback.'),
                    warn('El limite de credito puede subir automaticamente si eres buen pagador. Ese aumento no significa que debes usarlo. Aceptar un aumento de limite solo tiene sentido si mejora tu tasa de utilizacion (cuanto debes vs cuanto tienes disponible) para fines de historial crediticio, no como autorizacion para gastar mas.'),
                    exc('Revisa todas las tarjetas o lineas de credito que tienes actualmente. Para cada una anota: saldo actual, tasa de interes, pago minimo y fecha de vencimiento. Calcula el total de saldo en todas. Si ese total supera el 20% de un mes de ingreso, tienes una senhal de alerta que vale la pena atender.', 'El porcentaje de utilizacion (saldo/limite) recomendado para no afectar el historial crediticio es menor al 30%. Si tu utilizacion es alta, pagar primero la de mayor tasa tiene impacto directo en tu costo mensual de deuda.'),
                    vid('Como usar la tarjeta de credito sin caer en deudas', 'https://www.youtube.com/results?search_query=como+usar+tarjeta+credito+sin+endeudarse+correctamente'),
                ],
            },
            {
                title: 'Metodos para salir de deudas', order: 3, duration: 15, xpReward: 45,
                content: [
                    h('Eliminar deudas de consumo es una inversion con retorno garantizado'),
                    t('Las deudas de consumo (tarjetas, prestamos personales, credito en almacenes) son como remar con un ancla. Cada mes que pasan generan intereses que reducen tu capacidad de ahorrar e invertir. Eliminarlas no es solo un alivio psicologico: es una decision financiera con el retorno mas alto y mas garantizado que encontraras.'),
                    kc('Metodo Avalancha', 'Estrategia de pago de deudas donde se paga primero la deuda con la mayor tasa de interes mientras se hacen pagos minimos en todas las demas. Matematicamente optimo: minimiza el total de intereses pagados durante el proceso de liquidacion.'),
                    kc('Metodo Bola de Nieve', 'Estrategia donde se paga primero la deuda de menor saldo total (sin importar la tasa) para eliminarla rapidamente. Psicologicamente efectivo: las victorias rapidas al eliminar deudas pequenas generan motivacion sostenida para continuar el proceso.'),
                    cmp('Metodo Avalancha', 'Metodo Bola de Nieve', [
                        'Prioriza la deuda de mayor tasa de interes',
                        'Matematicamente optimo: menor costo total de intereses',
                        'Puede tardar mas en ver la primera deuda eliminada',
                        'Ideal si tienes disciplina y motivacion sostenida',
                    ], [
                        'Prioriza la deuda de menor saldo total',
                        'Mayor costo total de intereses que la avalancha',
                        'Eliminas la primera deuda mas rapido: victoria temprana',
                        'Ideal si necesitas motivacion rapida para mantener el proceso',
                    ]),
                    ex('Avalancha vs bola de nieve con las mismas 3 deudas', 'Deudas: Tarjeta A $1,200 al 28%, Tarjeta B $3,000 al 18%, Prestamo personal $800 al 12%. Pago disponible extra: $200/mes sobre minimos. AVALANCHA: ataca Tarjeta A primero (28%). La elimina en mes 6. Total intereses pagados al liquidar todo: $890. BOLA DE NIEVE: ataca Prestamo $800 primero (menor saldo). Lo elimina en mes 4. Total intereses pagados al liquidar todo: $1,050. Diferencia: $160 mas con bola de nieve. La motivacion adicional tiene un costo de $160.'),
                    lst('El proceso paso a paso sin importar cual metodo elijas', [
                        'Paso 1: Lista todas tus deudas: nombre, saldo actual, tasa de interes y cuota minima mensual',
                        'Paso 2: Calcula cuanto dinero puedes destinar a deudas por encima de todos los minimos combinados',
                        'Paso 3: Elige tu metodo (avalancha si tienes disciplina, bola de nieve si necesitas motivacion)',
                        'Paso 4: Paga el minimo en TODAS las deudas menos la deuda objetivo del mes',
                        'Paso 5: Todo el dinero extra disponible va a la deuda objetivo sin excepcion',
                        'Paso 6: Al liquidar una deuda, su cuota mensual completa pasa a la siguiente deuda objetivo',
                    ]),
                    fml('Dinero disponible para ataque = Ingresos - Gastos esenciales - Minimos de todas las deudas', [
                        'Gastos esenciales: lo estrictamente necesario para vivir y trabajar',
                        'Minimos de todas las deudas: el pago minimo requerido de cada cuenta',
                        'El resultado es el "poder de ataque" extra que puedes concentrar en una deuda a la vez',
                    ]),
                    exc('Haz tu inventario de deudas ahora: lista cada deuda activa con saldo actual, tasa de interes y cuota minima. Suma todas las cuotas minimas. Calcula cuanto dinero extra podrias liberar cada mes para acelerar el pago si redujeras temporalmente los gastos de deseos. Ese es tu poder de ataque mensual.', 'Si el inventario te da ansiedad, recuerda que la informacion no empeora la situacion. El problema ya existia antes de que lo analizaras. Solo saber los numeros reales te da poder para actuar.'),
                    h('La consolidacion: cuando tiene sentido y cuando es una trampa'),
                    t('Consolidar deudas significa tomar un nuevo prestamo para pagar varios creditos anteriores y quedarte con una sola cuota mensual a una tasa menor. Puede tener sentido matematico. El riesgo es que sin cambiar el habito que genero las deudas, en 18-24 meses puedes volver al mismo punto pero con el prestamo de consolidacion encima.'),
                    lst('Consolidacion inteligente: los criterios que deben cumplirse', [
                        'La nueva tasa debe ser menor al promedio ponderado de las deudas que consolidas',
                        'La nueva cuota mensual total no debe superar la suma de las cuotas anteriores',
                        'Debes cerrar (no solo pagar) las tarjetas consolidadas para eliminar la tentacion de reusarlas',
                        'Debes haber identificado y cambiado el habito de gasto que genero las deudas',
                        'Si algun punto no se cumple, la consolidacion solo mueve el problema de lugar',
                    ]),
                    tip('Si en un mes recibes dinero extra (venta de algo, ingreso adicional, regalo), usa al menos el 70% para pagar deuda extra antes de gastarlo en cualquier otra cosa. Ese prepago directo sobre el capital reduce todos los intereses futuros de esa deuda. El impacto de un pago extra sobre el capital es inmediato y permanente.'),
                    exc('Aplica el metodo elegido (avalancha o bola de nieve) a tu inventario de deudas actual. Determina: cual es tu deuda objetivo hoy (la de mayor tasa o la de menor saldo segun tu eleccion), cuanto dinero podras atacarla este mes por encima del minimo, y en cuantos meses aproximadamente la liquidas a ese ritmo.', 'Si no tienes deudas activas, calcula con un escenario hipotetico: $500 en tarjeta al 22%, $300 en credito al 15%, $200/mes disponible para pago. Cual metodo termina antes? Cual paga menos intereses totales?'),
                    vid('Metodo avalancha vs bola de nieve cual elegir para salir de deudas', 'https://www.youtube.com/results?search_query=metodo+avalancha+bola+nieve+pagar+deudas+rapido'),
                ],
            },
            {
                title: 'Tu historial crediticio', order: 4, duration: 12, xpReward: 40,
                content: [
                    h('Tu reputacion financiera: como se construye y como se cuida'),
                    t('El historial crediticio es el registro permanente de como has manejado tus compromisos de pago en el pasado. Un buen historial abre puertas: mejores tasas de interes, mayor acceso a credito, y en algunos contextos es consultado incluso por empleadores para roles financieros. Un mal historial las cierra por anos.'),
                    kc('Historial crediticio', 'Registro detallado del comportamiento de pago de una persona: si paga a tiempo, cuanto debe actualmente, cuantas cuentas tiene, cuanto tiempo llevan activas y cuantas solicitudes de credito ha hecho recientemente. En Ecuador lo administran principalmente Equifax y el sistema financiero regulado.'),
                    kc('Score crediticio', 'Numero que resume el historial crediticio en una escala. A mayor score, menor riesgo percibido por el prestamista, lo que se traduce en mejores tasas, mayores montos aprobados y condiciones mas favorables. En Ecuador el rango tipico es 0-999 segun el buro.'),
                    lst('Los 5 factores que construyen o danan el score crediticio', [
                        'Historial de pagos (35% del peso): el factor mas importante. Un solo pago tardio puede bajar el score significativamente y quedarse registrado por 5-7 anos.',
                        'Nivel de utilizacion (30%): cuanto debes vs cuanto credito tienes disponible. Menos del 30% de utilizacion es ideal. Al 80%+ se considera senhal de riesgo.',
                        'Antiguedad del historial (15%): cuentas activas de mayor tiempo construyen confianza. No cierres cuentas antiguas innecesariamente.',
                        'Tipos de credito (10%): tener diferentes tipos (tarjeta, prestamo, credito comercial) muestra capacidad de manejar obligaciones diversas.',
                        'Consultas recientes (10%): muchas solicitudes de credito en poco tiempo se interpreta como senhal de dificultades financieras y puede reducir el score.',
                    ]),
                    exc('Solicita tu buro de credito: en Ecuador puedes consultar tu historial en Equifax o a traves de tu banco. Revisa si hay cuentas que no reconoces (posible error o fraude), pagos tardios registrados, o deudas que creias pagadas pero siguen activas. Los errores en el buro son mas comunes de lo que se cree y pueden afectar tu acceso a credito sin que lo sepas.', 'La consulta de tu propio buro (consulta "blanda") NO afecta tu score. Solo las consultas de prestamistas cuando solicitas credito ("consulta dura") pueden afectarlo temporalmente.'),
                    h('Como construir historial desde cero'),
                    lst('Camino para construir historial crediticio si no tienes ninguno', [
                        'Tarjeta de credito asegurada: depositas tu propio dinero como garantia y eso define tu limite. Usas la tarjeta para compras pequenas planificadas y pagas el total cada mes.',
                        'Credito de construccion en cooperativa: depositas en un fondo y sobre ese fondo te prestan. Tu pago mensual queda registrado positivamente.',
                        'Ser cuentahabiente responsable: una cuenta bancaria activa con historial limpio es el primer paso antes de solicitar cualquier credito.',
                        'Cuotas de telefonia o servicios: algunos operadores reportan el comportamiento de pago de planes al buro.',
                        'Credito de bajo monto en una cooperativa con garantia de un codeudor confiable.',
                    ]),
                    ex('De historial cero a score solido en 18 meses', 'Sofia, 22 anos, no tenia historial crediticio. Mes 1: abrio cuenta corriente y tarjeta asegurada con $300 de garantia en su cooperativa. Meses 2-18: compro solo gastos ya presupuestados (mercado, gasolina, $50-100 al mes) y pago el saldo completo cada mes sin excepcion. A los 18 meses tenia score 720+ (bueno) y su cooperativa le ofrecio una tarjeta sin garantia con limite de $800 a tasa preferencial.'),
                    tip('Antes de solicitar un credito grande (vehiculo, hipoteca, negocio), espera 6 meses sin hacer nuevas solicitudes de credito para que las consultas duras recientes no reduzcan tu score en el momento de la evaluacion. El momento de pedir credito importa tanto como el historial que tienes.'),
                    warn('Un solo pago tardio puede afectar tu score por hasta 7 anos en Ecuador segun la normativa del buro. Si vas a tener dificultades para pagar una cuota, llama a tu banco O COOPERATIVA ANTES de que venza, no despues. Muchas instituciones tienen opciones de diferimiento o reestructuracion que no generan registro negativo si se gestionan antes del incumplimiento.'),
                    exc('Define tu siguiente accion de historial crediticio segun tu situacion actual: (A) Si no tienes historial: investiga los requisitos para abrir una tarjeta asegurada o credito de construccion en una cooperativa de tu ciudad. (B) Si tienes historial pero con marcas negativas: identifica la deuda en mora mas antigua e investiga si ya vencio el tiempo de reporte o si puedes negociar un acuerdo de pago. (C) Si tienes buen historial: calcula tu tasa de utilizacion actual y evalua si hay oportunidad de mejorarla.', 'La tasa de utilizacion = (suma de saldos actuales / suma de limites disponibles) × 100. Mantenla por debajo del 30% para optimizar tu score.'),
                    vid('Como mejorar tu historial crediticio y score paso a paso', 'https://www.youtube.com/results?search_query=como+mejorar+historial+crediticio+score+burocredito'),
                ],
            },
        ],
    },

    // ─── MODULO 4: INVERSIONES BASICAS ────────────────────────────────────────
    {
        order: 4,
        lessons: [
            {
                title: 'Por que invertir es mejor que solo ahorrar', order: 1, duration: 15, xpReward: 40,
                content: [
                    h('El dinero que no trabaja pierde valor cada ano'),
                    t('Ahorrar es necesario pero no suficiente. La inflacion reduce silenciosamente el poder de compra de tu dinero cada ano. Lo que hoy compras con $100, en 10 anos puede costar $163 si la inflacion promedia 5% anual. Si tu ahorro no rinde al menos lo que sube la inflacion, cada ano eres un poco mas pobre aunque el numero en tu cuenta no cambie.'),
                    kc('Inflacion', 'Aumento generalizado y sostenido del nivel de precios. Si la inflacion anual es del 4% y tu ahorro rinde el 2%, pierdes 2% de poder adquisitivo cada ano aunque el saldo suba. Lo que importa no es el rendimiento nominal sino el rendimiento real despues de la inflacion.'),
                    fml('Rendimiento real = Rendimiento nominal - Inflacion', [
                        'Cuenta bancaria al 2% con inflacion del 4%: rendimiento real = -2% (pierdes poder de compra)',
                        'Fondo indexado al 10% con inflacion del 4%: rendimiento real = +6%',
                        'El objetivo de la inversion es superar la inflacion y generar riqueza real, no solo nominal',
                    ]),
                    ex('El costo de no invertir durante 20 anos', '$10,000 en cuenta bancaria al 1.5% durante 20 anos: resultado $13,470. Los mismos $10,000 en fondo indexado al 8% promedio anual durante 20 anos: resultado $46,610. Diferencia: $33,140. No invertir no es una decision neutral: es una decision de regalar $33,140 de poder de compra futuro.'),
                    kc('ROI (Return on Investment)', 'Porcentaje de ganancia o perdida generada en relacion al capital invertido. ROI positivo: ganaste dinero. ROI negativo: perdiste dinero. Sirve para comparar eficiencia de distintas decisiones de inversion independientemente del monto invertido.'),
                    fml('ROI = ((Ganancia - Costo de inversion) / Costo de inversion) × 100', [
                        'Invertiste $500, tienes $600 despues de un ano: ROI = ((600-500)/500) × 100 = 20%',
                        'Invertiste $500, tienes $450: ROI = ((450-500)/500) × 100 = -10% (perdida)',
                        'Comparar ROI permite evaluar si una decision financiera fue mejor que otra',
                    ]),
                    exc('Calcula el ROI de la siguiente decision hipotetica: decides tomar un curso de Excel avanzado por $150 que te permite conseguir un trabajo con $80 mas de ingreso mensual. Asumiendo que ese diferencial de ingreso persiste 12 meses, cual es el ROI de la decision en ese periodo? Que implicacion tiene para como piensas en el desarrollo de habilidades?', 'ROI = ((beneficio 12 meses - costo) / costo) × 100. El beneficio = $80 × 12 = $960. Costo = $150. ROI = 540%. Este calculo explica por que la inversion en educacion y habilidades suele ser la de mayor retorno disponible.'),
                    h('La jerarquia de las finanzas personales: el orden correcto'),
                    lst('En que orden debes priorizar cada decision financiera', [
                        'Prioridad 1 - Fondo de emergencia (3-6 meses de gastos): sin esto eres vulnerable a cualquier imprevisto',
                        'Prioridad 2 - Eliminar deudas al +15% de tasa: son la inversion de mayor retorno garantizado disponible',
                        'Prioridad 3 - Invertir a largo plazo: con el colchon de emergencia y sin deudas caras, el dinero puede crecer sin riesgo de liquidacion forzada',
                        'Prioridad 4 - Pagar deudas de bajo interes: en paralelo con la inversion si la tasa es menor al rendimiento esperado',
                    ]),
                    t('El orden importa. Invertir antes de tener fondo de emergencia es peligroso: ante cualquier crisis tendras que liquidar inversiones en el peor momento posible, cuando el mercado puede estar bajo. Invertir antes de pagar deudas al 20% es matematicamente irracional: ninguna inversion convencional garantiza ese rendimiento.'),
                    tip('No necesitas mucho capital para empezar a invertir. Muchos fondos de inversion y cooperativas permiten empezar desde $50-100. El monto inicial importa menos que el habito y el tiempo en el mercado. Quien empieza con $50/mes a los 23 anos suele superar a quien empieza con $500/mes a los 35.'),
                    warn('Invertir antes de tener deudas de alto interes pagadas es matematicamente incorrecto en la mayoria de casos. Si tienes $1,000 de deuda al 24% y $1,000 para invertir, cada ano que mantienes esa deuda pierdes $240 en intereses. Ningun instrumento convencional garantiza ese rendimiento. La logica matematica exige pagar primero la deuda costosa.'),
                    exc('Evalua en cual prioridad de la jerarquia te encuentras hoy. Tienes fondo de emergencia completo (Nivel 2 al menos)? Tienes deudas con tasa superior al 15%? Dependiendo de tu respuesta, define tu siguiente accion especifica: completar el fondo, atacar la deuda mas cara, o iniciar inversiones.', 'No hay una respuesta incorrecta, hay una respuesta honesta. La jerarquia no es un juicio sino una herramienta para priorizar recursos limitados.'),
                    vid('Por que invertir es fundamental para construir riqueza a largo plazo', 'https://www.youtube.com/results?search_query=por+que+invertir+dinero+largo+plazo+inflacion+riqueza'),
                ],
            },
            {
                title: 'Tipos de activos financieros', order: 2, duration: 15, xpReward: 45,
                content: [
                    h('Conoce el universo de opciones antes de elegir'),
                    t('Un activo financiero es algo que posees y que puede generar valor o ingresos en el tiempo. Entender los principales tipos de activos te permite construir una cartera adecuada a tus objetivos y horizonte temporal, y reconocer rapidamente cuando alguien te esta ofreciendo algo demasiado bueno para ser real.'),
                    kc('Activo financiero', 'Instrumento que representa un derecho economico: de propiedad (acciones), de deuda (bonos), o de participacion en un fondo. Su valor deriva de la promesa de flujos futuros de dinero o de la apreciacion de precio en el mercado.'),
                    lst('Los grandes grupos de activos financieros con sus caracteristicas clave', [
                        'Efectivo y depositos: maxima liquidez, minimo riesgo, rendimiento igual o menor a inflacion',
                        'Renta fija (bonos, depositos a plazo): pago de interes fijo definido, capital garantizado si se mantiene hasta vencimiento',
                        'Renta variable (acciones): potencial de crecimiento alto, valor fluctua con el mercado, sin garantia de rendimiento',
                        'Fondos de inversion y ETFs: carteras diversificadas administradas, accesibles con poco capital',
                        'Bienes raices: ingresos por arriendo y apreciacion, iliquidos, requieren capital significativo',
                        'Activos alternativos (oro, materias primas, criptomonedas): alta volatilidad, no correlacionados con mercado tradicional',
                    ]),
                    kc('Acciones (renta variable)', 'Titulo de propiedad fraccionada en una empresa. Al comprar acciones te conviertes en dueno de una parte proporcional: participas en ganancias via dividendos y en el crecimiento del valor de la empresa. Mayor potencial de retorno a largo plazo, pero con volatilidad significativa en el corto plazo.'),
                    kc('Bonos (renta fija)', 'Instrumento de deuda: le prestas dinero a una empresa o gobierno y recibes pagos de interes periodicos (cupones) mas la devolucion del capital al vencimiento. Mas predecible y estable que las acciones, pero con menor potencial de crecimiento en el largo plazo.'),
                    cmp('Acciones (renta variable)', 'Bonos (renta fija)', [
                        'Propiedad en una empresa (eres socio)',
                        'Retorno via apreciacion de precio + dividendos',
                        'Valor puede subir o bajar significativamente',
                        'Mayor potencial de retorno en largo plazo (8-12% historico S&P)',
                        'Sin vencimiento fijo, puedes mantener indefinidamente',
                    ], [
                        'Prestamo a empresa o gobierno (eres acreedor)',
                        'Retorno via pagos de interes fijo (cupon)',
                        'Valor relativamente estable, menos volatil',
                        'Retorno mas predecible pero menor (3-7% tipico)',
                        'Vencimiento definido: recuperas capital en fecha pactada',
                    ]),
                    kc('Fondo de inversion', 'Vehiculo que agrupa el capital de multiples inversores para invertir colectivamente en una cartera de activos. Permiten diversificacion con poco capital, gestion profesional y acceso a mercados que individualmente requeririan montos mayores.'),
                    exc('Investiga cual es el fondo de inversion o deposito a plazo mas competitivo disponible en tu ciudad actualmente (cooperativa, banco o bolsa de valores). Compara: tasa de rendimiento (APY), monto minimo de inversion, plazo de inmovilizacion y si esta regulado por la SEPS o Superintendencia de Bancos. Elige uno que podrias considerar para empezar.', 'Busca en el sitio web de JEP, Jardin Azuayo, Cooprogreso o en la Bolsa de Valores de Quito la seccion de depositos a plazo o titulos de renta fija. Las bolsas de valores publican las tasas de los titulos en circulacion.'),
                    h('La relacion entre riesgo y rendimiento: la ley fundamental de la inversion'),
                    t('En el mundo de las inversiones existe una relacion directa e irrefutable: a mayor riesgo potencial, mayor rendimiento esperado. No existe ninguna inversion legitima que ofrezca rendimientos altos con riesgo bajo. Quien te promete eso te esta mintiendo, consciente o inconscientemente.'),
                    lst('El espectro riesgo-rendimiento de menor a mayor riesgo', [
                        'Depositos bancarios asegurados: riesgo minimo, rendimiento 1-3%, liquidos',
                        'Depositos a plazo en cooperativas reguladas: riesgo bajo, rendimiento 4-7%, iliquidos por plazo',
                        'Bonos del gobierno (soberanos): riesgo bajo-medio, rendimiento 4-8% segun pais y plazo',
                        'Fondos indexados globales: riesgo medio, rendimiento historico 8-10% anual en 20+ anos',
                        'Acciones individuales: riesgo medio-alto, retorno variable, puede ser negativo',
                        'Criptomonedas: riesgo muy alto, volatilidad extrema, puede perder 80%+ en un ano',
                    ]),
                    warn('Ninguna inversion garantiza rendimientos altos. Si alguien te garantiza 3-5% mensual (36-60% anual) con riesgo minimo o cero, es una estafa o una piramide. Las inversiones legitimas de alto rendimiento tienen alta volatilidad y riesgo real de perdida. La garantia y el alto rendimiento simultaneo son incompatibles.'),
                    tip('Para principiantes: empieza con el instrumento que entiendes mejor, con el monto que no te quitaria el sueno perder en un escenario malo, y con el plazo que te permite no necesitar ese dinero. Esas tres restricciones juntas definen tu punto de entrada correcto, independientemente de lo que diga cualquier asesor.'),
                    exc('Define tu perfil de inversor inicial respondiendo tres preguntas: (1) En cuantos anos necesitarias este dinero si lo invirtieras hoy? (2) Si tu inversion bajara un 30% en valor el ano 1, que harias: vender para limitar perdidas, mantener, o comprar mas? (3) Cual es el monto maximo que podrias invertir sin que te afecte si perdieras el 20%? Tus respuestas definen tu horizonte, tolerancia al riesgo y capacidad de inversion inicial.', 'No hay respuestas incorrectas. El objetivo es conocerte antes de elegir un instrumento, no al reves.'),
                    vid('Tipos de activos financieros para inversores principiantes', 'https://www.youtube.com/results?search_query=tipos+activos+financieros+acciones+bonos+fondos+principiantes'),
                ],
            },
            {
                title: 'Riesgo, rendimiento y diversificacion', order: 3, duration: 15, xpReward: 45,
                content: [
                    h('Los tres conceptos que definen toda decision de inversion'),
                    kc('Relacion riesgo-rendimiento', 'Principio fundamental: a mayor riesgo asumido, mayor rendimiento esperado. Esta relacion es directa e ineludible. No existe alto rendimiento con bajo riesgo en inversiones legitimas. La promesa de ambos simultaneamente es siempre una senal de alerta.'),
                    t('Tu tolerancia al riesgo depende de tres factores que debes evaluar honestamente antes de invertir: tu horizonte temporal (cuanto tiempo puedes mantener la inversion sin necesitar el dinero), tu capacidad economica de asumir perdidas (podrias sobrevivir si pierdes el 30% sin entrar en crisis), y tu temperamento (podrias mantener la calma y no vender en panico durante una caida del mercado).'),
                    kc('Diversificacion', 'Estrategia de distribuir la inversion en diferentes activos, sectores geograficos o instrumentos para reducir el riesgo total de la cartera. Si un activo cae, otros pueden compensar. La diversificacion no elimina el riesgo completamente pero evita que un solo evento destruya toda la cartera.'),
                    ex('Diversificacion en numeros concretos', 'Cartera concentrada: $5,000 en una sola empresa tecnologica. Si esa empresa quiebra o pierde el 70% de valor, pierdes $3,500. Cartera diversificada: $2,000 en ETF de 500 empresas, $1,500 en bonos, $1,000 en sector salud, $500 en liquidez. Si tecnologicas caen 70%, tu cartera cae aproximadamente 15-20%. La diversificacion no elimina la perdida pero la hace manejable.'),
                    lst('Los tipos de riesgo que todo inversor debe conocer', [
                        'Riesgo especifico o idiosincratico: el riesgo de una empresa particular. Se elimina diversificando en muchas empresas.',
                        'Riesgo de mercado o sistematico: afecta a todo el mercado simultaneamente (crisis 2008, pandemia 2020). No se puede eliminar, solo tolerar.',
                        'Riesgo de liquidez: no poder vender rapidamente sin perder valor significativo. Problema en inversiones en bienes raices o activos exoticos.',
                        'Riesgo de inflacion: que el rendimiento de tu inversion no supere la inflacion, perdiendo poder adquisitivo real.',
                        'Riesgo de concentracion: tener demasiado porcentaje en un solo activo, sector o pais.',
                    ]),
                    cmp('Cartera concentrada (alto riesgo)', 'Cartera diversificada (menor riesgo)', [
                        'Todo el capital en 1-3 acciones individuales',
                        'Un mal trimestre de una empresa puede devastar la cartera',
                        'Potencial de ganancias muy altas si aciertas',
                        'No recomendada para la mayoria de inversores',
                    ], [
                        'Capital distribuido en 20-500+ activos via ETFs o fondos',
                        'El fallo de una empresa tiene impacto minimo en el total',
                        'Rendimiento mas estable y predecible a largo plazo',
                        'Base recomendada para cualquier inversor, especialmente principiantes',
                    ]),
                    exc('Evalua el nivel de diversificacion de tus ahorros actuales: cuantos instrumentos o instituciones financieras diferentes tienes? Si todo tu dinero esta en una sola cuenta de un solo banco, tienes riesgo de concentracion. Identifica una accion concreta para reducir esa concentracion (abrir cuenta en cooperativa, iniciar un plazo fijo en otra institucion, etc.).', 'La diversificacion no requiere grandes montos. Tener el fondo de emergencia en una cooperativa y el ahorro de metas en otra institucion ya es diversificacion basica de riesgo institucional.'),
                    h('Horizonte temporal: el parametro que cambia todo'),
                    t('El horizonte de inversion, cuanto tiempo puedes mantener el dinero invertido sin necesitarlo, es el factor mas determinante para elegir la estrategia correcta. No es tu edad ni tu ingreso: es el tiempo. Con mucho tiempo puedes tolerar la volatilidad y buscar mayor rendimiento. Con poco tiempo necesitas estabilidad incluso si el rendimiento es menor.'),
                    lst('Como el horizonte cambia la estrategia recomendada', [
                        'Menos de 1 ano: solo liquidez o depositos a plazo fijo. El dinero debe estar disponible y estable.',
                        '1-3 anos: predominancia de renta fija (bonos, plazo fijo). Algo de renta variable solo si toleras volatilidad.',
                        '3-7 anos: mezcla equilibrada. 40-60% renta variable, resto en renta fija o bonos.',
                        '7-15 anos: predominancia de renta variable (60-80%). El tiempo absorbe la volatilidad.',
                        'Mas de 15 anos: alta proporcion en renta variable (70-90%). El largo plazo maximiza el potencial del interes compuesto.',
                    ]),
                    tip('Una forma practica de determinar tu asignacion de activos inicial: substrae tu edad de 110. El resultado es el porcentaje aproximado que podrias mantener en renta variable. A los 25 anos: 110-25=85% en acciones, 15% en bonos. A los 50: 60% acciones, 40% bonos. Ajusta segun tu tolerancia real al riesgo.'),
                    exc('Define una cartera hipotetica para tu situacion especifica: (1) cuanto tienes disponible para invertir hoy, (2) en cuantos anos necesitarias ese dinero, (3) que porcentaje de ese dinero podrias perder temporalmente sin que afecte tu vida. Con esos tres datos, describe como distribuirias el dinero entre los tipos de activos estudiados en esta leccion.', 'No hay una respuesta perfecta. El objetivo es practicar el proceso de decision antes de que sea con dinero real.'),
                    vid('Como diversificar una cartera de inversiones para reducir el riesgo', 'https://www.youtube.com/results?search_query=diversificacion+cartera+inversiones+reducir+riesgo'),
                ],
            },
            {
                title: 'Tu primera inversion paso a paso', order: 4, duration: 18, xpReward: 50,
                content: [
                    h('Del conocimiento a la primera accion concreta'),
                    t('El mayor error de los principiantes no es elegir el instrumento equivocado. Es esperar el momento perfecto, la cantidad suficiente o el conocimiento completo. No existe el momento perfecto. El mejor momento para empezar a invertir es hoy, con lo que tienes disponible y el conocimiento que ya tienes, ajustando la estrategia con el tiempo.'),
                    lst('Lista de verificacion antes de tu primera inversion real', [
                        'Tienes fondo de emergencia de al menos 1 mes? Si no, construyelo primero antes de invertir.',
                        'Tienes deudas con tasa superior al 15%? Si si, priorizalas antes de invertir en cualquier otro instrumento.',
                        'Entiendes como funciona el instrumento que vas a usar y como podrias perder dinero con el?',
                        'El dinero que vas a invertir puede permanecer invertido al menos 1-3 anos sin que lo necesites?',
                        'Tienes claro que los rendimientos pasados no garantizan rendimientos futuros?',
                    ]),
                    kc('DCA (Dollar Cost Averaging o Promedio de Costo en Dolares)', 'Estrategia de invertir una cantidad fija periodicamente (mensual, quincenal) sin importar si el precio del activo esta alto o bajo. Cuando el precio baja, compras mas unidades. Cuando sube, compras menos. El costo promedio por unidad tiende a ser menor que si invirtieras todo de una vez.'),
                    ex('DCA vs inversion de suma fija en un periodo volatil', 'En lugar de invertir $1,200 de una sola vez, inviertes $100 cada mes durante 12 meses. Mes 1: precio $10/unidad, compras 10 unidades. Mes 6: precio baja a $7, compras 14.3 unidades. Mes 12: precio sube a $11, compras 9.1 unidades. Promedio de costo: $9.30/unidad vs $10 si hubieras comprado todo en el mes 1. DCA reduce el impacto de comprar en el momento incorrecto.'),
                    fml('Costo promedio DCA = Inversion total / Total de unidades adquiridas', [
                        'Ejemplo: $1,200 invertidos en 12 meses comprando a distintos precios',
                        'Si compraste 130 unidades en total: costo promedio = $1,200/130 = $9.23',
                        'vs invertir $1,200 de una vez al precio del mes 1 = $10/unidad exactos',
                    ]),
                    exc('Diseña tu estrategia DCA personal: define cuanto podrias invertir cada mes (aunque sea $30-50), en que instrumento lo invertiras (fondo indexado, ETF, plazo fijo renovable), y durante cuantos meses lo mantendras sin evaluarlo. Escribe los tres datos. Tener el plan antes de ejecutarlo reduce las decisiones emocionales en el camino.', 'Para Ecuador: una opcion accesible es deposito a plazo renovable en cooperativa con aporte mensual. Para mercados internacionales: plataformas como eToro o Interactive Brokers permiten comprar ETFs desde $10 si tienes acceso.'),
                    h('Instrumentos accesibles para empezar en Ecuador'),
                    lst('Opciones reales para el primer inversor con menos de $1,000', [
                        'Deposito a plazo fijo en cooperativa regulada: desde $50, plazo 90-360 dias, APY 4-7%',
                        'Certificados de deposito renovables: apostas el mismo capital cada vencimiento y vas acumulando',
                        'Acciones en la Bolsa de Valores de Quito: requiere cuenta en casa de valores (casabor.com o similar), desde $200 aproximadamente',
                        'ETFs internacionales via plataformas digitales: exposicion a S&P500 o mercado global, desde $10-50',
                        'Fondos de inversion colectiva: algunos fondos en Ecuador permiten entrar desde $100-200',
                    ]),
                    warn('Desconfia de cualquier plataforma que prometa rendimientos del 5-10% mensual, sin regulacion clara, con testimonios excesivamente positivos y presion para invertir rapido o reclutar nuevos inversores. Estas son caracteristicas comunes de piramides y fraudes de inversion que operan activamente en Ecuador y Latinoamerica. La plataforma debe estar regulada por la Superintendencia de Bancos, SEPS o el equivalente regulatorio del pais donde opera.'),
                    tip('Lee el prospecto o contrato de cualquier fondo o instrumento antes de invertir. Si no entiendes que activos contiene, como genera rendimiento y bajo que condiciones puedes perder dinero, busca uno mas simple o aprende mas antes de comprometer el capital. La comprension del instrumento es proteccion, no burocracia.'),
                    h('Los errores mas costosos del inversor principiante'),
                    lst('Los 5 errores que destruyen el rendimiento a largo plazo', [
                        'Error 1: Vender en panico durante caidas del mercado. Las caidas son temporales para quien tiene horizonte largo. La venta durante una caida convierte la perdida temporal en permanente.',
                        'Error 2: Buscar el momento perfecto para entrar (market timing). Estudios muestran que el tiempo EN el mercado supera al tiempo ELIGIENDO el mercado.',
                        'Error 3: Concentrar en un solo activo o sector buscando el maximo retorno.',
                        'Error 4: No reinvertir los rendimientos o dividendos. La reinversion es lo que activa el interes compuesto.',
                        'Error 5: Revisar el valor de la cartera diariamente. Genera ansiedad y decisiones emocionales. Para inversion a largo plazo, revision mensual o trimestral es suficiente.',
                    ]),
                    exc('Define los parametros de tu primera inversion real o hipotetica: instrumento elegido, monto inicial, monto de aporte mensual DCA, plazo minimo de mantenimiento sin evaluar rendimiento, y la condicion que te haria cambiar la estrategia (perdida de mas del X%). Escribir estos parametros de antemano elimina la mayoria de las decisiones emocionales futuras.', 'El plan escrito es tu ancla cuando el mercado sube y te da euforia o cuando baja y te da miedo. Las decisiones tomadas con calma antes de la volatilidad son mas racionales que las tomadas en el momento de la emocion.'),
                    vid('Como empezar a invertir desde cero: guia completa para principiantes', 'https://www.youtube.com/results?search_query=como+empezar+invertir+desde+cero+principiantes+paso+a+paso'),
                ],
            },
        ],
    },

    // ─── MODULO 5: MERCADO DE VALORES ─────────────────────────────────────────
    {
        order: 5,
        lessons: [
            {
                title: 'La bolsa de valores explicada', order: 1, duration: 15, xpReward: 45,
                content: [
                    h('Un mercado de propiedad, no un casino'),
                    t('La bolsa de valores no es un casino ni un sistema de apuestas. Es un mercado organizado donde los propietarios de empresas pueden vender fracciones de su negocio al publico, y donde el publico puede convertirse en dueno de partes de las mejores empresas del mundo con tan solo unos dolares. Esta distincion cambia completamente como debes relacionarte con ella.'),
                    kc('Bolsa de valores', 'Mercado organizado y regulado donde se negocian titulos financieros: acciones, bonos y otros instrumentos. Cumple dos funciones clave: permite a las empresas obtener capital del publico (mercado primario) y permite a los inversores comprar y vender entre si esos titulos (mercado secundario).'),
                    t('El S&P 500, el indice de las 500 empresas mas grandes de Estados Unidos, ha retornado en promedio el 10% anual durante los ultimos 100 anos, atravesando dos guerras mundiales, la Gran Depresion, multiples recesiones, la crisis del 2008 y la pandemia del 2020. A largo plazo, el mercado siempre se ha recuperado.'),
                    lst('Como funciona una transaccion en bolsa paso a paso', [
                        'Paso 1: El inversor da una orden de compra a su broker (precio limite o precio de mercado)',
                        'Paso 2: El broker envía la orden a la bolsa donde se ejecuta cuando hay un vendedor al precio solicitado',
                        'Paso 3: La transaccion se liquida en T+2: dos dias habiles despues la accion aparece en tu cuenta',
                        'Paso 4: El precio de la accion sube o baja segun la oferta y demanda del mercado en tiempo real',
                    ]),
                    kc('Capitalizacion de mercado', 'Precio actual de la accion multiplicado por el total de acciones en circulacion. Indica el tamano relativo de una empresa. Apple, con capitalizacion de $3 trillones, es la empresa mas valiosa del mundo. Permite comparar empresas de forma relativa.'),
                    exc('Busca en Google el precio actual de la accion de una empresa que uses o conozcas: Apple (AAPL), Amazon (AMZN), Coca Cola (KO), o cualquier empresa que te sea familiar. Observa el precio actual, el cambio del dia, y el grafico de los ultimos 12 meses. Describe lo que ves: sube, baja, es volatil o estable?', 'No necesitas cuenta de inversiones para ver precios. Google Finance, Yahoo Finance o Investing.com muestran cotizaciones en tiempo real de cualquier empresa listada en bolsa.'),
                    h('Los indices bursatiles: el termometro del mercado'),
                    kc('Indice bursatil', 'Indicador que mide el desempeno promedio de un grupo de acciones seleccionado. Permite evaluar si el mercado en general sube o baja, y sirve como referencia para comparar el rendimiento de carteras individuales.'),
                    lst('Los indices mas importantes del mundo y lo que miden', [
                        'S&P 500: las 500 empresas de mayor capitalizacion de EE.UU. El indicador mas seguido globalmente.',
                        'NASDAQ Composite: mas de 3,000 empresas principalmente tecnologicas. Mas volatil que el S&P 500.',
                        'Dow Jones Industrial (DJIA): solo 30 empresas grandes de EE.UU. El mas antiguo, menos representativo que el S&P.',
                        'MSCI World: empresas de 23 paises desarrollados. Exposicion global en un indice.',
                        'MSCI Emerging Markets: empresas de 24 mercados emergentes incluyendo China, Brasil, India.',
                    ]),
                    tip('El mercado siempre se recupera a largo plazo. La crisis del 2008 genero una caida del 57% en el S&P 500. Quienes vendieron en panico en el minimo de marzo 2009 cristalizaron sus perdidas. Quienes mantuvieron o compraron mas recuperaron todo en 2013 y luego triplicaron su inversion hasta 2020. El comportamiento durante las caidas define el resultado final.'),
                    warn('La bolsa tiene volatilidad diaria significativa: dias de -2% o +2% son completamente normales. Si revisas tu cartera todos los dias, la volatilidad normal parecera amenazante y te incitara a tomar decisiones que destruyen el rendimiento. Para horizonte de 10+ anos, revisa mensual o trimestralmente. Resiste la tentacion de la informacion en tiempo real.'),
                    ex('El inversor de largo plazo vs el trader de corto plazo', 'Sofia invirtio $5,000 en un ETF del S&P 500 en enero 2020 y no hizo nada mas. En marzo 2020 su cartera valio $3,200 (-36%). Mantuvo. En diciembre 2020 valia $6,100 (+22% sobre su inversion original). En 2023: $8,500. Juan empezo igual en enero 2020 pero vendio en panico en marzo ($3,200). No supo cuando volver a entrar. En 2023 aun tenia $3,200 mas intereses de cuenta de ahorro ($3,600). Sofia: $8,500. Juan: $3,600. Mismo punto de partida, 4 anos de diferencia, resultados completamente distintos por una sola decision.'),
                    exc('Revisa el grafico historico del S&P 500 durante los ultimos 10 anos. Identifica al menos dos momentos de caida significativa (mayor al 10%) y observa cuanto tiempo tardo el indice en recuperarse y superar esos minimos. Que conclusion sacas sobre la relacion entre horizonte temporal y riesgo de inversion en bolsa?', 'Busca "S&P 500 historical chart" en Google Finance o TradingView. Las caidas de 2018, 2020 y 2022 son visibles claramente y cada una fue seguida de recuperacion y nuevos maximos.'),
                    vid('Como funciona la bolsa de valores: explicacion para principiantes', 'https://www.youtube.com/results?search_query=como+funciona+bolsa+valores+explicacion+simple'),
                ],
            },
            {
                title: 'Acciones vs bonos', order: 2, duration: 15, xpReward: 45,
                content: [
                    h('Los dos pilares de cualquier cartera de inversion'),
                    t('Acciones y bonos son los dos instrumentos mas fundamentales del mercado financiero. Se comportan de formas complementarias: cuando las acciones caen, los bonos tienden a subir o mantenerse estables, y viceversa. Entender la diferencia y como usarlos juntos es la base del diseno de cualquier cartera solida.'),
                    kc('Accion', 'Titulo que representa propiedad fraccionada en una empresa. Al comprar una accion te conviertes en accionista: tienes derecho a una porcion de las ganancias (via dividendos) y del crecimiento del valor de la empresa. El precio fluctua segun la oferta, la demanda y los resultados de la empresa.'),
                    kc('Bono', 'Instrumento de deuda: le prestas dinero a una empresa o gobierno por un plazo definido. A cambio recibes pagos de interes periodicos (cupones) y la devolucion del capital al vencimiento. El pago es contractual y predecible, lo que lo hace mas seguro pero menos dinamico que las acciones.'),
                    cmp('Acciones', 'Bonos', [
                        'Eres dueno de una fraccion de la empresa',
                        'Retorno via apreciacion del precio y dividendos',
                        'Valor puede subir o bajar significativamente a corto plazo',
                        'En caso de quiebra, accionistas cobran de ultimos',
                        'Sin vencimiento: puedes mantener indefinidamente',
                        'Retorno historico: 8-12% anual en indices amplios (20+ anos)',
                    ], [
                        'Eres acreedor: la empresa te debe dinero',
                        'Retorno via pagos de cupon (interes fijo contractual)',
                        'Valor relativamente estable, menor volatilidad',
                        'En caso de quiebra, bonistas cobran antes que accionistas',
                        'Vencimiento definido: recuperas capital en fecha pactada',
                        'Retorno tipico: 3-7% anual segun riesgo del emisor',
                    ]),
                    ex('La cobertura mutua en crisis: 2008 en numeros', 'En 2008 el S&P 500 cayo un 57% desde el maximo hasta el minimo. Los bonos del Tesoro de EE.UU. subieron el 26% en el mismo periodo porque los inversores huyeron hacia la seguridad. Una cartera 60% acciones/40% bonos cayo aproximadamente el 25%, la mitad de lo que cayeron solo las acciones. La combinacion reducia el daño a la mitad.'),
                    kc('P/E Ratio (Precio/Ganancia)', 'Precio actual de la accion dividido entre las ganancias por accion del ultimo ano. Un P/E de 20 significa que pagas $20 por cada $1 de ganancia anual de la empresa. P/E alto puede indicar que el mercado espera alto crecimiento futuro o que la accion esta sobrevaluada. P/E bajo puede indicar oportunidad o empresa en dificultades.'),
                    exc('Busca el P/E ratio actual de tres empresas famosas: una tecnologica (Apple, Google), una tradicional (Coca Cola, Johnson&Johnson) y una local o regional que conozcas. Compara los tres numeros. Cual tiene el P/E mas alto? Que podria significar esa diferencia?', 'Busca "[nombre empresa] P/E ratio" en Google Finance. El P/E promedio historico del S&P 500 es aproximadamente 16-18. Empresas de alto crecimiento como Amazon o Tesla tienen P/E mucho mas altos porque el mercado paga por el crecimiento futuro esperado.'),
                    h('Como combinar acciones y bonos segun tu perfil'),
                    lst('Asignaciones tipicas segun horizonte y tolerancia al riesgo', [
                        'Perfil conservador (horizonte corto o baja tolerancia): 20-40% acciones, 60-80% bonos',
                        'Perfil moderado (horizonte medio, tolerancia media): 50-60% acciones, 40-50% bonos',
                        'Perfil agresivo (horizonte largo, alta tolerancia): 70-90% acciones, 10-30% bonos',
                        'Joven con horizonte 30+ anos: algunos expertos recomiendan hasta 100% acciones en ETFs diversificados',
                        'Cerca del retiro (5-10 anos): ir aumentando la proporcion de bonos para reducir volatilidad',
                    ]),
                    t('La regla general es que la proporcion en acciones puede calcularse como 110 menos tu edad. A los 25: 85% acciones, 15% bonos. A los 50: 60% acciones, 40% bonos. A los 65: 45% acciones, 55% bonos. Es una guia, no una ley. Tu tolerancia real al riesgo y tu situacion especifica pueden justificar desviarse de esta formula.'),
                    tip('Para principiantes con horizonte largo (mas de 10 anos), la mayoria de economistas financieros recomienda empezar con una cartera simple: 80-90% en un ETF que replique el mercado global (como VT o MSCI World) y 10-20% en ETF de bonos. Esta combinacion simple ha superado a la mayoria de carteras gestionadas activamente en plazos de 10+ anos con costos mucho menores.'),
                    warn('Concentrar tu cartera en acciones del pais donde vives es un error de diversificacion llamado "sesgo de pais de origen". Si trabajas en Ecuador y tus ahorros estan en activos ecuatorianos, tu bienestar economico depende demasiado de un solo pais. Diversificar globalmente reduce este riesgo de correlacion entre ingresos laborales e inversion.'),
                    exc('Con los conceptos de esta leccion, define como distribuirias $1,000 de inversion hipotetica entre acciones y bonos segun tu horizonte y tolerancia al riesgo. Describe el razonamiento detras de la proporcion elegida. No hay una respuesta correcta, pero si debe haber un razonamiento coherente con tu situacion real.', 'Considera: cuantos anos hasta necesitar el dinero, como te sentarias si viera caer un 30% a los 6 meses, y si la volatilidad te empujaria a vender o a comprar mas.'),
                    vid('Acciones vs bonos: diferencias y como combinarlos en una cartera', 'https://www.youtube.com/results?search_query=acciones+vs+bonos+diferencias+cartera+inversion'),
                ],
            },
            {
                title: 'ETFs e indices bursatiles', order: 3, duration: 15, xpReward: 50,
                content: [
                    h('La forma mas inteligente y eficiente de invertir para la mayoria'),
                    t('Los fondos indexados y los ETFs han democratizado la inversion. Antes de su existencia, diversificar en cientos de empresas requeria cientos de miles de dolares. Hoy, con $10-50 puedes comprar una participacion en las 500 empresas mas grandes del mundo en una sola transaccion. Esto ha cambiado permanentemente quien puede invertir y como.'),
                    kc('Indice bursatil', 'Indicador que mide el desempeno de un conjunto de acciones seleccionado segun criterios especificos. El S&P 500 selecciona las 500 empresas de mayor capitalizacion de EE.UU. ponderadas por su tamano. Cuando el indice sube 1%, el valor promedio ponderado de esas 500 empresas subio 1%.'),
                    kc('ETF (Exchange Traded Fund)', 'Fondo que replica un indice y se negocia en bolsa exactamente como una accion. Al comprar un ETF del S&P 500 eres propietario de una fraccion proporcional de las 500 empresas del indice en una sola transaccion. Combina la diversificacion de un fondo con la facilidad de compra de una accion.'),
                    ex('El impacto brutal de las comisiones a largo plazo', '$10,000 invertidos durante 30 anos al 8% anual. Fondo de gestion activa con 1.5% de comision anual: resultado final $74,000. ETF con 0.05% de comision anual: resultado final $97,000. Diferencia: $23,000 perdidos en comisiones. La diferencia del 1.45% anual en costos representa $23,000 de riqueza destruida en 30 anos. Las comisiones bajas son uno de los factores mas importantes en el rendimiento final a largo plazo.'),
                    lst('ETFs globales mas conocidos como referencia', [
                        'VOO o SPY: replica el S&P 500, las 500 mayores empresas de EE.UU. por capitalizacion',
                        'QQQ: replica el NASDAQ 100, predominantemente empresas tecnologicas',
                        'VTI: cubre el mercado total de EE.UU. (mas de 4,000 empresas)',
                        'VT: mercado global completo incluyendo desarrollados y emergentes (mas de 9,000 empresas)',
                        'BND: bonos diversificados de EE.UU. para el componente de renta fija',
                        'VEA: mercados desarrollados fuera de EE.UU. (Europa, Japon, Australia)',
                    ]),
                    fml('Ratio de gastos (Expense Ratio) = Comision anual / Valor total del fondo', [
                        'Un expense ratio de 0.03% en $10,000 cuesta $3 al ano en comisiones',
                        'Un expense ratio de 1.5% en $10,000 cuesta $150 al ano en comisiones',
                        'La diferencia de $147 al ano parece pequena, pero en 30 anos con interes compuesto es enorme',
                    ]),
                    exc('Busca en Google el expense ratio de los siguientes tres instrumentos y compara: (1) VOO (ETF de Vanguard del S&P500), (2) un fondo mutuo activo de cualquier banco local (busca "fondos de inversion [nombre banco]"), (3) SPY (el ETF mas antiguo del S&P500). La diferencia en costos entre gestion activa y pasiva deberia ser evidente.', 'El expense ratio se muestra en la ficha del fondo. VOO tipicamente tiene 0.03%. Fondos activos frecuentemente tienen 0.5-1.5%. Multiplica la diferencia por un horizonte de 20 anos para ver el impacto real.'),
                    h('La evidencia detras de la gestion pasiva'),
                    t('Segun el informe SPIVA de S&P Dow Jones Indices, mas del 80% de los fondos de gestion activa no superan a su indice de referencia en periodos de 15+ anos despues de descontar comisiones. Esto significa que pagar mas por un gestor que "selecciona" acciones resulta peor, estadisticamente, que simplemente comprar el indice completo con comisiones minimas.'),
                    lst('Por que los gestores activos no superan al indice consistentemente', [
                        'El mercado es eficiente: los precios ya incorporan toda la informacion publica disponible',
                        'Las comisiones de gestion activa consumen una parte del rendimiento cada ano',
                        'Los gestores tienen que superar al indice DESPUES de costos, lo que es matematicamente muy dificil',
                        'Los ganadores de un periodo raramente repiten en el siguiente: el rendimiento pasado no predice el futuro',
                        'Incluso Warren Buffett, el mejor inversor del siglo, ha recomendado publicamente ETFs de bajo costo para la mayoria de personas',
                    ]),
                    tip('La estrategia que John Bogle (fundador de Vanguard e inventor del fondo indexado) demostro matematicamente: comprar un ETF de bajo costo del mercado total y mantenerlo indefinidamente supera a la gran mayoria de gestores profesionales en periodos de 10+ anos. La estrategia mas "aburrida" es frecuentemente la mas efectiva.'),
                    warn('Los ETFs de criptomonedas, materias primas exoticas o sectores muy especificos (cannabis, memes, etc.) tienen volatilidad extrema y no tienen el historial de recuperacion que tienen los indices amplios como el S&P 500. Para principiantes, los ETFs de indices amplios como S&P 500 o mercado total global son el punto de entrada correcto.'),
                    exc('Diseña una cartera simple de dos ETFs: uno de renta variable global y uno de renta fija, con la proporcion adecuada para tu horizonte y tolerancia al riesgo calculada en la leccion anterior. Especifica el nombre del ETF, la proporcion, el monto mensual que destinarias con DCA y el horizonte de inversion. Esta es tu primera propuesta de cartera real.', 'Ejemplo de cartera simple: 80% VT (mercado global) + 20% BND (bonos EE.UU.) con $100/mes durante 15 anos. Calculadora de rendimiento en portfoliovisualizer.com permite simular historicamente esta estrategia.'),
                    vid('Que son los ETFs y como invertir en fondos indexados', 'https://www.youtube.com/results?search_query=que+son+ETFs+fondos+indexados+como+invertir+principiantes'),
                ],
            },
            {
                title: 'Estrategia para invertir en bolsa', order: 4, duration: 18, xpReward: 50,
                content: [
                    h('Los principios que sobreviven el paso del tiempo'),
                    t('Las estrategias de inversion se multiplican y cambian constantemente. Lo que no cambia son los principios basicos que han funcionado a traves de decadas de mercados alcistas, crash financieros, guerras, pandemias y cambios tecnologicos. Esta leccion es sobre esos principios, no sobre la estrategia de moda del momento.'),
                    lst('Los 5 principios del inversor inteligente a largo plazo', [
                        'Principio 1: Invierte regularmente via DCA sin importar si el mercado esta alto o bajo. El tiempo en el mercado supera al timing del mercado.',
                        'Principio 2: Nunca vendas en panico durante caidas del mercado. Las caidas son temporales para quien tiene horizonte largo. La venta en panico convierte perdida temporal en perdida permanente.',
                        'Principio 3: Mantén costos bajos. Comisiones de 1-1.5% anual destruyen decenas de miles de dolares en 30 anos. ETFs de bajo costo ganan a la gestion activa estadisticamente.',
                        'Principio 4: Diversifica globalmente. No solo en tu pais, no solo en un sector, no solo en una empresa.',
                        'Principio 5: Reinvierte dividendos y rendimientos automaticamente. La reinversion es la que activa el interes compuesto en toda su magnitud.',
                    ]),
                    kc('Mercado alcista y bajista (Bull y Bear market)', 'Bull market: periodo sostenido de alza del mercado, tipicamente definido como subida del 20%+ desde el minimo reciente. Bear market: caida del 20%+ desde el maximo reciente. Los bear markets son inevitables, historicamente temporales y necesarios para la salud del mercado a largo plazo.'),
                    ex('La estrategia simple que construye riqueza', 'Sofia invierte $200/mes en un ETF del S&P 500 desde los 25 hasta los 65 anos. No hace market timing, no compra acciones individuales, no sigue las noticias financieras. Total invertido en 40 anos: $96,000. Resultado estimado al 8% anual historico con reinversion de dividendos: $700,000+. El 87% del resultado final vino de los rendimientos, no del capital aportado.'),
                    fml('Rentabilidad total acumulada = (1 + rendimiento anual)^anos × capital', [
                        'Capital: lo que inviertes en total',
                        'Rendimiento anual: historial S&P 500 ≈ 10% nominal, 7% real (descontando inflacion)',
                        'Anos: el factor multiplicador mas poderoso de la ecuacion',
                    ]),
                    warn('El day trading, el swing trading y el "stock picking" (seleccionar acciones individuales) son actividades que estadisticamente destruyen rendimiento para el 85-95% de los practicantes. No son investing, son especulacion. Requieren dedicacion de tiempo profesional, acceso a informacion de primer nivel y tolerancia al riesgo extrema. Para quien no es profesional financiero, la inversion pasiva en indices diversificados produce mejores resultados con menos tiempo y menos estres.'),
                    h('Como manejar la volatilidad psicologicamente'),
                    t('La mayor amenaza para el rendimiento a largo plazo no es la caida del mercado: es tu reaccion a la caida del mercado. Los estudios de comportamiento financiero muestran que el inversor promedio obtiene un 2-3% menos anual que el propio fondo en que invierte, por entrar en el maximo con euforia y vender en el minimo con miedo.'),
                    lst('Estrategias para mantener la disciplina cuando el mercado cae', [
                        'Ten escrito de antemano como actuaras si el mercado cae un 20, 30 o 40%. Las decisiones tomadas con calma antes de la volatilidad son mas racionales.',
                        'No revises el valor de tu cartera durante periodos de alta volatilidad mediática. Las noticias catastrofistas generan miedo, no informacion util.',
                        'Recuerda que cada caida del mercado en la historia ha sido seguida por recuperacion y nuevos maximos. La pregunta no es si el mercado se recuperara, es cuando.',
                        'Usa el DCA como ancla psicologica: seguir invirtiendo la misma cantidad cuando el mercado cae te da perspectiva de estar comprando barato.',
                        'Comparte tu plan de inversion con alguien de confianza. Tener que explicar un cambio de plan a otra persona reduce las decisiones impulsivas.',
                    ]),
                    exc('Escribe tu politica de inversion personal en un parrafo: que instrumento usaras, cuanto invertiras mensualmente, por cuanto tiempo, y como actuaras si el mercado cae un 30% (mantendras, compraras mas, o ajustaras la estrategia). Este documento escrito es tu sistema de decision bajo presion.', 'Una politica de inversion personal no necesita ser un documento formal. Puede ser una nota en tu telefono. Lo que importa es que esta escrita antes de que ocurra la volatilidad, no mientras ocurre.'),
                    tip('El mejor momento para haber empezado a invertir era hace 10 anos. El segundo mejor momento es hoy. No esperes el momento perfecto del mercado, la cantidad "suficiente" o el conocimiento "completo". Empieza con lo que tienes, aprende en el camino y ajusta la estrategia con el tiempo. El costo de esperar es el interes compuesto perdido.'),
                    exc('Define una accion especifica que puedes ejecutar esta semana para comenzar o mejorar tu estrategia de inversion: abrir una cuenta en una cooperativa para deposito a plazo, investigar como abrir cuenta en casa de valores de Ecuador, o explorar una plataforma de ETFs internacionales. Un paso concreto esta semana vale mas que el plan perfecto para dentro de 6 meses.', 'Para Ecuador: Bolsa de Valores de Quito (bvq.fin.ec) lista las casas de valores autorizadas. Para mercados internacionales: Interactive Brokers, eToro o Degiro son opciones con acceso desde Ecuador con verificacion de identidad.'),
                    vid('Estrategia de inversion a largo plazo para principiantes con ETFs', 'https://www.youtube.com/results?search_query=estrategia+inversion+largo+plazo+ETF+principiantes'),
                ],
            },
        ],
    },

    // ─── MODULO 6: SEGUROS Y PROTECCION FINANCIERA ───────────────────────────
    {
        order: 6,
        lessons: [
            {
                title: 'Por que necesitas seguros', order: 1, duration: 12, xpReward: 35,
                content: [
                    h('Proteger lo que construiste con tanto esfuerzo'),
                    t('Puedes hacer todo bien: presupuestar, ahorrar, invertir con criterio. Un solo evento inesperado sin cobertura puede destruir anos de progreso financiero en dias. Los seguros no son un gasto: son el mecanismo que convierte una potencial catastrofe financiera en un costo predecible y manejable.'),
                    kc('Seguro', 'Contrato por el cual el asegurado paga una prima periodica y la aseguradora se compromete a cubrir las perdidas economicas derivadas de eventos especificos definidos en la poliza. Transfiere el riesgo financiero del individuo hacia un grupo de personas que comparten el mismo tipo de riesgo.'),
                    t('El objetivo del seguro no es generar ganancias ni sustituir el fondo de emergencia. Su funcion es especificamente proteger contra perdidas financieras que serian demasiado grandes para absorber sin endeudarse o perder el patrimonio acumulado.'),
                    exc('Haz el ejercicio del peor escenario: identifica los 3 eventos que, si ocurrieran hoy, mas daño financiero te causarian. Puede ser perdida de empleo, enfermedad grave, accidente de vehiculo, incendio de tu lugar de residencia. Para cada uno, estima el costo economico aproximado. Esa lista te dice exactamente que riesgos necesitas asegurar primero.', 'El principio financiero es: asegura los riesgos cuyo costo seria catastrofico para tu economia. No asegures los que puedes cubrir con tu fondo de emergencia.'),
                    lst('Eventos que un seguro puede absorber', [
                        'Enfermedad o accidente que genera gastos medicos: seguro de salud o accidentes',
                        'Fallecimiento o invalidez permanente con dependientes economicos: seguro de vida',
                        'Dano o robo del vehiculo o dano a terceros con el vehiculo: seguro de auto',
                        'Incendio, inundacion o robo en el lugar de residencia: seguro de hogar o contenido',
                        'Demanda por dano causado a terceras personas: responsabilidad civil',
                        'Perdida de empleo involuntaria: seguro de desempleo (disponible en algunos paises)',
                    ]),
                    kc('Principio del peor escenario financiero', 'Criterio para decidir que riesgos asegurar: si X evento ocurriera, podrias recuperarte financieramente sin seguro en un tiempo razonable? Si la respuesta es no (hospitalizacion de $5,000, perdida total del vehiculo de $8,000), eso hay que asegurar. Si si (arreglo de telefono de $80), el fondo de emergencia lo cubre.'),
                    ex('El seguro medico que costo $600 al ano y evito una deuda de $4,000', 'Carlos tiene seguro medico complementario con prima de $52/mes ($624/ano) y deducible de $100. En julio sufrió una apendicitis que requirio cirugia y 2 dias de hospitalizacion. Costo total sin seguro: $4,200. Su costo con seguro: $100 de deducible + el 20% del exceso = $100 + $820 = $920. El seguro cubrio $3,280. Sin el, habria necesitado prestamo al 18% que tardaria 2 anos en pagar.'),
                    lst('El error de infraasegurarse: casos reales en Ecuador', [
                        'Asegurar el vehiculo solo contra terceros: si tienes accidente propio, el seguro no cubre tu vehiculo',
                        'Seguro de salud con limite muy bajo ($5,000): una cirugía mayor puede costar el doble',
                        'Seguro de vida con suma asegurada insuficiente: los dependientes no tienen cobertura real',
                        'Pagar seguro barato que excluye condiciones preexistentes: cuando mas lo necesitas, no aplica',
                    ]),
                    tip('Evalua tus seguros por lo que cubren cuando pasa lo peor, no por lo que cuestan cuando no pasa nada. La prima mensual es el costo de la tranquilidad; la cobertura real es el valor del seguro. Dos seguros con la misma prima pueden tener coberturas radicalmente diferentes. Lee la poliza antes de contratar.'),
                    warn('Los seguros de vida vinculados a inversion (unit-linked, seguros dotales) mezclan proteccion con rendimiento y suelen ofrecer lo peor de ambos mundos: proteccion insuficiente y rendimiento mediocre. Para la mayoria de personas, es mas eficiente contratar seguro de vida a termino puro (barato) e invertir la diferencia por separado con mejor rentabilidad y mayor transparencia.'),
                    exc('Con tu lista del peor escenario financiero del primer ejercicio, identifica: cual de esos riesgos ya tienes asegurado, cual deberia ser tu siguiente seguro a contratar y cuanto estimas que costaria una prima basica para ese riesgo. Ese es el plan de proteccion que necesitas construir.', 'Para cotizar seguros en Ecuador puedes contactar a Seguros Equinoccial, Seguros Alianza, Aseguradora del Sur o cualquier aseguradora supervisada por la Superintendencia de Compañias, Valores y Seguros.'),
                    vid('Por que los seguros son parte fundamental de tu plan financiero', 'https://www.youtube.com/results?search_query=importancia+seguros+finanzas+personales+proteccion'),
                ],
            },
            {
                title: 'Los seguros que todo joven necesita', order: 2, duration: 12, xpReward: 40,
                content: [
                    h('Proteccion segun tu etapa de vida real'),
                    t('No todos los seguros tienen la misma urgencia para todas las personas. La clave es identificar los riesgos que, si ocurrieran hoy, te destruirian financieramente, y asegurar esos primero. Para un joven de 22 anos sin dependientes, el orden de prioridades es diferente al de una persona de 35 con hijos y vehiculo propio.'),
                    lst('Prioridad 1: seguros esenciales para jovenes sin importar la situacion', [
                        'Seguro medico: el mas urgente y mas universal. Sin el, cualquier emergencia de salud puede generar deudas de $1,000-10,000+ que tardan anos en pagar. En Ecuador: IESS como minimo si eres empleado formal, complementario si puedes costear la prima.',
                        'Seguro de auto (si tienes vehiculo): obligatorio legalmente (SOAT para responsabilidad a terceros). Conviene al menos cobertura contra terceros y robo si el vehiculo tiene valor.',
                    ]),
                    lst('Prioridad 2: seguros importantes segun situacion especifica', [
                        'Seguro de vida: urgente si tienes personas que dependen economicamente de tus ingresos (hijos, padres que mantienes, conyuge sin ingresos propios). No urgente si eres independiente economicamente.',
                        'Seguro de accidentes personales: cubre invalidez temporal o permanente por accidente. Accesible en precio ($15-30/mes) y muy relevante para trabajadores independientes o sin acceso a seguro de desempleo.',
                        'Seguro de contenido: si arriendas y tienes bienes de valor (computador, electrodomesticos), protege contra robo o incendio.',
                    ]),
                    kc('Principio del peor escenario aplicado a seguros', 'Pregunta para cada posible seguro: si este evento ocurriera hoy, podria recuperarme financieramente en 6-12 meses sin endeudamiento significativo? Si la respuesta es no, ese riesgo necesita seguro. Si si, el fondo de emergencia puede cubrirlo.'),
                    ex('Plan de proteccion para joven de 23 anos en Ecuador', 'Sofia, 23 anos, empleada, sueldo $580, sin vehiculo, sin dependientes. Seguros: IESS por empleador (obligatorio, sin costo adicional). Seguro medico complementario: $45/mes ($540/ano) con deducible de $100 y cobertura de $15,000. Accidentes personales: $18/mes ($216/ano) con cobertura de invalidez de $10,000. Total proteccion: $63/mes (10.8% del ingreso). Sin seguro de vida porque no tiene dependientes. Sin seguro de auto porque no tiene vehiculo.'),
                    lst('Comparacion: con IESS vs sin cobertura adicional', [
                        'Solo IESS (empleado formal): cubre hospitalizacion en hospitales del IESS, medicamentos genericos, maternidad. Limitacion: no todos los hospitales, listas de espera, sin cobertura en clinicas privadas.',
                        'IESS + complementario privado: acceso a clinicas privadas, menor tiempo de espera, reembolso de consultas fuera del IESS. Costo: $30-80/mes segun deducible y cobertura.',
                        'Solo seguro privado (sin empleo formal): costo mas alto ($60-150/mes segun edad y cobertura), sin respaldo estatal.',
                        'Sin ninguna cobertura: una hospitalizacion basica en clinica privada: $800-3,000. Cirugia ambulatoria: $1,500-5,000. Accidente de transito grave: $5,000-20,000+.',
                    ]),
                    exc('Define tu plan de proteccion actual: tienes IESS por empleo formal? Tienes algun seguro medico complementario o privado? Si tienes vehiculo, que cobertura tiene el seguro? Identifica el gap entre tu proteccion actual y el nivel de proteccion recomendado para tu situacion y calcula cuanto costaria cubrir ese gap mensualmente.', 'Si no tienes ninguna cobertura medica, investiga el costo de un seguro medico individual en tu ciudad con al menos $5,000 de cobertura anual y deducible de $200-300. Ese costo mensual es el primer seguro que debes priorizar.'),
                    tip('Para jovenes sin dependientes, el seguro de vida puede esperar hasta que tengas personas que dependan de tus ingresos. Ese dinero esta mejor usado en seguro medico que es universalmente necesario. Cuando lleguen los dependientes, contrata seguro de vida a termino: es mucho mas barato cuando tienes 25 que cuando tienes 40.'),
                    warn('El seguro del empleador puede terminar el dia que dejas ese trabajo. Si cambias de empleo, renuncias o te despiden, perdes la cobertura inmediatamente. Por eso tener un seguro complementario individual (no atado al empleador) es una capa adicional de seguridad importante para trabajadores que pueden cambiar de trabajo o pasar periodos sin empleo formal.'),
                    vid('Que seguros necesita un joven adulto y por que', 'https://www.youtube.com/results?search_query=seguros+necesita+joven+adulto+medico+vida+accidentes'),
                ],
            },
            {
                title: 'Como leer y elegir una poliza', order: 3, duration: 15, xpReward: 45,
                content: [
                    h('El contrato que necesitas entender antes de firmarlo'),
                    t('La mayoria de personas compra seguros sin leer la poliza. Luego, en el momento de la emergencia, descubren que su caso era una exclusion o que la cobertura era insuficiente. Entender los terminos clave de una poliza antes de firmar es proteccion adicional que no tiene costo.'),
                    lst('Los terminos clave que aparecen en cualquier poliza de seguro', [
                        'Prima: pago periodico (mensual, trimestral o anual) que mantiene el seguro activo. A mayor cobertura o mayor riesgo del asegurado, mayor prima.',
                        'Deducible: el monto que el asegurado paga primero antes de que el seguro cubra el resto. Deducible alto = prima mas baja. Deducible bajo = prima mas alta.',
                        'Limite de cobertura: el maximo que la aseguradora pagara por siniestro o en el periodo anual. Elige un limite que cubra el peor escenario real, no el promedio.',
                        'Coaseguro: porcentaje del costo que compartes con la aseguradora despues del deducible. 80/20 significa el seguro paga 80% y tu pagas el 20% restante.',
                        'Exclusiones: situaciones, condiciones o eventos que la poliza explicitamente NO cubre. Lee esta seccion con maxima atencion antes de firmar.',
                    ]),
                    fml('Tu costo real en un siniestro = Deducible + (Costo total - Deducible) × Porcentaje de coaseguro', [
                        'Siniestro de $3,000, deducible $300, coaseguro 80/20:',
                        'Tu costo = $300 + ($3,000 - $300) × 0.20 = $300 + $540 = $840',
                        'El seguro paga = $3,000 - $840 = $2,160',
                    ]),
                    kc('Deducible como herramienta de decision', 'Subir el deducible reduce la prima mensual. La pregunta correcta es: si uso el seguro una vez al ano en promedio, cual opcion es mas economica en total (prima anual + deducible promedio)? Si tienes fondo de emergencia solido, un deducible mas alto puede ser mas eficiente.'),
                    ex('Comparar dos polizas de salud con el mismo evento', 'Poliza A: prima $55/mes, deducible $200, coaseguro 80/20. Poliza B: prima $38/mes, deducible $800, coaseguro 80/20. Hospitalizacion de $3,000. Poliza A: tu costo = $200 + $2,800×0.20 = $760. Poliza A costo anual total = $660 primas + $760 deducible/coaseguro = $1,420. Poliza B: tu costo = $800 + $2,200×0.20 = $1,240. Poliza B costo anual = $456 primas + $1,240 = $1,696. Con una hospitalizacion/ano, la poliza A mas cara es en realidad mas economica. Sin hospitalizacion: Poliza B ahorra $204 al ano.'),
                    exc('Con el calculo anterior como modelo, compara dos polizas de salud reales (puedes solicitar cotizaciones a dos aseguradoras en Ecuador). Para cada una calcula: costo anual si no usas el seguro (solo primas) y costo anual si tienes una hospitalizacion de $2,000. Cual resulta mas conveniente para tu situacion?', 'Puedes solicitar cotizaciones en linea o por telefono a Seguros Equinoccial, Seguros Alianza, Aseguradora del Sur, AIG o cualquier otra aseguradora supervisada por la Superintendencia de Companias.'),
                    h('Las exclusiones: la letra pequena que importa'),
                    lst('Exclusiones comunes que sorprenden cuando ocurre el siniestro', [
                        'Condiciones preexistentes: enfermedades o condiciones que tenias antes de contratar el seguro. Muchas polizas las excluyen completamente o tienen periodo de espera de 6-24 meses.',
                        'Accidentes bajo efectos de alcohol o drogas: la mayoria de polizas de auto y vida excluyen este escenario.',
                        'Actividades de alto riesgo: deportes extremos, motociclismo, trabajos de altura pueden estar excluidos.',
                        'Zonas geograficas: algunos seguros de viaje no cubren ciertos paises o regiones.',
                        'Uso comercial del vehiculo: si usas tu auto para Uber/Cabify, el seguro personal puede no cubrir accidentes en ese uso.',
                    ]),
                    lst('Checklist antes de firmar cualquier poliza de seguro', [
                        'Lee completamente la seccion de exclusiones: que eventos especificos NO cubre?',
                        'Verifica el limite de cobertura: es suficiente para el peor escenario real de ese riesgo?',
                        'Calcula tu costo maximo en un siniestro grande (deducible + coaseguro)',
                        'Compara al menos 3 aseguradoras con exactamente la misma cobertura',
                        'Verifica la reputacion de la aseguradora en el pago de siniestros (busca comentarios, revisa regulacion)',
                        'Pregunta especificamente si tus condiciones preexistentes estan cubiertas o excluidas',
                    ]),
                    tip('Cuando tengas un siniestro, notifica a la aseguradora ANTES de recibir tratamiento cuando sea posible, o dentro de las primeras 24-48 horas de conocerlo. La notificacion tardia es una de las razones mas frecuentes de rechazo de reclamaciones. Guarda siempre el numero de contacto de emergencias de tu aseguradora en tu telefono.'),
                    exc('Toma la poliza de cualquier seguro que tengas actualmente (auto, salud, accidentes) y busca la seccion de exclusiones. Lista las 3 exclusiones que mas te sorprendan o que consideres mas relevantes para tu vida diaria. Hay alguna exclusion que cambic tu percepcion de la cobertura que tienes?', 'Si no tienes ninguna poliza activa, descarga el resumen publico de una poliza de seguro de salud de cualquier aseguradora ecuatoriana de su sitio web. Practicamente todos los publican en sus paginas de productos.'),
                    vid('Como leer una poliza de seguro y que terminos buscar', 'https://www.youtube.com/results?search_query=como+leer+poliza+seguro+terminos+clave+deducible'),
                ],
            },
            {
                title: 'Seguro medico y de vida a fondo', order: 4, duration: 15, xpReward: 45,
                content: [
                    h('Los dos seguros que mas impacto financiero tienen'),
                    t('El seguro medico protege tu patrimonio del costo de enfermedades y accidentes. El seguro de vida protege a quienes dependen de tus ingresos si tu faltas. Juntos cubren los dos riesgos financieros con mayor potencial de dano en la vida de la mayoria de personas, especialmente en edades productivas.'),
                    kc('Seguro de vida a termino', 'Cubre el riesgo de fallecimiento por un periodo definido (10, 20 o 30 anos). Si el asegurado fallece durante el termino, los beneficiarios reciben la suma asegurada. Si no fallece, la poliza vence sin valor de rescate. Es la opcion mas barata y la mas adecuada para la mayoria de personas con dependientes temporales.'),
                    kc('Seguro de vida permanente (entero o universal)', 'Cubre toda la vida sin vencimiento y acumula valor en efectivo a lo largo del tiempo. Significativamente mas caro que el termino. Tiene utilidad en planificacion patrimonial especifica (empresas familiares, sucesion) pero para la mayoria de personas no es la mejor opcion comparada con seguro a termino mas inversion independiente.'),
                    cmp('Seguro de vida a termino', 'Seguro de vida permanente', [
                        'Cubre por un periodo definido (10-30 anos)',
                        'Sin valor de rescate al vencimiento',
                        'Prima baja: $15-50/mes para cobertura amplia',
                        'Ideal para proteger dependientes temporales',
                        'Maxima proteccion por el menor costo posible',
                    ], [
                        'Cubre toda la vida, sin fecha de vencimiento',
                        'Acumula valor en efectivo que puedes retirar',
                        'Prima alta: 5-10x mas cara que el termino',
                        'Utilidad en planificacion patrimonial especifica',
                        'El rendimiento del componente de ahorro suele ser inferior a invertir por separado',
                    ]),
                    fml('Suma asegurada recomendada de seguro de vida = Ingreso anual × 10 a 12 veces', [
                        'Ingreso mensual $700 × 12 = $8,400 anuales',
                        'Suma asegurada recomendada: $84,000 a $100,800',
                        'Esta suma reemplaza aproximadamente 10 anos de ingresos para los dependientes',
                    ]),
                    exc('Determina si necesitas seguro de vida hoy: alguien dependeria economicamente de tus ingresos si fallecieras? (hijos, conyuge sin ingresos propios, padres o hermanos que mantienes). Si si, calcula la suma asegurada recomendada segun tu ingreso. Si no, el seguro de vida puede esperar. Registra tu conclusion y la fecha para revisarla cuando tu situacion cambie.', 'Las circunstancias que activan la necesidad de seguro de vida: primer hijo, matrimonio con conyuge sin ingresos estables, tomar a cargo a padres mayores, iniciar un negocio con sociedad.'),
                    h('Seguro medico: entendiendo las capas de cobertura'),
                    lst('Las capas del sistema de salud en Ecuador', [
                        'IESS: seguridad social obligatoria para empleados formales. Cobertura de hospitalizacion, consultas, medicamentos genericos en hospitales del IESS. Sin costo adicional al empleado (patron aporta el 11.15% del sueldo).',
                        'Seguro medico complementario del empleador: algunos empleadores ofrecen cobertura adicional al IESS. Permite acceso a clinicas privadas, cubre diferencias entre tarifa IESS y tarifa privada.',
                        'Seguro medico individual privado: contratado personalmente, independiente del empleo. Mas control sobre cobertura, valido incluso sin empleo formal.',
                        'Seguro de accidentes personales: especifico para accidentes (no enfermedades), accesible y barato, util especialmente para trabajadores independientes.',
                    ]),
                    ex('El costo real de no tener seguro medico en Ecuador', 'Escenario: apendicitis con complicacion que requiere cirugia laparoscopica y 2 dias de hospitalizacion en clinica privada de nivel medio en Quito o Guayaquil. Costo estimado sin seguro: $3,500-5,000 (cirugia $2,000-3,000 + hospitalizacion $400-600/dia + anestesia $400-600). Con seguro medico individual de $55/mes y deducible $200: tu costo maximal $200 + 20% del exceso = $200 + $660 = $860. El seguro de $55/mes evito una deuda de $4,000+ con una prima anual de $660.'),
                    tip('Para jovenes sanos sin dependientes: prioriza seguro medico (universal y urgente) sobre seguro de vida (solo urgente si tienes dependientes). Cuando tengas dependientes, agrega seguro de vida a termino lo antes posible. El costo del seguro de vida a termino a los 25 es el 40-50% de lo que costaria a los 40, con el mismo nivel de cobertura.'),
                    warn('Las companias que venden seguros de vida permanente frecuentemente los presentan como "inversion mas proteccion". El componente de inversion dentro de estos productos generalmente rinde menos que un deposito a plazo o un ETF con la misma cantidad de dinero. La comparacion correcta es: costo del termino mas inversion independiente vs costo del permanente. En casi todos los casos, el termino mas inversion separada supera al permanente en resultados finales.'),
                    exc('Diseña tu plan de proteccion completo: (1) seguro medico que tienes o necesitas y costo mensual estimado, (2) seguro de vida: necesitas uno hoy? suma asegurada calculada, tipo (termino), costo estimado. (3) seguro de accidentes si eres independiente. Total costo mensual de proteccion completa. Compara ese total con tu presupuesto actual: es factible? Como lo incorporarias?', 'Para cotizacion de seguro de vida a termino en Ecuador, contacta Seguros Ecuavida, BancoSeguros, MetLife Ecuador o cualquier aseguradora con producto de vida. La prima de $100,000 de suma asegurada a termino de 20 anos para alguien de 25 anos puede ser $20-35/mes.'),
                    vid('Seguro de vida termino vs permanente: cual elegir y por que', 'https://www.youtube.com/results?search_query=seguro+vida+termino+vs+permanente+cual+elegir'),
                ],
            },
        ],
    },

    // ─── MODULO 7: PLANIFICACION FINANCIERA ──────────────────────────────────
    {
        order: 7,
        lessons: [
            {
                title: 'Metas financieras SMART', order: 1, duration: 15, xpReward: 50,
                content: [
                    h('La diferencia entre un deseo y un plan de accion'),
                    t('"Quiero ahorrar mas" no es una meta financiera. "Ahorrare $150 cada mes durante 8 meses para tener $1,200 de fondo de emergencia completado el 31 de octubre" si lo es. La precision no es burocracia: es lo que convierte una intencion en un compromiso con fecha y numero verificable.'),
                    kc('Meta SMART', 'Marco para definir metas que realmente se ejecutan. Especifica (que exactamente y cuanto), Medible (con numero concreto verificable), Alcanzable (realista dado tu ingreso y situacion), Relevante (importa de verdad para tu vida) y con Tiempo definido (fecha limite concreta).'),
                    ex('Transformar un deseo en meta SMART', 'Deseo: quiero salir de deudas. Meta SMART: pagare $120 adicionales a mi Tarjeta Banco Pichincha (saldo actual $720 al 22% APR) cada mes durante 7 meses para liquidarla antes del 30 de septiembre, ahorrando $140 en intereses. Tengo calculado que la cuota minima es $22 y puedo destinar $142/mes total a esa tarjeta reduciendo en $90 mis salidas durante ese periodo.'),
                    lst('Los tres horizontes de metas financieras', [
                        'Corto plazo (0-12 meses): fondo de emergencia, pagar una deuda especifica, compra planeada de valor medio. Estas metas dan victorias rapidas y construyen la confianza para las siguientes.',
                        'Mediano plazo (1-5 anos): enganche para vehiculo o vivienda, maestria o certificacion, capital inicial de negocio. Requieren disciplina sostenida y ajustes en el camino.',
                        'Largo plazo (5+ anos): retiro, independencia financiera, educacion de hijos. Requieren inversion, no solo ahorro, porque la inflacion erosiona el ahorro puro.',
                    ]),
                    exc('Escribe una meta SMART para cada uno de los tres horizontes usando el formato exacto del ejemplo. Cada una debe incluir: que logras, numero especifico, fecha limite y la razon por la que importa. No copies el ejemplo: usa tu vida real y tus numeros reales.', 'Si no sabes los numeros exactos para las metas de mediano y largo plazo, usa estimaciones y revisalas en 30 dias con informacion mas precisa. Una meta con numero aproximado es infinitamente mejor que ninguna meta.'),
                    h('El sistema de revision de metas'),
                    t('Una meta SMART sin revision periodica se convierte en una buena intencion olvidada. El sistema de revision convierte las metas en parte activa de tu gestion financiera mensual.'),
                    lst('Frecuencia y foco de la revision de metas financieras', [
                        'Revision semanal (5 minutos): voy en el ritmo correcto con la meta de corto plazo? Registre todos los ingresos y gastos esta semana?',
                        'Revision mensual (20-30 minutos): cumpli el aporte planeado a cada meta? Hay alguna meta que necesite ajuste de monto o fecha? Hay una nueva meta que agregar?',
                        'Revision semestral (1-2 horas): las metas de mediano plazo siguen siendo relevantes? Han cambiado las circunstancias (ingreso, vida familiar, objetivos) que justifiquen replantear alguna meta?',
                        'Revision anual (2-3 horas): evaluacion completa de progreso en todas las metas, ajuste de la meta de retiro segun ingresos actuales, actualizacion del patrimonio neto.',
                    ]),
                    kc('Costo de oportunidad', 'El valor de la mejor alternativa que sacrificas al tomar una decision. Si usas $500 para vacaciones en lugar de pagar deuda al 20%, el costo de oportunidad no es solo los $500 sino los $100 de intereses que seguiras pagando ese ano y el impacto acumulado en anos siguientes.'),
                    tip('Trabaja en paralelo al menos una meta de cada plazo. La meta de corto plazo (0-12 meses) da victorias rapidas y motivacion. La de largo plazo (retiro, IF) mantiene la perspectiva y justifica sacrificios en el presente. Sin ambas, o te quemas persiguiendo solo el largo plazo o te quedas en el corto plazo sin vision de futuro.'),
                    warn('Las metas que no tienen numero especifico y fecha limite no son metas: son deseos con buenas intenciones. El cerebro no puede ejecutar instrucciones vagas. "Quiero ahorrar para el retiro" no activa ningun comportamiento especifico. "Depositare $200/mes en mi cuenta de retiro antes del dia 5 de cada mes a partir de noviembre" si lo hace.'),
                    exc('Toma la meta de corto plazo que escribiste en el primer ejercicio y convierte en un plan de accion: que accion especifica ejecutas esta semana para empezar, cuanto exactamente depositas o pagas el proximo dia de cobro, y que reviras o eliminacion de gasto hace posible ese numero. Una meta sin primer paso esta semana es simplemente teoria.', 'El primer paso no tiene que ser grande. Abrir una cuenta de ahorro separada, hacer la transferencia inicial de $10, o calcular el numero exacto de tu meta son acciones validas como primer paso.'),
                    vid('Como establecer metas financieras SMART que realmente funcionen', 'https://www.youtube.com/results?search_query=metas+financieras+SMART+objetivos+finanzas+personales'),
                ],
            },
            {
                title: 'Calcula tu patrimonio neto', order: 2, duration: 12, xpReward: 45,
                content: [
                    h('La unica metrica que mide tu riqueza real'),
                    t('El ingreso mensual no es una medida de riqueza. Es posible ganar $5,000/mes y ser cada vez mas pobre si los gastos y deudas crecen mas rapido. El patrimonio neto, la diferencia entre todo lo que tienes y todo lo que debes, es la unica medida honesta de tu posicion financiera real.'),
                    kc('Patrimonio neto', 'Total de activos (lo que tienes de valor) menos el total de pasivos (lo que debes). Puede ser positivo (tienes mas de lo que debes) o negativo (debes mas de lo que tienes). Para la mayoria de jovenes el primer calculo es negativo o cerca de cero, lo cual es normal y el punto de partida.'),
                    fml('Patrimonio neto = Total activos - Total pasivos', [
                        'Activos: efectivo, ahorros, inversiones, valor de mercado de vehiculo o inmueble',
                        'Pasivos: saldo de tarjetas, prestamos personales, credito estudiantil, hipoteca',
                        'Si el resultado es negativo: no es una crisis, es informacion. El objetivo es que crezca mes a mes.',
                    ]),
                    exc('Calcula tu patrimonio neto actual en este momento. Lista primero todos tus activos con su valor de mercado real (no el precio original que pagaste). Luego lista todas tus deudas con el saldo actual pendiente. Resta. Ese numero, positivo o negativo, es tu punto de partida real.', 'Sé completamente honesto. El objetivo no es que el numero sea bueno: es que sea real. Un patrimonio neto negativo calculado con precision es infinitamente mas util que un numero inflado que esconde la realidad.'),
                    h('Por que el patrimonio neto importa mas que el salario'),
                    ex('Dos personas, dos realidades opuestas', 'Andrea gana $1,200/mes (ingreso alto para Ecuador). Tiene auto a credito ($8,000 pendiente), tarjetas con saldo de $3,500, prestamo personal de $2,000. Sus activos: ahorro $1,500, auto en valor de mercado $6,000. Patrimonio neto: $7,500 activos - $13,500 pasivos = -$6,000. Sofia gana $580/mes. No tiene deudas. Ahorro $2,400, fondo de emergencia $1,800. Patrimonio neto: $4,200 - $0 = +$4,200. Sofia gana menos de la mitad que Andrea pero es $10,200 mas rica en terminos reales.'),
                    kc('Patrimonio neto como brujula mensual', 'Si tu ingreso sube pero tu patrimonio neto no crece mes a mes, el aumento de ingreso se esta yendo en mas gastos y deudas, no en construccion de riqueza real. El patrimonio neto creciente es la evidencia de que tus decisiones financieras van en la direccion correcta.'),
                    lst('Como aumentar el patrimonio neto mes a mes', [
                        'Reducir pasivos: cada pago extra a una deuda reduce directamente el pasivo y aumenta el patrimonio',
                        'Aumentar activos liquidos: cada dolar ahorrado e invertido aumenta el activo',
                        'Evitar deuda de consumo: compras financiadas crean pasivo que deprecia mas rapido que el activo que crean',
                        'Invertir en activos que se aprecian: inmuebles, carteras de fondos indexados, educacion que aumenta ingresos',
                        'Evitar lifestyle creep: cuando el ingreso sube, la diferencia debe ir a activos, no a pasivos adicionales',
                    ]),
                    tip('Calcula tu patrimonio neto el primer dia de cada mes. Crear una tabla simple con dos columnas (activos y pasivos) y el resultado mensual te da la evidencia mas poderosa de si tus decisiones financieras funcionan. Ver ese numero crecer mes a mes, aunque sea $50, es el indicador mas motivador de progreso real.'),
                    exc('Crea una tabla de seguimiento de patrimonio neto con tres columnas: fecha, patrimonio neto total, y variacion vs mes anterior. Registra el numero de hoy como punto de partida. Pon un recordatorio para calcular y registrar el primer dia de cada mes. El patron de 6 meses te dira mas sobre tu progreso que cualquier otro indicador.', 'La hoja puede ser tan simple como una nota en tu telefono o una hoja de papel. No necesita herramienta sofisticada para funcionar.'),
                    ex('El patrimonio neto negativo no es una sentencia', 'Jonnathan, 24 anos, tiene patrimonio neto de -$2,800 (credito estudiantil de $4,000, tarjeta $800, ahorros $1,500, computador $500). En los siguientes 18 meses: paga $120 extra/mes a credito estudiantil, cancela tarjeta en 6 meses ($800/6), ahorra $60/mes. Mes 18: credito estudiantil $2,840, tarjeta $0, ahorros $2,580. Patrimonio neto: $3,080 activos - $2,840 pasivos = +$240. Paso de -$2,800 a +$240 en 18 meses con $180 extra al mes dedicado al plan.'),
                    vid('Que es el patrimonio neto y como calcularlo paso a paso', 'https://www.youtube.com/results?search_query=patrimonio+neto+como+calcular+finanzas+personales'),
                ],
            },
            {
                title: 'Planifica tu retiro hoy', order: 3, duration: 18, xpReward: 55,
                content: [
                    h('El futuro que construyes o que te encontrara sin preparacion'),
                    t('El retiro parece lejano a los 22 anos. Pero cada ano que demoras en planificarlo tiene un costo exponencial por el interes compuesto perdido. Empezar a los 22 con $50/mes produce mas que empezar a los 40 con $300/mes en el mismo instrumento. No es intuicion: es matematica.'),
                    kc('Retiro o jubilacion', 'Etapa de vida donde los ingresos laborales activos cesan o se reducen significativamente. El objetivo de la planificacion de retiro es que en esa etapa tengas suficiente capital acumulado o renta pasiva para mantener tu nivel de vida sin depender de trabajar.'),
                    ex('El costo de esperar 10 anos: en numeros concretos', 'Sofia empieza a invertir $100/mes para el retiro a los 22 anos al 8% anual. Invierte hasta los 65. Total aportado: $51,600. Resultado: $389,000. Pedro empieza a los 32 (10 anos despues), invierte el mismo $100/mes al mismo 8%. Total aportado: $39,600 (menos que Sofia). Resultado a los 65: $176,000. Sofia invirtio $12,000 mas pero tiene $213,000 mas al retiro. Los primeros 10 anos de interes compuesto valen mas que cualquier decada posterior.'),
                    kc('Regla del 4%', 'Principio empirico que dice que puedes retirar el 4% anual de tu fondo de retiro con alta probabilidad de que el fondo dure 30+ anos, asumiendo una cartera diversificada con rendimientos historicos normales. Sirve para calcular el "numero de retiro": el capital que necesitas acumular.'),
                    fml('Numero de retiro = Gastos anuales deseados en retiro / 0.04', [
                        'Si necesitas $1,000/mes en retiro = $12,000 al ano',
                        'Numero de retiro = $12,000 / 0.04 = $300,000',
                        'Corolario: necesitas 25 veces tus gastos anuales acumulados para el retiro',
                    ]),
                    exc('Calcula tu numero de retiro preliminar: estima cuanto necesitas gastar mensualmente en retiro para mantener un nivel de vida razonable (en dolares de hoy). Multiplica por 12 y luego por 25. Ese es el capital que necesitas acumular. No te asustes con el numero: el siguiente ejercicio calcula cuanto tienes que ahorrar mensualmente para llegar ahi.', 'Referencia: si en retiro necesitas $800/mes, tu numero es $800 × 12 × 25 = $240,000. Si necesitas $1,500/mes, el numero es $450,000. Estos parecen grandes pero son alcanzables con tiempo y disciplina.'),
                    h('El IESS no es suficiente: la brecha que debes llenar'),
                    kc('Tasa de reemplazo del IESS', 'Porcentaje del ultimo salario activo que el sistema de seguridad social reemplaza en la jubilacion. En Ecuador el IESS tipicamente reemplaza entre el 40-60% del ultimo salario base, dependiendo de los anos aportados y la edad de jubilacion. La brecha entre ese porcentaje y el 100% de tu nivel de vida actual es lo que debes financiar con ahorro propio.'),
                    lst('Sistema de tres pilares del retiro en Ecuador', [
                        'Pilar 1 - IESS obligatorio: aporte del 20.6% del sueldo (9.45% empleado + 11.15% patron). Cobertura basica garantizada si aportaste al menos 15 anos. Limitado para quien tiene salarios bajos o trabajo informal.',
                        'Pilar 2 - Ahorro voluntario complementario: fondos de cesantia en cooperativas, aporte voluntario adicional al IESS, seguros de retiro. Flexible y potencialmente mas rentable.',
                        'Pilar 3 - Inversion personal: fondos de inversion, ETFs, bienes raices para renta. Sin restricciones ni condicionalidades. Requiere educacion financiera y disciplina propia.',
                    ]),
                    ex('La brecha del retiro: calcular lo que falta', 'Miguel, 28 anos, gana $700/mes. Proyeccion del IESS (supuesto): jubilacion a los 65 con pension de $350/mes (50% del salario). Para mantener $700/mes de poder adquisitivo en retiro necesita $350/mes adicionales de fuentes propias. Su numero de retiro para cubrir la brecha: $350 × 12 × 25 = $105,000. Invirtiendo $130/mes al 8% anual desde los 28 hasta los 65, acumula exactamente $125,000. Brecha cubierta con $130/mes durante 37 anos de disciplina.'),
                    lst('Instrumentos de retiro accesibles en Ecuador', [
                        'Aporte voluntario al IESS: adicional al 9.45% obligatorio, permanece en cuenta individual con rendimiento del sistema',
                        'Fondos de cesantia en cooperativas: JEP, Jardin Azuayo y otras ofrecen fondos especificos con rendimientos del 5-8%',
                        'ETFs internacionales (via plataformas): Vanguard Target Date Funds o ETFs de renta fija para horizonte largo',
                        'Depositos a plazo renovable: accesible, predecible, menor rendimiento que renta variable pero sin volatilidad',
                        'Inmueble para renta: requiere mayor capital inicial pero genera renta pasiva real en la jubilacion',
                    ]),
                    tip('Aunque sea $30-50/mes, empieza hoy. La diferencia en el resultado final entre empezar a los 24 vs a los 30 es equivalente a aportar el triple despues de los 30. No hay nada que hagas a los 45 anos que recupere los anos perdidos de interes compuesto entre los 22 y los 30.'),
                    warn('El sistema del IESS en Ecuador, como la mayoria de sistemas de reparto en Latinoamerica, enfrenta presiones demograficas y financieras de largo plazo. No es prudente planificar el retiro contando exclusivamente con la pension del IESS como unica fuente de ingresos. Tratala como el piso, no como el techo de tu planificacion de retiro.'),
                    exc('Con tu numero de retiro calculado, usa una calculadora de inversion online (busca "retirement calculator") para determinar cuanto necesitas invertir mensualmente a partir de hoy para alcanzar ese numero en la edad de retiro que planeas. Si el numero mensual parece inalcanzable, ajusta la edad de retiro o el nivel de gastos proyectado y observa como cambia el resultado.', 'Ingresa: capital actual disponible para retiro, tasa de rendimiento esperada (7-8% es conservador para fondo diversificado a largo plazo), anos hasta la edad de retiro objetivo y el numero de retiro calculado. La calculadora te dira el aporte mensual necesario.'),
                    vid('Como planificar el retiro a los 20 y 30 anos en Latinoamerica', 'https://www.youtube.com/results?search_query=como+planificar+retiro+jubilacion+joven+adulto+latinoamerica'),
                ],
            },
            {
                title: 'El camino a la independencia financiera', order: 4, duration: 18, xpReward: 55,
                content: [
                    h('Cuando trabajar pasa a ser una eleccion, no una obligacion'),
                    kc('Independencia financiera (IF)', 'Estado en que tus activos generan suficientes ingresos pasivos para cubrir todos tus gastos de vida sin necesidad de ingresos laborales activos. No significa necesariamente dejar de trabajar: significa que trabajar pasa a ser una eleccion libre, no una obligacion economica.'),
                    t('La independencia financiera no es exclusiva de personas con herencias o salarios altisimos. Es el resultado matematico de mantener una brecha sostenida entre ingresos y gastos durante suficiente tiempo, invirtiendo esa diferencia en activos que generan renta pasiva. Es accesible para quien empieza temprano y mantiene la disciplina.'),
                    kc('Movimiento FIRE (Financial Independence, Retire Early)', 'Corriente que busca alcanzar la independencia financiera antes de los 40-50 anos mediante ahorro agresivo del 40-70% del ingreso e inversion en activos de renta pasiva. No es necesario seguir el FIRE extremo para beneficiarse de sus principios: ahorrar el 25-30% e invertir consistentemente produce resultados excelentes a cualquier horizonte.'),
                    fml('Numero FIRE = Gastos anuales × 25', [
                        'Equivalente a la Regla del 4%: puedes retirar el 4% anual indefinidamente (1/0.04 = 25)',
                        'Gastos mensuales $1,000 = $12,000 anuales × 25 = $300,000 de numero FIRE',
                        'Gastos mensuales $1,500 = $18,000 anuales × 25 = $450,000 de numero FIRE',
                    ]),
                    exc('Calcula tu numero FIRE personal: toma tus gastos mensuales actuales y proyecta cuanto necesitarias en independencia financiera (mismo nivel o menos si simplificas). Multiplica por 12 y por 25. Ese es tu numero. Con tu tasa de ahorro actual, estima cuantos anos te tomaria llegar. Ese numero no es una sentencia: es informacion para decidir si quieres acelerar el proceso o simplemente usarlo como norte.', 'Usa portfoliovisualizer.com o cualquier calculadora de retiro para simular el tiempo necesario con diferentes tasas de ahorro. La diferencia entre ahorrar el 10% y el 20% tipicamente reduce el tiempo para IF en 15-20 anos.'),
                    h('Los 5 pilares que construyen la independencia financiera'),
                    lst('Pilar 1: Aumentar los ingresos activos', [
                        'Desarrollar habilidades con alta demanda en el mercado laboral: programacion, diseno, ventas, idiomas',
                        'Negociar tu salario sistematicamente: muchos trabajadores nunca negocian y dejan hasta el 30% del salario de mercado sobre la mesa',
                        'Desarrollar una fuente de ingresos adicional: freelance, consultoria, negocio de escala pequena',
                        'Invertir en educacion y certificaciones que aumentan tu valor economico en el mercado',
                    ]),
                    lst('Pilar 2: Reducir gastos de forma deliberada (no sufrimiento)', [
                        'Vivir por debajo de tus posibilidades no significa privarse: significa priorizar activos sobre pasivos',
                        'Eliminar gastos de bajo valor: suscripciones que no usas, habitos de consumo automatico sin reflexion',
                        'Optimizar los gastos grandes: vivienda, vehiculo, alimentacion tienen mayor impacto que el cafe diario',
                        'Diferenciar entre calidad de vida real (experiencias, salud, tiempo) y senal de status (cosas para impresionar a otros)',
                    ]),
                    lst('Pilar 3: Invertir la diferencia consistentemente', [
                        'La brecha entre ingresos y gastos es el combustible de la independencia financiera: maximize esa diferencia',
                        'DCA mensual en cartera diversificada: simple, eficaz, no requiere tiempo de mercado',
                        'Reinvertir todos los dividendos y rendimientos automaticamente',
                        'Aumentar el porcentaje de inversion cada vez que suben los ingresos: 50% del aumento directo a inversion',
                    ]),
                    lst('Pilar 4: Generar ingresos pasivos crecientes', [
                        'Dividendos de ETFs y acciones: ingresos periodicos sin vender el activo',
                        'Ingresos por arriendo: inmueble residencial o comercial que genera flujo mensual',
                        'Ingresos por derechos: libros, musica, software, contenido que genera royalties',
                        'Ingresos por prestamo (bonos): el cupon del bono es renta pasiva predecible',
                    ]),
                    lst('Pilar 5: Mantener la disciplina en el tiempo', [
                        'La IF se construye en anos o decadas, no en meses. La consistencia supera a la intensidad intermitente.',
                        'Automatizar al maximo para no depender de la motivacion del dia a dia',
                        'Construir un sistema de revision mensual que mantiene la accountability con tus metas',
                        'Rodear el proceso de personas con objetivos financieros similares o comunidades de IF',
                    ]),
                    ex('El camino de Maria hacia la independencia financiera', 'Maria, 24 anos, ingreso neto $650/mes. Decision: vivir con $420/mes (65% del ingreso) e invertir $230/mes (35%) en ETF global al 8% anual historico. A los 35 anos (11 anos de consistencia): habrá aportado $30,360 y acumulado ~$44,000. A los 45 (21 anos): $72,000 mas, fondo total ~$150,000. A los 55 (31 anos): habra alcanzado su numero FIRE de ~$250,000 (gastos proyectados $830/mes × 25). IF a los 55 sin herencia, sin salario extraordinario, con el SBU multiplicado por la consistencia.'),
                    tip('No necesitas el FIRE extremo para que estos principios transformen tu vida financiera. Ahorrar e invertir el 20-25% del ingreso con consistencia durante 30 anos produce independencia financiera para la mayoria de personas. El FIRE extremo (50%+) solo acelera el calendario si eso es una prioridad para ti. La version moderada es suficiente para llegar bien al retiro y construir patrimonio real.'),
                    exc('Define los dos cambios concretos que podrias hacer en los proximos 30 dias para acercarte a la independencia financiera: uno que aumente la diferencia entre ingresos y gastos (reduccion de un gasto o generacion de ingreso extra) y uno que mejore el destino de esa diferencia (abrir inversion, aumentar porcentaje de ahorro, o pagar deuda costosa). Dos cambios pequenos ejecutados en 30 dias valen mas que un plan perfecto para "algun dia".', 'Escribe los dos cambios con fechas especificas y el impacto mensual estimado de cada uno en dolares. Ese numero es el avance mensual hacia tu numero FIRE.'),
                    vid('Como alcanzar la independencia financiera: principios del movimiento FIRE', 'https://www.youtube.com/results?search_query=independencia+financiera+movimiento+FIRE+como+lograrlo'),
                ],
            },
        ],
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