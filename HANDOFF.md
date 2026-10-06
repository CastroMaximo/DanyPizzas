# HANDOFF — Dany Pizzas Web (proyecto de Ingeniería de Software)

> Archivo de estado. Si la sesión se corta, leer ESTE archivo primero y continuar desde "Estado actual".
> Última actualización: 2026-10-06 (v1.2: fotos, logo nuevo, protección del backend). **Fecha de entrega y exposición: 13/10/2026.**

## 1. Qué es
Sitio web estático (mobile-first) para el emprendimiento **Dany Pizzas / Dany Pizzería** (Chilecito, La Rioja, Argentina; 3 personas; solo envío a domicilio). El cliente arma el pedido, el sitio genera un ID y un recibo, y abre WhatsApp con el recibo prellenado. Después el cliente paga y manda el comprobante; recién ahí se prepara.
Backend mínimo opcional: Google Apps Script + Google Sheets (ID secuencial, registro mensual de pedidos, catálogo editable por el dueño).

Usuario: Máximo Daniel Castro (GitHub `CastroMaximo`, repo `CastroMaximo/DanyPizzas`). Trabaja individual, Linux Ubuntu + VS Code, nunca usó Node.js. Docente: Dr. Morales Gonzales Alexander.

## 2. Decisiones confirmadas por el usuario (cuestionario)
| Tema | Respuesta |
|---|---|
| Nombre | **"Dany Pizzas"** (confirmado 06/10; logo nuevo dice "DANY PIZZAS") |
| WhatsApp | +54 9 3825 62-0508 (número común, temporal; usarlo igual para la exposición) → `5493825620508` |
| Instagram | https://www.instagram.com/dany.pizzeria/ |
| Zona | Solo envío, "puertas cerradas". Chilecito, La Rioja |
| Horario | Martes a domingo 21:00 a 00:30 (lunes cerrado) |
| Tamaño | Un único tamaño: entera (8 porciones) o mitad (4 porciones) |
| Mitad y mitad | Sí. Cada mitad se cobra aparte: mitad del precio redondeada (ej. $9.500 → $5.000) |
| Otros productos | Solo pizzas. Sin etiquetas, sin promos (Q19 sin respuesta → sin promos) |
| Envío | Costo lo habla el cliente con el motoquero; NO se suma al total |
| Mínimo / tope | Sin mínimo ni tope diario |
| Tiempo | 20–30 min estimados |
| Programación | Solo para el mismo día; se puede sugerir hora de entrega |
| Cancelación | Se coordina por WhatsApp; el cliente vuelve a la web y hace un pedido nuevo |
| Pagos | Mercado Pago, transferencia y efectivo (efectivo se paga en la entrega, sin comprobante) |
| Cobro | Alias `castro.md`, titular Castro Maximo Daniel, Mercado Pago |
| Comprobante | Quien use el celular/PC valida; transferencia: 5 minutos para enviarlo |
| Descuentos | No |
| Registro | Quiere planilla mensual de pedidos |
| Tono | Cercano, argentino (voseo) |
| Dispositivos | Mayoría Android; debe andar en PC e iOS |
| Referencias de diseño | pedix.app (Gorilla Burger), dominos.com.pe, pizzahut.com.pe |
| Precios | Cambian poco; los cambia "un perfil administrador o como lo sugieras" → hoja `Catalogo` del Google Sheet |
| Backend (Q53) | Pegó mi opción: "Sí… servidor pequeño" → se implementa Apps Script + Sheets |
| Enlace | Enlace + QR |
| Entorno | Linux Ubuntu, VS Code, aprende Node si hace falta. Debe poder abrirse desde PC de laboratorio (→ hosting público, nada que instalar) |

### Catálogo (precio de la pizza entera)
| id | Nombre | Precio | Ingredientes |
|---|---|---|---|
| muzza | Muzza | 8500 | salsa de tomate, mozzarella, orégano, olivas verdes |
| fugazzeta | Fugazzeta | 9500 | salsa de tomate, mozzarella, cebolla rebosada, orégano, olivas verdes |
| napolitana | Napolitana | 9500 | salsa de tomate, mozzarella, tomate, provenzal, orégano, aceitunas verdes |
| especial | Especial | 9500 | salsa de tomate, mozzarella, jamón, morrón, huevo, orégano, aceituna verde |
| doble-muzza | Doble Muzza | 9500 | salsa de tomate, abundante mozzarella, orégano, olivas verdes |
| calabresa | Calabresa | 9500 | salsa de tomate, mozzarella, salame picado grueso, orégano, olivas verdes |
| de-la-casa | De la Casa | 10500 | salsa de tomate, mozzarella, carne picada, huevo, olivas verdes (confirmado 06/10) |

Mitades (regla: `ceil(precio/2 / 500) * 500`): Muzza 4.500 · resto de 9.500 → 5.000 · De la Casa 5.500.

## 3. Supuestos que YO tomé (el usuario debe confirmarlos)
1. **Redondeo de mitades:** siempre hacia arriba al múltiplo de $500 (el único ejemplo dado fue 9.500→5.000; 8.500 y 10.500 caen en empate).
2. **Fotos (resuelto 06/10):** las 7 pizzas tienen foto. Muzza y Doble Muzza comparten `muzza.jpg` (decisión del usuario). Calabresa = foto nueva de salame. De la Casa = foto de carne picada + huevo (decisión del usuario) → ingredientes corregidos a muzza, carne picada, huevo y olivas verdes (confirmado 06/10).
3. **Fuera de horario:** el sitio avisa que está cerrado pero igual deja armar el pedido (para que la demo funcione de día). Configurable: `permitirFueraDeHorario` en `site/js/config.js`.
4. **Datos del cliente (Q27 sin respuesta):** nombre, teléfono, dirección (obligatoria: solo envío), referencia (opcional), hora de entrega, medio de pago, observaciones.
5. **Privacidad (Q57-59 sin respuesta):** al guardar pedidos en la planilla SÍ se guardan datos personales (contradice mi supuesto inicial "no se guarda nada"). Se agrega aviso de privacidad breve. La planilla es privada (cuenta Google del dueño).
6. **ID de pedido:** `DP-AAMMDD-NNN` secuencial por día (lo da el backend). Sin backend: `DP-AAMMDD-XXX` aleatorio (letras/números).
7. **Dominio / hosting / analítica (Q47-49):** GitHub Pages por Actions, URL gratuita, sin analítica.
8. **Modo:** solo claro.
9. Sin "Quiénes somos" (Q9 vacío).
10. **Seguridad del backend (v1.2):** la URL del Apps Script es pública. Barreras simples en `Code.gs` (`CFG.SEGURIDAD`): campo trampa verificado en el servidor, tiempo mínimo en la página (4 s), máx. 3 pedidos/hora por teléfono, máx. 40/hora y 150/día en total, `nonce` anti-duplicados, interruptor `PEDIDOS_WEB=NO`. Si el backend rechaza, el sitio igual abre WhatsApp. La validación real sigue siendo: sin WhatsApp + comprobante no se prepara (estado "Descartado" para filas falsas). Detalle en `backend/README.md`.

## 4. Estructura del repo
```
site/            ← el sitio (se publica tal cual)
  index.html
  css/styles.css
  js/config.js   ← TODO lo editable del negocio (WhatsApp, alias, horarios, URL del backend)
  js/lib.js      ← lógica pura testeable (precios, horarios, ID, recibo)
  js/app.js      ← interfaz (DOM)
  data/catalogo.js
  assets/img/    ← logo y fotos
backend/Code.gs  ← Google Apps Script (registro en Google Sheets)
backend/README.md
tests/           ← pruebas unitarias (node --test) y e2e (Playwright, solo si se quiere)
.github/workflows/deploy.yml  ← pruebas + publicación en GitHub Pages
diagramas/       ← UML/C4 (pendiente)
docs/            ← recursos y documentación
HANDOFF.md
```
Probar local sin Node: `cd site && python3 -m http.server 8000` y abrir http://localhost:8000
Pruebas: `node --test` (Node 18+; no hace falta instalar paquetes). Modo demo: `?ahora=2026-10-13T22:00` simula hora de Argentina.

## 5. Estado actual (marcar al avanzar)
- [x] Cuestionario respondido y leído
- [x] Esquema del profesor leído (ver sección 6)
- [x] Logo, fotos y colores preparados (rojo #E83030, verde #309880, crema #F7EBDB)
- [x] Sitio construido y probado (Playwright móvil 390px + PC 1366px; flujo completo con y sin backend; 34 pruebas `node --test` OK)
- [x] Backend Apps Script (`backend/Code.gs`) + guía (`backend/README.md`) — probado con Google simulado; **NO desplegado** (requiere cuenta Google del usuario)
- [x] CI/CD (`.github/workflows/deploy.yml`: pruebas + publicación en Pages) — **sin ejecutar** (requiere repo en GitHub y Settings → Pages → Source: GitHub Actions)
- [x] Paquete entregado al usuario (zip `DanyPizzas_v1.zip`)
- [x] v1.2 (06/10): fotos de Calabresa, De la Casa y Doble Muzza; logo nuevo "DANY PIZZAS" (`assets/img/logo.png`, ícono `icono.png`); protección contra pedidos falsos en backend + 10 pruebas nuevas (44 en total OK); probado con Playwright (móvil y PC, backend simulado). Zip `DanyPizzas_v1_2.zip`
- [x] Repo `CastroMaximo/DanyPizzas` creado por el usuario (vacío). Repo público `CastroMaximo/DanyPizzas`, código subido el 06/10 (app de Claude instalada, Claude puede hacer push). Job de pruebas en verde en Actions. URL final: https://castromaximo.github.io/DanyPizzas/ · QR en `docs/qr-sitio.png` · guía `docs/PUBLICAR.md`
- [x] Pages activado y **sitio publicado el 06/10/2026: https://castromaximo.github.io/DanyPizzas/** (workflow en verde: pruebas + publicar)
- [ ] Usuario: desplegar Apps Script, pegar URL en `site/js/config.js`, push, pedido real de prueba
- [ ] **Presentación rehecha según el esquema del profesor** (ver 6)
- [ ] Diagramas: casos de uso, clases, C4 contexto/contenedores, secuencia del pedido
- [ ] Evidencias de que es real (capturas de la web publicada, pedido real llegando a WhatsApp, fila en la planilla)
- [x] Publicar en GitHub Pages + QR (`docs/qr-sitio.png`)

## 6. Esquema del profesor (ESQUEMA_PRESENTACION.pdf, 49 págs.) — lo que la presentación debe tener
Su ejemplo es su propio proyecto (gamificación en Dantes Burgers). Secciones: Introducción/Esquema → I Curriculum vitae (omitir/adaptar a datos del estudiante) → II Memoria descriptiva (empresa, ubicación, razón social, organización con nº de trabajadores, misión/visión, infraestructura, **FODA** y **posición estratégica** con valoración de analistas) → III Relación de trabajos (adaptable) → IV Trabajo principal: **diagrama causa-efecto (Ishikawa)** del problema, título del proyecto, **objetivo general + 3 OE**, **alcance** (delimitación, componentes, evaluación, exclusiones), **plan de ejecución (fases, cronograma/Gantt)**, **presupuesto por macrofase y financiamiento**, **evaluación económico-financiera** (VAN, TIR, ROI, B/C, payback; su ejemplo usa Monte Carlo), **diseño conceptual**, **RF y RNF numerados (RF-01…, RNF-01…)**, **desarrollo e integración**, **Resultados por objetivo (con datos reales de uso)**, **Conclusiones por objetivo**, **Recomendaciones por responsable**.
Corrección pendiente de la presentación v1: (a) le faltan evaluación económico-financiera, RF/RNF, diagramas, resultados reales y conclusiones; (b) el "Docente" debe decir "Dr. Morales Gonzales Alexander"; (c) para la evaluación económica hacen falta datos reales del negocio (ver sección 7).

## 7. Preguntas abiertas para el usuario
1. ¿Confirmás el redondeo de mitades (hacia arriba a $500)?
2. ~~Ingredientes De la Casa~~ → resuelto: mozzarella, carne picada, huevo y olivas verdes.
3. ~~Nombre~~ → resuelto: "Dany Pizzas". (El Instagram sigue siendo @dany.pizzeria.)
4. Para la evaluación económica: pedidos promedio por noche (y por semana), ticket promedio, minutos que hoy se pierden por pedido atendiendo el chat, % de pedidos con errores/repreguntas, cuántas horas por semana podría ahorrar.
5. ¿La cátedra pide Monte Carlo/VAN/TIR como el ejemplo o alcanza con un análisis simple costo-beneficio?
6. ¿Cómo se presenta el "Curriculum vitae" (el ejemplo es del profesor)? ¿Hay que incluir el del estudiante?
7. ¿Hay clientes reales dispuestos a hacer un pedido de prueba antes del 13/10 (evidencia)?
