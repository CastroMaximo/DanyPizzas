// Prueba la lógica de backend/Code.gs simulando Google (SpreadsheetApp, Utilities, etc.).
// Verifica que el servidor y el sitio calculen EXACTAMENTE los mismos precios.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const L = require('../site/js/lib.js');
const CFG = require('../site/js/config.js');
const CAT = require('../site/data/catalogo.js');

function crearEntorno(fechaFija) {
  const hojas = {};
  const hoja = (nombre) => {
    const h = { nombre, filas: [], getLastRow() { return this.filas.length; } };
    h.appendRow = (r) => { h.filas.push(r); return h; };
    h.getRange = (r, c, n, m) => ({
      getValues: () => h.filas.slice(r - 1, r - 1 + (n || 1)).map(f => f.slice(c - 1, c - 1 + (m || 1))),
      setValues: (v) => { v.forEach((fila, i) => { h.filas[r - 1 + i] = fila.slice(); }); return {}; },
      setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; },
      setWrap() { return this; }, setNumberFormat() { return this; }, setDataValidation() { return this; }
    });
    h.getDataRange = () => ({ getValues: () => h.filas.map(f => f.slice()) });
    ['setFrozenRows', 'setColumnWidth', 'clear'].forEach(k => { h[k] = () => h; });
    return h;
  };
  const ss = {
    getSheetByName: (n) => hojas[n] || null,
    insertSheet: (n) => (hojas[n] = hoja(n))
  };
  const fmt = (d, tz, f) => {
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return f.replace('yyyy', p.year).replace('yy', p.year.slice(2)).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute);
  };
  const cache = {}, props = {};
  class FakeDate extends Date { constructor(...a) { super(...(a.length ? a : [fechaFija])); } }
  const sandbox = {
    console, JSON, Math, Number, String, Array, Object, parseInt, Date: FakeDate,
    SpreadsheetApp: {
      getActive: () => ss, getUi: () => ({ alert() {} }),
      newDataValidation: () => ({ requireValueInList() { return this; }, build() { return {}; } })
    },
    Utilities: { formatDate: fmt },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = String(v); } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null) }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../backend/Code.gs'), 'utf8'), sandbox);
  sandbox.configurarPlanilla();
  const post = (obj) => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(obj) } }).s);
  return { sandbox, hojas, post, cache, props };
}

const pedidoBase = (extra) => Object.assign({
  items: [{ id: 'muzza', tam: 'E', cant: 2 }, { id: 'fugazzeta', tam: 'M', cant: 1 }, { id: 'de-la-casa', tam: 'M', cant: 1 }],
  nombre: 'Ana Pérez', telefono: '3825 123456', direccion: 'Belgrano 123', referencia: '', entrega: 'asap',
  pago: 'transferencia', obs: '', fueraDeHorario: false,
  sitio: '', msEnPagina: 30000, nonce: nuevoNonce()
}, extra || {});
let contNonce = 0;
function nuevoNonce() { return (++contNonce).toString(16).padStart(24, 'a'); }
// Teléfonos distintos para pruebas que hacen muchos pedidos (el límite por teléfono es 3/hora).
const tel = (i) => '3825 ' + String(100000 + i);

const FECHA = new Date('2026-10-13T22:00:00-03:00');

test('backend: el catálogo de la hoja coincide con el del sitio', () => {
  const { sandbox } = crearEntorno(FECHA);
  const cat = sandbox.leerCatalogo();
  assert.equal(cat.length, CAT.length);
  for (const p of CAT) {
    const s = cat.find(x => x.id === p.id);
    assert.ok(s, p.id);
    assert.equal(s.precio, p.precio, p.id);
    assert.equal(s.nombre, p.nombre, p.id);
  }
});

test('backend: total y porciones coinciden con el cálculo del sitio', () => {
  const { post } = crearEntorno(FECHA);
  const r = post(pedidoBase());
  const local = L.calcularCarrito(pedidoBase().items, CAT, CFG);
  assert.equal(r.ok, true);
  assert.equal(r.total, local.total);
  assert.equal(r.total, 27500);
  assert.equal(r.porciones, local.porciones);
});

test('backend: IDs secuenciales del día y registro en la hoja del mes', () => {
  const { post, hojas } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase()).id, 'DP-261013-001');
  assert.equal(post(pedidoBase()).id, 'DP-261013-002');
  assert.equal(post(pedidoBase()).id, 'DP-261013-003');
  const h = hojas['Pedidos 2026-10'];
  assert.ok(h, 'debe existir la hoja del mes');
  assert.equal(h.filas.length, 4); // encabezados + 3 pedidos
  assert.equal(h.filas[1][3], 'Ana Pérez');
  assert.equal(h.filas[1][11], 27500);
  assert.equal(h.filas[1][12], 'Nuevo');
});

test('backend: ignora el total que manda el navegador (no se puede manipular)', () => {
  const { post } = crearEntorno(FECHA);
  const r = post(pedidoBase({ totalCliente: 1 }));
  assert.equal(r.total, 27500);
});

test('backend: rechaza pedidos inválidos', () => {
  const { post } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase({ items: [] })).ok, false);
  assert.equal(post(pedidoBase({ items: [{ id: 'pizza-inventada', tam: 'E', cant: 1 }] })).ok, false);
  assert.equal(post(pedidoBase({ items: [{ id: 'muzza', tam: 'E', cant: 999 }] })).ok, false);
  assert.equal(post(pedidoBase({ items: [{ id: 'muzza', tam: 'X', cant: 1 }] })).ok, false);
  assert.equal(post(pedidoBase({ nombre: '' })).ok, false);
  assert.equal(post(pedidoBase({ telefono: '123' })).ok, false);
  assert.equal(post(pedidoBase({ direccion: 'ab' })).ok, false);
  assert.equal(post(pedidoBase({ pago: 'bitcoin' })).ok, false);
});

test('backend: una pizza marcada NO en la hoja deja de aceptarse', () => {
  const { post, hojas } = crearEntorno(FECHA);
  const fila = hojas['Catalogo'].filas.find(f => f[0] === 'muzza');
  fila[4] = 'NO';
  assert.equal(post(pedidoBase()).ok, false);
});

test('backend: cambiar un precio en la hoja se refleja en el total', () => {
  const { post, hojas } = crearEntorno(FECHA);
  hojas['Catalogo'].filas.find(f => f[0] === 'muzza')[3] = 9000;
  const r = post(pedidoBase({ items: [{ id: 'muzza', tam: 'E', cant: 1 }, { id: 'muzza', tam: 'M', cant: 1 }] }));
  assert.equal(r.total, 9000 + 4500);
});

test('backend: texto que parece fórmula se neutraliza', () => {
  const { post, hojas } = crearEntorno(FECHA);
  post(pedidoBase({ nombre: '=HYPERLINK("http://x")', obs: '+cmd' }));
  const fila = hojas['Pedidos 2026-10'].filas[1];
  assert.ok(fila[3].startsWith("'="));
  assert.ok(fila[13].startsWith("'+"));
});

test('backend: la fecha del ID usa hora argentina', () => {
  const { post } = crearEntorno(new Date('2026-10-14T02:30:00Z')); // 23:30 del 13/10 en Argentina
  assert.equal(post(pedidoBase()).id, 'DP-261013-001');
});

/* ---------------- Protección contra pedidos falsos ---------------- */

test('protección: campo trampa completo → rechazado y no se registra', () => {
  const { post, hojas } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase({ sitio: 'http://spam.example' })).ok, false);
  assert.ok(!hojas['Pedidos 2026-10'] || hojas['Pedidos 2026-10'].filas.length === 1);
});

test('protección: envío demasiado rápido o sin tiempo → rechazado', () => {
  const { post } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase({ msEnPagina: 800 })).ok, false);
  assert.equal(post(pedidoBase({ msEnPagina: undefined })).ok, false);
  assert.equal(post(pedidoBase({ msEnPagina: 'x' })).ok, false);
  assert.equal(post(pedidoBase({ msEnPagina: 4000 })).ok, true);
});

test('protección: sin código de envío (nonce) válido → rechazado', () => {
  const { post } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase({ nonce: '' })).ok, false);
  assert.equal(post(pedidoBase({ nonce: '<script>' })).ok, false);
});

test('protección: el mismo envío repetido se registra una sola vez', () => {
  const { post, hojas } = crearEntorno(FECHA);
  const pedido = pedidoBase();
  const a = post(pedido), b = post(pedido);
  assert.equal(a.ok, true);
  assert.equal(b.id, a.id);
  assert.equal(hojas['Pedidos 2026-10'].filas.length, 2); // encabezados + 1
});

test('protección: máximo 3 pedidos por hora desde el mismo teléfono (en cualquier formato)', () => {
  const { post, cache } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase({ telefono: '3825 123456' })).ok, true);
  assert.equal(post(pedidoBase({ telefono: '+54 9 3825 12-3456' })).ok, true);
  assert.equal(post(pedidoBase({ telefono: '03825123456' })).ok, true);
  const r = post(pedidoBase({ telefono: '3825-123456' }));
  assert.equal(r.ok, false);
  assert.match(r.error, /teléfono/);
  assert.equal(post(pedidoBase({ telefono: tel(1) })).ok, true); // otro número sí puede
  // pasada la hora, el mismo número vuelve a poder pedir
  const k = 'tel:3825123456';
  const v = JSON.parse(cache[k]); v.hasta = Date.now() - 1; cache[k] = JSON.stringify(v);
  assert.equal(post(pedidoBase({ telefono: '3825 123456' })).ok, true);
});

test('protección: máximo 40 pedidos por hora en total', () => {
  const { post } = crearEntorno(FECHA);
  for (let i = 0; i < 40; i++) assert.equal(post(pedidoBase({ telefono: tel(i) })).ok, true, 'pedido ' + i);
  assert.equal(post(pedidoBase({ telefono: tel(99) })).ok, false);
});

test('protección: máximo 150 pedidos por día', () => {
  const { post, hojas, cache } = crearEntorno(FECHA);
  post(pedidoBase());
  const h = hojas['Pedidos 2026-10'];
  for (let i = 2; i <= 150; i++) h.filas.push(['DP-261013-' + String(i).padStart(3, '0')]);
  delete cache.hora;
  const r = post(pedidoBase({ telefono: tel(5) }));
  assert.equal(r.ok, false);
  assert.match(r.error, /límite/);
});

test('protección: interruptor PEDIDOS_WEB = NO pausa el registro', () => {
  const { post, props } = crearEntorno(FECHA);
  props.PEDIDOS_WEB = 'no';
  assert.equal(post(pedidoBase()).ok, false);
  props.PEDIDOS_WEB = 'SI';
  assert.equal(post(pedidoBase()).ok, true);
});

test('protección: cuerpo gigante → rechazado', () => {
  const { post } = crearEntorno(FECHA);
  assert.equal(post(pedidoBase({ obs: 'x'.repeat(25000) })).ok, false);
});
