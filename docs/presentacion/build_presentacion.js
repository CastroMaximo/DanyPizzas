// Genera la presentación principal de Dany Pizzas Web (esquema del profesor).
// Uso: node build_presentacion.js   → DanyPizzas_Presentacion.pptx
// Los textos marcados con PENDIENTE se completan cuando el estudiante pase los datos.
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const ROOT = path.resolve(__dirname, "../..");
const P = (...p) => path.join(ROOT, ...p);
// MODO=principal (20 diapositivas que se exponen) o MODO=anexos (respaldo para preguntas)
const MODO = process.env.MODO === "anexos" ? "anexos" : "principal";
const OUT = path.join(__dirname, MODO === "anexos" ? "DanyPizzas_Anexos.pptx" : "DanyPizzas_Presentacion.pptx");

const HEX = {
  ink: "2B2420", red: "E83030", redDark: "B42323", green: "309880", greenDark: "1F6E5C",
  cream: "F7EBDB", gray: "8A7F76", line: "E4DCD2", tint: "FBF6F0", white: "FFFFFF", yellow: "F2B63D",
};
const THEME = {
  name: "Dany Pizzas",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.greenDark, lt2: HEX.cream,
    accent1: HEX.red, accent2: HEX.green, accent3: HEX.redDark, accent4: HEX.gray,
    accent5: HEX.yellow, accent6: HEX.tint, hlink: HEX.greenDark, folHlink: HEX.gray,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Máximo Daniel Castro";
pres.company = "Universidad Nacional de Moquegua";
pres.title = "Dany Pizzas Web — Ingeniería de Software";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const INK = C.text1, WHITE = C.background1, CREAM = C.background2, RED = C.accent1,
  GREEN = C.accent2, RED_D = C.accent3, GRAY = C.accent4, TINT = C.accent6, GREEN_D = C.text2;

// ---------- layouts ----------
const FOOT = "Dany Pizzas Web · Ingeniería de Software · Comisión A";
pres.defineSlideMaster({
  title: "Contenido",
  background: { color: WHITE },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.32, w: 12.1, h: 0.34,
      fontFace: "Calibri", fontSize: 12, bold: true, color: RED, charSpacing: 2, margin: 0, valign: "top" },
      text: "SECCIÓN" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.66, w: 12.1, h: 0.72,
      fontFace: "Cambria", fontSize: 32, bold: true, color: INK, margin: 0, valign: "top", align: "left" }, text: "Título" } },
    { text: { text: FOOT, options: { x: 0.6, y: 7.02, w: 8, h: 0.3, fontSize: 10, color: GRAY, margin: 0, isTextBox: true } } },
  ],
  slideNumber: { x: 12.2, y: 7.02, w: 0.5, h: 0.3, fontSize: 10, color: GRAY, align: "right" },
});
pres.defineSlideMaster({
  title: "Seccion",
  background: { color: INK },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.9, y: 3.05, w: 11.5, h: 1.1,
      fontFace: "Cambria", fontSize: 44, bold: true, color: WHITE, margin: 0, valign: "top", align: "left" }, text: "Sección" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.9, y: 4.2, w: 11.5, h: 0.9,
      fontFace: "Calibri", fontSize: 18, color: CREAM, margin: 0, valign: "top", align: "left" }, text: "" } },
  ],
});
pres.defineSlideMaster({ title: "Oscuro", background: { color: INK }, objects: [] });

// ---------- helpers ----------
const iconCache = {};
async function icon(name, color, size = 256) {
  const key = name + color;
  if (iconCache[key]) return iconCache[key];
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return (iconCache[key] = "image/png;base64," + buf.toString("base64"));
}
let objN = 0;
const on = (s) => `${s}-${++objN}`;
const shadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.12 });

function content(kicker, title, section) {
  const s = pres.addSlide({ masterName: "Contenido", sectionTitle: section });
  s.addText(kicker.toUpperCase(), { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  return s;
}
function card(s, x, y, w, h, fill = TINT, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.12,
    line: opts.line ? { color: opts.line, width: 1, dashType: opts.dash || "solid" } : { type: "none" },
    shadow: opts.shadow ? shadow() : undefined, objectName: on("card") });
}
const nb = (v) => typeof v === "string" ? v.replace(/\b(RNF|RF|CU|OE)-(?=\d)/g, "$1\u2011") : v;
function txt(s, text, o) {
  text = Array.isArray(text) ? text.map((r) => Object.assign({}, r, { text: nb(r.text) })) : nb(text);
  s.addText(text, Object.assign({ isTextBox: true, fontFace: "Calibri", fontSize: 14, color: INK, margin: 0, valign: "top" }, o));
}
async function iconCircle(s, name, x, y, d = 0.6, bg = RED, fg = HEX.white) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" }, objectName: on("icono-fondo") });
  const pad = d * 0.24;
  s.addImage({ data: await icon(name, fg), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, objectName: on("icono") });
}
function pendiente(s, x, y, w, h, text, size = 14) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: "FFF4F2" }, rectRadius: 0.1,
    line: { color: HEX.red, width: 1.5, dashType: "dash" }, objectName: on("pendiente") });
  txt(s, [{ text: "PENDIENTE  ", options: { bold: true, color: RED_D, fontSize: size - 2 } },
    { text, options: { color: RED_D, fontSize: size } }], { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, valign: "middle" });
}
function pill(s, text, x, y, w, fill = RED, color = WHITE) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.34, fill: { color: fill }, rectRadius: 0.17, line: { type: "none" }, objectName: on("etiqueta") });
  txt(s, text, { x, y, w, h: 0.34, fontSize: 11, bold: true, color, align: "center", valign: "middle" });
}
const img = (rel) => P(rel);
const peso = (n) => "$" + Math.round(n).toLocaleString("es-AR");

// ---------------------------------------------------------------------------
// Estructura pensada para la rúbrica: exposición de 10 a 15 min (objetivo 13 min),
// diapositivas sintetizadas; el detalle queda en ANEXOS (después de "Gracias")
// para responder preguntas. Las notas del orador traen el guion y el tiempo.
// ---------------------------------------------------------------------------
const bul = (items, extra = {}) => items.map((t, k, a) => ({ text: t, options: Object.assign({ bullet: true, breakLine: k < a.length - 1 }, extra) }));
const notes = (s, t, guion) => s.addNotes(`⏱ ${t}\n\n${guion}`);

async function build() {
  const S1 = "Introducción", S2 = "I. Curriculum vitae", S3 = "II. Memoria descriptiva", S4 = "III. Trabajo principal", S5 = "Anexos";
  let s;

  if (MODO === "principal") {
  // ===== 1. Portada =====
  pres.addSection({ title: S1 });
  s = pres.addSlide({ masterName: "Oscuro", sectionTitle: S1 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 1.25, w: 4.4, h: 4.7, fill: { color: CREAM }, rectRadius: 0.25, line: { type: "none" }, objectName: "logo-fondo" });
  s.addImage({ path: img("site/assets/img/logo.png"), x: 1.05, y: 1.45, w: 3.9, h: 4.16, objectName: "logo" });
  txt(s, "INGENIERÍA DE SOFTWARE · COMISIÓN A", { x: 5.8, y: 1.25, w: 7, h: 0.35, fontSize: 13, bold: true, color: HEX.yellow, charSpacing: 2 });
  txt(s, "Dany Pizzas Web", { x: 5.8, y: 1.65, w: 7, h: 0.95, fontFace: "Cambria", fontSize: 48, bold: true, color: WHITE });
  txt(s, "Sistema web de pedidos por WhatsApp para un emprendimiento familiar de pizzas", { x: 5.8, y: 2.65, w: 6.8, h: 0.9, fontSize: 20, color: CREAM });
  txt(s, [
    { text: "Universidad Nacional de Moquegua", options: { bold: true, breakLine: true } },
    { text: "Facultad de Ingenierías", options: { breakLine: true } },
    { text: "Escuela Profesional de Ingeniería de Sistemas e Informática", options: { breakLine: true } },
    { text: "Carrera: Ingeniería de Sistemas · Asignatura: Ingeniería de Software" },
  ], { x: 5.8, y: 3.85, w: 7, h: 1.2, fontSize: 14, color: WHITE, paraSpaceAfter: 2 });
  txt(s, [
    { text: "Estudiante: ", options: { bold: true, color: HEX.yellow } }, { text: "Máximo Daniel Castro", options: { breakLine: true } },
    { text: "Docente: ", options: { bold: true, color: HEX.yellow } }, { text: "Dr. Alexander Morales Gonzales", options: { breakLine: true } },
    { text: "13 de octubre de 2026", options: { color: CREAM } },
  ], { x: 5.8, y: 5.25, w: 7, h: 1.0, fontSize: 14, color: WHITE, paraSpaceAfter: 2 });
  notes(s, "0:20 (acumulado 0:20)", "Buenos días. Mi nombre es Máximo Castro y les voy a presentar Dany Pizzas Web: un sistema de pedidos que desarrollé para un emprendimiento familiar real, que ya está publicado y funcionando.");

  // ===== 2. Esquema =====
  s = content("Introducción", "Esquema de la presentación", S1);
  const esquema = [
    ["I", "Curriculum vitae", "Quién presenta", "FaUserTie"],
    ["II", "Memoria descriptiva", "La empresa, su organización y su diagnóstico estratégico", "FaStore"],
    ["III", "Trabajo principal", "Problema, objetivos, plan, evaluación económica, diseño, desarrollo, resultados y conclusiones", "FaCogs"],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, y = 1.75, w = 3.8, h = 4.6;
    card(s, x, y, w, h, TINT);
    await iconCircle(s, esquema[i][3], x + 0.35, y + 0.4, 0.8, i === 2 ? RED : GREEN);
    txt(s, esquema[i][0], { x: x + w - 1.25, y: y + 0.3, w: 0.95, h: 0.9, fontFace: "Cambria", fontSize: 40, bold: true, color: i === 2 ? RED : GREEN, align: "right" });
    txt(s, esquema[i][1], { x: x + 0.35, y: y + 1.5, w: w - 0.7, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true });
    txt(s, esquema[i][2], { x: x + 0.35, y: y + 2.1, w: w - 0.7, h: 2.2, fontSize: 16 });
  }
  notes(s, "0:20 (acumulado 0:40)", "La exposición tiene tres partes: quién soy, cómo es la empresa y el trabajo principal, que va del problema hasta los resultados y conclusiones.");

  // ===== 3. CV =====
  pres.addSection({ title: S2 });
  s = content("I. Curriculum vitae", "Máximo Daniel Castro", S2);
  s.addShape(pres.shapes.OVAL, { x: 0.8, y: 1.8, w: 2.6, h: 2.6, fill: { color: CREAM }, line: { color: HEX.red, width: 1.5, dashType: "dash" }, objectName: "foto-cv" });
  txt(s, "Foto\n(opcional)", { x: 0.8, y: 2.75, w: 2.6, h: 0.8, fontSize: 14, color: GRAY, align: "center" });
  txt(s, [
    { text: "Estudiante de Ingeniería de Sistemas", options: { bold: true, fontSize: 18, breakLine: true } },
    { text: "Universidad Nacional de Moquegua · Escuela Profesional de Ingeniería de Sistemas e Informática", options: { color: GRAY } },
  ], { x: 3.9, y: 1.8, w: 8.6, h: 0.9, fontSize: 15 });
  card(s, 3.9, 2.85, 4.1, 2.35, TINT);
  txt(s, "Proyecto destacado", { x: 4.15, y: 3.0, w: 3.6, h: 0.35, fontSize: 14, bold: true, color: RED });
  txt(s, "Dany Pizzas Web (2026): sistema de pedidos publicado y en uso para un emprendimiento real.", { x: 4.15, y: 3.38, w: 3.6, h: 1.75, fontSize: 15 });
  card(s, 8.3, 2.85, 4.2, 2.35, TINT);
  txt(s, "Herramientas", { x: 8.55, y: 3.0, w: 3.8, h: 0.35, fontSize: 14, bold: true, color: RED });
  txt(s, bul(["HTML, CSS y JavaScript", "Git, GitHub y GitHub Actions", "Google Apps Script y Sheets", "Linux Ubuntu y VS Code"]), { x: 8.55, y: 3.38, w: 3.8, h: 1.75, fontSize: 14, paraSpaceAfter: 4 });
  pendiente(s, 0.8, 5.5, 11.7, 1.15, "Completar con tu CV: año que cursás, formación previa, experiencia laboral, cursos o certificaciones, idiomas y datos de contacto.");
  notes(s, "0:30 (acumulado 1:10)", "Breve: carrera, año y experiencia. Mencionar que este es un proyecto real, no un ejercicio. [Completar con el CV]");

  // ===== 4. La empresa =====
  pres.addSection({ title: S3 });
  s = content("II. Memoria descriptiva", "La empresa: Dany Pizzas", S3);
  s.addImage({ path: img("site/assets/img/napolitana.jpg"), x: 0.6, y: 1.6, w: 4.8, h: 3.0, objectName: "foto-pizza" });
  const mini = [["7", "variedades"], ["≈ 50", "pedidos/semana"], ["2024", "año de inicio"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 1.65;
    card(s, x, 4.8, 1.5, 1.95, TINT);
    txt(s, mini[i][0], { x: x + 0.1, y: 5.0, w: 1.3, h: 0.7, fontFace: "Cambria", fontSize: 26, bold: true, color: RED, align: "center" });
    txt(s, mini[i][1], { x: x + 0.1, y: 5.75, w: 1.3, h: 0.8, fontSize: 13, color: GRAY, align: "center" });
  }
  const datos = [
    ["FaMapMarkerAlt", "Ubicación", "Chilecito, La Rioja, Argentina"],
    ["FaMotorcycle", "Modalidad", "Solo envío a domicilio"],
    ["FaClock", "Horario", "Mar a dom, 21:00 a 00:30"],
    ["FaWhatsapp", "Canal de venta", "WhatsApp e Instagram"],
  ];
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 5.8 + col * 3.5, y = 1.6 + row * 1.15;
    await iconCircle(s, datos[i][0], x, y + 0.05, 0.55, i % 2 ? GREEN : RED);
    txt(s, datos[i][1], { x: x + 0.7, y, w: 2.7, h: 0.3, fontSize: 12, bold: true, color: GRAY });
    txt(s, datos[i][2], { x: x + 0.7, y: y + 0.32, w: 2.75, h: 0.6, fontSize: 15 });
  }
  card(s, 5.8, 4.05, 6.9, 2.7, CREAM);
  pill(s, "PROPUESTA · A APROBAR POR EL DUEÑO", 9.35, 4.2, 3.2, WHITE, RED_D);
  txt(s, [
    { text: "Misión. ", options: { bold: true, color: RED_D } },
    { text: "Llevar a las casas de Chilecito pizzas caseras y a buen precio, con un pedido simple y una atención cercana.", options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "Visión. ", options: { bold: true, color: GREEN_D } },
    { text: "Ser para 2028 la pizzería de envío de referencia en Chilecito, creciendo de forma ordenada y formalizándose." },
  ], { x: 6.1, y: 4.65, w: 6.35, h: 2.0, fontSize: 17 });
  notes(s, "0:40 (acumulado 1:50)", "Dany Pizzas es un emprendimiento familiar e informal de Chilecito, que empezó en 2024. Trabaja solo con envío, de noche, y vende unos 50 pedidos por semana. Todo entra por WhatsApp. Como no tenían misión ni visión, propuse estas dos.");

  // ===== 5. Organización e infraestructura =====
  s = content("II. Memoria descriptiva", "Organización e infraestructura", S3);
  const ln = (x1, y1, x2, y2) => s.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: HEX.gray, width: 1.5 }, objectName: on("linea") });
  ln(4.0, 2.85, 4.0, 3.25); ln(1.95, 3.25, 6.05, 3.25); ln(1.95, 3.25, 1.95, 3.6); ln(6.05, 3.25, 6.05, 3.6); ln(6.05, 5.0, 6.05, 5.45);
  const org = [
    [2.3, 1.65, 3.4, 1.2, "Cocinero (dueño)", "Elabora y fija carta y precios", RED, WHITE, false],
    [0.6, 3.6, 2.7, 1.4, "Ayudante", "Masas, horneado y empaque", GREEN, WHITE, false],
    [4.5, 3.6, 3.1, 1.4, "Atención al cliente", "Atiende WhatsApp, cobra y coordina", GREEN, WHITE, false],
    [4.5, 5.45, 3.1, 1.3, "Repartidor (externo)", "Cobra el envío al cliente", TINT, INK, true],
  ];
  for (const [x, y, w, h, t1, t2, fill, color, dashed] of org) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.12, line: dashed ? { color: HEX.gray, width: 1.25, dashType: "dash" } : { type: "none" }, objectName: on("org") });
    txt(s, t1, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.4, fontSize: 16, bold: true, color });
    txt(s, t2, { x: x + 0.2, y: y + 0.6, w: w - 0.4, h: h - 0.7, fontSize: 14, color });
  }
  card(s, 8.1, 1.65, 4.6, 5.1, TINT);
  txt(s, "Infraestructura", { x: 8.4, y: 1.85, w: 4, h: 0.45, fontFace: "Cambria", fontSize: 20, bold: true });
  const inf = [["FaHome", "Cocina de la vivienda familiar"], ["FaFire", "Horno pizzero de 6 moldes: una noche fuerte son 4 tandas"], ["FaMobileAlt", "Un solo celular recibe todos los pedidos"], ["FaMoneyBillWave", "Tecnología nueva: $0 (servicios gratuitos)"]];
  for (let i = 0; i < 4; i++) {
    const y = 2.5 + i * 1.03;
    await iconCircle(s, inf[i][0], 8.4, y, 0.55, i === 2 ? RED : GREEN);
    txt(s, inf[i][1], { x: 9.15, y: y - 0.05, w: 3.35, h: 0.75, fontSize: 15, valign: "middle" });
  }
  notes(s, "0:40 (acumulado 2:30)", "Son tres personas: el cocinero, que es el dueño; un ayudante; y una persona que atiende al cliente. El reparto es externo. Cocinan en la casa con un horno de 6 moldes. Retengan este dato: un solo celular y una sola persona reciben todos los pedidos.");

  // ===== 6. FODA y posición =====
  s = content("II. Memoria descriptiva", "FODA y posición estratégica", S3);
  const foda = [
    ["F", "Fortalezas", ["Producto propio, 7 variedades", "Clientes que ya piden por WhatsApp", "Cobro digital incorporado"], GREEN],
    ["O", "Oportunidades", ["Uso masivo de celular y WhatsApp", "Herramientas web gratuitas", "Difusión por Instagram y QR"], GREEN_D],
    ["D", "Debilidades", ["Pedidos informales, sin registro", "Sin carta digital", "Una sola persona atiende"], RED],
    ["A", "Amenazas", ["Competencia y apps de delivery", "Inflación de insumos", "Dependencia de terceros"], RED_D],
  ];
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 4.05, y = 1.6 + row * 2.62, w = 3.85, h = 2.45;
    card(s, x, y, w, h, TINT);
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.2, w: 0.55, h: 0.55, fill: { color: foda[i][3] }, line: { type: "none" }, objectName: on("letra") });
    txt(s, foda[i][0], { x: x + 0.25, y: y + 0.2, w: 0.55, h: 0.55, fontFace: "Cambria", fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle" });
    txt(s, foda[i][1], { x: x + 0.95, y: y + 0.22, w: 2.7, h: 0.5, fontFace: "Cambria", fontSize: 19, bold: true });
    txt(s, bul(foda[i][2]), { x: x + 0.3, y: y + 0.9, w: w - 0.5, h: h - 1.0, fontSize: 14, paraSpaceAfter: 4 });
  }
  card(s, 8.95, 1.6, 3.75, 5.15, INK);
  txt(s, "Matriz interna-externa", { x: 9.2, y: 1.8, w: 3.3, h: 0.4, fontSize: 14, bold: true, color: HEX.yellow });
  txt(s, [{ text: "EFI ", options: { fontSize: 16, color: CREAM } }, { text: "2,45", options: { fontFace: "Cambria", fontSize: 36, bold: true, color: WHITE } }], { x: 9.2, y: 2.25, w: 3.3, h: 0.75 });
  txt(s, [{ text: "EFE ", options: { fontSize: 16, color: CREAM } }, { text: "2,32", options: { fontFace: "Cambria", fontSize: 36, bold: true, color: WHITE } }], { x: 9.2, y: 3.0, w: 3.3, h: 0.75 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.2, y: 3.95, w: 3.25, h: 0.75, fill: { color: RED }, rectRadius: 0.1, line: { type: "none" }, objectName: "cuadrante" });
  txt(s, "Cuadrante V: conservar y mantener", { x: 9.3, y: 3.95, w: 3.05, h: 0.75, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle" });
  txt(s, "Estrategia: mejorar cómo se vende lo que ya existe. El sistema web hace eso, sin cambiar producto ni canal.", { x: 9.2, y: 4.9, w: 3.3, h: 1.7, fontSize: 14, color: CREAM });
  notes(s, "0:50 (acumulado 3:20)", "El FODA, validado por el negocio, muestra un producto fuerte y clientes que ya usan WhatsApp, pero pedidos informales y sin registro. Con EFI 2,45 y EFE 2,32 cae en el cuadrante V: conservar y mantener. Es decir, no hace falta cambiar el negocio, sino ordenar cómo vende. Ese es el proyecto. (Detalle de estrategias cruzadas: anexo A1.)");

  // ===== 7. El problema (dramatizado) =====
  pres.addSection({ title: S4 });
  s = content("III. Trabajo principal · Problema", "Sábado, 22:00: once pedidos y una sola persona", S4);
  // celular con chat
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 1.55, w: 3.7, h: 5.3, fill: { color: INK }, rectRadius: 0.3, line: { type: "none" }, objectName: "celular" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.95, y: 1.75, w: 3.4, h: 4.95, fill: { color: "ECE5DD" }, rectRadius: 0.18, line: { type: "none" }, objectName: "pantalla" });
  const chat = [
    ["c", "Hola! qué gustos tienen?"], ["n", "Muzza, fugazzeta, napo, especial…"], ["c", "cuánto sale la napo?"],
    ["c", "dame una muzza y media fuga"], ["n", "¿Dirección?"], ["c", "por el hospital 😅"], ["n", "Son $14.000… ¿o eran $13.500?"],
  ];
  let cy = 1.9;
  for (const [who, t] of chat) {
    const mine = who === "n", w = 2.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: mine ? 1.65 : 1.1, y: cy, w, h: 0.5, fill: { color: mine ? "D9FDD3" : HEX.white }, rectRadius: 0.08, line: { type: "none" }, objectName: on("mensaje") });
    txt(s, t, { x: (mine ? 1.65 : 1.1) + 0.1, y: cy, w: w - 0.2, h: 0.5, fontSize: 12, valign: "middle" });
    cy += 0.64;
  }
  txt(s, "… y 10 chats más esperando", { x: 0.95, y: 6.35, w: 3.4, h: 0.3, fontSize: 12, bold: true, color: RED_D, align: "center" });
  const dolor = [
    ["≈ 4 h", "por semana respondiendo el chat", "50 pedidos × 2 a 10 minutos cada uno", GREEN_D],
    ["5", "pedidos con error por semana", "gusto, dirección o total equivocados (1 de cada 10)", RED],
    ["$197.600", "de ganancia que se pierde por mes", "≈ 1 pedido perdido por noche por no contestar a tiempo", RED_D],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.6 + i * 1.55;
    card(s, 5.0, y, 7.7, 1.38, i === 2 ? CREAM : TINT);
    txt(s, dolor[i][0], { x: 5.25, y, w: 2.7, h: 1.38, fontFace: "Cambria", fontSize: i === 2 ? 30 : 36, bold: true, color: dolor[i][3], valign: "middle" });
    txt(s, [{ text: dolor[i][1], options: { bold: true, fontSize: 17, breakLine: true } }, { text: dolor[i][2], options: { fontSize: 13, color: GRAY } }],
      { x: 8.05, y, w: 4.5, h: 1.38, valign: "middle" });
  }
  txt(s, "Datos del propio negocio. Pérdida: 6 pedidos/semana × 2 pizzas × $3.800 de ganancia × 4,33 semanas.", { x: 5.0, y: 6.35, w: 7.7, h: 0.45, fontSize: 11, color: GRAY });
  notes(s, "1:10 (acumulado 4:30)", "Imaginen un sábado a las diez de la noche. Entran once pedidos. Una sola persona tiene que contestar qué gustos hay, cuánto sale cada uno, pedir la dirección, sumar a mano… [pausa] mientras tanto, otros diez clientes esperan. Algunos se cansan y le piden a otro. [pausa] Según el propio negocio: se pierden unas cuatro horas por semana en el chat, uno de cada diez pedidos sale con error, y se pierde más o menos un pedido por noche. Eso son casi 200 mil pesos de ganancia por mes que se van. Ese es el problema que vine a resolver.");

  // ===== 8. Ishikawa (nativo, legible) =====
  s = content("III. Trabajo principal · Problema", "Causas del problema (diagrama de Ishikawa)", S4);
  const cats = [
    ["MÉTODO", ["Pedido en mensajes sueltos", "Sin formato de recibo", "Total sumado a mano"], 3.0, true],
    ["MANO DE OBRA", ["Una persona atiende todo", "Chat compite con la cocina", "Saber técnico en uno solo"], 5.9, true],
    ["MEDICIÓN", ["No se cuentan pedidos", "No se miden errores", "Sin datos de ventas"], 8.8, true],
    ["TECNOLOGÍA", ["Sin carta digital", "Un solo celular", "Sin registro digital"], 3.0, false],
    ["INFORMACIÓN", ["Carta reenviada en imagen", "Precios desactualizados", "Faltan datos de entrega"], 5.9, false],
    ["ENTORNO", ["Clientes esperan rapidez", "Competencia y apps", "Picos de fin de semana"], 8.8, false],
  ];
  const SP = 4.2;
  s.addShape(pres.shapes.LINE, { x: 0.6, y: SP, w: 9.85, h: 0, line: { color: HEX.ink, width: 3, endArrowType: "triangle" }, objectName: "espina" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.5, y: 3.3, w: 2.2, h: 1.8, fill: { color: RED }, rectRadius: 0.12, line: { type: "none" }, objectName: "efecto" });
  txt(s, "Pedidos lentos, incompletos, con errores y sin registro", { x: 10.62, y: 3.3, w: 1.96, h: 1.8, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle" });
  for (const [name, causes, cx, top] of cats) {
    const y0 = top ? 2.0 : 6.4;
    s.addShape(pres.shapes.LINE, { x: cx, y: top ? y0 : SP, w: 1.2, h: top ? SP - y0 : y0 - SP, flipV: !top, line: { color: HEX.greenDark, width: 2 }, objectName: on("hueso") });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - 1.0, y: top ? 1.52 : 6.42, w: 2.0, h: 0.42, fill: { color: GREEN_D }, rectRadius: 0.08, line: { type: "none" }, objectName: on("categoria") });
    txt(s, name, { x: cx - 1.0, y: top ? 1.52 : 6.42, w: 2.0, h: 0.42, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle" });
    const levels = top ? [2.5, 3.1, 3.7] : [4.7, 5.3, 5.9];
    levels.forEach((ly, k) => {
      const bx = top ? cx + 1.2 * (ly - 2.0) / 2.2 : cx + 1.2 * (6.4 - ly) / 2.2;
      txt(s, causes[k], { x: bx - 2.65, y: ly - 0.2, w: 2.55, h: 0.4, fontSize: 14, align: "right", valign: "middle" });
    });
  }
  notes(s, "0:45 (acumulado 5:15)", "¿Por qué pasa esto? Agrupé 18 causas en seis categorías. Las más importantes: el pedido se dicta en mensajes sueltos y se suma a mano (método), una sola persona atiende todo (mano de obra) y no hay carta digital ni registro (tecnología). Fíjense que casi todas se pueden atacar con un sistema simple.");

  // ===== 9. Objetivos =====
  s = content("III. Trabajo principal · Objetivos", "Objetivos del proyecto", S4);
  card(s, 0.6, 1.6, 12.1, 1.55, INK);
  txt(s, [{ text: "Objetivo general. ", options: { bold: true, color: HEX.yellow } }, { text: "Implementar un sistema web en el que el cliente arme su pedido, se genere un recibo numerado que llegue por WhatsApp y cada pedido quede registrado, para reducir demoras, errores y pedidos perdidos." }],
    { x: 0.9, y: 1.6, w: 11.5, h: 1.55, fontSize: 17, color: WHITE, valign: "middle" });
  const oe = [
    ["OE1", "Ordenar la toma de pedidos", "Ataca: método, información y mano de obra", "FaWhatsapp", RED],
    ["OE2", "Registrar los pedidos y facilitar la administración", "Ataca: medición y tecnología", "FaTable", GREEN],
    ["OE3", "Operar de forma segura, confiable y sin costo", "Ataca: entorno y riesgo técnico", "FaShieldAlt", GREEN_D],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, y = 3.45, w = 3.8, h = 3.3;
    card(s, x, y, w, h, TINT);
    await iconCircle(s, oe[i][3], x + 0.3, y + 0.3, 0.65, oe[i][4]);
    txt(s, oe[i][0], { x: x + 1.1, y: y + 0.35, w: 2.4, h: 0.55, fontFace: "Cambria", fontSize: 26, bold: true, color: oe[i][4] });
    txt(s, oe[i][1], { x: x + 0.3, y: y + 1.15, w: w - 0.6, h: 1.1, fontSize: 18, bold: true });
    txt(s, oe[i][2], { x: x + 0.3, y: y + 2.45, w: w - 0.6, h: 0.65, fontSize: 13, color: GRAY });
  }
  notes(s, "0:45 (acumulado 6:00)", "De esas causas salen los objetivos. El general: que el cliente arme su pedido, que llegue un recibo numerado por WhatsApp y que todo quede registrado. Y tres específicos: ordenar la toma de pedidos, registrar y administrar, y que funcione seguro, confiable y sin costo. Cada uno ataca un grupo de causas, y al final les muestro el resultado de cada uno.");

  // ===== 10. Alcance y plan =====
  s = content("III. Trabajo principal · Alcance y plan", "Alcance y plan de ejecución", S4);
  card(s, 0.6, 1.6, 3.9, 2.55, TINT);
  txt(s, "Incluye", { x: 0.85, y: 1.72, w: 3.4, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true, color: GREEN_D });
  txt(s, bul(["Carta, carrito y mitades", "Recibo numerado a WhatsApp", "Planilla de pedidos y precios", "Protección y 44 pruebas"]), { x: 0.85, y: 2.15, w: 3.5, h: 1.9, fontSize: 14, paraSpaceAfter: 3 });
  card(s, 0.6, 4.3, 3.9, 2.45, CREAM);
  txt(s, "No incluye (v2)", { x: 0.85, y: 4.42, w: 3.4, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true, color: RED_D });
  txt(s, bul(["Pago en línea", "App móvil nativa", "Seguimiento en tiempo real", "Más de un local"]), { x: 0.85, y: 4.85, w: 3.5, h: 1.8, fontSize: 14, paraSpaceAfter: 3 });
  const gl = 7.35, gw = 1.07, gt = 1.6, rh = 0.55, gx0 = 4.8;
  ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "06–13/10"].forEach((c, i) => txt(s, c, { x: gl + i * gw, y: gt, w: gw, h: 0.35, fontSize: 12, bold: true, color: GRAY, align: "center" }));
  const fases = [
    ["Análisis y diseño", 0, 1.3, GRAY], ["Inc. 1: carta", 1, 0.8, RED], ["Inc. 2: carrito", 1.7, 0.8, RED],
    ["Inc. 3: recibo y WhatsApp", 2.4, 0.8, RED], ["Inc. 4: backend y planilla", 3, 0.95, RED],
    ["Pruebas y publicación", 3.5, 1.1, GREEN], ["Evaluación y exposición", 4.1, 0.9, GREEN_D],
  ];
  fases.forEach((f, i) => {
    const y = gt + 0.45 + i * rh;
    if (i % 2 === 0) s.addShape(pres.shapes.RECTANGLE, { x: gx0, y, w: gl - gx0 + gw * 5, h: rh, fill: { color: TINT }, line: { type: "none" }, objectName: on("fila") });
    txt(s, f[0], { x: gx0 + 0.1, y, w: 2.45, h: rh, fontSize: 14, valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gl + f[1] * gw + 0.03, y: y + 0.13, w: f[2] * gw - 0.06, h: rh - 0.26, fill: { color: f[3] }, rectRadius: 0.07, line: { type: "none" }, objectName: on("barra") });
  });
  [4, 5].forEach((pos) => s.addShape(pres.shapes.LINE, { x: gl + pos * gw, y: gt + 0.4, w: 0, h: rh * 7 + 0.1, line: { color: HEX.ink, width: 1.25, dashType: "dash" }, objectName: on("hito") }));
  txt(s, "Publicado 06/10 ▲", { x: gl + 4 * gw - 1.9, y: gt + 0.55 + 7 * rh, w: 1.85, h: 0.3, fontSize: 12, bold: true, align: "right" });
  txt(s, "Expo 13/10 ▲", { x: gl + 5 * gw - 1.3, y: gt + 0.55 + 7 * rh, w: 1.25, h: 0.3, fontSize: 12, bold: true, align: "right" });
  pendiente(s, gx0, 6.3, 7.9, 0.45, "Fechas reales de las semanas 1 a 4.", 12);
  notes(s, "0:40 (acumulado 6:40)", "El alcance es deliberadamente chico: lo mínimo que resuelve el problema. El pago en línea o una app quedan para una versión 2. Trabajé en cuatro incrementos semanales con un tablero Kanban, mostrando cada avance a la familia. El sitio se publicó el 6 de octubre.");

  // ===== 11. Presupuesto =====
  s = content("III. Trabajo principal · Presupuesto", "Presupuesto y financiamiento", S4);
  const fasesP = [["Análisis", 8], ["Diseño", 8], ["Desarrollo", 18], ["Pruebas", 8], ["Despliegue", 6]];
  const VH = 4890;
  s.addChart(pres.charts.BAR, [{ name: "Costo", labels: fasesP.map((f) => f[0]), values: fasesP.map((f) => f[1] * VH) }], {
    x: 0.6, y: 1.6, w: 7.2, h: 4.8, barDir: "bar", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0',
    dataLabelFontSize: 14, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt", chartColors: [HEX.red], showLegend: false,
    catAxisLabelFontSize: 14, catAxisLabelColor: HEX.ink, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisOrientation: "maxMin", barGapWidthPct: 55,
    showTitle: true, title: "Costo por macrofase (horas × $4.890)", titleFontSize: 14, titleColor: HEX.ink, titleFontFace: "+mn-lt", valAxisMaxVal: 115000,
  });
  card(s, 8.2, 1.6, 4.5, 2.4, INK);
  txt(s, "Inversión total", { x: 8.5, y: 1.8, w: 3.9, h: 0.35, fontSize: 14, color: CREAM });
  txt(s, "$234.720", { x: 8.5, y: 2.15, w: 3.9, h: 0.8, fontFace: "Cambria", fontSize: 40, bold: true, color: WHITE });
  txt(s, "48 h de desarrollo valorizadas", { x: 8.5, y: 3.05, w: 3.9, h: 0.6, fontSize: 14, color: CREAM });
  card(s, 8.2, 4.2, 4.5, 2.55, TINT);
  txt(s, "Financiamiento", { x: 8.5, y: 4.35, w: 3.9, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true });
  txt(s, bul(["Desarrollo: aporte propio", "Operación: $0 por mes", "Dominio propio: opcional"]), { x: 8.5, y: 4.85, w: 3.95, h: 1.8, fontSize: 15, paraSpaceAfter: 6 });
  notes(s, "0:30 (acumulado 7:10)", "La inversión son 48 horas de desarrollo, valorizadas a 2,5 veces la hora del salario mínimo: 234.720 pesos. El negocio no pone dinero, y el funcionamiento mensual cuesta cero porque uso los niveles gratuitos de GitHub y Google. (Reparto por fase estimado.)");

  // ===== 12. Evaluación económica: escenarios =====
  s = content("III. Trabajo principal · Evaluación económico-financiera", "¿Conviene? Evaluación a 12 meses", S4);
  const ben = [["FaMoneyBillWave", "Pedidos perdidos recuperados", "$59.280", RED], ["FaCheckCircle", "Errores evitados", "$17.290", GREEN_D], ["FaClock", "Tiempo de atención ahorrado", "$14.127", GREEN]];
  txt(s, "Beneficio mensual (base)", { x: 0.6, y: 1.6, w: 5, h: 0.4, fontSize: 15, bold: true, color: GRAY });
  for (let i = 0; i < 3; i++) {
    const y = 2.1 + i * 0.95;
    await iconCircle(s, ben[i][0], 0.6, y, 0.6, ben[i][3]);
    txt(s, ben[i][1], { x: 1.35, y, w: 3.1, h: 0.6, fontSize: 15, valign: "middle" });
    txt(s, ben[i][2], { x: 4.3, y, w: 1.4, h: 0.6, fontSize: 18, bold: true, color: RED_D, align: "right", valign: "middle" });
  }
  card(s, 0.6, 5.0, 5.1, 1.75, CREAM);
  txt(s, [{ text: "$90.697 por mes", options: { bold: true, fontSize: 20, color: RED_D, breakLine: true } }, { text: "Tasa: plazo fijo BNA (TNA 17,5 %). Adopción gradual: 50 %, 75 % y 100 %.", options: { fontSize: 13, color: INK } }],
    { x: 0.85, y: 5.0, w: 4.7, h: 1.75, valign: "middle" });
  const hdr = (t, base) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: base ? HEX.red : HEX.ink }, align: "center" } });
  const rowE = (lab, a, b, c) => [{ text: lab, options: { bold: true } }, { text: a, options: { align: "right" } }, { text: b, options: { align: "right", bold: true, fill: { color: HEX.cream } } }, { text: c, options: { align: "right" } }];
  s.addTable([
    [hdr("Indicador"), hdr("Pesimista"), hdr("Base", true), hdr("Optimista")],
    rowE("Inversión", "$396.090", "$234.720", "$150.612"),
    rowE("VAN", "−$335.891", "$583.451", "$2.038.551"),
    rowE("TIR mensual", "−18,4 %", "26,8 %", "97,5 %"),
    rowE("ROI", "−50 %", "190 %", "1.067 %"),
    rowE("B/C", "0,47", "2,71", "10,86"),
    rowE("Recupero", "no recupera", "3,9 meses", "1,3 meses"),
  ], { x: 6.1, y: 1.6, w: 6.6, colW: [1.7, 1.6, 1.65, 1.65], rowH: 0.6, fontSize: 16, fontFace: "Calibri", color: HEX.ink, border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
  txt(s, "Pesimista: todas las variables empeoran a la vez. ¿Qué tan probable es? → Monte Carlo.", { x: 6.1, y: 6.0, w: 6.6, h: 0.7, fontSize: 13, color: GRAY });
  notes(s, "0:50 (acumulado 8:00)", "¿Conviene económicamente? Valoricé tres beneficios con los datos del negocio. El más grande no es ahorrar minutos sino recuperar pedidos perdidos. En el escenario base el VAN es de 583 mil pesos, la TIR de casi 27 % mensual, cada peso devuelve 2,71 y la inversión se recupera en unos 4 meses. El pesimista da negativo porque supone que todo sale mal al mismo tiempo. ¿Qué tan probable es eso? Para eso hice la simulación. (Supuestos: anexo A2; recupero por escenario: A3.)");

  // ===== 13. Monte Carlo =====
  s = content("III. Trabajo principal · Evaluación económico-financiera", "Monte Carlo: 97,8 % de probabilidad de VAN positivo", S4);
  s.addImage({ path: img("docs/analisis/economia/montecarlo_van.png"), x: 0.6, y: 1.6, w: 8.0, h: 4.16, objectName: "grafico-montecarlo" });
  txt(s, "10.000 iteraciones · 17 variables con distribución triangular", { x: 0.6, y: 5.85, w: 8.0, h: 0.35, fontSize: 13, color: GRAY });
  const mc = [["97,8 %", "de los casos con VAN > 0"], ["4,3 meses", "recupero mediano"]];
  for (let i = 0; i < 2; i++) {
    card(s, 8.95, 1.6 + i * 1.3, 3.75, 1.15, i === 0 ? INK : TINT);
    txt(s, mc[i][0], { x: 9.2, y: 1.63 + i * 1.3, w: 3.3, h: 0.62, fontFace: "Cambria", fontSize: 28, bold: true, color: i === 0 ? WHITE : RED });
    txt(s, mc[i][1], { x: 9.2, y: 2.25 + i * 1.3, w: 3.3, h: 0.4, fontSize: 14, color: i === 0 ? CREAM : GRAY });
  }
  card(s, 8.95, 4.25, 3.75, 2.5, CREAM);
  txt(s, [{ text: "Punto de equilibrio", options: { bold: true, color: RED_D, breakLine: true } }, { text: "Alcanza con recuperar un pedido perdido cada 3 o 4 meses para que el VAN sea positivo." }],
    { x: 9.2, y: 4.4, w: 3.3, h: 2.2, fontSize: 16 });
  notes(s, "0:50 (acumulado 8:50)", "Simulé diez mil combinaciones de las 17 variables. En el 97,8 % de los casos el VAN es positivo, y la inversión se recupera en una mediana de 4,3 meses. Lo que más pesa es cuántos pedidos perdidos recupera la web: con recuperar uno cada tres o cuatro meses ya conviene. El riesgo real no es técnico, es que los clientes usen la web; por eso lo vamos a medir. (Sensibilidad completa: anexo A4.)");

  // ===== 14. Arquitectura =====
  s = content("III. Trabajo principal · Diseño conceptual", "Diseño: sitio estático, backend mínimo y WhatsApp", S4);
  const nodo = (x, y, w, h, t1, t2, fill, color) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.12, line: { type: "none" }, shadow: shadow(), objectName: on("nodo") });
    txt(s, t1, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.4, fontSize: 16, bold: true, color });
    if (t2) txt(s, t2, { x: x + 0.2, y: y + 0.58, w: w - 0.4, h: h - 0.68, fontSize: 13, color });
  };
  const flecha = (x, y, w, h) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: HEX.gray, width: 1.75, endArrowType: "triangle" }, objectName: on("flecha") });
  const lab = (t, x, y, w) => txt(s, t, { x, y, w, h: 0.35, fontSize: 12, color: GRAY, align: "center" });
  nodo(0.6, 2.9, 2.4, 1.5, "Cliente", "Celular o PC", RED, WHITE);
  nodo(4.0, 1.75, 3.6, 3.55, "Sitio web (GitHub Pages)", "", GREEN, WHITE);
  [["Interfaz", "pantallas y carrito"], ["Lógica", "precios, horario, recibo"], ["Datos", "configuración y carta"]].forEach((c, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.25, y: 2.35 + i * 1.0, w: 3.1, h: 0.85, fill: { color: WHITE }, rectRadius: 0.08, line: { type: "none" }, objectName: on("capa") });
    txt(s, [{ text: c[0], options: { bold: true, breakLine: true } }, { text: c[1], options: { fontSize: 12, color: GRAY } }], { x: 4.4, y: 2.38 + i * 1.0, w: 2.85, h: 0.8, fontSize: 14, valign: "middle" });
  });
  nodo(8.75, 1.75, 3.95, 1.45, "Google Apps Script", "N.º de pedido, total recalculado, protección", GREEN_D, WHITE);
  nodo(8.75, 4.1, 3.95, 1.2, "Google Sheets", "Carta y pedidos del mes", CREAM, INK);
  nodo(4.0, 6.0, 3.6, 0.8, "WhatsApp del negocio", "", INK, WHITE);
  nodo(0.6, 6.0, 2.4, 0.8, "Mercado Pago", "", CREAM, INK);
  flecha(3.0, 3.65, 1.0, 0); lab("HTTPS", 3.0, 3.25, 1.0);
  flecha(7.6, 2.45, 1.15, 0); lab("GET / POST", 7.55, 2.05, 1.25);
  flecha(10.7, 3.2, 0, 0.9);
  flecha(5.8, 5.3, 0, 0.7); txt(s, "recibo listo (wa.me)", { x: 5.95, y: 5.45, w: 2.4, h: 0.35, fontSize: 12, color: GRAY });
  flecha(1.8, 4.4, 0, 1.6); txt(s, "paga aparte", { x: 1.9, y: 4.95, w: 1.6, h: 0.35, fontSize: 12, color: GRAY });
  card(s, 8.75, 5.55, 3.95, 1.25, TINT);
  txt(s, "Si Google falla, el pedido sale igual por WhatsApp.", { x: 8.95, y: 5.55, w: 3.6, h: 1.25, fontSize: 14, bold: true, color: RED_D, valign: "middle" });
  notes(s, "0:45 (acumulado 9:35)", "La arquitectura es cliente-servidor mínima en capas. El sitio es estático, en GitHub Pages: interfaz, lógica y datos separados. Un backend en Google Apps Script asigna el número de pedido, recalcula el total para que nadie lo manipule y lo guarda en una planilla. El pedido sale por WhatsApp, el canal que el negocio ya usa. Y si Google falla, el pedido sale igual. (Casos de uso y secuencia: anexos A8 y A9.)");

  // ===== 15. Requisitos (resumen) =====
  s = content("III. Trabajo principal · Requisitos", "Requisitos: 20 funcionales y 15 no funcionales", S4);
  const grupos = [
    ["Carta y horario", "RF‑01, RF‑02"], ["Armar el pedido", "RF‑03 a RF‑06"], ["Datos y validación", "RF‑07 a RF‑10"],
    ["Recibo, WhatsApp y pago", "RF‑11 a RF‑13"], ["Planilla y administración", "RF‑14 a RF‑17, RF‑19"], ["Protección y horario", "RF‑18, RF‑20"],
  ];
  txt(s, "Funcionales (MoSCoW)", { x: 0.6, y: 1.6, w: 6, h: 0.4, fontSize: 16, bold: true, color: RED });
  grupos.forEach((g, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 3.6, y = 2.1 + row * 1.15;
    card(s, x, y, 3.4, 1.0, TINT);
    txt(s, [{ text: g[0], options: { bold: true, breakLine: true } }, { text: g[1], options: { fontSize: 13, color: GRAY } }], { x: x + 0.2, y, w: 3.0, h: 1.0, fontSize: 15, valign: "middle" });
  });
  txt(s, "18 de 20 verificados con pruebas · 2 se validan con el uso real", { x: 0.6, y: 5.6, w: 7.0, h: 0.4, fontSize: 14, bold: true, color: GREEN_D });
  txt(s, "No funcionales (ISO/IEC 25010)", { x: 8.1, y: 1.6, w: 4.6, h: 0.4, fontSize: 16, bold: true, color: RED });
  const iso = ["Usabilidad", "Compatibilidad", "Seguridad", "Fiabilidad", "Eficiencia", "Mantenibilidad", "Accesibilidad", "Costo y disponibilidad"];
  iso.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    pill(s, t, 8.1 + col * 2.35, 2.15 + row * 0.6, 2.2, i < 4 ? RED : GREEN, WHITE);
  });
  card(s, 8.1, 4.75, 4.6, 2.0, CREAM);
  txt(s, "Ejemplos: pedido sin ayuda en ≤ 2 minutos · 100 % HTTPS · $0 por mes · 44 pruebas antes de publicar", { x: 8.3, y: 4.75, w: 4.2, h: 2.0, fontSize: 16, valign: "middle" });
  txt(s, "Listado completo y trazabilidad: anexos A5 a A7.", { x: 0.6, y: 6.15, w: 7.0, h: 0.35, fontSize: 12, color: GRAY });
  notes(s, "0:40 (acumulado 10:15)", "Especifiqué 20 requisitos funcionales priorizados con MoSCoW y 15 no funcionales según ISO 25010, cada uno con una métrica. Por ejemplo: que un cliente nuevo pida sin ayuda en menos de dos minutos, o que funcione con costo cero. 18 de los 20 funcionales ya están verificados con pruebas automáticas.");

  // ===== 16. Desarrollo y producto =====
  s = content("III. Trabajo principal · Desarrollo e integración", "Desarrollo: cada cambio se prueba antes de publicarse", S4);
  const pipe = [["FaCode", "Código", "VS Code + Git"], ["FaGithub", "GitHub", "push a main"], ["FaCheckCircle", "44 pruebas", "automáticas"], ["FaGlobe", "Publicación", "GitHub Pages"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 1.95;
    await iconCircle(s, pipe[i][0], x + 0.5, 1.7, 0.75, i === 2 ? RED : GREEN);
    txt(s, pipe[i][1], { x, y: 2.55, w: 1.75, h: 0.35, fontSize: 15, bold: true, align: "center" });
    txt(s, pipe[i][2], { x, y: 2.9, w: 1.75, h: 0.3, fontSize: 12, color: GRAY, align: "center" });
    if (i < 3) s.addImage({ data: await icon("FaChevronRight", HEX.gray), x: x + 1.72, y: 1.9, w: 0.22, h: 0.35, objectName: on("flecha") });
  }
  card(s, 0.6, 3.5, 7.6, 1.15, CREAM);
  txt(s, "Si una prueba falla, no se publica. Así el recibo y el total nunca salen mal.", { x: 0.85, y: 3.5, w: 7.2, h: 1.15, fontSize: 16, bold: true, color: RED_D, valign: "middle" });
  const nums = [["44", "pruebas"], ["0", "dependencias"], ["$0", "por mes"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 2.6;
    card(s, x, 4.9, 2.4, 1.85, TINT);
    txt(s, nums[i][0], { x: x + 0.2, y: 5.05, w: 2.0, h: 0.9, fontFace: "Cambria", fontSize: 40, bold: true, color: RED });
    txt(s, nums[i][1], { x: x + 0.2, y: 5.95, w: 2.0, h: 0.45, fontSize: 15, color: GRAY });
  }
  for (let i = 0; i < 2; i++) {
    const src = ["docs/capturas/01-movil-inicio.png", "docs/capturas/03-movil-confirmacion.png"][i];
    const x = 8.55 + i * 2.17, h = 4.3, w = h * (390 / 844);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.07, y: 1.58, w: w + 0.14, h: h + 0.14, fill: { color: INK }, rectRadius: 0.14, line: { type: "none" }, objectName: on("marco-celular") });
    s.addImage({ path: img(src), x, y: 1.65, w, h, sizing: { type: "cover", w, h }, objectName: on("captura") });
  }
  txt(s, "Carta · Confirmación con N.º de pedido", { x: 8.5, y: 6.15, w: 4.2, h: 0.35, fontSize: 12, color: GRAY, align: "center" });
  notes(s, "0:45 (acumulado 11:00)", "Para desarrollarlo usé Git y GitHub con integración continua: cada vez que subo un cambio corren 44 pruebas automáticas, y si una falla no se publica. Así me aseguro de que el total y el recibo nunca salgan mal. Acá ven la carta en el celular y la confirmación con el número de pedido. [Opcional: mostrar el sitio en vivo con el QR del final; si es de día, usar ?ahora=2026-10-13T22:00 para que figure abierto.]");

  // ===== 17. Resultados =====
  s = content("III. Trabajo principal · Resultados", "Resultados por objetivo: antes y ahora", S4);
  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.ink } } });
  const R = (oe, c, ind, antes, ahora) => [
    { text: oe, options: { bold: true, color: WHITE, fill: { color: c }, align: "center" } },
    { text: ind, options: { bold: true } }, { text: antes, options: { color: HEX.gray } }, { text: ahora, options: { bold: true, color: HEX.greenDark } }];
  s.addTable([
    [H(""), H("Indicador"), H("Antes"), H("Ahora (07/10/2026)")],
    R("OE1", HEX.red, "Carta", "Imagen reenviada por chat", "Sitio publicado con fotos y precios"),
    R("OE1", HEX.red, "Datos del pedido", "Incompletos (1 de cada 10 con error)", "100 % completos: no se envía sin ellos"),
    R("OE2", HEX.green, "Registro de pedidos", "No existía", "Planilla mensual activa desde 06/10"),
    R("OE2", HEX.green, "Cambio de precios", "Reenviar la carta", "Editar una celda"),
    R("OE3", HEX.greenDark, "Costo y calidad", "—", "$0 por mes · 44 pruebas en verde"),
  ], { x: 0.6, y: 1.6, w: 12.1, colW: [0.9, 2.7, 4.0, 4.5], rowH: 0.52, fontSize: 15, fontFace: "Calibri", color: HEX.ink, border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
  txt(s, "Evidencia del uso real", { x: 0.6, y: 4.95, w: 6, h: 0.4, fontFace: "Cambria", fontSize: 17, bold: true });
  const ev = ["Captura: confirmación en el sitio", "Captura: mensaje en WhatsApp", "Captura: fila en la planilla", "Pedidos web hasta el 13/10"];
  for (let i = 0; i < 4; i++) pendiente(s, 0.6 + i * 3.075, 5.4, 2.85, 1.35, ev[i], 12);
  notes(s, "0:50 (acumulado 11:50)", "Los resultados, objetivo por objetivo, comparando antes y ahora. OE1: la carta dejó de ser una imagen reenviada y el pedido llega siempre completo. OE2: antes no había ningún registro, hoy hay una planilla mensual y los precios se cambian editando una celda. OE3: cuesta cero por mes y pasa 44 pruebas. Y acá tienen la evidencia de un pedido real: [mostrar capturas].");

  // ===== 18. Conclusiones (trazabilidad) =====
  s = content("III. Trabajo principal · Conclusiones", "Conclusiones: del problema al resultado", S4);
  const CH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.ink } } });
  const CR = (oe, c, p, h, r) => [{ text: oe, options: { bold: true, color: WHITE, fill: { color: c }, align: "center" } }, { text: p }, { text: h }, { text: r, options: { bold: true, color: HEX.greenDark } }];
  s.addTable([
    [CH(""), CH("Problema"), CH("Qué se hizo"), CH("Conclusión")],
    CR("OE1", HEX.red, "Pedidos dictados por chat, incompletos y con errores", "Carta web, carrito, validación y recibo numerado a WhatsApp", "Cumplido: el pedido llega completo sin cambiar de canal"),
    CR("OE2", HEX.green, "Sin registro ni datos para decidir", "Planilla mensual automática y precios editables", "Cumplido: el negocio ya registra y puede medir"),
    CR("OE3", HEX.greenDark, "Una sola persona, sin presupuesto para tecnología", "Servicios gratuitos, HTTPS, protecciones y 44 pruebas", "Cumplido: $0/mes, recupero en ≈ 4 meses"),
  ], { x: 0.6, y: 1.6, w: 12.1, colW: [0.9, 3.6, 3.9, 3.7], rowH: [0.5, 1.05, 1.05, 1.05], fontSize: 15, fontFace: "Calibri", color: HEX.ink, border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
  card(s, 0.6, 5.6, 12.1, 1.15, INK);
  txt(s, [{ text: "Conclusión general: ", options: { bold: true, color: HEX.yellow } }, { text: "una solución chica, a la medida de un negocio de 3 personas, resuelve su cuello de botella y es económicamente conveniente.", options: { color: WHITE } }],
    { x: 0.9, y: 5.6, w: 11.5, h: 1.15, fontSize: 17, valign: "middle" });
  notes(s, "0:45 (acumulado 12:35)", "Para cerrar, conecto todo: cada problema tiene su objetivo, lo que hice y el resultado. Los tres objetivos se cumplieron. En resumen: una solución chica, a la medida de un negocio de tres personas, que resuelve su cuello de botella y además conviene económicamente.");

  // ===== 19. Recomendaciones =====
  s = content("III. Trabajo principal · Recomendaciones", "Recomendaciones por responsable", S4);
  const rec = [
    ["FaUserTie", "Dueño", ["Aprobar misión y visión", "Mantener precios al día", "Evaluar formalizarse al crecer"], RED],
    ["FaHeadset", "Atención al cliente", ["Marcar estados en la planilla", "Anotar pedidos perdidos un mes", "Difundir el QR en cada entrega"], GREEN],
    ["FaCode", "Desarrollador", ["Recalcular con datos reales", "Mantener las actualizaciones", "v2: aviso de estado al cliente"], GREEN_D],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, w = 3.8;
    card(s, x, 1.6, w, 5.15, TINT);
    await iconCircle(s, rec[i][0], x + 0.3, 1.85, 0.75, rec[i][3]);
    txt(s, rec[i][1], { x: x + 1.2, y: 1.95, w: w - 1.4, h: 0.55, fontFace: "Cambria", fontSize: 20, bold: true, valign: "middle" });
    txt(s, bul(rec[i][2]), { x: x + 0.3, y: 2.95, w: w - 0.55, h: 3.6, fontSize: 18, paraSpaceAfter: 16 });
  }
  notes(s, "0:25 (acumulado 13:00)", "Y tres recomendaciones: al dueño, aprobar la misión y mantener los precios; a quien atiende, anotar los pedidos perdidos durante un mes para medir; y como desarrollador, recalcular la evaluación con esos datos reales y avanzar a una versión 2.");

  // ===== 20. Cierre =====
  s = pres.addSlide({ masterName: "Oscuro", sectionTitle: S4 });
  txt(s, "Gracias", { x: 0.9, y: 2.0, w: 7, h: 1.2, fontFace: "Cambria", fontSize: 60, bold: true, color: WHITE });
  txt(s, "¿Preguntas?", { x: 0.9, y: 3.2, w: 7, h: 0.8, fontSize: 28, color: HEX.yellow });
  txt(s, [
    { text: "Sitio: ", options: { bold: true } }, { text: "castromaximo.github.io/DanyPizzas", options: { breakLine: true } },
    { text: "Código: ", options: { bold: true } }, { text: "github.com/CastroMaximo/DanyPizzas", options: { breakLine: true } },
    { text: "Instagram: ", options: { bold: true } }, { text: "@dany.pizzeria" },
  ], { x: 0.9, y: 4.4, w: 7.5, h: 1.3, fontSize: 16, color: CREAM, paraSpaceAfter: 4 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.9, y: 1.6, w: 3.6, h: 4.3, fill: { color: WHITE }, rectRadius: 0.2, line: { type: "none" }, objectName: "qr-fondo" });
  s.addImage({ path: img("docs/qr-sitio.png"), x: 9.2, y: 1.9, w: 3.0, h: 3.0, objectName: "qr-cierre" });
  txt(s, "Pedí desde tu celular", { x: 8.9, y: 5.05, w: 3.6, h: 0.5, fontSize: 16, bold: true, color: INK, align: "center" });
  notes(s, "0:10 (acumulado 13:10)", "Muchas gracias. Pueden escanear el QR para probarlo. Quedo atento a sus preguntas. [Para responder, abrir DanyPizzas_Anexos.pptx: ver la lista en guion-y-preguntas.md]");

  }
  if (MODO === "anexos") {
  // =================== ANEXOS (respaldo para preguntas) ===================
  pres.addSection({ title: S5 });
  s = pres.addSlide({ masterName: "Seccion", sectionTitle: S5 });
  txt(s, "A", { x: 0.9, y: 1.6, w: 3, h: 1.3, fontFace: "Cambria", fontSize: 80, bold: true, color: HEX.red });
  s.addText("Anexos", { placeholder: "title" });
  s.addText("Material de respaldo para responder preguntas", { placeholder: "body" });
  s.addNotes("No se expone. Saltar aquí solo si una pregunta lo requiere.");

  const anexo = (n, title) => content(`Anexo ${n}`, `${n} · ${title}`, S5);

  // A1 Estrategias cruzadas
  s = anexo("A1", "Estrategias cruzadas del FODA");
  const est = [
    ["FO · ofensivas", ["Pedido web que termina en WhatsApp, el canal que ya usan (RF-12)", "Carta con fotos reales difundida por Instagram y QR (RF-01)"], GREEN],
    ["FA · defensivas", ["Precios editables en la planilla para ajustar ante la inflación (RF-15)", "Pedido claro y sin comisiones de apps de delivery (RNF-14)"], GREEN_D],
    ["DO · reorientación", ["Registro automático de pedidos en Google Sheets, gratis (RF-14)", "El cliente arma su pedido solo; nadie dicta la carta ni suma a mano (RF-03 a RF-05)"], RED],
    ["DA · supervivencia", ["Pruebas automáticas y plan de contingencia con vuelta al chat (RNF-08, RNF-12)", "El pedido por chat sigue disponible: la web se suma, no reemplaza"], RED_D],
  ];
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.15, y = 1.6 + row * 2.7, w = 5.95, h = 2.5;
    card(s, x, y, w, h, TINT);
    pill(s, est[i][0].toUpperCase(), x + 0.3, y + 0.28, 2.6, est[i][2], WHITE);
    txt(s, bul(est[i][1]), { x: x + 0.3, y: y + 0.85, w: w - 0.6, h: h - 1.0, fontSize: 15, paraSpaceAfter: 8 });
  }

  // A2 Supuestos
  s = anexo("A2", "Supuestos de la evaluación económica");
  const H2 = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.ink }, align: "center" } });
  const r2 = (v, a, m, b, f) => [{ text: v }, { text: a, options: { align: "center" } }, { text: m, options: { align: "center", bold: true } }, { text: b, options: { align: "center" } }, { text: f, options: { color: f === "Negocio" ? HEX.greenDark : HEX.redDark } }];
  s.addTable([
    [H2("Variable"), H2("Mín."), H2("Más probable"), H2("Máx."), H2("Fuente")],
    r2("Pedidos por noche (mar a vie / sáb y dom)", "5 / 9", "7 / 11", "9 / 13", "Negocio"),
    r2("Pizzas por pedido", "1", "2", "3", "Negocio"),
    r2("Margen sobre el precio ($9.500 promedio)", "35 %", "40 %", "45 %", "Negocio"),
    r2("Minutos de chat por pedido (hoy → con la web)", "2 → 0,5", "5 → 1", "10 → 2", "Negocio / supuesto"),
    r2("Pedidos con error (hoy → con la web)", "5 % → 1 %", "10 % → 3 %", "15 % → 5 %", "Negocio / supuesto"),
    r2("Pedidos perdidos por semana", "3", "6", "9", "Negocio"),
    r2("% de pedidos por la web (adopción)", "20 %", "40 %", "60 %", "Supuesto"),
    r2("% de perdidos que la web recupera", "10 %", "30 %", "50 %", "Supuesto"),
    r2("Valor hora atención (SMVM $1.956)", "1 ×", "1,25 ×", "1,5 ×", "SMVM oct‑2026"),
    r2("Valor hora desarrollo (× SMVM) · horas", "1 × · 40", "2,5 × · 48", "5 × · 60", "Supuesto / estudiante"),
  ], { x: 0.6, y: 1.6, w: 12.1, colW: [4.6, 1.6, 1.8, 1.6, 2.5], rowH: 0.44, fontSize: 14, fontFace: "Calibri", color: HEX.ink, border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
  txt(s, "Horizonte 12 meses · tasa TNA 17,5 % (plazo fijo BNA) = 1,458 % mensual · distribuciones triangulares · script reproducible en docs/analisis/economia/.", { x: 0.6, y: 6.55, w: 12.1, h: 0.35, fontSize: 12, color: GRAY });

  // A3 Recupero
  s = anexo("A3", "Recupero de la inversión por escenario");
  s.addImage({ path: img("docs/analisis/economia/flujo_acumulado.png"), x: 0.6, y: 1.6, w: 9.4, h: 4.89, objectName: "grafico-recupero" });
  card(s, 10.3, 1.6, 2.4, 4.9, CREAM);
  txt(s, "Base: se recupera a los 3,9 meses. Optimista: 1,3 meses. Pesimista (todo mal a la vez): no se recupera en 12 meses.", { x: 10.45, y: 1.75, w: 2.1, h: 4.6, fontSize: 15 });

  // A4 Sensibilidad
  s = anexo("A4", "Sensibilidad del VAN (tornado)");
  s.addImage({ path: img("docs/analisis/economia/tornado.png"), x: 0.6, y: 1.6, w: 8.6, h: 4.47, objectName: "grafico-tornado" });
  card(s, 9.5, 1.6, 3.2, 4.47, CREAM);
  txt(s, bul(["Con recupero mínimo (10 %) el VAN sigue en ≈ $180.000", "Sin recuperar ningún pedido: VAN ≈ −$21.000 (casi cero)", "Hora de desarrollo a 5 × SMVM: VAN ≈ $242.000"]), { x: 9.7, y: 1.8, w: 2.85, h: 4.1, fontSize: 14, paraSpaceAfter: 10 });

  // A5-A6 RF
  const RF = [
    ["RF-01", "Mostrar la carta: nombre, foto, ingredientes, precio entera y mitad", "M", "✅"],
    ["RF-02", "Indicar abierto/cerrado según el horario y mostrar la tabla", "M", "✅"],
    ["RF-03", "Agregar enteras o mitades, cambiar cantidades y quitar ítems", "M", "✅"],
    ["RF-04", "Armar pizza mitad y mitad cobrando cada mitad por separado", "M", "✅"],
    ["RF-05", "Calcular total y porciones (mitad redondeada a múltiplo de $500)", "M", "✅"],
    ["RF-06", "Conservar pedido y datos del cliente en su dispositivo", "S", "✅"],
    ["RF-07", "Pedir nombre, teléfono y dirección; referencia y observaciones opcionales", "M", "✅"],
    ["RF-08", "Elegir entrega “lo antes posible” o un horario del mismo día", "S", "✅"],
    ["RF-09", "Elegir pago: Mercado Pago, transferencia o efectivo", "M", "✅"],
    ["RF-10", "Validar datos e indicar qué campo corregir", "M", "✅"],
    ["RF-11", "Asignar N.º DP-AAMMDD-NNN secuencial por día (o local si falla)", "M", "✅"],
    ["RF-12", "Generar el recibo, abrir WhatsApp del negocio y permitir copiarlo", "M", "✅"],
    ["RF-13", "Mostrar alias, titular, monto y 5 min para el comprobante", "M", "✅"],
    ["RF-14", "Registrar cada pedido en la hoja mensual con total recalculado", "M", "✅"],
    ["RF-15", "Cambiar precios y disponibilidad desde la hoja Catalogo", "M", "✅"],
    ["RF-16", "Marcar estado: Nuevo, Pagado, En preparación, Entregado…", "S", "🟡"],
    ["RF-17", "Consultar los pedidos de cada mes en la planilla", "S", "🟡"],
    ["RF-18", "Rechazar pedidos falsos o abusivos (trampa, límites, duplicados)", "S", "✅"],
    ["RF-19", "Pausar el registro web sin dejar de recibir por WhatsApp", "C", "✅"],
    ["RF-20", "Avisar fuera de horario y permitir o bloquear el envío", "C", "✅"],
  ];
  const hdrT = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.ink }, align: "center" } });
  const rfTable = (rows) => [
    [hdrT("ID"), hdrT("Requisito funcional"), hdrT("MoSCoW"), hdrT("Estado")],
    ...rows.map((r, i) => r.map((c, k) => ({ text: k === 3 ? (c === "✅" ? "Verificado" : "Falta validar") : c,
      options: { bold: k === 0, align: k >= 2 ? "center" : "left", color: k === 3 ? (c === "✅" ? HEX.greenDark : HEX.redDark) : HEX.ink, fill: { color: i % 2 ? HEX.white : HEX.tint } } }))),
  ];
  for (const [n, part, rows] of [["A5", "1 de 2", RF.slice(0, 10)], ["A6", "2 de 2", RF.slice(10)]]) {
    s = anexo(n, `Requisitos funcionales (${part})`);
    s.addTable(rfTable(rows), { x: 0.6, y: 1.6, w: 12.1, colW: [1.1, 8.0, 1.3, 1.7], rowH: 0.44, fontSize: 14, fontFace: "Calibri", border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
    txt(s, "MoSCoW: M debe · S debería · C podría. Caso de uso y prueba de cada requisito: docs/analisis/requisitos.md.", { x: 0.6, y: 6.6, w: 12.1, h: 0.3, fontSize: 11, color: GRAY });
  }

  // A7 RNF
  s = anexo("A7", "Requisitos no funcionales (ISO/IEC 25010)");
  const rnf = [
    ["Usabilidad", "RNF-01 a 03", "Pedido sin ayuda en ≤ 2 min; mobile-first desde 360 px; voseo y precios locales", "FaMobileAlt"],
    ["Compatibilidad", "RNF-04", "Chrome, Safari, Firefox y Edge en Android, iOS, Windows y Linux", "FaGlobe"],
    ["Seguridad", "RNF-05 a 07", "100 % HTTPS; total imposible de manipular; datos mínimos y Ley 25.326", "FaLock"],
    ["Fiabilidad", "RNF-08, 09", "Si el servidor falla, el pedido sale igual; sin números duplicados", "FaShieldAlt"],
    ["Eficiencia", "RNF-10", "Sin frameworks; fotos ≤ 140 KB con carga diferida", "FaFire"],
    ["Mantenibilidad", "RNF-11, 12", "Datos del negocio sin programar; 44 pruebas antes de publicar", "FaTools"],
    ["Accesibilidad", "RNF-13", "Etiquetas, foco visible, contraste ≥ 4,5:1, teclado", "FaUserFriends"],
    ["Costo y disponibilidad", "RNF-14, 15", "$0 por mes; disponible en el horario, con plan de contingencia", "FaMoneyBillWave"],
  ];
  for (let i = 0; i < 8; i++) {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.075, y = 1.6 + row * 2.6, w = 2.85, h = 2.4;
    card(s, x, y, w, h, TINT);
    await iconCircle(s, rnf[i][3], x + 0.25, y + 0.25, 0.5, row === 0 ? RED : GREEN);
    txt(s, rnf[i][1], { x: x + 0.9, y: y + 0.3, w: w - 1.05, h: 0.4, fontSize: 11, bold: true, color: GRAY, align: "right" });
    txt(s, rnf[i][0], { x: x + 0.25, y: y + 0.85, w: w - 0.5, h: 0.4, fontSize: 15, bold: true });
    txt(s, rnf[i][2], { x: x + 0.25, y: y + 1.25, w: w - 0.45, h: 1.1, fontSize: 13 });
  }

  // A8 Casos de uso
  s = anexo("A8", "Diagrama de casos de uso");
  s.addImage({ path: img("diagramas/casos-de-uso.png"), x: 2.28, y: 1.55, w: 8.77, h: 5.3, objectName: "casos-de-uso" });

  // A9 Secuencia
  s = anexo("A9", "Diagrama de secuencia del pedido");
  s.addImage({ path: img("diagramas/secuencia-pedido.png"), x: 3.3, y: 1.5, w: 6.3, h: 5.33, objectName: "secuencia" });

  // A10 Infraestructura y tecnología
  s = anexo("A10", "Tecnología antes y después");
  card(s, 0.6, 1.6, 5.8, 3.9, TINT);
  txt(s, "Antes", { x: 0.9, y: 1.8, w: 5, h: 0.45, fontFace: "Cambria", fontSize: 20, bold: true, color: GRAY });
  txt(s, bul(["Celular con WhatsApp común", "Instagram", "Cuenta de Mercado Pago", "Carta enviada como imagen", "Sin registro de pedidos"]), { x: 0.9, y: 2.4, w: 5.2, h: 4.1, fontSize: 17, paraSpaceAfter: 8 });
  card(s, 6.9, 1.6, 5.8, 3.9, CREAM);
  txt(s, "Después", { x: 7.2, y: 1.8, w: 5, h: 0.45, fontFace: "Cambria", fontSize: 20, bold: true, color: GREEN_D });
  txt(s, bul(["Todo lo anterior (nada se reemplaza)", "Sitio web en GitHub Pages", "Backend en Google Apps Script", "Planilla mensual en Google Sheets", "Código QR del enlace", "Costo: $0 de hardware y servidores"]), { x: 7.2, y: 2.4, w: 5.2, h: 4.1, fontSize: 17, paraSpaceAfter: 8 });

  }
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("OK", OUT);
}
build().catch((e) => { console.error(e); process.exit(1); });
