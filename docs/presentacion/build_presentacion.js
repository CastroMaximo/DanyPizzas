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
const OUT = path.join(__dirname, "DanyPizzas_Presentacion.pptx");

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

async function build() {
  const S1 = "Introducción", S2 = "I. Curriculum vitae", S3 = "II. Memoria descriptiva", S4 = "III. Trabajo principal";

  // ===== 1. Portada =====
  pres.addSection({ title: S1 });
  let s = pres.addSlide({ masterName: "Oscuro", sectionTitle: S1 });
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
    { text: "Docente: ", options: { bold: true, color: HEX.yellow } }, { text: "Dr. Morales Gonzales Alexander", options: { breakLine: true } },
    { text: "13 de octubre de 2026", options: { color: CREAM } },
  ], { x: 5.8, y: 5.25, w: 7, h: 1.0, fontSize: 14, color: WHITE, paraSpaceAfter: 2 });
  s.addNotes("Presentación del proyecto Dany Pizzas Web: un sistema de pedidos para un emprendimiento familiar real de Chilecito, La Rioja, ya publicado y funcionando.");

  // ===== 2. Esquema =====
  s = content("Introducción", "Esquema de la presentación", S1);
  const esquema = [
    ["I", "Curriculum vitae", "Formación y experiencia del estudiante", "FaUserTie"],
    ["II", "Memoria descriptiva", "La empresa, organización, misión y visión, infraestructura, FODA y posición estratégica", "FaStore"],
    ["III", "Trabajo principal", "Problema, objetivos, alcance, plan, presupuesto, evaluación económica, diseño, requisitos, desarrollo, resultados, conclusiones y recomendaciones", "FaCogs"],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, y = 1.75, w = 3.8, h = 4.6;
    card(s, x, y, w, h, TINT);
    await iconCircle(s, esquema[i][3], x + 0.35, y + 0.4, 0.8, i === 2 ? RED : GREEN);
    txt(s, esquema[i][0], { x: x + w - 1.25, y: y + 0.3, w: 0.95, h: 0.9, fontFace: "Cambria", fontSize: 40, bold: true, color: i === 2 ? RED : GREEN, align: "right" });
    txt(s, esquema[i][1], { x: x + 0.35, y: y + 1.5, w: w - 0.7, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true });
    txt(s, esquema[i][2], { x: x + 0.35, y: y + 2.1, w: w - 0.7, h: 2.2, fontSize: 15, color: INK });
  }
  s.addNotes("La presentación sigue el esquema de la cátedra. La relación de trabajos se omite en esta entrega, por eso el trabajo principal pasa a ser la sección III.");

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
  txt(s, "Dany Pizzas Web (2026): sistema de pedidos publicado y en uso para un emprendimiento real, con backend en Google Apps Script y 44 pruebas automáticas.", { x: 4.15, y: 3.38, w: 3.6, h: 1.75, fontSize: 14 });
  card(s, 8.3, 2.85, 4.2, 2.35, TINT);
  txt(s, "Herramientas usadas en el proyecto", { x: 8.55, y: 3.0, w: 3.8, h: 0.35, fontSize: 14, bold: true, color: RED });
  txt(s, [
    { text: "HTML, CSS y JavaScript", options: { bullet: true, breakLine: true } },
    { text: "Git, GitHub y GitHub Actions", options: { bullet: true, breakLine: true } },
    { text: "Google Apps Script y Sheets", options: { bullet: true, breakLine: true } },
    { text: "Linux Ubuntu y VS Code", options: { bullet: true } },
  ], { x: 8.55, y: 3.38, w: 3.8, h: 1.75, fontSize: 14, paraSpaceAfter: 4 });
  pendiente(s, 0.8, 5.5, 11.7, 1.15, "Completar con tu CV: año que cursás, formación previa, experiencia laboral, cursos o certificaciones, idiomas y datos de contacto.");
  s.addNotes("Breve presentación personal. Completar con el CV del estudiante.");

  // ===== 4. Sección II =====
  pres.addSection({ title: S3 });
  s = pres.addSlide({ masterName: "Seccion", sectionTitle: S3 });
  txt(s, "II", { x: 0.9, y: 1.6, w: 3, h: 1.3, fontFace: "Cambria", fontSize: 80, bold: true, color: HEX.red });
  s.addText("Memoria descriptiva", { placeholder: "title" });
  s.addText("La empresa, su organización y su posición estratégica antes del proyecto", { placeholder: "body" });

  // ===== 5. La empresa =====
  s = content("II. Memoria descriptiva", "La empresa: Dany Pizzas", S3);
  s.addImage({ path: img("site/assets/img/napolitana.jpg"), x: 0.6, y: 1.7, w: 5.2, h: 3.25, rounding: false, objectName: "foto-pizza" });
  txt(s, "Foto propia del negocio (Napolitana)", { x: 0.6, y: 5.0, w: 5.2, h: 0.3, fontSize: 11, color: GRAY });
  const datos = [
    ["FaPizzaSlice", "Rubro", "Elaboración y venta de pizzas con envío"],
    ["FaClock", "Inicio", "2024 · emprendimiento familiar informal"],
    ["FaMapMarkerAlt", "Ubicación", "Chilecito, La Rioja, Argentina"],
    ["FaMotorcycle", "Modalidad", "Solo envío a domicilio (“puertas cerradas”)"],
    ["FaStore", "Horario", "Martes a domingo, 21:00 a 00:30"],
    ["FaWhatsapp", "Canal de venta", "WhatsApp; difusión por Instagram"],
  ];
  for (let i = 0; i < datos.length; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 6.3 + col * 3.25, y = 1.7 + row * 1.12;
    await iconCircle(s, datos[i][0], x, y + 0.05, 0.5, i % 2 ? GREEN : RED);
    txt(s, datos[i][1], { x: x + 0.65, y, w: 2.5, h: 0.3, fontSize: 12, bold: true, color: GRAY });
    txt(s, datos[i][2], { x: x + 0.65, y: y + 0.3, w: 2.5, h: 0.7, fontSize: 14 });
  }
  const stats = [["7", "variedades en la carta"], ["≈ 50", "pedidos por semana"], ["$8.500–$10.500", "precio de la pizza entera"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1;
    card(s, x, 5.5, 3.8, 1.25, i === 1 ? CREAM : TINT);
    txt(s, stats[i][0], { x: x + 0.25, y: 5.58, w: 3.3, h: 0.65, fontFace: "Cambria", fontSize: i === 2 ? 26 : 32, bold: true, color: RED, valign: "middle" });
    txt(s, stats[i][1], { x: x + 0.25, y: 6.25, w: 3.3, h: 0.35, fontSize: 13, color: GRAY });
  }
  s.addNotes("Dany Pizzas es un emprendimiento familiar de Chilecito que vende solo con envío. Trabaja de martes a domingo a la noche y toma todos los pedidos por WhatsApp.");

  // ===== 6. Organización =====
  s = content("II. Memoria descriptiva", "Organización: tres personas y un repartidor externo", S3);
  const box = (x, y, w, h, t1, t2, fill, ic, dashed) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.12,
      line: dashed ? { color: HEX.gray, width: 1.25, dashType: "dash" } : { type: "none" }, objectName: on("org") });
  };
  // líneas
  const ln = (x1, y1, x2, y2) => s.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: HEX.gray, width: 1.5 }, objectName: on("linea") });
  ln(4.35, 2.95, 4.35, 3.35); ln(1.95, 3.35, 6.75, 3.35); ln(1.95, 3.35, 1.95, 3.7); ln(6.75, 3.35, 6.75, 3.7); ln(6.75, 5.3, 6.75, 5.6);
  const org = [
    [2.6, 1.7, 3.5, 1.25, "Cocinero (dueño)", "Dirige el negocio, elabora las pizzas y define carta y precios", RED, WHITE, false],
    [0.6, 3.7, 2.7, 1.6, "Ayudante", "Masas, ingredientes, horneado y empaque", GREEN, WHITE, false],
    [5.2, 3.7, 3.1, 1.6, "Encargado de atención al cliente", "Atiende WhatsApp, toma pedidos, valida pagos y coordina el envío", GREEN, WHITE, false],
    [5.2, 5.6, 3.1, 1.15, "Repartidor (externo)", "Cobra el envío directamente al cliente", TINT, INK, true],
  ];
  for (const [x, y, w, h, t1, t2, fill, color, dashed] of org) {
    box(x, y, w, h, t1, t2, fill, null, dashed);
    txt(s, t1, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.4, fontSize: 15, bold: true, color });
    txt(s, t2, { x: x + 0.2, y: y + (t1.length > 24 ? 0.75 : 0.5), w: w - 0.4, h: h - 0.6, fontSize: 12, color });
  }
  card(s, 8.9, 1.7, 3.8, 5.05, CREAM);
  await iconCircle(s, "FaExclamationTriangle", 9.2, 1.95, 0.6, RED);
  txt(s, "Cuello de botella", { x: 9.2, y: 2.7, w: 3.3, h: 0.45, fontFace: "Cambria", fontSize: 20, bold: true });
  txt(s, "Toda la toma de pedidos depende de una sola persona. En una noche fuerte (11 pedidos) esa persona responde consultas, pasa la carta, suma totales y valida pagos mientras la cocina espera.", { x: 9.2, y: 3.2, w: 3.3, h: 2.2, fontSize: 14 });
  txt(s, "De ahí salen las demoras, los errores y los pedidos perdidos que ataca el sistema.", { x: 9.2, y: 5.5, w: 3.3, h: 1.0, fontSize: 14, bold: true, color: RED_D });
  s.addNotes("Son tres personas: el cocinero, que es el dueño; un ayudante; y el encargado de atención. El reparto lo hace un repartidor externo. El punto débil es que toda la atención recae en una persona.");

  // ===== 7. Misión y visión =====
  s = content("II. Memoria descriptiva", "Misión, visión y valores", S3);
  pill(s, "PROPUESTA · PENDIENTE DE APROBACIÓN DEL DUEÑO", 8.15, 0.3, 4.55, CREAM, RED_D);
  const mv = [
    ["FaBullseye", "Misión", "Llevar a las casas de Chilecito pizzas caseras, abundantes y a buen precio, hechas en familia, con un pedido simple y una atención cercana cada noche.", RED],
    ["FaEye", "Visión", "Ser, para 2028, la pizzería de envío a domicilio de referencia en Chilecito por su sabor casero y por lo fácil que es pedir, creciendo de forma ordenada y formalizando el emprendimiento.", GREEN],
  ];
  for (let i = 0; i < 2; i++) {
    const x = 0.6 + i * 6.15;
    card(s, x, 1.7, 5.95, 3.3, TINT);
    await iconCircle(s, mv[i][0], x + 0.35, 1.95, 0.7, mv[i][3]);
    txt(s, mv[i][1], { x: x + 1.25, y: 2.05, w: 4.3, h: 0.5, fontFace: "Cambria", fontSize: 24, bold: true });
    txt(s, mv[i][2], { x: x + 0.35, y: 2.9, w: 5.25, h: 2.0, fontSize: 16 });
  }
  const val = ["Calidad casera", "Precio justo", "Trato cercano", "Cumplir el horario de entrega"];
  txt(s, "Valores", { x: 0.6, y: 5.3, w: 3, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true });
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.075;
    card(s, x, 5.8, 2.85, 0.85, CREAM);
    s.addImage({ data: await icon("FaHeart", HEX.red), x: x + 0.25, y: 6.07, w: 0.3, h: 0.3, objectName: on("icono") });
    txt(s, val[i], { x: x + 0.7, y: 5.8, w: 2.05, h: 0.85, fontSize: 14, bold: true, valign: "middle" });
  }
  s.addNotes("El negocio no tenía misión ni visión escritas. Estas son una propuesta del estudiante, a aprobar por el dueño.");

  // ===== 8. Infraestructura =====
  s = content("II. Memoria descriptiva", "Infraestructura: cocina casera y tecnología gratuita", S3);
  const infra = [
    ["FaHome", "Lugar de elaboración", "Cocina de la vivienda familiar"],
    ["FaFire", "Horno pizzero de 6 moldes", "Una noche fuerte: 11 pedidos × 2 pizzas = 22 pizzas ≈ 4 tandas"],
    ["FaMotorcycle", "Reparto", "Repartidor externo; el envío lo arregla el cliente con él"],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.75 + i * 1.6;
    await iconCircle(s, infra[i][0], 0.6, y, 0.75, RED);
    txt(s, infra[i][1], { x: 1.6, y: y - 0.02, w: 4.6, h: 0.4, fontSize: 17, bold: true });
    txt(s, infra[i][2], { x: 1.6, y: y + 0.42, w: 4.6, h: 0.9, fontSize: 14 });
  }
  card(s, 6.7, 1.7, 2.85, 5.05, TINT);
  txt(s, "Tecnología antes", { x: 6.95, y: 1.9, w: 2.4, h: 0.4, fontSize: 16, bold: true, color: GRAY });
  txt(s, [
    { text: "Celular con WhatsApp común", options: { bullet: true, breakLine: true } },
    { text: "Instagram", options: { bullet: true, breakLine: true } },
    { text: "Cuenta de Mercado Pago", options: { bullet: true } },
  ], { x: 6.95, y: 2.4, w: 2.4, h: 2.5, fontSize: 14, paraSpaceAfter: 6 });
  s.addImage({ data: await icon("FaChevronRight", HEX.red), x: 9.7, y: 3.95, w: 0.4, h: 0.5, objectName: "flecha" });
  card(s, 10.25, 1.7, 2.45, 5.05, CREAM);
  txt(s, "Tecnología después", { x: 10.45, y: 1.9, w: 2.1, h: 0.7, fontSize: 16, bold: true, color: GREEN_D });
  txt(s, [
    { text: "Todo lo anterior", options: { bullet: true, breakLine: true } },
    { text: "Sitio web en GitHub Pages", options: { bullet: true, breakLine: true } },
    { text: "Planilla de pedidos en Google Sheets", options: { bullet: true, breakLine: true } },
    { text: "Código QR del enlace", options: { bullet: true } },
  ], { x: 10.45, y: 2.65, w: 2.1, h: 2.9, fontSize: 14, paraSpaceAfter: 6 });
  txt(s, "$0 de hardware y de servidores", { x: 10.45, y: 5.75, w: 2.1, h: 0.8, fontSize: 15, bold: true, color: RED_D });
  s.addNotes("No se compró nada: la solución usa el celular que ya tenían y servicios gratuitos de GitHub y Google. El horno de 6 moldes alcanza para la demanda actual y para los pedidos que se recuperen.");

  // ===== 9. FODA =====
  s = content("II. Memoria descriptiva", "Diagnóstico FODA (situación antes del proyecto)", S3);
  const foda = [
    ["F", "Fortalezas", ["Producto propio y artesanal, 7 variedades", "Clientela que ya pide por WhatsApp", "Estructura chica y costos fijos bajos", "Precios accesibles y estables", "Cobro digital ya incorporado"], GREEN],
    ["O", "Oportunidades", ["Uso masivo de celular y WhatsApp", "Pagos digitales generalizados", "Herramientas gratuitas (GitHub Pages, Google Sheets)", "Difusión por Instagram y QR", "Demanda nocturna con envío"], GREEN_D],
    ["D", "Debilidades", ["Pedidos informales, sin registro", "Solo 3 personas, horario acotado", "Sin carta digital", "Conocimiento técnico en una persona", "Sin datos para decidir"], RED],
    ["A", "Amenazas", ["Competencia y apps de delivery", "Inflación y suba de insumos", "Dependencia de plataformas de terceros", "Clientes con baja habilidad digital"], RED_D],
  ];
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.15, y = 1.6 + row * 2.7, w = 5.95, h = 2.5;
    card(s, x, y, w, h, TINT);
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.22, w: 0.6, h: 0.6, fill: { color: foda[i][3] }, line: { type: "none" }, objectName: on("letra") });
    txt(s, foda[i][0], { x: x + 0.25, y: y + 0.22, w: 0.6, h: 0.6, fontFace: "Cambria", fontSize: 22, bold: true, color: WHITE, align: "center", valign: "middle" });
    txt(s, foda[i][1], { x: x + 1.0, y: y + 0.27, w: 4.5, h: 0.5, fontFace: "Cambria", fontSize: 20, bold: true });
    txt(s, foda[i][2].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })),
      { x: x + 0.3, y: y + 0.95, w: w - 0.55, h: h - 1.05, fontSize: 13, paraSpaceAfter: 2 });
  }
  s.addNotes("FODA validado por el negocio. Las debilidades D1 y D3, pedidos informales y sin carta digital, son las que más pesan y las que ataca el proyecto.");

  // ===== 10. Posición estratégica =====
  s = content("II. Memoria descriptiva", "Posición estratégica: cuadrante V, conservar y mantener", S3);
  const big = [["2,45", "EFI · factores internos"], ["2,32", "EFE · factores externos"]];
  for (let i = 0; i < 2; i++) {
    card(s, 0.6, 1.7 + i * 1.75, 3.6, 1.5, TINT);
    txt(s, big[i][0], { x: 0.85, y: 1.8 + i * 1.75, w: 3.1, h: 0.85, fontFace: "Cambria", fontSize: 44, bold: true, color: RED });
    txt(s, big[i][1], { x: 0.85, y: 2.65 + i * 1.75, w: 3.1, h: 0.4, fontSize: 14, color: GRAY });
  }
  txt(s, "Escala 1 a 4 · promedio 2,5. Pesos y calificaciones validados por el dueño.", { x: 0.6, y: 5.25, w: 3.6, h: 0.7, fontSize: 12, color: GRAY });
  const ie = [["I", "Crecer"], ["II", "Crecer"], ["III", "Conservar"], ["IV", "Crecer"], ["V", "Conservar y mantener"], ["VI", "Cosechar"], ["VII", "Conservar"], ["VIII", "Cosechar"], ["IX", "Cosechar"]];
  const gx = 5.6, gy = 2.0, cw = 1.75, ch = 1.15;
  txt(s, "EFI →  Fuerte · Medio · Débil", { x: gx, y: 1.6, w: cw * 3, h: 0.3, fontSize: 12, bold: true, color: GRAY, align: "center" });
  txt(s, "EFE ↓ Alto · Medio · Bajo", { x: gx - 1.35, y: gy, w: 1.2, h: ch * 3, fontSize: 12, bold: true, color: GRAY, align: "right", valign: "middle" });
  for (let i = 0; i < 9; i++) {
    const c = i % 3, r = Math.floor(i / 3), x = gx + c * cw, y = gy + r * ch;
    const hit = i === 4;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: ch, fill: { color: hit ? RED : (["Crecer"].includes(ie[i][1]) ? "E6F2EF" : ie[i][1] === "Cosechar" ? "F3EFEA" : CREAM) }, line: { color: WHITE, width: 2 }, objectName: on("celda-ie") });
    txt(s, [{ text: ie[i][0], options: { bold: true, fontSize: 16, breakLine: true } }, { text: ie[i][1], options: { fontSize: 11 } }],
      { x: x + 0.1, y: y + 0.1, w: cw - 0.2, h: ch - 0.2, color: hit ? WHITE : INK, align: "center", valign: "middle" });
  }
  card(s, 11.0, 2.0, 1.75, 3.45, CREAM);
  txt(s, "Dany Pizzas (2,45 ; 2,32) cae en la celda V", { x: 11.12, y: 2.15, w: 1.5, h: 3.1, fontSize: 13, bold: true, color: RED_D, valign: "middle" });
  txt(s, "Estrategias recomendadas: penetración de mercado y desarrollo de producto. El sistema web es una de ellas: no cambia el producto ni el canal (WhatsApp); ordena el pedido, muestra la carta y deja registro.", { x: gx, y: 5.65, w: 7.15, h: 1.1, fontSize: 14 });
  s.addNotes("Con EFI 2,45 y EFE 2,32 el negocio queda en el cuadrante V de la matriz interna-externa: conservar y mantener. Eso justifica un proyecto que mejore cómo se vende lo que ya existe.");

  // ===== 11. Estrategias cruzadas =====
  s = content("II. Memoria descriptiva", "Estrategias cruzadas que guían el proyecto", S3);
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
    txt(s, est[i][1].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })),
      { x: x + 0.3, y: y + 0.85, w: w - 0.6, h: h - 1.0, fontSize: 15, paraSpaceAfter: 8 });
  }
  s.addNotes("Cada estrategia cruzada quedó traducida en requisitos concretos del sistema.");

  // ===== 12. Sección III =====
  pres.addSection({ title: S4 });
  s = pres.addSlide({ masterName: "Seccion", sectionTitle: S4 });
  txt(s, "III", { x: 0.9, y: 1.6, w: 3, h: 1.3, fontFace: "Cambria", fontSize: 80, bold: true, color: HEX.red });
  s.addText("Trabajo principal", { placeholder: "title" });
  s.addText("Del problema a un sistema publicado, evaluado y en funcionamiento", { placeholder: "body" });

  // ===== 13. Problema =====
  s = content("III. Trabajo principal · Problema", "El problema: pedidos lentos, incompletos y sin registro", S4);
  s.addImage({ path: path.join(__dirname, "assets/ishikawa_recorte.png"), x: 0.6, y: 1.55, w: 12.1, h: 4.33, objectName: "ishikawa" });
  const prob = [["2 a 10 min", "de chat por pedido"], ["1 de cada 10", "pedidos con error"], ["≈ 1 por noche", "pedido perdido por no contestar a tiempo"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1;
    card(s, x, 6.0, 3.8, 0.85, CREAM);
    txt(s, [{ text: prob[i][0] + "  ", options: { fontFace: "Cambria", bold: true, color: RED, fontSize: 20 } }, { text: prob[i][1], options: { fontSize: 13 } }],
      { x: x + 0.2, y: 6.0, w: 3.45, h: 0.85, valign: "middle" });
  }
  s.addNotes("Diagrama de Ishikawa con 18 causas en 6 categorías, validado por el negocio. Abajo, los tres síntomas medidos por el propio negocio.");

  // ===== 14. Objetivos =====
  s = content("III. Trabajo principal · Objetivos", "Título del proyecto y objetivos", S4);
  card(s, 0.6, 1.6, 12.1, 1.75, INK);
  txt(s, "SISTEMA WEB DE PEDIDOS POR WHATSAPP PARA EL EMPRENDIMIENTO FAMILIAR DANY PIZZAS", { x: 0.9, y: 1.72, w: 11.5, h: 0.4, fontSize: 13, bold: true, color: HEX.yellow, charSpacing: 1 });
  txt(s, [{ text: "Objetivo general. ", options: { bold: true } }, { text: "Implementar un sistema web que permita al cliente armar su pedido, genere un recibo con número y lo envíe por WhatsApp, registrando cada pedido, para reducir demoras, errores y pedidos perdidos en Dany Pizzas." }],
    { x: 0.9, y: 2.15, w: 11.5, h: 1.1, fontSize: 16, color: WHITE });
  const oe = [
    ["OE1", "Ordenar la toma de pedidos", "Carta digital con precios, pedido armado por el cliente, total automático y recibo prellenado en WhatsApp.", "RF-01 a RF-13", "FaWhatsapp"],
    ["OE2", "Registrar los pedidos y facilitar la administración", "Planilla mensual con número secuencial, estados del pedido y precios editables sin programar.", "RF-14 a RF-17, RF-19", "FaTable"],
    ["OE3", "Operar de forma segura, confiable y sin costo", "HTTPS, total recalculado en el servidor, protección contra pedidos falsos, pruebas automáticas y $0 de infraestructura.", "RF-18, RNF-05 a RNF-15", "FaShieldAlt"],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, y = 3.6, w = 3.8, h = 3.15;
    card(s, x, y, w, h, TINT);
    await iconCircle(s, oe[i][4], x + 0.3, y + 0.3, 0.6, i === 0 ? RED : i === 1 ? GREEN : GREEN_D);
    txt(s, oe[i][0], { x: x + 1.05, y: y + 0.35, w: 2.4, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true, color: RED });
    txt(s, oe[i][1], { x: x + 0.3, y: y + 1.0, w: w - 0.6, h: 0.65, fontSize: 15, bold: true });
    txt(s, oe[i][2], { x: x + 0.3, y: y + 1.65, w: w - 0.6, h: 1.1, fontSize: 13 });
    txt(s, oe[i][3], { x: x + 0.3, y: y + 2.75, w: w - 0.6, h: 0.3, fontSize: 11, color: GRAY, bold: true });
  }
  s.addNotes("Un objetivo general y tres específicos. Cada específico tiene requisitos asociados, y los resultados y conclusiones se presentan objetivo por objetivo.");

  // ===== 15. Alcance =====
  s = content("III. Trabajo principal · Alcance", "Alcance de la versión 1", S4);
  const alc = [
    ["FaMapMarkerAlt", "Delimitación", ["Dany Pizzas, Chilecito (La Rioja)", "Solo envío a domicilio", "Pedidos del mismo día, en horario de atención", "Un local, un número de WhatsApp"], RED],
    ["FaCogs", "Componentes", ["Sitio web mobile-first (GitHub Pages)", "Backend en Google Apps Script", "Planilla Google Sheets: catálogo y pedidos", "Publicación automática con pruebas"], GREEN],
    ["FaCheckCircle", "Evaluación", ["44 pruebas automáticas", "Lista de aceptación (UAT) con el negocio", "Métricas: pedidos web, errores y pedidos perdidos", "Evaluación económica a 12 meses"], GREEN_D],
    ["FaLock", "Exclusiones", ["Pasarela de pago en línea", "Aplicación móvil nativa", "Cuentas de cliente y seguimiento en tiempo real", "Más de un local o canal de venta"], RED_D],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.075, y = 1.65, w = 2.85, h = 5.1;
    card(s, x, y, w, h, i === 3 ? CREAM : TINT);
    await iconCircle(s, alc[i][0], x + 0.3, y + 0.3, 0.6, alc[i][3]);
    txt(s, alc[i][1], { x: x + 0.3, y: y + 1.05, w: w - 0.5, h: 0.45, fontFace: "Cambria", fontSize: 20, bold: true });
    txt(s, alc[i][2].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })),
      { x: x + 0.3, y: y + 1.65, w: w - 0.5, h: 3.3, fontSize: 14, paraSpaceAfter: 8 });
  }
  s.addNotes("La versión 1 resuelve el problema con lo mínimo. Lo excluido queda como hoja de ruta para la versión 2.");

  // ===== 16. Plan de ejecución (Gantt) =====
  s = content("III. Trabajo principal · Plan de ejecución", "Plan de ejecución: incremental en Scrumban", S4);
  const cols = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "06–13/10"];
  const gl = 4.3, gw = 1.6, gt = 1.6, rh = 0.44;
  txt(s, "Fase", { x: 0.6, y: gt, w: 3.5, h: 0.4, fontSize: 13, bold: true, color: GRAY });
  cols.forEach((c, i) => txt(s, c, { x: gl + i * gw, y: gt, w: gw, h: 0.4, fontSize: 13, bold: true, color: GRAY, align: "center" }));
  const fases = [
    ["1. Análisis y requisitos (cuestionario)", 0, 1, GRAY],
    ["2. Diseño: arquitectura, UML y C4", 0.6, 1.2, GRAY],
    ["3. Inc. 1: carta y horarios", 1, 1, RED],
    ["4. Inc. 2: carrito, mitades y total", 1.6, 1, RED],
    ["5. Inc. 3: recibo, N.º de pedido y WhatsApp", 2.3, 1, RED],
    ["6. Inc. 4: backend, planilla y protección", 3, 1, RED],
    ["7. Pruebas, publicación y QR", 3.5, 1.1, GREEN],
    ["8. Análisis estratégico y económico", 4.1, 0.4, GREEN_D],
    ["9. Validación con el negocio y exposición", 4.4, 0.6, GREEN_D],
  ];
  fases.forEach((f, i) => {
    const y = gt + 0.5 + i * rh;
    if (i % 2 === 0) s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: gl - 0.6 + gw * 5, h: rh, fill: { color: TINT }, line: { type: "none" }, objectName: on("fila") });
    txt(s, f[0], { x: 0.7, y, w: 3.55, h: rh, fontSize: 13, valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gl + f[1] * gw + 0.04, y: y + 0.11, w: f[2] * gw - 0.08, h: rh - 0.22, fill: { color: f[3] }, rectRadius: 0.08, line: { type: "none" }, objectName: on("barra") });
  });
  const hitos = [["Publicado 06/10", 4.0], ["Exposición 13/10", 5.0]];
  hitos.forEach(([t, pos], i) => {
    const x = gl + pos * gw;
    s.addShape(pres.shapes.LINE, { x, y: gt + 0.45, w: 0, h: rh * 9 + 0.1, line: { color: HEX.ink, width: 1.25, dashType: "dash" }, objectName: on("hito") });
  });
  txt(s, "Publicado 06/10 ▲", { x: gl + 4 * gw - 1.8, y: gt + 0.6 + 9 * rh, w: 1.75, h: 0.3, fontSize: 11, bold: true, align: "right" });
  txt(s, "Exposición 13/10 ▲", { x: gl + 5 * gw - 1.85, y: gt + 0.6 + 9 * rh, w: 1.8, h: 0.3, fontSize: 11, bold: true, align: "right" });
  pendiente(s, 0.6, 6.45, 8.0, 0.45, "Fechas reales de inicio y de respuesta del cuestionario (semanas 1 a 4).", 12);
  txt(s, [{ text: "■ ", options: { color: RED } }, { text: "Incrementos   " }, { text: "■ ", options: { color: GREEN } }, { text: "Publicación   " }, { text: "■ ", options: { color: GRAY } }, { text: "Análisis/diseño" }],
    { x: 8.8, y: 6.5, w: 3.9, h: 0.35, fontSize: 11, color: GRAY, align: "right" });
  s.addNotes("Cuatro incrementos semanales con tablero Kanban y revisión semanal con el negocio. El sitio se publicó el 6 de octubre. Completar las fechas reales de las primeras semanas.");

  // ===== 17. Presupuesto =====
  s = content("III. Trabajo principal · Presupuesto", "Presupuesto por macrofase y financiamiento", S4);
  const fasesP = [["Análisis", 8], ["Diseño", 8], ["Desarrollo", 18], ["Pruebas", 8], ["Despliegue y documentación", 6]];
  const VH = 4890;
  s.addChart(pres.charts.BAR, [{ name: "Costo", labels: fasesP.map((f) => f[0]), values: fasesP.map((f) => f[1] * VH) }], {
    x: 0.6, y: 1.6, w: 7.2, h: 4.75, barDir: "bar", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0',
    dataLabelFontSize: 12, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt", chartColors: [HEX.red], showLegend: false,
    catAxisLabelFontSize: 13, catAxisLabelColor: HEX.ink, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisOrientation: "maxMin", barGapWidthPct: 60,
    showTitle: true, title: "Costo por macrofase (horas × $4.890)", titleFontSize: 14, titleColor: HEX.ink, titleFontFace: "+mn-lt", valAxisMaxVal: 110000,
  });
  card(s, 8.2, 1.6, 4.5, 2.4, INK);
  txt(s, "Inversión total", { x: 8.5, y: 1.8, w: 3.9, h: 0.35, fontSize: 14, color: CREAM });
  txt(s, "$234.720", { x: 8.5, y: 2.15, w: 3.9, h: 0.8, fontFace: "Cambria", fontSize: 40, bold: true, color: WHITE });
  txt(s, "48 horas de desarrollo × $4.890 (2,5 × hora del salario mínimo, oct-2026)", { x: 8.5, y: 3.0, w: 3.9, h: 0.85, fontSize: 12, color: CREAM });
  card(s, 8.2, 4.2, 4.5, 2.55, TINT);
  txt(s, "Financiamiento", { x: 8.5, y: 4.35, w: 3.9, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true });
  txt(s, [
    { text: "Desarrollo: aporte propio del estudiante (sin desembolso del negocio)", options: { bullet: true, breakLine: true } },
    { text: "Operación: $0/mes (niveles gratuitos de GitHub y Google)", options: { bullet: true, breakLine: true } },
    { text: "Opcional: dominio propio ≈ $8.500/año", options: { bullet: true } },
  ], { x: 8.5, y: 4.8, w: 3.95, h: 1.9, fontSize: 13, paraSpaceAfter: 4 });
  txt(s, "Reparto de horas por fase estimado por el estudiante.", { x: 0.6, y: 6.45, w: 7.2, h: 0.3, fontSize: 11, color: GRAY });
  s.addNotes("La inversión es el tiempo de desarrollo valorizado; el negocio no desembolsa dinero. El funcionamiento mensual cuesta cero.");

  // ===== 18. Evaluación económica: planteo =====
  s = content("III. Trabajo principal · Evaluación económico-financiera", "De dónde sale el beneficio", S4);
  const sup = [["50", "pedidos por semana"], ["2", "pizzas por pedido"], ["$3.800", "ganancia por pizza (40 %)"], ["≈ 6", "pedidos perdidos por semana"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.075;
    card(s, x, 1.6, 2.85, 1.35, TINT);
    txt(s, sup[i][0], { x: x + 0.25, y: 1.68, w: 2.4, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: RED });
    txt(s, sup[i][1], { x: x + 0.25, y: 2.38, w: 2.4, h: 0.45, fontSize: 13, color: GRAY });
  }
  const ben = [
    ["FaClock", "Tiempo de atención ahorrado", "De 5 min de chat por pedido a 1 min para confirmar el pago", "$14.127/mes", GREEN],
    ["FaCheckCircle", "Errores evitados", "Del 10 % al 3 % de pedidos con error", "$17.290/mes", GREEN_D],
    ["FaMoneyBillWave", "Pedidos perdidos recuperados", "La web recupera el 30 % de los ≈ 6 pedidos perdidos por semana", "$59.280/mes", RED],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 3.25 + i * 0.95;
    await iconCircle(s, ben[i][0], 0.6, y + 0.08, 0.6, ben[i][4]);
    txt(s, ben[i][1], { x: 1.4, y, w: 4.6, h: 0.4, fontSize: 16, bold: true });
    txt(s, ben[i][2], { x: 1.4, y: y + 0.38, w: 4.8, h: 0.45, fontSize: 13, color: GRAY });
    txt(s, ben[i][3], { x: 6.2, y, w: 1.9, h: 0.75, fontSize: 17, bold: true, color: RED_D, align: "right", valign: "middle" });
  }
  card(s, 8.5, 3.2, 4.2, 3.55, INK);
  txt(s, "Método", { x: 8.8, y: 3.35, w: 3.6, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true, color: HEX.yellow });
  txt(s, [
    { text: "Horizonte de 12 meses, flujos mensuales", options: { bullet: true, breakLine: true } },
    { text: "Tasa: plazo fijo BNA, TNA 17,5 % → 1,46 % mensual", options: { bullet: true, breakLine: true } },
    { text: "17 variables con distribución triangular", options: { bullet: true, breakLine: true } },
    { text: "Monte Carlo: 10.000 iteraciones", options: { bullet: true, breakLine: true } },
    { text: "Adopción gradual: 50 %, 75 % y 100 %", options: { bullet: true } },
  ], { x: 8.8, y: 3.85, w: 3.7, h: 2.8, fontSize: 13, color: WHITE, paraSpaceAfter: 5 });
  txt(s, "Beneficio mensual del escenario base: $90.697. Datos del negocio; adopción, recupero y tasa de error con la web son supuestos a medir.", { x: 0.6, y: 6.2, w: 7.5, h: 0.6, fontSize: 12, color: GRAY });
  s.addNotes("Los datos de pedidos, pizzas, margen, minutos, errores y pedidos perdidos los dio el negocio. El mayor beneficio no es ahorrar minutos sino no perder ventas.");

  // ===== 19. Escenarios =====
  s = content("III. Trabajo principal · Evaluación económico-financiera", "Tres escenarios: VAN, TIR, ROI, B/C y recupero", S4);
  const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.ink }, align: "center" } });
  const rowE = (lab, a, b, c) => [{ text: lab, options: { bold: true } }, { text: a, options: { align: "right" } }, { text: b, options: { align: "right", bold: true, fill: { color: HEX.cream } } }, { text: c, options: { align: "right" } }];
  s.addTable([
    [hdr("Indicador"), hdr("Pesimista"), hdr("Base"), hdr("Optimista")],
    rowE("Inversión", "$396.090", "$234.720", "$150.612"),
    rowE("Beneficio mensual", "$29.494", "$90.697", "$220.125"),
    rowE("VAN (12 meses)", "−$335.891", "$583.451", "$2.038.551"),
    rowE("TIR mensual", "−18,4 %", "26,8 %", "97,5 %"),
    rowE("ROI", "−50 %", "190 %", "1.067 %"),
    rowE("Relación B/C", "0,47", "2,71", "10,86"),
    rowE("Recupero", "no recupera", "3,9 meses", "1,3 meses"),
  ], { x: 0.6, y: 1.6, w: 6.2, colW: [1.9, 1.4, 1.45, 1.45], rowH: 0.5, fontSize: 14, fontFace: "Calibri", color: HEX.ink, border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
  txt(s, "Pesimista y optimista: cada variable a mitad de camino hacia su extremo, todas a la vez.", { x: 0.6, y: 5.75, w: 6.2, h: 0.6, fontSize: 12, color: GRAY });
  s.addImage({ path: img("docs/analisis/economia/flujo_acumulado.png"), x: 7.1, y: 1.6, w: 5.6, h: 2.91, objectName: "grafico-recupero" });
  card(s, 7.1, 4.75, 5.6, 1.95, CREAM);
  txt(s, [{ text: "Escenario base: ", options: { bold: true, color: RED_D } }, { text: "la inversión se recupera en unos 4 meses y cada peso invertido devuelve $2,71 en valor presente." }],
    { x: 7.35, y: 4.9, w: 5.1, h: 1.65, fontSize: 15, valign: "middle" });
  s.addNotes("En el escenario base el proyecto conviene con holgura. El pesimista da negativo porque supone que todo sale mal al mismo tiempo; la simulación mide qué tan probable es eso.");

  // ===== 20. Monte Carlo =====
  s = content("III. Trabajo principal · Evaluación económico-financiera", "Monte Carlo: 97,8 % de probabilidad de VAN positivo", S4);
  s.addImage({ path: img("docs/analisis/economia/montecarlo_van.png"), x: 0.6, y: 1.6, w: 8.3, h: 4.32, objectName: "grafico-montecarlo" });
  const mc = [["97,8 %", "probabilidad de VAN > 0"], ["$532.611", "VAN mediano"], ["2,33", "B/C mediana"], ["4,3 meses", "recupero mediano"]];
  for (let i = 0; i < 4; i++) {
    card(s, 9.2, 1.6 + i * 1.12, 3.5, 1.0, i === 0 ? INK : TINT);
    txt(s, mc[i][0], { x: 9.45, y: 1.63 + i * 1.12, w: 3.1, h: 0.55, fontFace: "Cambria", fontSize: 24, bold: true, color: i === 0 ? WHITE : RED });
    txt(s, mc[i][1], { x: 9.45, y: 2.17 + i * 1.12, w: 3.1, h: 0.35, fontSize: 12, color: i === 0 ? CREAM : GRAY });
  }
  txt(s, "10.000 iteraciones · P5 del VAN: $84.479 · P95: $1.101.041. Solo el 2,2 % de los casos termina con VAN negativo.", { x: 0.6, y: 6.1, w: 12.1, h: 0.6, fontSize: 14 });
  s.addNotes("Se simularon 10.000 combinaciones de las 17 variables. En casi el 98 % el VAN es positivo; el caso pesimista anterior es una combinación muy poco probable.");

  // ===== 21. Sensibilidad =====
  s = content("III. Trabajo principal · Evaluación económico-financiera", "Sensibilidad: el valor está en no perder ventas", S4);
  s.addImage({ path: img("docs/analisis/economia/tornado.png"), x: 0.6, y: 1.6, w: 7.6, h: 3.95, objectName: "grafico-tornado" });
  const sens = [
    ["FaChartLine", "La variable que más pesa es el % de pedidos perdidos que la web recupera."],
    ["FaBullseye", "Punto de equilibrio: alcanza con recuperar un pedido perdido cada 3 o 4 meses para que el VAN sea positivo."],
    ["FaUserTie", "Aun valuando la hora de desarrollo a 5 veces el salario mínimo, el VAN base sigue positivo (≈ $242.000)."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.65 + i * 1.35;
    await iconCircle(s, sens[i][0], 8.6, y, 0.55, i === 1 ? RED : GREEN);
    txt(s, sens[i][1], { x: 9.35, y: y - 0.05, w: 3.35, h: 1.2, fontSize: 14 });
  }
  card(s, 0.6, 5.75, 12.1, 1.0, CREAM);
  txt(s, [{ text: "Riesgo principal: la adopción. ", options: { bold: true, color: RED_D } }, { text: "Se mide en el primer mes: pedidos por la web frente al total, pedidos perdidos por semana y pedidos con error. Con esos datos se recalcula el modelo." }],
    { x: 0.9, y: 5.75, w: 11.5, h: 1.0, fontSize: 14, valign: "middle" });
  s.addNotes("El ahorro de tiempo y de errores casi paga el proyecto por sí solo; cualquier pedido recuperado es ganancia. El riesgo es que los clientes no usen la web, y eso se mide.");

  // ===== 22. Diseño conceptual =====
  s = content("III. Trabajo principal · Diseño conceptual", "Arquitectura: sitio estático, backend mínimo y WhatsApp", S4);
  const nodo = (x, y, w, h, t1, t2, fill, color, ic) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.12, line: { type: "none" }, shadow: shadow(), objectName: on("nodo") });
    txt(s, t1, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.4, fontSize: 15, bold: true, color });
    txt(s, t2, { x: x + 0.2, y: y + 0.55, w: w - 0.4, h: h - 0.65, fontSize: 12, color });
  };
  const flecha = (x, y, w, h, label, lx, ly, lw = 2.0) => {
    s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: HEX.gray, width: 1.75, endArrowType: "triangle" }, objectName: on("flecha") });
    if (label) txt(s, label, { x: lx, y: ly, w: lw, h: 0.5, fontSize: 11, color: GRAY, align: "center" });
  };
  nodo(0.6, 2.9, 2.4, 1.5, "Cliente", "Celular o PC con navegador", RED, WHITE);
  nodo(4.0, 1.75, 3.6, 3.55, "Sitio web (GitHub Pages)", "", GREEN, WHITE);
  const capas = [["Interfaz", "index.html · app.js"], ["Lógica", "lib.js: precios, horario, recibo"], ["Datos", "config.js · catalogo.js"]];
  capas.forEach((c, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.25, y: 2.35 + i * 1.0, w: 3.1, h: 0.85, fill: { color: WHITE }, rectRadius: 0.08, line: { type: "none" }, objectName: on("capa") });
    txt(s, [{ text: c[0], options: { bold: true, breakLine: true } }, { text: c[1], options: { fontSize: 11, color: GRAY } }], { x: 4.4, y: 2.38 + i * 1.0, w: 2.85, h: 0.8, fontSize: 13, valign: "middle" });
  });
  nodo(8.75, 1.75, 3.95, 1.45, "Backend: Google Apps Script", "N.º secuencial, total recalculado, protección", GREEN_D, WHITE);
  nodo(8.75, 4.1, 3.95, 1.45, "Google Sheets", "Hojas Catalogo y Pedidos AAAA-MM", CREAM, INK);
  nodo(4.0, 6.0, 3.6, 0.8, "WhatsApp del negocio", "", INK, WHITE);
  nodo(0.6, 6.0, 2.4, 0.8, "Mercado Pago", "", CREAM, INK);
  flecha(3.0, 3.65, 1.0, 0, "HTTPS", 2.5, 3.15, 2.0);
  flecha(7.6, 2.45, 1.15, 0, "GET / POST", 7.2, 1.95, 1.9);
  flecha(10.7, 3.2, 0, 0.9, "", 0, 0);
  flecha(5.8, 5.3, 0, 0.7, "", 0, 0);
  txt(s, "enlace wa.me con el recibo", { x: 5.95, y: 5.45, w: 2.6, h: 0.35, fontSize: 11, color: GRAY });
  flecha(1.8, 4.4, 0, 1.6, "", 0, 0);
  txt(s, "paga fuera del sistema", { x: 1.9, y: 4.9, w: 1.8, h: 0.5, fontSize: 11, color: GRAY });
  txt(s, "Si el backend no responde en 6 s, el sitio genera un número local y el pedido sale igual por WhatsApp. Diagramas C4 de contexto y contenedores en el repositorio.", { x: 8.75, y: 5.75, w: 3.95, h: 1.1, fontSize: 12, color: GRAY });
  s.addNotes("Cliente-servidor mínimo en capas. El sitio es estático; el backend de Google registra los pedidos y sirve los precios. WhatsApp sigue siendo el canal: el sitio solo le entrega el pedido ya escrito.");

  // ===== 23. Casos de uso =====
  s = content("III. Trabajo principal · Diseño conceptual", "Casos de uso: cliente, atención y dueño", S4);
  s.addImage({ path: img("diagramas/casos-de-uso.png"), x: 0.6, y: 1.55, w: 8.5, h: 5.14, objectName: "casos-de-uso" });
  const act = [["Cliente", "CU-01 a CU-06: ve la carta, arma y confirma el pedido, lo envía por WhatsApp y manda el comprobante.", RED],
    ["Atención", "CU-07 y CU-08: recibe y valida el pedido, actualiza su estado.", GREEN],
    ["Dueño", "CU-08 a CU-11: cambia precios, consulta pedidos del mes y puede pausar el registro web.", GREEN_D]];
  for (let i = 0; i < 3; i++) {
    const y = 1.6 + i * 1.72;
    card(s, 9.4, y, 3.3, 1.55, TINT);
    pill(s, act[i][0].toUpperCase(), 9.6, y + 0.18, 1.5, act[i][2], WHITE);
    txt(s, act[i][1], { x: 9.6, y: y + 0.6, w: 2.95, h: 0.9, fontSize: 12 });
  }
  s.addNotes("Once casos de uso con tres actores humanos y WhatsApp como sistema externo.");

  // ===== 24. Secuencia =====
  s = content("III. Trabajo principal · Diseño conceptual", "Secuencia del pedido, de la carta al comprobante", S4);
  s.addImage({ path: img("diagramas/secuencia-pedido.png"), x: 0.6, y: 1.5, w: 6.3, h: 5.33, objectName: "secuencia" });
  const pasos = [
    ["1", "El sitio pide al backend la carta vigente con precios y disponibilidad."],
    ["2", "El cliente arma el pedido; el sitio calcula total y porciones y valida los datos."],
    ["3", "El backend descarta bots y abusos, recalcula el total y asigna DP-AAMMDD-NNN."],
    ["4", "El sitio abre WhatsApp con el recibo; el cliente lo envía y manda el comprobante."],
    ["5", "El negocio valida el pago, prepara y marca el estado en la planilla."],
  ];
  pasos.forEach((p, i) => {
    const y = 1.6 + i * 1.05;
    s.addShape(pres.shapes.OVAL, { x: 7.3, y, w: 0.5, h: 0.5, fill: { color: i === 2 ? GREEN_D : RED }, line: { type: "none" }, objectName: on("paso") });
    txt(s, p[0], { x: 7.3, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle" });
    txt(s, p[1], { x: 8.0, y: y - 0.02, w: 4.7, h: 0.95, fontSize: 14 });
  });
  s.addNotes("Diagrama de secuencia del flujo completo, con los caminos alternativos: datos incompletos y backend caído.");

  // ===== 25-26. RF =====
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
  const rfTable = (rows) => [
    [hdr("ID"), hdr("Requisito funcional"), hdr("MoSCoW"), hdr("Estado")],
    ...rows.map((r, i) => r.map((c, k) => ({ text: k === 3 ? (c === "✅" ? "Verificado" : "Falta validar") : c,
      options: { bold: k === 0, align: k >= 2 ? "center" : "left", color: k === 3 ? (c === "✅" ? HEX.greenDark : HEX.redDark) : HEX.ink, fill: { color: i % 2 ? HEX.white : HEX.tint } } }))),
  ];
  for (const [part, rows] of [["1 de 2", RF.slice(0, 10)], ["2 de 2", RF.slice(10)]]) {
    s = content("III. Trabajo principal · Requisitos", `Requisitos funcionales (${part})`, S4);
    s.addTable(rfTable(rows), { x: 0.6, y: 1.6, w: 12.1, colW: [1.1, 8.0, 1.3, 1.7], rowH: 0.44, fontSize: 14, fontFace: "Calibri", border: { type: "solid", color: HEX.line, pt: 1 }, valign: "middle" });
    txt(s, "Prioridad MoSCoW: M debe · S debería · C podría. Cada requisito tiene su caso de uso y la prueba que lo verifica (docs/analisis/requisitos.md).", { x: 0.6, y: 6.62, w: 12.1, h: 0.3, fontSize: 11, color: GRAY });
    s.addNotes("Veinte requisitos funcionales numerados, todos implementados. Dos quedan por validar en el uso real: los estados y la consulta mensual de la planilla.");
  }

  // ===== 27. RNF =====
  s = content("III. Trabajo principal · Requisitos", "Requisitos no funcionales (ISO/IEC 25010)", S4);
  const rnf = [
    ["Usabilidad", "RNF-01 a 03", "Pedido sin ayuda en ≤ 2 min; mobile-first desde 360 px; voseo y precios en formato local", "FaMobileAlt"],
    ["Compatibilidad", "RNF-04", "Chrome, Safari, Firefox y Edge en Android, iOS, Windows y Linux, sin instalar nada", "FaGlobe"],
    ["Seguridad", "RNF-05 a 07", "100 % HTTPS; total imposible de manipular; datos mínimos y Ley 25.326", "FaLock"],
    ["Fiabilidad", "RNF-08, 09", "Si el servidor falla, el pedido sale igual; sin números ni filas duplicadas", "FaShieldAlt"],
    ["Eficiencia", "RNF-10", "Sin frameworks; fotos ≤ 140 KB con carga diferida", "FaFire"],
    ["Mantenibilidad", "RNF-11, 12", "Datos del negocio sin programar; 44 pruebas antes de cada publicación", "FaTools"],
    ["Accesibilidad", "RNF-13", "Etiquetas, foco visible, contraste ≥ 4,5:1, navegable con teclado", "FaUserFriends"],
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
  s.addNotes("Quince requisitos no funcionales agrupados según ISO/IEC 25010, cada uno con una métrica de aceptación.");

  // ===== 28. Desarrollo e integración =====
  s = content("III. Trabajo principal · Desarrollo e integración", "Desarrollo e integración continua", S4);
  const pipe = [["FaCode", "Commit en Git", "VS Code + Ubuntu"], ["FaGithub", "Push a GitHub", "rama main"], ["FaCheckCircle", "44 pruebas", "node --test"], ["FaGlobe", "Publicación", "GitHub Pages"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 1.95;
    await iconCircle(s, pipe[i][0], x + 0.5, 1.65, 0.75, i === 2 ? RED : GREEN);
    txt(s, pipe[i][1], { x, y: 2.5, w: 1.75, h: 0.35, fontSize: 14, bold: true, align: "center" });
    txt(s, pipe[i][2], { x, y: 2.85, w: 1.75, h: 0.3, fontSize: 11, color: GRAY, align: "center" });
    if (i < 3) s.addImage({ data: await icon("FaChevronRight", HEX.gray), x: x + 1.72, y: 1.85, w: 0.22, h: 0.35, objectName: on("flecha") });
  }
  txt(s, "Si una prueba falla, no se publica.", { x: 0.6, y: 3.25, w: 7.6, h: 0.35, fontSize: 14, bold: true, color: RED_D });
  const nums = [["44", "pruebas automáticas"], ["0", "dependencias de código"], ["4", "incrementos semanales"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 2.6;
    card(s, x, 3.85, 2.4, 1.3, TINT);
    txt(s, nums[i][0], { x: x + 0.2, y: 3.9, w: 2.0, h: 0.7, fontFace: "Cambria", fontSize: 32, bold: true, color: RED });
    txt(s, nums[i][1], { x: x + 0.2, y: 4.6, w: 2.0, h: 0.45, fontSize: 12, color: GRAY });
  }
  txt(s, [
    { text: "Lógica pura separada de la interfaz (lib.js) para poder probarla", options: { bullet: true, breakLine: true } },
    { text: "El backend se prueba con Google simulado: mismo total que el sitio", options: { bullet: true, breakLine: true } },
    { text: "Pruebas de punta a punta con Playwright en móvil (390 px) y PC (1366 px)", options: { bullet: true } },
  ], { x: 0.6, y: 5.35, w: 7.6, h: 1.4, fontSize: 14, paraSpaceAfter: 4 });
  s.addImage({ path: img("docs/capturas/04-pc-inicio.png"), x: 8.55, y: 1.65, w: 4.15, h: 2.73, objectName: "captura-pc" });
  s.addShape(pres.shapes.RECTANGLE, { x: 8.55, y: 1.65, w: 4.15, h: 2.73, fill: { type: "none" }, line: { color: HEX.line, width: 1 }, objectName: "marco-pc" });
  txt(s, "Sitio publicado, vista de PC", { x: 8.55, y: 4.45, w: 4.15, h: 0.3, fontSize: 11, color: GRAY });
  card(s, 8.55, 4.95, 4.15, 1.8, CREAM);
  txt(s, [{ text: "Integración con el negocio: ", options: { bold: true } }, { text: "backend activo en la cuenta Google del negocio y planilla verificada desde el 06/10/2026." }],
    { x: 8.8, y: 5.05, w: 3.7, h: 1.6, fontSize: 14, valign: "middle" });
  s.addNotes("Cada cambio pasa por las 44 pruebas antes de publicarse. El backend y la planilla están activos en la cuenta del negocio desde el 6 de octubre.");

  // ===== 29. Producto =====
  s = content("III. Trabajo principal · Desarrollo e integración", "El producto: castromaximo.github.io/DanyPizzas", S4);
  const caps = [["docs/capturas/01-movil-inicio.png", "1. Carta con fotos, precios y horario"], ["docs/capturas/02-movil-pedido.png", "2. Pedido, datos de entrega y pago"], ["docs/capturas/03-movil-confirmacion.png", "3. N.º de pedido, WhatsApp y pago"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.75 + i * 3.0, h = 4.75, w = h * (390 / 844);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.08, y: 1.52, w: w + 0.16, h: h + 0.16, fill: { color: INK }, rectRadius: 0.15, line: { type: "none" }, objectName: on("marco-celular") });
    s.addImage({ path: img(caps[i][0]), x, y: 1.6, w, h, sizing: { type: "cover", w, h }, objectName: on("captura") });
    txt(s, caps[i][1], { x: x - 0.3, y: 6.45, w: w + 0.6, h: 0.45, fontSize: 12, color: INK, align: "center" });
  }
  card(s, 9.6, 1.6, 3.1, 4.9, TINT);
  s.addImage({ path: img("docs/qr-sitio.png"), x: 10.0, y: 1.85, w: 2.3, h: 2.3, objectName: "qr" });
  txt(s, "Escaneá para probarlo", { x: 9.8, y: 4.3, w: 2.7, h: 0.4, fontSize: 15, bold: true, align: "center" });
  txt(s, "Funciona en cualquier celular o PC, sin instalar nada.", { x: 9.85, y: 4.75, w: 2.6, h: 1.6, fontSize: 12, color: GRAY });
  s.addNotes("Demostración: abrir el sitio con el QR. Si la exposición es de día, agregar ?ahora=2026-10-13T22:00 a la dirección (modo demo) para que el local figure abierto.");

  // ===== 30. Resultados por objetivo =====
  s = content("III. Trabajo principal · Resultados", "Resultados por objetivo", S4);
  const res = [
    ["OE1", "Ordenar la toma de pedidos", "Sitio publicado el 06/10/2026; flujo completo probado en móvil y PC; recibo con N.º de pedido abierto en WhatsApp.", RED],
    ["OE2", "Registrar y administrar", "Planilla mensual activa y verificada; precios y disponibilidad editables desde la hoja Catalogo.", GREEN],
    ["OE3", "Seguro, confiable y sin costo", "$0 por mes; 100 % HTTPS; 44 pruebas en verde; VAN base $583.451 y P(VAN > 0) = 97,8 %.", GREEN_D],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.6 + i * 1.05;
    card(s, 0.6, y, 7.4, 0.92, TINT);
    pill(s, res[i][0], 0.8, y + 0.29, 0.75, res[i][3], WHITE);
    txt(s, [{ text: res[i][1] + ". ", options: { bold: true } }, { text: res[i][2] }], { x: 1.75, y, w: 6.1, h: 0.92, fontSize: 13, valign: "middle" });
  }
  txt(s, "Evidencia del uso real", { x: 0.6, y: 4.85, w: 7.4, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true });
  const ev = ["Captura: confirmación en el sitio", "Captura: mensaje en WhatsApp", "Captura: fila en la planilla"];
  for (let i = 0; i < 3; i++) pendiente(s, 0.6 + i * 2.5, 5.35, 2.3, 1.4, ev[i], 12);
  card(s, 8.3, 1.6, 4.4, 5.15, CREAM);
  txt(s, "Indicadores del primer mes", { x: 8.55, y: 1.75, w: 3.9, h: 0.4, fontFace: "Cambria", fontSize: 17, bold: true });
  txt(s, [
    { text: "Pedidos por la web / total (meta base: 40 %)", options: { bullet: true, breakLine: true } },
    { text: "Pedidos con datos completos (meta: 100 %)", options: { bullet: true, breakLine: true } },
    { text: "Pedidos perdidos por semana (hoy ≈ 6)", options: { bullet: true, breakLine: true } },
    { text: "Pedidos con error (hoy 10 %)", options: { bullet: true } },
  ], { x: 8.55, y: 2.25, w: 3.95, h: 2.1, fontSize: 13, paraSpaceAfter: 4 });
  pendiente(s, 8.55, 4.55, 3.9, 2.0, "Pedidos registrados por la web hasta el 13/10 y opinión de 2 o 3 clientes.", 12);
  s.addNotes("Resultados verificables hoy, objetivo por objetivo. Completar con el pedido real de prueba y con los pedidos que entren por la web antes de la exposición.");

  // ===== 31. Conclusiones =====
  s = content("III. Trabajo principal · Conclusiones", "Conclusiones por objetivo", S4);
  const con = [
    ["OE1", "El cliente arma su pedido solo y el negocio recibe un recibo completo, uniforme y numerado, sin cambiar de canal: WhatsApp sigue siendo el centro. Se atacan las causas de método e información del Ishikawa.", RED],
    ["OE2", "Cada pedido queda registrado en una planilla que el dueño ya sabe usar, y los precios cambian sin tocar código. El negocio pasa a tener datos para decidir (debilidad D5).", GREEN],
    ["OE3", "El sistema funciona con $0 de infraestructura, cifrado, a prueba de fallos del servidor y con 44 pruebas. Es económicamente conveniente: recupero en unos 4 meses en el escenario base.", GREEN_D],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, w = 3.8;
    card(s, x, 1.6, w, 3.85, TINT);
    txt(s, con[i][0], { x: x + 0.3, y: 1.8, w: 2, h: 0.6, fontFace: "Cambria", fontSize: 30, bold: true, color: con[i][2] });
    txt(s, con[i][1], { x: x + 0.3, y: 2.5, w: w - 0.6, h: 2.85, fontSize: 16 });
  }
  card(s, 0.6, 5.7, 12.1, 1.05, INK);
  txt(s, [{ text: "Conclusión general: ", options: { bold: true, color: HEX.yellow } }, { text: "una solución pequeña, proporcional a un emprendimiento de 3 personas, resuelve el cuello de botella de la atención y es coherente con la estrategia de conservar y mantener (cuadrante V).", options: { color: WHITE } }],
    { x: 0.9, y: 5.7, w: 11.5, h: 1.05, fontSize: 15, valign: "middle" });
  s.addNotes("Las tres conclusiones responden a los tres objetivos específicos.");

  // ===== 32. Recomendaciones =====
  s = content("III. Trabajo principal · Recomendaciones", "Recomendaciones por responsable", S4);
  const rec = [
    ["FaUserTie", "Dueño (cocinero)", ["Aprobar misión, visión y valores", "Mantener precios al día en la hoja Catalogo", "Evaluar formalizarse (monotributo) al crecer", "Proteger la cuenta Google con verificación en dos pasos"], RED],
    ["FaHeadset", "Encargado de atención", ["Marcar el estado de cada pedido en la planilla", "Anotar los pedidos perdidos durante el primer mes", "Difundir el QR e Instagram en cada entrega"], GREEN],
    ["FaCode", "Desarrollador", ["Recalcular la evaluación con los datos del primer mes", "Actualizar Code.gs y las versiones de GitHub Actions", "v2: aviso de estado al cliente, panel simple y promociones"], GREEN_D],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, w = 3.8;
    card(s, x, 1.6, w, 5.15, TINT);
    await iconCircle(s, rec[i][0], x + 0.3, 1.85, 0.7, rec[i][3]);
    txt(s, rec[i][1], { x: x + 1.15, y: 1.95, w: w - 1.35, h: 0.5, fontFace: "Cambria", fontSize: 18, bold: true, valign: "middle" });
    txt(s, rec[i][2].map((t, k, a) => ({ text: t, options: { bullet: true, breakLine: k < a.length - 1 } })),
      { x: x + 0.3, y: 2.8, w: w - 0.55, h: 3.8, fontSize: 16, paraSpaceAfter: 12 });
  }
  s.addNotes("Recomendaciones concretas para cada responsable, empezando por medir el primer mes de uso.");

  // ===== 33. Cierre =====
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
  s.addNotes("Cierre. Invitar a escanear el QR y abrir el sitio.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("OK", OUT);
}
build().catch((e) => { console.error(e); process.exit(1); });
