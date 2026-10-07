/**
 * DANY PIZZAS — Backend mínimo (Google Apps Script + Google Sheets)
 *
 * Qué hace:
 *  - doGet  ?action=catalogo → devuelve el catálogo de la hoja "Catalogo" (el dueño edita precios ahí).
 *  - doPost                  → recibe un pedido, RECALCULA el total con los precios de la hoja
 *                              (no confía en el navegador), le asigna un ID secuencial del día
 *                              (DP-AAMMDD-001) y lo guarda en la hoja del mes ("Pedidos 2026-10").
 *  - configurarPlanilla()    → se ejecuta UNA vez a mano: crea la hoja "Catalogo" con las 7 pizzas.
 *
 * Protección contra pedidos falsos (la URL es pública, así que se combinan varias barreras simples):
 *  1. Campo trampa: si viene completo, es un bot.
 *  2. Tiempo mínimo: un pedido enviado a los pocos segundos de abrir la página no es de una persona.
 *  3. Límite por teléfono: máx. 3 pedidos por hora desde el mismo número.
 *  4. Límite general: máx. 40 pedidos por hora y 150 por día (frena una avalancha).
 *  5. Sin duplicados: un mismo envío repetido (doble toque, reintento) se registra una sola vez.
 *  6. Interruptor: propiedad del script PEDIDOS_WEB = NO → deja de registrar (el sitio sigue andando
 *     y el pedido llega igual por WhatsApp).
 *  Y la regla de negocio de siempre: un pedido solo se prepara si llega por WhatsApp (con el mismo ID)
 *  y con el comprobante. Una fila sin WhatsApp se marca "Descartado".
 *
 * Instrucciones paso a paso: backend/README.md
 */

var CFG = {
  HOJA_CATALOGO: 'Catalogo',
  PREFIJO: 'DP',
  ZONA: 'America/Argentina/Buenos_Aires',
  REDONDEO_MITAD: 500,
  PORCIONES: { E: 8, M: 4 },
  MAX_ITEMS: 30,
  MAX_CANT: 20,
  MEDIOS: { mp: 'Mercado Pago', transferencia: 'Transferencia bancaria', efectivo: 'Efectivo (pago al recibir)' },
  ESTADOS: ['Nuevo', 'Pagado', 'En preparación', 'Entregado', 'Cancelado', 'Descartado'],
  SEGURIDAD: {
    MIN_MS_EN_PAGINA: 4000,      // menos de 4 s entre abrir la página y confirmar → bot
    MAX_POR_TELEFONO: 3,         // pedidos por número…
    VENTANA_TELEFONO_S: 3600,    // …en 1 hora
    MAX_POR_HORA: 40,            // pedidos en total por hora
    MAX_POR_DIA: 150,            // pedidos en total por día
    NONCE_S: 600                 // 10 min recordando envíos para no duplicar
  },
  ENCABEZADOS: ['ID', 'Fecha', 'Hora', 'Cliente', 'Teléfono', 'Dirección', 'Referencia', 'Entrega', 'Pago',
                'Detalle', 'Porciones', 'Total', 'Estado', 'Observaciones', 'Fuera de horario']
};

/* ---------------- Entradas web ---------------- */

function doGet(e) {
  var accion = e && e.parameter && e.parameter.action;
  if (accion === 'catalogo') return salida({ ok: true, catalogo: leerCatalogo() });
  return salida({ ok: true, mensaje: 'Dany Pizzas: backend activo' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);                       // evita IDs repetidos si llegan dos pedidos juntos
    if (String(e.postData.contents || '').length > 20000) throw new Error('Pedido demasiado grande');
    var d = JSON.parse(e.postData.contents);

    var repetido = filtrarBots(d);              // null si es nuevo; la respuesta anterior si es un reintento
    if (repetido) return salida(repetido);

    var p = validar(d);
    controlarLimites(p);
    var cat = leerCatalogo();
    var calc = calcular(p.items, cat);

    var ahora = new Date();
    var hoja = hojaDelMes(ahora);
    var id = siguienteId(hoja, ahora);
    if (parseInt(id.slice(-3), 10) > CFG.SEGURIDAD.MAX_POR_DIA) throw new Error('Se alcanzó el límite de pedidos web de hoy');

    var detalle = calc.lineas.map(function (l) {
      return l.cant + ' x ' + l.nombre + ' (' + (l.tam === 'M' ? 'mitad' : 'entera') + ') = $' + l.subtotal;
    }).join('\n');

    hoja.appendRow([
      id,
      Utilities.formatDate(ahora, CFG.ZONA, 'dd/MM/yyyy'),
      Utilities.formatDate(ahora, CFG.ZONA, 'HH:mm'),
      seguro(p.nombre), seguro(p.telefono), seguro(p.direccion), seguro(p.referencia),
      p.entrega === 'asap' ? 'Lo antes posible' : seguro(p.entrega),
      CFG.MEDIOS[p.pago],
      detalle, calc.porciones, calc.total, 'Nuevo', seguro(p.obs), p.fueraDeHorario ? 'SI' : ''
    ]);

    var resp = { ok: true, id: id, total: calc.total, porciones: calc.porciones, lineas: calc.lineas };
    registrarEnvio(p, d.nonce, resp);
    return salida(resp);
  } catch (err) {
    return salida({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* nada */ }
  }
}

/* ---------------- Protección contra pedidos falsos ---------------- */

function filtrarBots(d) {
  if (!d || typeof d !== 'object') throw new Error('Pedido inválido');
  var activo = PropertiesService.getScriptProperties().getProperty('PEDIDOS_WEB');
  if (activo && String(activo).trim().toUpperCase() === 'NO') throw new Error('Registro web pausado');
  if (d.sitio) throw new Error('Pedido rechazado');                                   // campo trampa
  var ms = Number(d.msEnPagina);
  if (!(ms >= CFG.SEGURIDAD.MIN_MS_EN_PAGINA)) throw new Error('Pedido rechazado');   // muy rápido o sin dato
  var n = nonceValido(d.nonce);
  if (!n) throw new Error('Pedido rechazado');
  var previo = CacheService.getScriptCache().get('nonce:' + n);
  return previo ? JSON.parse(previo) : null;
}

function controlarLimites(p) {
  var c = CacheService.getScriptCache(), S = CFG.SEGURIDAD;
  if (contador(c, 'tel:' + telClave(p.telefono)).n >= S.MAX_POR_TELEFONO)
    throw new Error('Demasiados pedidos desde este teléfono. Escribinos por WhatsApp.');
  if (contador(c, 'hora').n >= S.MAX_POR_HORA)
    throw new Error('Demasiados pedidos en este momento. Escribinos por WhatsApp.');
}

function registrarEnvio(p, nonce, resp) {
  var c = CacheService.getScriptCache(), S = CFG.SEGURIDAD;
  sumar(c, 'tel:' + telClave(p.telefono), S.VENTANA_TELEFONO_S);
  sumar(c, 'hora', 3600);
  c.put('nonce:' + nonceValido(nonce), JSON.stringify(resp), S.NONCE_S);
}

// Contador con ventana fija: { n: cantidad, hasta: fin de la ventana en ms }
function contador(c, k) {
  var v = c.get(k);
  try { v = v ? JSON.parse(v) : null; } catch (x) { v = null; }
  return v && v.hasta > Date.now() ? v : { n: 0, hasta: 0 };
}
function sumar(c, k, segundos) {
  var v = contador(c, k);
  if (!v.hasta) v.hasta = Date.now() + segundos * 1000;
  v.n++;
  c.put(k, JSON.stringify(v), Math.max(1, Math.ceil((v.hasta - Date.now()) / 1000)));
}
// Últimos 10 dígitos: "+54 9 3825 12-3456", "03825 123456" y "3825123456" cuentan como el mismo número.
function telClave(t) { return String(t).replace(/\D/g, '').slice(-10); }
function nonceValido(n) { n = String(n || ''); return /^[a-f0-9]{16,64}$/.test(n) ? n : ''; }

/* ---------------- Lógica ---------------- */

function validar(d) {
  if (!d || typeof d !== 'object') throw new Error('Pedido inválido');
  if (!Array.isArray(d.items) || d.items.length === 0 || d.items.length > CFG.MAX_ITEMS) throw new Error('Carrito inválido');
  var nombre = txt(d.nombre, 80), tel = txt(d.telefono, 30), dir = txt(d.direccion, 160);
  if (nombre.length < 2) throw new Error('Falta el nombre');
  if (tel.replace(/\D/g, '').length < 8) throw new Error('Teléfono inválido');
  if (dir.length < 5) throw new Error('Falta la dirección');
  if (!CFG.MEDIOS[d.pago]) throw new Error('Medio de pago inválido');
  return {
    items: d.items, nombre: nombre, telefono: tel, direccion: dir,
    referencia: txt(d.referencia, 160), entrega: txt(d.entrega, 40) || 'asap',
    pago: d.pago, obs: txt(d.obs, 300), fueraDeHorario: !!d.fueraDeHorario
  };
}

function calcular(items, catalogo) {
  var lineas = [], total = 0, porciones = 0;
  items.forEach(function (it) {
    var cant = Math.floor(Number(it.cant));
    var pizza = catalogo.filter(function (p) { return p.id === it.id && p.disponible; })[0];
    if (!pizza) throw new Error('Pizza no disponible: ' + it.id);
    if (!(cant >= 1 && cant <= CFG.MAX_CANT)) throw new Error('Cantidad inválida');
    if (it.tam !== 'E' && it.tam !== 'M') throw new Error('Tamaño inválido');
    var unit = it.tam === 'M' ? Math.round(pizza.precio / 2 / CFG.REDONDEO_MITAD) * CFG.REDONDEO_MITAD : pizza.precio;
    lineas.push({ id: pizza.id, nombre: pizza.nombre, tam: it.tam, cant: cant, unit: unit, subtotal: unit * cant });
    total += unit * cant;
    porciones += CFG.PORCIONES[it.tam] * cant;
  });
  return { lineas: lineas, total: total, porciones: porciones };
}

function siguienteId(hoja, fecha) {
  var yymmdd = Utilities.formatDate(fecha, CFG.ZONA, 'yyMMdd');
  var prefijo = CFG.PREFIJO + '-' + yymmdd + '-';
  var n = hoja.getLastRow() - 1;                       // sin la fila de encabezados
  var max = 0;
  if (n > 0) {
    hoja.getRange(2, 1, n, 1).getValues().forEach(function (r) {
      var v = String(r[0]);
      if (v.indexOf(prefijo) === 0) max = Math.max(max, parseInt(v.slice(prefijo.length), 10) || 0);
    });
  }
  return prefijo + ('00' + (max + 1)).slice(-3);
}

/* ---------------- Hojas ---------------- */

function hojaDelMes(fecha) {
  var ss = SpreadsheetApp.getActive();
  var nombre = 'Pedidos ' + Utilities.formatDate(fecha, CFG.ZONA, 'yyyy-MM');
  var h = ss.getSheetByName(nombre);
  if (h) return h;
  h = ss.insertSheet(nombre);
  h.appendRow(CFG.ENCABEZADOS);
  h.getRange(1, 1, 1, CFG.ENCABEZADOS.length).setFontWeight('bold').setBackground('#E83030').setFontColor('#FFFFFF');
  h.setFrozenRows(1);
  h.getRange('J:J').setWrap(true);
  h.getRange('L:L').setNumberFormat('$#,##0');
  h.getRange('M2:M2000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CFG.ESTADOS, true).build());
  h.setColumnWidth(1, 120); h.setColumnWidth(10, 320);
  return h;
}

function leerCatalogo() {
  var h = SpreadsheetApp.getActive().getSheetByName(CFG.HOJA_CATALOGO);
  if (!h) return [];
  var filas = h.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < filas.length; i++) {
    var f = filas[i];
    var id = String(f[0]).trim();
    if (!id) continue;
    out.push({
      id: id,
      nombre: String(f[1]).trim(),
      ingredientes: String(f[2]).trim(),
      precio: Number(f[3]),
      disponible: String(f[4]).trim().toUpperCase() !== 'NO'
    });
  }
  return out.filter(function (p) { return p.nombre && p.precio > 0; });
}

/** Ejecutar UNA vez desde el editor: crea la hoja "Catalogo" con las pizzas actuales. */
function configurarPlanilla() {
  var ss = SpreadsheetApp.getActive();
  var h = ss.getSheetByName(CFG.HOJA_CATALOGO) || ss.insertSheet(CFG.HOJA_CATALOGO, 0);
  if (h.getLastRow() > 1) { SpreadsheetApp.getUi().alert('La hoja Catalogo ya tiene datos. No se modificó.'); return; }
  h.clear();
  var datos = [
    ['id', 'nombre', 'ingredientes', 'precio_entera', 'disponible'],
    ['muzza', 'Muzza', 'Salsa de tomate, mozzarella, orégano y olivas verdes', 8500, 'SI'],
    ['fugazzeta', 'Fugazzeta', 'Salsa de tomate, mozzarella, cebolla rebosada, orégano y olivas verdes', 9500, 'SI'],
    ['napolitana', 'Napolitana', 'Salsa de tomate, mozzarella, tomate, provenzal, orégano y aceitunas verdes', 9500, 'SI'],
    ['especial', 'Especial', 'Salsa de tomate, mozzarella, jamón, morrón, huevo, orégano y aceituna verde', 9500, 'SI'],
    ['doble-muzza', 'Doble Muzza', 'Salsa de tomate, abundante mozzarella, orégano y olivas verdes', 9500, 'SI'],
    ['calabresa', 'Calabresa', 'Salsa de tomate, mozzarella, salame picado grueso, orégano y olivas verdes', 9500, 'SI'],
    ['de-la-casa', 'De la Casa', 'Salsa de tomate, mozzarella, carne picada, huevo y olivas verdes', 10500, 'SI']
  ];
  h.getRange(1, 1, datos.length, 5).setValues(datos);
  h.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#309880').setFontColor('#FFFFFF');
  h.getRange('D2:D100').setNumberFormat('$#,##0');
  h.getRange('E2:E100').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build());
  h.setFrozenRows(1); h.setColumnWidth(2, 140); h.setColumnWidth(3, 460); h.setColumnWidth(4, 110);
  hojaDelMes(new Date());
  SpreadsheetApp.getUi().alert('Listo. Hoja "Catalogo" creada. Ahora publicá el script como aplicación web (ver README).');
}

/* ---------------- Utilidades ---------------- */

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function txt(v, max) { return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
// Evita que una celda se interprete como fórmula (=, +, -, @) al abrir la planilla.
function seguro(v) { v = String(v || ''); return /^[=+\-@]/.test(v) ? "'" + v : v; }
