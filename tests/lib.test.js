// Pruebas unitarias de la lógica del negocio. Ejecutar: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../site/js/lib.js');
const CFG = require('../site/js/config.js');
const CAT = require('../site/data/catalogo.js');

// Helper: fecha a partir de hora de Argentina (UTC-3, sin horario de verano)
const ar = (iso) => new Date(iso + '-03:00');

test('precioMitad: redondea hacia arriba al múltiplo de $500', () => {
  assert.equal(L.precioMitad(9500, 500), 5000);   // ejemplo dado por el negocio
  assert.equal(L.precioMitad(8500, 500), 4500);
  assert.equal(L.precioMitad(10500, 500), 5500);
  assert.equal(L.precioMitad(9000, 500), 4500);   // sin redondeo necesario
});

test('pesos: formato argentino con punto de miles', () => {
  assert.equal(L.pesos(8500), '$8.500');
  assert.equal(L.pesos(105000), '$105.000');
  assert.equal(L.pesos(0), '$0');
});

test('calcularCarrito: total, porciones y cantidad', () => {
  const r = L.calcularCarrito([
    { id: 'muzza', tam: 'E', cant: 2 },        // 17000
    { id: 'fugazzeta', tam: 'M', cant: 1 }      // 5000
  ], CAT, CFG);
  assert.equal(r.total, 22000);
  assert.equal(r.porciones, 20);
  assert.equal(r.cantidad, 3);
  assert.equal(r.lineas.length, 2);
});

test('calcularCarrito: ignora ítems inválidos (pizza inexistente, cantidad 0, tamaño raro)', () => {
  const r = L.calcularCarrito([
    { id: 'inexistente', tam: 'E', cant: 1 },
    { id: 'muzza', tam: 'E', cant: 0 },
    { id: 'muzza', tam: 'X', cant: 1 },
    { id: 'muzza', tam: 'E', cant: -2 }
  ], CAT, CFG);
  assert.equal(r.total, 0);
  assert.equal(r.lineas.length, 0);
});

test('mitad y mitad: dos mitades de distinta variedad se cobran por separado', () => {
  const r = L.calcularCarrito([
    { id: 'muzza', tam: 'M', cant: 1 },        // 4500
    { id: 'de-la-casa', tam: 'M', cant: 1 }     // 5500
  ], CAT, CFG);
  assert.equal(r.total, 10000);
  assert.equal(r.porciones, 8);
});

test('estadoLocal: abierto martes 22:00, cerrado martes 15:00', () => {
  // 2026-10-06 es martes
  assert.equal(L.estadoLocal(ar('2026-10-06T22:00:00'), CFG).abierto, true);
  const c = L.estadoLocal(ar('2026-10-06T15:00:00'), CFG);
  assert.equal(c.abierto, false);
  assert.deepEqual(c.proxima, { dias: 0, hora: '21:00' });
});

test('estadoLocal: pasada la medianoche sigue abierto hasta las 00:30', () => {
  // miércoles 00:15 pertenece a la sesión del martes
  const e = L.estadoLocal(ar('2026-10-07T00:15:00'), CFG);
  assert.equal(e.abierto, true);
  assert.equal(e.sesion, 'ayer');
  assert.equal(L.estadoLocal(ar('2026-10-07T00:45:00'), CFG).abierto, false);
});

test('estadoLocal: lunes cerrado todo el día, pero el lunes 00:15 aún es la sesión del domingo', () => {
  // 2026-10-05 es lunes
  assert.equal(L.estadoLocal(ar('2026-10-05T00:15:00'), CFG).abierto, true);   // sesión del domingo
  const l = L.estadoLocal(ar('2026-10-05T21:30:00'), CFG);
  assert.equal(l.abierto, false);
  assert.deepEqual(l.proxima, { dias: 1, hora: '21:00' });
});

test('estadoLocal: martes 00:15 NO es abierto (el lunes no se trabaja)', () => {
  assert.equal(L.estadoLocal(ar('2026-10-06T00:15:00'), CFG).abierto, false);
});

test('textoEstado: mensajes claros', () => {
  const d1 = ar('2026-10-06T22:00:00');
  assert.equal(L.textoEstado(L.estadoLocal(d1, CFG), d1, CFG), 'Abierto · hasta las 00:30');
  const d2 = ar('2026-10-06T15:00:00');
  assert.equal(L.textoEstado(L.estadoLocal(d2, CFG), d2, CFG), 'Cerrado · abrimos hoy a las 21:00');
  const d3 = ar('2026-10-05T12:00:00');
  assert.equal(L.textoEstado(L.estadoLocal(d3, CFG), d3, CFG), 'Cerrado · abrimos mañana a las 21:00');
});

test('opcionesEntrega: antes de abrir ofrece 21:00 → 00:30 cada 15 min', () => {
  const o = L.opcionesEntrega(ar('2026-10-06T15:00:00'), CFG);
  assert.equal(o[0], '21:00');
  assert.equal(o[o.length - 1], '00:30');
  assert.equal(o.length, 15);
});

test('opcionesEntrega: con el local abierto sugiere desde ahora + 20 min', () => {
  const o = L.opcionesEntrega(ar('2026-10-06T22:05:00'), CFG);
  assert.equal(o[0], '22:30');   // 22:05 + 20 = 22:25 → próximo cuarto de hora: 22:30
  assert.equal(o[o.length - 1], '00:30');
});

test('opcionesEntrega: en la madrugada de la sesión anterior sólo queda hasta 00:30', () => {
  const o = L.opcionesEntrega(ar('2026-10-07T00:05:00'), CFG);
  assert.deepEqual(o, ['00:30']);
});

test('generarId: formato DP-AAMMDD-NNN con secuencia del backend', () => {
  assert.equal(L.generarId(ar('2026-10-06T22:00:00'), CFG, 7), 'DP-261006-007');
  assert.equal(L.generarId(ar('2026-10-06T22:00:00'), CFG, 123), 'DP-261006-123');
});

test('generarId: sin backend usa 3 caracteres aleatorios sin símbolos confusos', () => {
  const id = L.generarId(ar('2026-10-06T22:00:00'), CFG, null, () => 0);
  assert.match(id, /^DP-261006-[A-HJ-NP-Z2-9]{3}$/);
});

test('generarId usa la fecha de Argentina, no la UTC (23:30 ART ya es el día siguiente en UTC)', () => {
  assert.equal(L.generarId(new Date('2026-10-07T02:30:00Z'), CFG, 1), 'DP-261006-001');
});

test('validarPedido: acepta un pedido completo', () => {
  const carrito = L.calcularCarrito([{ id: 'muzza', tam: 'E', cant: 1 }], CAT, CFG);
  const v = L.validarPedido({ carrito, nombre: 'Ana Pérez', telefono: '3825 123456', direccion: 'Calle 1 N° 123', pago: 'mp' }, CFG);
  assert.equal(v.ok, true);
});

test('validarPedido: detecta cada campo faltante', () => {
  const vacio = L.calcularCarrito([], CAT, CFG);
  const v = L.validarPedido({ carrito: vacio, nombre: '', telefono: '12', direccion: 'ab', pago: 'bitcoin' }, CFG);
  assert.equal(v.ok, false);
  assert.deepEqual(Object.keys(v.errores).sort(), ['carrito', 'direccion', 'nombre', 'pago', 'telefono']);
});

function base(extra) {
  const carrito = L.calcularCarrito([
    { id: 'muzza', tam: 'E', cant: 2 }, { id: 'fugazzeta', tam: 'M', cant: 1 }
  ], CAT, CFG);
  return Object.assign({
    id: 'DP-261006-007', fecha: ar('2026-10-06T22:10:00'), nombre: 'Ana Pérez', telefono: '+54 9 3825 123456',
    direccion: 'Belgrano 123', referencia: 'Portón negro', entrega: 'asap', pago: 'transferencia', obs: 'Sin olivas en una',
    lineas: carrito.lineas, total: carrito.total, porciones: carrito.porciones, fueraDeHorario: false
  }, extra || {});
}

test('armarRecibo: contiene todos los datos y el total correcto', () => {
  const r = L.armarRecibo(base(), CFG);
  for (const s of ['DP-261006-007', '06/10/2026 22:10', 'Ana Pérez', 'Belgrano 123', 'Portón negro',
    '2 × Muzza (entera) — $17.000', '1 × Fugazzeta (mitad) — $5.000', 'Porciones: 20',
    'Total pizzas: $22.000', 'Transferencia bancaria', 'Sin olivas en una', 'comprobante', '5 minutos']) {
    assert.ok(r.includes(s), 'falta: ' + s);
  }
});

test('armarRecibo: efectivo no pide comprobante', () => {
  const r = L.armarRecibo(base({ pago: 'efectivo' }), CFG);
  assert.ok(r.includes('Pago en efectivo al recibir'));
  assert.ok(!r.includes('comprobante'));
});

test('armarRecibo: hora elegida y aviso fuera de horario', () => {
  const r = L.armarRecibo(base({ entrega: '22:30', fueraDeHorario: true }), CFG);
  assert.ok(r.includes('A las 22:30'));
  assert.ok(r.includes('fuera de horario'));
});

test('armarRecibo: entrega para mañana no dice "A las mañana"', () => {
  const r = L.armarRecibo(base({ entrega: 'mañana 21:30' }), CFG);
  assert.ok(r.includes('*Entrega:* mañana 21:30'));
});

test('armarRecibo: saltos de línea en campos de texto no rompen el formato', () => {
  const r = L.armarRecibo(base({ nombre: 'Ana\n*Pérez*', direccion: 'Calle\r\n1' }), CFG);
  assert.ok(r.includes('*Cliente:* Ana *Pérez*'));
  assert.ok(r.includes('*Dirección:* Calle 1'));
});

test('urlWhatsApp: apunta al número del negocio y codifica el texto', () => {
  const u = L.urlWhatsApp('Hola & chau\n1', CFG);
  assert.ok(u.startsWith('https://wa.me/5493825620508?text='));
  assert.ok(u.includes('Hola%20%26%20chau%0A1'));
});

test('catálogo: precios positivos, ids únicos y mitades dentro de lo esperado', () => {
  const ids = new Set(CAT.map(p => p.id));
  assert.equal(ids.size, CAT.length);
  assert.equal(CAT.length, 7);
  for (const p of CAT) {
    assert.ok(p.precio > 0 && p.precio % 500 === 0, p.id);
    const m = L.precioMitad(p.precio, CFG.redondeoMitad);
    assert.ok(m >= p.precio / 2 && m < p.precio / 2 + 500, p.id);
  }
});

test('catálogo: todas las pizzas tienen foto y el archivo existe', () => {
  const fs = require('node:fs'), path = require('node:path');
  const CAT = require('../site/data/catalogo.js');
  for (const p of CAT) {
    assert.ok(p.imagen, 'falta foto: ' + p.id);
    assert.ok(fs.existsSync(path.join(__dirname, '../site', p.imagen)), 'no existe ' + p.imagen);
  }
  assert.ok(fs.existsSync(path.join(__dirname, '../site/assets/img/logo.png')));
});
