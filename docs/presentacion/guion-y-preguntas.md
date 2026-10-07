# Guion, tiempos y preguntas — Exposición Dany Pizzas Web

> Rúbrica: 10 criterios × 2 puntos. **Tiempo exigido: 10 a 15 minutos.** Objetivo: **13 minutos** (deja margen a ambos lados).
> El guion completo de cada diapositiva está en las **notas del orador** del PowerPoint (vista Moderador). Acá va el resumen para ensayar.

## 1. Tiempos por diapositiva

| Diap. | Contenido | Tiempo | Acumulado |
|---:|---|---:|---:|
| 1 | Portada | 0:20 | 0:20 |
| 2 | Esquema | 0:20 | 0:40 |
| 3 | Curriculum vitae | 0:30 | 1:10 |
| 4 | La empresa | 0:40 | 1:50 |
| 5 | Organización e infraestructura | 0:40 | 2:30 |
| 6 | FODA y posición estratégica | 0:50 | 3:20 |
| 7 | **El problema: sábado 22:00** | 1:10 | 4:30 |
| 8 | Ishikawa | 0:45 | 5:15 |
| 9 | Objetivos | 0:45 | **6:00** ← control |
| 10 | Alcance y plan | 0:40 | 6:40 |
| 11 | Presupuesto | 0:30 | 7:10 |
| 12 | Evaluación económica | 0:50 | 8:00 |
| 13 | Monte Carlo | 0:50 | 8:50 |
| 14 | Arquitectura | 0:45 | **9:35** ← control |
| 15 | Requisitos | 0:40 | 10:15 |
| 16 | Desarrollo | 0:45 | 11:00 |
| 17 | Resultados | 0:50 | 11:50 |
| 18 | Conclusiones | 0:45 | 12:35 |
| 19 | Recomendaciones | 0:25 | 13:00 |
| 20 | Gracias / preguntas | 0:10 | **13:10** |

Los anexos A1–A10 están en un archivo aparte, `DanyPizzas_Anexos.pptx` (11 diapositivas): no se exponen, solo se abren si una pregunta lo necesita.

Reparto: introducción y memoria ≈ 3:20 · problema y objetivos ≈ 2:40 · desarrollo ≈ 5:00 · resultados y cierre ≈ 2:10.

**Si vas atrasado** en el control de la diapositiva 9 (más de 6:30): decí la 10 y la 11 en una frase cada una y pasá. En la 15 (requisitos) basta con la frase de los números.
**Si vas adelantado** (antes de 5:30 en la 9): mostrá el sitio en vivo con el QR en la diapositiva 16 (máx. 40 s).

## 2. Qué hacer en cada criterio de la rúbrica

| # | Criterio | Qué hacer |
|---:|---|---|
| 1 | Vestimenta | **Terno o traje completo** (es lo que da 2 puntos). |
| 2 | Tiempo | Ensayar con cronómetro al menos 2 veces. Mirar el reloj en las diapositivas 9 y 14. |
| 3 | Control de diapositivas | **Usar un presentador inalámbrico (clicker) o una app de control remoto en el celular.** Probarlo antes con tu computadora y el proyector. No acercarse al teclado. |
| 4 | Voz | Volumen para la última fila, ritmo pausado. Bajar el ritmo y hacer **pausas** en la diapositiva 7 y en los números grandes. |
| 5 | Lenguaje corporal | Moverse por el frente (cambiar de lugar en cada sección: memoria → problema → solución → resultados). Mirar al público, no a la pantalla. |
| 6 | Dramatización del problema | Diapositiva 7: contarla como una escena (“Imaginen un sábado a las diez…”). Leer el chat como si fueras el cliente. Remarcar **$197.600 por mes** con una pausa antes. |
| 7 | Dominio del tema | No leer. Saber de memoria: 50 pedidos/semana, 1 de cada 10 con error, ~1 perdido por noche, $234.720 de inversión, VAN $583.451, 97,8 %, 4 meses, 44 pruebas, $0/mes. |
| 8 | Organización | Usar las frases puente: “¿Por qué pasa esto?” (7→8), “De esas causas salen los objetivos” (8→9), “¿Conviene económicamente?” (11→12), “Para cerrar, conecto todo” (17→18). |
| 9 | Diapositivas | Ya están sintetizadas; el detalle quedó en los anexos. Señalar el número clave de cada diapositiva y explicarlo con tus palabras. |
| 10 | Preguntas | Ver la sección 3. Si un anexo ayuda, tener `DanyPizzas_Anexos.pptx` ya abierto en segundo plano y pasar a él (Alt+Tab). |

## 3. Preguntas probables y respuesta preparada

| Pregunta | Respuesta corta | Apoyo |
|---|---|---|
| ¿Por qué no usar PedidosYa o Rappi? | Cobran comisión por pedido y el negocio pierde el contacto con su cliente. Esta solución cuesta $0 y mantiene WhatsApp, que el cliente ya usa. | A1 (FA) |
| ¿Por qué un sitio estático y no un backend completo con base de datos? | Por el tamaño del negocio: 3 personas, ~50 pedidos por semana. Google Sheets es gratis y el dueño ya sabe usarlo. Las capas permiten agregar una base de datos en la v2 sin reescribir. | diap. 14 |
| ¿Qué pasa si se cae Google o GitHub? | Si el backend no responde en 6 s, el sitio genera un número local y el pedido sale igual por WhatsApp. Y siempre se puede volver a pedir por chat. | diap. 14, A7 |
| ¿Cómo evitan pedidos falsos o que alguien cambie el precio? | El servidor recalcula el total con los precios de la planilla; campo trampa para bots, tiempo mínimo, máximo 3 pedidos por hora por teléfono, sin duplicados. Y nada se prepara sin el mensaje de WhatsApp y el comprobante. | A6 (RF-18), A7 |
| ¿De dónde salen los números de la evaluación? | Pedidos, pizzas, margen, minutos, errores y pedidos perdidos los dio el negocio. Adopción, recupero y valor de la hora son supuestos con rango amplio; por eso hice Monte Carlo. | A2 |
| ¿Por qué el pesimista da negativo si decís que conviene? | El pesimista supone que las 17 variables salen mal a la vez. Monte Carlo muestra que eso pasa en solo el 2,2 % de los casos. | diap. 13, A3 |
| ¿Por qué esa tasa de descuento? | No había una de la cátedra: usé el plazo fijo a 30 días del Banco Nación (TNA 17,5 %), que es el costo de oportunidad del dinero para el negocio. Es conservadora porque los flujos están en pesos constantes. | A2 |
| ¿Cómo valorizaste tu trabajo? | 48 horas a 2,5 veces la hora del salario mínimo (oct-2026, $1.956). Aun a 5 veces el VAN sigue positivo (≈ $242.000). | A4 |
| ¿Qué metodología usaste? | Modelo incremental con prototipos, enfoque ágil y Lean, Scrumban liviano: backlog con MoSCoW, tablero Kanban con WIP 2 y revisión semanal con la familia. | diap. 10 |
| ¿Cómo probaste el sistema? | 44 pruebas automáticas (lógica y backend con Google simulado) que corren antes de cada publicación, pruebas de punta a punta con Playwright en móvil y PC, y la lista de aceptación con el negocio. | diap. 16 |
| ¿Qué datos personales guarda? ¿Es legal? | Solo nombre, teléfono y dirección para la entrega, en una planilla privada del dueño, con aviso de privacidad (Ley 25.326 de Argentina). | A7 |
| ¿Qué falta o qué harías en la v2? | Pago en línea, aviso de estado al cliente, panel de administración simple y promociones. Primero medir un mes de uso. | diap. 19 |
| ¿Cómo sabés que los clientes lo van a usar? | No lo sé todavía: es el riesgo principal y por eso propongo medirlo el primer mes (pedidos web / total). Pero alcanza con recuperar un pedido cada 3 o 4 meses para que convenga. | diap. 13 |

## 4. Antes de exponer (día 13/10)

- [ ] Completar los recuadros PENDIENTE (CV, fechas del Gantt, capturas del pedido real).
- [ ] Probar el clicker o el control desde el celular con tu computadora.
- [ ] Dejar abierto `DanyPizzas_Anexos.pptx` en segundo plano para las preguntas.
- [ ] Abrir el PowerPoint en **vista Moderador** (ves las notas y el tiempo; el público solo la diapositiva).
- [ ] Guardar una **copia en PDF** y llevarla en un pendrive.
- [ ] Probar el sitio en la red del aula. Si la exposición es de día, el sitio dirá “cerrado”: abrí https://castromaximo.github.io/DanyPizzas/?ahora=2026-10-13T22:00 (modo demo).
- [ ] Cronometrar un ensayo completo: entre 12 y 14 minutos.
