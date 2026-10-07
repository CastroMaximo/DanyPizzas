# Requisitos del sistema — Dany Pizzas

> Versión 1.2 · 07/10/2026 · Fuente: cuestionario respondido por el negocio, código del repositorio y casos de uso (`diagramas/casos-de-uso`).
> Prioridad según **MoSCoW**: **M** = debe tener · **S** = debería tener · **C** = podría tener.
> Columna *Verificación*: prueba automática (archivo `tests/`) y/o caso de la lista de aceptación UAT (`docs/entregas/Dossier_Transicion_DanyPizzas`, sección 2.2).
> Estado: ✅ implementado y verificado · 🟡 implementado, falta validar con el negocio.

## Requisitos funcionales (RF)

| ID | Requisito | CU | Prior. | Verificación | Estado |
|---|---|---|---|---|---|
| RF-01 | El sistema debe mostrar la carta con las pizzas disponibles: nombre, foto, ingredientes, precio de la entera y precio de la mitad. | CU-01 | M | UAT F-02 · prueba «catálogo: todas las pizzas tienen foto…» | ✅ |
| RF-02 | El sistema debe indicar si el local está abierto o cerrado según el horario (martes a domingo 21:00–00:30) y mostrar la tabla de horarios. | CU-01 | M | 4 pruebas `estadoLocal` · UAT F-12 | ✅ |
| RF-03 | El cliente debe poder agregar pizzas enteras (8 porciones) o mitades (4 porciones), modificar cantidades y quitar ítems del pedido. | CU-02 | M | prueba «calcularCarrito: total, porciones y cantidad» · UAT F-03 | ✅ |
| RF-04 | El sistema debe permitir armar una pizza “mitad y mitad” cobrando cada mitad por separado. | CU-02 | M | prueba «mitad y mitad…» · UAT F-03 | ✅ |
| RF-05 | El sistema debe calcular el total y las porciones; la mitad cuesta la mitad del precio redondeada al múltiplo de $500 más cercano (empate hacia arriba). | CU-02, CU-04 | M | prueba «precioMitad…» · UAT F-04 | ✅ |
| RF-06 | El sistema debe conservar el pedido en curso y los datos del cliente en su dispositivo para no perderlos al recargar ni reescribirlos en el próximo pedido. | CU-02, CU-03 | S | UAT U-04 | ✅ |
| RF-07 | El sistema debe solicitar nombre, teléfono, dirección (obligatorios), referencia y observaciones (opcionales). | CU-03 | M | 2 pruebas `validarPedido` · UAT F-05 | ✅ |
| RF-08 | El cliente debe poder elegir la entrega “lo antes posible” o un horario del mismo día dentro del horario de atención. | CU-03 | S | 3 pruebas `opcionesEntrega` | ✅ |
| RF-09 | El cliente debe elegir el medio de pago: Mercado Pago, transferencia o efectivo al recibir. | CU-03 | M | prueba «armarRecibo: efectivo no pide comprobante» · UAT F-08 | ✅ |
| RF-10 | El sistema debe validar los datos y no permitir confirmar un pedido incompleto, indicando qué campo corregir. | CU-04 | M | 2 pruebas `validarPedido` · UAT F-05 | ✅ |
| RF-11 | Al confirmar, el sistema debe asignar un número de pedido `DP-AAMMDD-NNN` secuencial por día (con hora argentina); si el servidor no responde, uno local equivalente. | CU-04 | M | 3 pruebas `generarId` · prueba backend «IDs secuenciales…» · UAT F-06 | ✅ |
| RF-12 | El sistema debe generar un recibo con todos los datos del pedido y abrir WhatsApp con ese recibo dirigido al número del negocio; también permitir copiarlo. | CU-05 | M | 5 pruebas `armarRecibo` · prueba `urlWhatsApp` · UAT F-07 | ✅ |
| RF-13 | El sistema debe mostrar cómo pagar: alias, titular y monto, con una cuenta regresiva de 5 minutos para enviar el comprobante (no aplica a efectivo). | CU-06 | M | UAT F-08 | ✅ |
| RF-14 | El sistema debe registrar cada pedido confirmado en una hoja de cálculo mensual (`Pedidos AAAA-MM`), con el total **recalculado por el servidor**. | CU-04 | M | pruebas backend «total y porciones…», «ignora el total que manda el navegador» · UAT F-09 | ✅ |
| RF-15 | El dueño debe poder cambiar precios y disponibilidad de cada pizza desde la hoja `Catalogo`, sin modificar código. | CU-09 | M | pruebas backend «una pizza marcada NO…», «cambiar un precio…» · UAT F-10 | ✅ |
| RF-16 | El equipo debe poder marcar el estado de cada pedido: Nuevo, Pagado, En preparación, Entregado, Cancelado o Descartado. | CU-08 | S | UAT F-11 | 🟡 |
| RF-17 | El dueño debe poder consultar los pedidos de cada mes en la planilla. | CU-10 | S | UAT F-09 | 🟡 |
| RF-18 | El sistema debe rechazar pedidos falsos o abusivos: campo trampa, tiempo mínimo en la página, máx. 3 por hora por teléfono, 40 por hora y 150 por día en total, sin duplicados. | — | S | 9 pruebas «protección: …» | ✅ |
| RF-19 | El dueño debe poder pausar el registro web (`PEDIDOS_WEB = NO`) sin modificar código ni dejar de recibir pedidos por WhatsApp. | CU-11 | C | prueba «interruptor PEDIDOS_WEB…» | ✅ |
| RF-20 | Fuera del horario, el sistema debe avisar que el local está cerrado; según la configuración, permite o bloquea el envío del pedido. | CU-01, CU-04 | C | prueba «armarRecibo: hora elegida y aviso fuera de horario» | ✅ |

## Requisitos no funcionales (RNF)

Clasificados según las características de calidad de **ISO/IEC 25010**.

| ID | Característica | Requisito | Métrica / criterio de aceptación | Verificación | Estado |
|---|---|---|---|---|---|
| RNF-01 | Usabilidad | Un cliente que nunca usó el sitio debe poder hacer un pedido sin ayuda. | ≤ 2 minutos, sin asistencia | UAT U-01 | 🟡 |
| RNF-02 | Usabilidad | Diseño *mobile-first*: legible y operable en celulares sin zoom. | Sin desplazamiento horizontal desde 360 px de ancho; probado a 390 px y 1366 px | Pruebas con Playwright · UAT U-02 | ✅ |
| RNF-03 | Usabilidad | Lenguaje cercano y local: voseo rioplatense y pesos con punto de miles (`$9.500`). | Textos revisados por el negocio | prueba `pesos` · UAT U-03 | 🟡 |
| RNF-04 | Compatibilidad / Portabilidad | Funcionar en cualquier navegador moderno (Android, iOS, Windows, Linux) sin instalar nada. | Chrome, Safari, Firefox y Edge actuales | UAT F-01 | 🟡 |
| RNF-05 | Seguridad | Toda la comunicación debe ir cifrada. | 100 % del tráfico por HTTPS (GitHub Pages y Google) | Inspección de la URL publicada | ✅ |
| RNF-06 | Seguridad (integridad) | El importe registrado no puede manipularse desde el navegador; el texto ingresado no puede ejecutarse como fórmula en la planilla. | Total = precio de la hoja `Catalogo`; textos que empiezan con `= + - @` se neutralizan | pruebas backend «ignora el total…», «texto que parece fórmula…» | ✅ |
| RNF-07 | Seguridad (privacidad) | Recolectar solo los datos necesarios para la entrega, avisar su uso y guardarlos en una planilla privada. Cumplir la Ley 25.326 de Protección de Datos Personales. | Aviso visible en el sitio; planilla no compartida; borrado a pedido del cliente | Revisión del sitio y de los permisos de la planilla | ✅ |
| RNF-08 | Fiabilidad (tolerancia a fallos) | Si el servidor o la planilla fallan, el cliente igual debe poder enviar su pedido por WhatsApp. | Espera máxima de 6 s; luego continúa con número local | prueba «generarId: sin backend…» · revisión del flujo | ✅ |
| RNF-09 | Fiabilidad (integridad de datos) | Dos pedidos simultáneos nunca deben recibir el mismo número ni duplicar filas. | Bloqueo de concurrencia (`LockService`) y código único por envío | pruebas «IDs secuenciales…», «el mismo envío repetido…» | ✅ |
| RNF-10 | Eficiencia de desempeño | Carga liviana en conexiones móviles. | Sin frameworks ni dependencias externas de código; fotos de 960×600 px y ≤ 140 KB con carga diferida | Revisión del repositorio | ✅ |
| RNF-11 | Mantenibilidad | Los datos del negocio deben poder cambiarse sin programar. | Teléfono, alias, horarios en un solo archivo (`config.js`); precios en la planilla | Revisión del código · UAT F-10 | ✅ |
| RNF-12 | Mantenibilidad (capacidad de prueba) | Toda versión nueva debe pasar las pruebas automáticas antes de publicarse. | 44 pruebas; la publicación se bloquea si alguna falla | GitHub Actions | ✅ |
| RNF-13 | Accesibilidad | Pautas básicas WCAG: enlace “Ir al menú”, etiquetas en todos los campos, mensajes anunciados a lectores de pantalla, foco visible. | Navegable con teclado; contraste de texto ≥ 4,5:1 | Revisión manual | 🟡 |
| RNF-14 | Costo / Operación | Sin costos de infraestructura. | $0 por mes (niveles gratuitos de GitHub Pages y Google); dominio propio opcional ≈ $8.500/año | Facturación de los servicios | ✅ |
| RNF-15 | Disponibilidad | El sitio debe estar disponible durante todo el horario de atención. | Alojamiento en GitHub Pages; ante caída, plan de contingencia (vuelta al pedido por chat) | Monitoreo durante la estabilización | 🟡 |

## Trazabilidad resumida

| Objetivo específico | Requisitos que lo cubren |
|---|---|
| OE1 — Ordenar la toma de pedidos | RF-01 a RF-13, RNF-01 a RNF-04 |
| OE2 — Registrar los pedidos y facilitar la administración | RF-14 a RF-17, RF-19, RNF-09, RNF-11 |
| OE3 — Operar de forma segura, confiable y sin costo | RF-18, RNF-05 a RNF-08, RNF-12, RNF-14, RNF-15 |

> Los objetivos específicos de esta tabla son una **propuesta** alineada al producto actual; se ajustan cuando se rehaga la presentación.
