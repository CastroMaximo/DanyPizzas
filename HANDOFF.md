# HANDOFF — Dany Pizzas Web (proyecto de Ingeniería de Software)

> Archivo de estado. Si la sesión se corta, leer ESTE archivo primero y continuar desde "Estado actual".
> Última actualización: 2026-10-07 10:15 (presentación v2 ajustada a la rúbrica: 20 diapositivas ≈ 13 min + anexos; guion y preguntas; quedan los PENDIENTE por datos del usuario). **Fecha de entrega y exposición: 13/10/2026.**

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

Mitades (regla **confirmada 06/10**: mitad del precio redondeada al múltiplo de $500 más cercano; si cae justo en el medio, hacia arriba): Muzza 4.500 · resto de 9.500 → 5.000 · De la Casa 5.500.

## 3. Supuestos que YO tomé (el usuario debe confirmarlos)
1. ~~Redondeo de mitades~~ → **confirmado 07/10:** múltiplo de $500 más cercano, empate hacia arriba (`Math.round`, en `lib.js` y `Code.gs`).
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
diagramas/       ← UML/C4: casos de uso, clases, C4 contexto/contenedores, secuencia (.drawio + .mmd + .png + .svg)
docs/analisis/   ← requisitos.md (RF/RNF), foda.md (EFI/EFE/IE), ishikawa (.md/.png/.drawio), memoria-descriptiva.md,
                   evaluacion-economica.md, economia/ (script Monte Carlo + resultados.json + 3 gráficos PNG), PENDIENTES_DEL_USUARIO.md
docs/entregas/   ← Dossier de transición (Word + PDF)
docs/presentacion/ ← DanyPizzas_Presentacion.pptx (20) + DanyPizzas_Anexos.pptx (11) + build_presentacion.js (generador) + guion-y-preguntas.md + assets/
docs/            ← PUBLICAR.md, qr-sitio.png, capturas/
HANDOFF.md
```
Probar local sin Node: `cd site && python3 -m http.server 8000` y abrir http://localhost:8000
Pruebas: `node --test` (Node 18+; no hace falta instalar paquetes). Modo demo: `?ahora=2026-10-13T22:00` simula hora de Argentina.

## 5. Estado actual (marcar al avanzar)
- [x] Cuestionario respondido y leído
- [x] Esquema del profesor leído (ver sección 6)
- [x] Logo, fotos y colores preparados (rojo #E83030, verde #309880, crema #F7EBDB)
- [x] Sitio construido y probado (Playwright móvil 390px + PC 1366px; flujo completo con y sin backend; 34 pruebas `node --test` OK)
- [x] Backend Apps Script (`backend/Code.gs`) + guía (`backend/README.md`) — probado con Google simulado; **desplegado y activo desde el 06/10** (cuenta Google del negocio; URL cargada en `config.js`; verificado por el usuario)
- [x] CI/CD (`.github/workflows/deploy.yml`: pruebas + publicación en Pages) — **funcionando desde el 06/10** (cada push a `main` corre las 44 pruebas y publica)
- [x] Paquete entregado al usuario (zip `DanyPizzas_v1.zip`)
- [x] v1.2 (06/10): fotos de Calabresa, De la Casa y Doble Muzza; logo nuevo "DANY PIZZAS" (`assets/img/logo.png`, ícono `icono.png`); protección contra pedidos falsos en backend + 10 pruebas nuevas (44 en total OK); probado con Playwright (móvil y PC, backend simulado). Zip `DanyPizzas_v1_2.zip`
- [x] Repo `CastroMaximo/DanyPizzas` creado por el usuario (vacío). Repo público `CastroMaximo/DanyPizzas`, código subido el 06/10 (app de Claude instalada, Claude puede hacer push). Job de pruebas en verde en Actions. URL final: https://castromaximo.github.io/DanyPizzas/ · QR en `docs/qr-sitio.png` · guía `docs/PUBLICAR.md`
- [x] Pages activado y **sitio publicado el 06/10/2026: https://castromaximo.github.io/DanyPizzas/** (workflow en verde: pruebas + publicar)
- [x] Apps Script desplegado, URL en `site/js/config.js`, planilla verificada por el usuario (06/10)
- [ ] Pedido real de prueba (lo hace el usuario más adelante)
- [x] Análisis (07/10) en `docs/analisis/`: RF-01…RF-20 y RNF-01…RNF-15 con trazabilidad; FODA + EFI 2,45 / EFE 2,32 → cuadrante V (conservar y mantener) + estrategias FO/FA/DO/DA; Ishikawa 6 categorías (PNG + drawio). **Aprobados por el usuario el 07/10** (sin cambios)
- [x] Dossier de transición (actividad aparte) entregado: `docs/entregas/` + deck de exposición en artifact
- [x] Respuestas del usuario (07/10): FODA, Ishikawa y requisitos **aprobados**; organización: Cocinero (dueño), Ayudante, Encargado de atención + repartidor externo; inicio 2024; informal; cocina en casa, horno de 6 moldes. Portada: Universidad Nacional de Moquegua, Fac. de Ingenierías, EP de Ingeniería de Sistemas e Informática, Ingeniería de Software, Comisión A. Relación de trabajos: se omite. Proyecta desde su PC → .pptx
- [x] `docs/analisis/memoria-descriptiva.md` (misión/visión **propuestas**, falta aprobar)
- [x] `docs/analisis/evaluacion-economica.md` + `economia/evaluacion_economica.py` (Monte Carlo 10.000 it., semilla 2026). Base: inversión $234.720, beneficio $90.697/mes, VAN 12 m $583.451, TIR 26,8 %/mes, B/C 2,71, recupero 3,9 meses; MC: P(VAN>0) 97,8 %. Tasa: TNA 17,5 % BNA; hora: SMVM $1.956 (oct-2026)
- [x] **Presentación v2 (07/10) ajustada a la rúbrica** (`Criterio Evaluativo Software.pdf` en el proyecto: 10 criterios × 2 pts; **exposición de 10 a 15 min**). `docs/presentacion/DanyPizzas_Presentacion.pptx`, generada por `build_presentacion.js`. **`DanyPizzas_Presentacion.pptx` = 20 diapositivas (~13:10, tiempo en cada nota del orador); los anexos A1–A10 van aparte en `DanyPizzas_Anexos.pptx` (11 diapositivas).** El generador arma uno u otro: `node build_presentacion.js` (principal) y `MODO=anexos node build_presentacion.js` (anexos). Cambios clave: problema dramatizado (diap. 7, "Sábado 22:00", chat + $197.600/mes de ganancia perdida = 6 pedidos/sem × 2 × $3.800 × 4,33), Ishikawa redibujado nativo y legible (diap. 8), objetivos con "ataca: causas", resultados antes/ahora (diap. 17), conclusiones como trazabilidad problema→qué se hizo→conclusión (diap. 18); RF/RNF completos, supuestos, sensibilidad, casos de uso y secuencia pasaron a anexos. Docente escrito como en la rúbrica: "Dr. Alexander Morales Gonzales".
- [x] `docs/presentacion/guion-y-preguntas.md`: tiempos por diapositiva con puntos de control, qué hacer en cada criterio (terno, clicker, voz, movimiento), 13 preguntas probables con respuesta y anexo, checklist del día.
- [ ] **Completar los PENDIENTE de la presentación** (recuadros rojos punteados; editar `build_presentacion.js` y regenerar): CV (diap. 3), fechas del Gantt (diap. 10), 3 capturas del pedido real + pedidos web hasta el 13/10 (diap. 17), aprobación de misión/visión (etiqueta en diap. 4).
- [x] Diagramas (06/10): casos de uso, clases, C4 contexto y contenedores, secuencia del pedido → `diagramas/` (draw.io editable + fuente Mermaid + PNG + SVG; GitHub los dibuja en `diagramas/README.md`)
- [ ] Evidencias de que es real (capturas de la web publicada, pedido real llegando a WhatsApp, fila en la planilla)
- [x] Publicar en GitHub Pages + QR (`docs/qr-sitio.png`)

## 6. Esquema del profesor (ESQUEMA_PRESENTACION.pdf, 49 págs.) — lo que la presentación debe tener
Su ejemplo es su propio proyecto (gamificación en Dantes Burgers). Secciones: Introducción/Esquema → I Curriculum vitae (omitir/adaptar a datos del estudiante) → II Memoria descriptiva (empresa, ubicación, razón social, organización con nº de trabajadores, misión/visión, infraestructura, **FODA** y **posición estratégica** con valoración de analistas) → III Relación de trabajos (adaptable) → IV Trabajo principal: **diagrama causa-efecto (Ishikawa)** del problema, título del proyecto, **objetivo general + 3 OE**, **alcance** (delimitación, componentes, evaluación, exclusiones), **plan de ejecución (fases, cronograma/Gantt)**, **presupuesto por macrofase y financiamiento**, **evaluación económico-financiera** (VAN, TIR, ROI, B/C, payback; su ejemplo usa Monte Carlo), **diseño conceptual**, **RF y RNF numerados (RF-01…, RNF-01…)**, **desarrollo e integración**, **Resultados por objetivo (con datos reales de uso)**, **Conclusiones por objetivo**, **Recomendaciones por responsable**.
Corrección pendiente de la presentación v1: (a) le faltan evaluación económico-financiera, RF/RNF, diagramas, resultados reales y conclusiones; (b) el "Docente" debe decir "Dr. Morales Gonzales Alexander"; (c) ~~datos para la evaluación económica~~ → hecha el 07/10 (`docs/analisis/evaluacion-economica.md`); (d) el nombre del proyecto es "Dany Pizzas", no "PizzaFamiliar"; (e) portada con los datos de la Universidad Nacional de Moquegua (ver sección 5).

## 6b. Pendientes de acción del USUARIO (no los puede hacer Claude)
1. **Actualizar el backend en Apps Script**: el redondeo de mitades cambió en `backend/Code.gs` el 07/10. Pegar el `Code.gs` actual → Implementar → Administrar implementaciones → ✏ → Nueva versión (la URL no cambia). No urgente: con los precios actuales da el mismo resultado.
2. **Pedido real de prueba + 3 capturas** (confirmación en el sitio, mensaje en WhatsApp, fila en la planilla; marcar la fila como Descartado).
3. **Completar lo que queda de `docs/analisis/PENDIENTES_DEL_USUARIO.md`** (también en el proyecto como `Pendientes_presentacion.md` y `claude/Pendientes_presentacion.md`): CV (⭐), pedido real + capturas (⭐), fechas reales para el Gantt, aprobar misión/visión, duración de la exposición, y confirmar si el viernes es día de semana y si el 40 % es sobre el precio de venta.

## 6c. Otros entregables ya hechos (actividad del dossier, aparte de la presentación principal)
- Dossier de transición: `docs/entregas/Dossier_Transicion_DanyPizzas.docx/.pdf` (14 págs.).
- Diapositivas de la exposición del dossier (15 slides, notas del orador): artifact https://claude.ai/artifact/DxrxdBi3E8F5nBXch6VJw6 (privado). Speech de 4–5 min entregado en el chat (07/10).

## 6d. Mantenimiento técnico (después del 13/10, no tocar antes de exponer)
- GitHub Actions avisa que `checkout@v4`, `setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4` usan Node 20 (deprecado; hoy se fuerzan a Node 24 y funcionan). Subir versiones y verificar que la publicación siga en verde.
- `ubuntu-latest` pasa a Ubuntu 26 desde el 19/10/2026 (sin impacto esperado).

## 7. Preguntas abiertas para el usuario
> **Lista completa y actualizada:** `docs/analisis/PENDIENTES_DEL_USUARIO.md`. Lo de abajo es el historial.
1. ~~Redondeo de mitades~~ → confirmado: múltiplo de $500 más cercano (empate hacia arriba).
2. ~~Ingredientes De la Casa~~ → resuelto: mozzarella, carne picada, huevo y olivas verdes.
3. ~~Nombre~~ → resuelto: "Dany Pizzas". (El Instagram sigue siendo @dany.pizzeria.)
4. ~~Datos para la evaluación económica~~ → respondidos el 07/10: 7 pedidos/noche entre semana y 11 en fin de semana; 1 a 3 pizzas por pedido; ganancia 40 %; 2 a 10 min de chat por pedido; 1 de cada 10 con error; ~1 pedido perdido por día; 48 h de desarrollo; sin dato de valor hora ni tasa (se usó SMVM y plazo fijo BNA).
5. ~~Monte Carlo~~ → sí, hecho.
6. ~~Curriculum vitae~~ → se incluye el del estudiante; lo está preparando.
7. Pedido real de prueba y uso real hasta el 13/10 → pendiente.

## 8. Cómo retomar en una sesión nueva
1. Leer este HANDOFF y `claude/Pendientes_presentacion.md` del proyecto.
2. Clonar `CastroMaximo/DanyPizzas` (Claude tiene permiso de push) y correr `node --test` (deben pasar 44).
3. Próximo trabajo: **completar la presentación** (`docs/presentacion/`) con los datos del usuario: reemplazar cada `pendiente(...)` del generador (CV diap. 3, Gantt diap. 10, capturas diap. 17 con `addImage`), quitar la etiqueta de misión/visión cuando la apruebe, regenerar con `node build_presentacion.js` (y `MODO=anexos node build_presentacion.js` si cambian los anexos), validar y revisar visualmente. **Respetar la rúbrica:** 10–15 min (no agregar diapositivas principales; lo nuevo va a anexos), texto sintetizado, notas con tiempos.
4. Si cambia algún dato económico: editar `PARAMS` (o `TNA`) en `docs/analisis/economia/evaluacion_economica.py`, ejecutar `python3 evaluacion_economica.py` y actualizar las cifras de `evaluacion-economica.md`. Verificar la tasa de plazo fijo vigente antes del 13/10.

