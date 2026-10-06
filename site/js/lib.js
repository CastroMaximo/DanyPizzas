/* ============================================================
   LÓGICA PURA (sin DOM): precios, carrito, horarios, ID, recibo.
   Se prueba con `node --test tests/` y se usa en el navegador (window.DanyLib).
   ============================================================ */
(function (root) {
  'use strict';

  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var aMin = function (hhmm) { var p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); };

  /* ---------- Dinero ---------- */
  function pesos(n) {
    var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return '$' + s;
  }

  // La mitad vale la mitad del precio, redondeada hacia arriba al múltiplo de `paso` (500 por defecto).
  function precioMitad(precio, paso) {
    paso = paso || 500;
    return Math.ceil(precio / 2 / paso) * paso;
  }

  function precioUnitario(pizza, tam, cfg) {
    return tam === 'M' ? precioMitad(pizza.precio, cfg.redondeoMitad) : pizza.precio;
  }

  /* ---------- Carrito ----------
     items: [{ id, tam: 'E' | 'M', cant }]  */
  function calcularCarrito(items, catalogo, cfg) {
    var lineas = [], total = 0, porciones = 0, cantidad = 0;
    items.forEach(function (it) {
      var pizza = catalogo.find(function (p) { return p.id === it.id; });
      var cant = Math.floor(Number(it.cant));
      if (!pizza || !(cant > 0) || (it.tam !== 'E' && it.tam !== 'M')) return;
      var unit = precioUnitario(pizza, it.tam, cfg);
      var sub = unit * cant;
      lineas.push({ id: pizza.id, nombre: pizza.nombre, tam: it.tam, cant: cant, unit: unit, subtotal: sub });
      total += sub;
      porciones += cfg.porciones[it.tam] * cant;
      cantidad += cant;
    });
    return { lineas: lineas, total: total, porciones: porciones, cantidad: cantidad };
  }

  /* ---------- Horarios ---------- */
  function partesZona(date, tz) {
    var f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23'
    });
    var o = {};
    f.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    var dows = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { y: +o.year, m: +o.month, d: +o.day, hh: (+o.hour) % 24, mm: +o.minute, dow: dows[o.weekday] };
  }

  // Devuelve { abierto, sesion: 'hoy'|'ayer'|null, cierra, proxima: { dias, hora } | null }
  function estadoLocal(date, cfg) {
    var t = partesZona(date, cfg.zonaHoraria);
    var min = t.hh * 60 + t.mm;
    var hoy = cfg.horarios[t.dow];
    var ayer = cfg.horarios[(t.dow + 6) % 7];

    if (ayer) {
      var oa = aMin(ayer[0]), ca = aMin(ayer[1]);
      if (ca < oa && min < ca) return { abierto: true, sesion: 'ayer', cierra: ayer[1], proxima: null };
    }
    if (hoy) {
      var o = aMin(hoy[0]), c = aMin(hoy[1]);
      if (c < o) {
        if (min >= o) return { abierto: true, sesion: 'hoy', cierra: hoy[1], proxima: null };
        return { abierto: false, sesion: null, cierra: null, proxima: { dias: 0, hora: hoy[0] } };
      }
      if (min >= o && min < c) return { abierto: true, sesion: 'hoy', cierra: hoy[1], proxima: null };
      if (min < o) return { abierto: false, sesion: null, cierra: null, proxima: { dias: 0, hora: hoy[0] } };
    }
    for (var i = 1; i <= 7; i++) {
      var h = cfg.horarios[(t.dow + i) % 7];
      if (h) return { abierto: false, sesion: null, cierra: null, proxima: { dias: i, hora: h[0] } };
    }
    return { abierto: false, sesion: null, cierra: null, proxima: null };
  }

  function textoEstado(est, date, cfg) {
    if (est.abierto) return 'Abierto · hasta las ' + est.cierra;
    if (!est.proxima) return 'Cerrado';
    var t = partesZona(date, cfg.zonaHoraria);
    var cuando = est.proxima.dias === 0 ? 'hoy' : est.proxima.dias === 1 ? 'mañana' : 'el ' + DIAS[(t.dow + est.proxima.dias) % 7];
    return 'Cerrado · abrimos ' + cuando + ' a las ' + est.proxima.hora;
  }

  // Horas de entrega sugeridas (cada `intervalo` min) dentro de la sesión actual o de la próxima.
  function opcionesEntrega(date, cfg, intervalo, demoraMin) {
    intervalo = intervalo || 15; demoraMin = demoraMin === undefined ? 20 : demoraMin;
    var est = estadoLocal(date, cfg);
    var t = partesZona(date, cfg.zonaHoraria);
    var min = t.hh * 60 + t.mm;
    var o, c, ahora = -Infinity, prefijo = '';
    if (est.abierto) {
      var h = est.sesion === 'ayer' ? cfg.horarios[(t.dow + 6) % 7] : cfg.horarios[t.dow];
      o = aMin(h[0]); c = aMin(h[1]);
      ahora = est.sesion === 'ayer' ? min + 1440 : min;
    } else {
      if (!est.proxima) return [];
      var hp = cfg.horarios[(t.dow + est.proxima.dias) % 7];
      o = aMin(hp[0]); c = aMin(hp[1]);
      prefijo = est.proxima.dias === 0 ? '' : est.proxima.dias === 1 ? 'mañana ' : DIAS[(t.dow + est.proxima.dias) % 7] + ' ';
    }
    if (c <= o) c += 1440;
    var start = est.abierto ? Math.max(o, Math.ceil((ahora + demoraMin) / intervalo) * intervalo) : o;
    var out = [];
    for (var x = start; x <= c; x += intervalo) {
      var m = x % 1440;
      out.push(prefijo + pad(Math.floor(m / 60)) + ':' + pad(m % 60));
    }
    return out;
  }

  /* ---------- ID de pedido ---------- */
  var ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function generarId(date, cfg, secuencia, rand) {
    rand = rand || Math.random;
    var t = partesZona(date, cfg.zonaHoraria);
    var fecha = String(t.y).slice(2) + pad(t.m) + pad(t.d);
    var suf;
    if (Number.isInteger(secuencia) && secuencia > 0) suf = String(secuencia).padStart(3, '0');
    else {
      suf = '';
      for (var i = 0; i < 3; i++) suf += ALFABETO[Math.floor(rand() * ALFABETO.length)];
    }
    return cfg.prefijoId + '-' + fecha + '-' + suf;
  }

  /* ---------- Validación ---------- */
  function limpiarTelefono(s) { return String(s || '').replace(/[^\d+]/g, ''); }

  function validarPedido(d, cfg) {
    var e = {};
    if (!d.carrito || d.carrito.cantidad < 1) e.carrito = 'Agregá al menos una pizza.';
    if (!d.nombre || d.nombre.trim().length < 2) e.nombre = 'Escribí tu nombre.';
    var tel = limpiarTelefono(d.telefono).replace(/\D/g, '');
    if (tel.length < 8 || tel.length > 15) e.telefono = 'Revisá el teléfono (con característica, ej. 3825 123456).';
    if (!d.direccion || d.direccion.trim().length < 5) e.direccion = 'Escribí la dirección de entrega (calle y número).';
    var medios = cfg.pago.medios.map(function (m) { return m.id; });
    if (medios.indexOf(d.pago) === -1) e.pago = 'Elegí cómo vas a pagar.';
    return { ok: Object.keys(e).length === 0, errores: e };
  }

  /* ---------- Recibo ---------- */
  function una(s) { return String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  function fechaHora(date, cfg) {
    var t = partesZona(date, cfg.zonaHoraria);
    return pad(t.d) + '/' + pad(t.m) + '/' + t.y + ' ' + pad(t.hh) + ':' + pad(t.mm);
  }

  function medioPago(cfg, id) {
    return cfg.pago.medios.find(function (m) { return m.id === id; }) || { id: id, label: id, requiereComprobante: true };
  }

  function etiquetaTam(tam, cant) {
    if (tam === 'M') return cant === 1 ? 'mitad' : 'mitades';
    return cant === 1 ? 'entera' : 'enteras';
  }

  // p: { id, fecha(Date), nombre, telefono, direccion, referencia, entrega, pago, obs, lineas, total, porciones, fueraDeHorario }
  function armarRecibo(p, cfg) {
    var medio = medioPago(cfg, p.pago);
    var L = [];
    L.push('🍕 *NUEVO PEDIDO · ' + p.id + '*');
    L.push('🗓️ ' + fechaHora(p.fecha, cfg));
    if (p.fueraDeHorario) L.push('⚠️ Pedido hecho fuera de horario de atención');
    L.push('');
    L.push('👤 *Cliente:* ' + una(p.nombre));
    L.push('📞 *Teléfono:* ' + una(p.telefono));
    L.push('📍 *Dirección:* ' + una(p.direccion));
    if (una(p.referencia)) L.push('🧭 *Referencia:* ' + una(p.referencia));
    L.push('🕘 *Entrega:* ' + (p.entrega && p.entrega !== 'asap' ? (/^\d/.test(p.entrega) ? 'A las ' + p.entrega : p.entrega) : 'Lo antes posible (' + cfg.negocio.tiempoEstimado + ')'));
    L.push('');
    L.push('*Detalle del pedido*');
    p.lineas.forEach(function (l) {
      L.push('• ' + l.cant + ' × ' + l.nombre + ' (' + (l.tam === 'M' ? 'mitad' : 'entera') + ') — ' + pesos(l.subtotal));
    });
    L.push('🔢 Porciones: ' + p.porciones);
    L.push('');
    L.push('💰 *Total pizzas: ' + pesos(p.total) + '*');
    L.push('🛵 Envío: se coordina con el repartidor (no incluido)');
    L.push('💳 *Pago:* ' + medio.label);
    if (una(p.obs)) L.push('📝 *Observaciones:* ' + una(p.obs));
    L.push('');
    if (medio.requiereComprobante) {
      L.push('➡️ Te envío el comprobante de pago por este chat (dentro de ' + cfg.pago.minutosComprobante + ' minutos).');
    } else {
      L.push('➡️ Pago en efectivo al recibir el pedido.');
    }
    return L.join('\n');
  }

  function urlWhatsApp(texto, cfg) {
    return 'https://wa.me/' + cfg.negocio.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  var api = {
    DIAS: DIAS, pesos: pesos, precioMitad: precioMitad, precioUnitario: precioUnitario,
    calcularCarrito: calcularCarrito, partesZona: partesZona, estadoLocal: estadoLocal,
    textoEstado: textoEstado, opcionesEntrega: opcionesEntrega, generarId: generarId,
    limpiarTelefono: limpiarTelefono, validarPedido: validarPedido, armarRecibo: armarRecibo,
    urlWhatsApp: urlWhatsApp, medioPago: medioPago, etiquetaTam: etiquetaTam, fechaHora: fechaHora
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.DanyLib = api; }
})(typeof window !== 'undefined' ? window : this);
