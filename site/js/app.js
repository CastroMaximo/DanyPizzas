/* ============================================================
   Interfaz de Dany Pizzas (DOM). La lógica de negocio está en lib.js.
   ============================================================ */
(function () {
  'use strict';
  var CFG = window.DANY_CONFIG, L = window.DanyLib;
  var catalogo = (window.DANY_CATALOGO || []).filter(function (p) { return p.disponible !== false; });
  var carrito = [];          // [{ id, tam, cant }]
  var ultimoFoco = null;
  var timerCuenta = null;
  var cargadoEn = Date.now(); // el backend rechaza envíos hechos a los pocos segundos de abrir la página (bots)

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // Modo demo: ?ahora=2026-10-13T22:00 simula la hora de Argentina (útil para la exposición).
  function ahora() {
    try {
      var p = new URLSearchParams(location.search).get('ahora');
      if (p) { var d = new Date(p + '-03:00'); if (!isNaN(d)) return d; }
    } catch (e) { /* nada */ }
    return new Date();
  }

  /* ---------- Almacenamiento (si el navegador lo bloquea, el sitio igual funciona) ---------- */
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } }
  };

  /* ---------- Estado del local y horarios ---------- */
  function pintarEstado() {
    var d = ahora(), est = L.estadoLocal(d, CFG), el = $('#estado');
    el.textContent = L.textoEstado(est, d, CFG);
    el.className = 'estado ' + (est.abierto ? 'estado--abierto' : 'estado--cerrado');
    return est;
  }

  function pintarHorarios() {
    var orden = [1, 2, 3, 4, 5, 6, 0], hoy = L.partesZona(ahora(), CFG.zonaHoraria).dow;
    $('#horarios').innerHTML = orden.map(function (dia) {
      var h = CFG.horarios[dia], nombre = L.DIAS[dia];
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      return '<li class="' + (dia === hoy ? 'hoy' : '') + '"><span>' + nombre + '</span><span>' + (h ? h[0] + ' a ' + h[1] + ' hs' : 'Cerrado') + '</span></li>';
    }).join('');
  }

  /* ---------- Catálogo ---------- */
  var SVG_PIZZA = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 18c14-9 34-9 48 0L32 58 8 18z"/><circle cx="24" cy="26" r="3.2" fill="currentColor"/><circle cx="38" cy="27" r="3.2" fill="currentColor"/><circle cx="31" cy="39" r="3.2" fill="currentColor"/></svg>';

  function cantidadEnCarrito(id) {
    return carrito.filter(function (i) { return i.id === id; }).reduce(function (a, i) { return a + i.cant * (i.tam === 'E' ? 1 : 0.5); }, 0);
  }

  function pintarCatalogo() {
    var cont = $('#lista');
    if (!catalogo.length) { cont.innerHTML = '<p>Por ahora no hay pizzas disponibles. Escribinos por WhatsApp.</p>'; return; }
    cont.innerHTML = catalogo.map(function (p) {
      var img = p.imagen
        ? '<img src="' + esc(p.imagen) + '" alt="Pizza ' + esc(p.nombre) + '" loading="lazy" width="960" height="600">'
        : '<div class="card__ph" role="img" aria-label="Pizza ' + esc(p.nombre) + '">' + SVG_PIZZA + '</div>';
      return '<article class="card" data-card="' + esc(p.id) + '">' +
        '<div class="card__img">' + img + '<span class="card__en" data-en="' + esc(p.id) + '" hidden></span></div>' +
        '<div class="card__body"><h3 class="card__nombre">' + esc(p.nombre) + '</h3>' +
        '<p class="card__ing">' + esc(p.ingredientes) + '</p>' +
        '<div class="precios">' +
          '<div class="opcion"><span class="opcion__etq">Entera · 8 porc.</span><span class="opcion__precio">' + L.pesos(L.precioUnitario(p, 'E', CFG)) + '</span>' +
            '<button type="button" class="btn btn--primary" data-add="' + esc(p.id) + '" data-tam="E" aria-label="Agregar pizza ' + esc(p.nombre) + ' entera">+ Entera</button></div>' +
          '<div class="opcion"><span class="opcion__etq">Mitad · 4 porc.</span><span class="opcion__precio">' + L.pesos(L.precioUnitario(p, 'M', CFG)) + '</span>' +
            '<button type="button" class="btn btn--suave" data-add="' + esc(p.id) + '" data-tam="M" aria-label="Agregar mitad de pizza ' + esc(p.nombre) + '">+ Mitad</button></div>' +
        '</div></div></article>';
    }).join('');
    marcarEnPedido();
  }

  function marcarEnPedido() {
    $$('[data-en]').forEach(function (el) {
      var n = cantidadEnCarrito(el.getAttribute('data-en'));
      el.hidden = n === 0;
      if (n) el.textContent = (n % 1 === 0 ? n : n.toString().replace('.', ',')) + ' en tu pedido';
    });
  }

  /* ---------- Carrito ---------- */
  function guardarCarrito() { store.set('dany.carrito.v1', carrito); }

  function cargarCarrito() {
    var g = store.get('dany.carrito.v1');
    if (Array.isArray(g)) {
      carrito = g.filter(function (i) { return i && catalogo.some(function (p) { return p.id === i.id; }) && (i.tam === 'E' || i.tam === 'M') && i.cant > 0; })
        .map(function (i) { return { id: i.id, tam: i.tam, cant: Math.min(20, Math.floor(i.cant)) }; });
    }
  }

  function agregar(id, tam) {
    var it = carrito.find(function (i) { return i.id === id && i.tam === tam; });
    if (it) { if (it.cant >= 20) { toast('Para más de 20 de una misma pizza, escribinos por WhatsApp.'); return; } it.cant++; }
    else carrito.push({ id: id, tam: tam, cant: 1 });
    guardarCarrito(); pintarCarrito();
    var p = catalogo.find(function (x) { return x.id === id; });
    toast('Agregaste ' + p.nombre + ' (' + (tam === 'M' ? 'mitad' : 'entera') + ')');
    var bar = $('#cartbar'); bar.classList.remove('cartbar--pop'); void bar.offsetWidth; bar.classList.add('cartbar--pop');
  }

  function cambiar(id, tam, delta) {
    var it = carrito.find(function (i) { return i.id === id && i.tam === tam; });
    if (!it) return;
    it.cant = Math.max(0, Math.min(20, it.cant + delta));
    carrito = carrito.filter(function (i) { return i.cant > 0; });
    guardarCarrito(); pintarCarrito();
  }

  function resumen() { return L.calcularCarrito(carrito, catalogo, CFG); }

  function pintarCarrito() {
    var r = resumen();
    $('#cartbar').hidden = r.cantidad === 0 || !$('#sheet').hidden;
    $('#cartCount').textContent = r.cantidad;
    $('#cartTotal').textContent = L.pesos(r.total);
    $('#totTotal').textContent = L.pesos(r.total);
    $('#totPorciones').textContent = r.porciones;
    $('#vacio').hidden = r.cantidad > 0;
    $('#lineas').innerHTML = r.lineas.map(function (l) {
      return '<li class="linea"><div><div class="linea__n">' + esc(l.nombre) + ' · ' + (l.tam === 'M' ? 'mitad' : 'entera') + '</div>' +
        '<div class="linea__t">' + L.pesos(l.unit) + ' c/u · ' + (CFG.porciones[l.tam] * l.cant) + ' porciones</div></div>' +
        '<div class="linea__p">' + L.pesos(l.subtotal) + '</div>' +
        '<div class="stepper" role="group" aria-label="Cantidad de ' + esc(l.nombre) + ' ' + (l.tam === 'M' ? 'mitad' : 'entera') + '">' +
          '<button type="button" data-menos="' + esc(l.id) + '" data-tam="' + l.tam + '" aria-label="Quitar uno">−</button>' +
          '<span aria-live="polite">' + l.cant + '</span>' +
          '<button type="button" data-mas="' + esc(l.id) + '" data-tam="' + l.tam + '" aria-label="Agregar uno">+</button></div></li>';
    }).join('');

    var mitades = r.lineas.filter(function (l) { return l.tam === 'M'; }).reduce(function (a, l) { return a + l.cant; }, 0);
    var av = $('#avisoMitad');
    if (mitades % 2 === 1) { av.hidden = false; av.textContent = 'Tenés una mitad sola: se prepara media pizza (4 porciones). Si querés una pizza mitad y mitad, sumá otra mitad.'; }
    else if (mitades > 0) { av.hidden = false; av.textContent = 'Tus mitades se arman de a dos: una pizza mitad y mitad.'; }
    else av.hidden = true;

    $('#btnEnviar').disabled = r.cantidad === 0;
    marcarEnPedido();
    if (r.cantidad === 0 && !$('#sheet').hidden && $('#vistaPedido').hidden === false) { /* se queda abierto mostrando "vacío" */ }
  }

  /* ---------- Hoja ---------- */
  function abrirHoja(vista) {
    ultimoFoco = document.activeElement;
    $('#toast').hidden = true;
    $('#sheet').hidden = false;
    $('#cartbar').hidden = true;
    document.body.style.overflow = 'hidden';
    $('#vistaPedido').hidden = vista === 'ok';
    $('#vistaOk').hidden = vista !== 'ok';
    if (vista !== 'ok') prepararFormulario();
    setTimeout(function () { var p = $('.sheet__panel'); p.focus(); p.scrollTop = 0; }, 30);
  }

  function cerrarHoja() {
    $('#sheet').hidden = true;
    document.body.style.overflow = '';
    pintarCarrito();
    if (ultimoFoco && ultimoFoco.focus) { try { ultimoFoco.focus(); } catch (e) { /* nada */ } }
  }

  function prepararFormulario() {
    pintarCarrito();
    var d = ahora(), est = L.estadoLocal(d, CFG);
    var opc = L.opcionesEntrega(d, CFG), sel = $('#entrega'), previo = sel.value;
    sel.innerHTML = '<option value="asap">Lo antes posible (' + CFG.negocio.tiempoEstimado + ')</option>' +
      opc.map(function (h) { return '<option value="' + esc(h) + '">' + (/^\d/.test(h) ? 'A las ' : '') + esc(h) + '</option>'; }).join('');
    if (previo && $$('option', sel).some(function (o) { return o.value === previo; })) sel.value = previo;
    $('#ayudaEntrega').textContent = est.abierto ? 'Los pedidos son para hoy. Si elegís una hora, tratamos de llegar a esa hora.' : (L.textoEstado(est, d, CFG) + '. Tu pedido se prepara cuando abramos.');

    if (!$('#medios').children.length) {
      $('#medios').innerHTML = CFG.pago.medios.map(function (m) {
        return '<label class="medio"><input type="radio" name="pago" value="' + esc(m.id) + '"> <span>' + esc(m.label) + '</span></label>';
      }).join('');
    }
    var c = store.get('dany.cliente.v1');
    if (c) { ['nombre', 'telefono', 'direccion', 'referencia'].forEach(function (k) { if (c[k] && !$('#' + k).value) $('#' + k).value = c[k]; }); if (c.pago && !$('input[name=pago]:checked')) { var r = $('input[name=pago][value="' + c.pago + '"]'); if (r) r.checked = true; } }
    limpiarErrores();
  }

  function limpiarErrores() {
    $$('[data-err]').forEach(function (e) { e.textContent = ''; });
    $$('.campo.invalido').forEach(function (c) { c.classList.remove('invalido'); });
  }

  /* ---------- Backend (Google Apps Script) ---------- */
  function fetchConTimeout(url, opts, ms) {
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    var o = opts || {}; if (ctl) o.signal = ctl.signal;
    return Promise.race([
      fetch(url, o),
      new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms + 200); })
    ]).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }

  function cargarCatalogoRemoto() {
    if (!CFG.backendUrl) return Promise.resolve();
    return fetchConTimeout(CFG.backendUrl + '?action=catalogo', {}, CFG.backendTimeoutMs)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok && Array.isArray(j.catalogo) && j.catalogo.length) {
          var ok = j.catalogo.filter(function (p) { return p && p.id && p.nombre && p.precio > 0 && p.disponible !== false; });
          if (ok.length) {
            var viejo = {}; catalogo.forEach(function (p) { viejo[p.id] = p; });
            catalogo = ok.map(function (p) { return { id: String(p.id), nombre: String(p.nombre), precio: Number(p.precio), ingredientes: String(p.ingredientes || ''), imagen: p.imagen || (viejo[p.id] && viejo[p.id].imagen) || null, disponible: true }; });
            cargarCarrito(); pintarCatalogo(); pintarCarrito();
          }
        }
      })
      .catch(function () { /* se usa el catálogo local */ });
  }

  // Código único por envío: si el mismo pedido llega dos veces (doble toque, reintento), se registra una sola vez.
  function nonce() {
    var a = new Uint8Array(12);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < a.length; i++) a[i] = Math.random() * 256;
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function registrarPedido(payload) {
    if (!CFG.backendUrl) return Promise.resolve(null);
    return fetchConTimeout(CFG.backendUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }, CFG.backendTimeoutMs)
      .then(function (r) { return r.json(); })
      .then(function (j) { return j && j.ok ? j : null; })
      .catch(function () { return null; });
  }

  /* ---------- Confirmar pedido ---------- */
  function onSubmit(ev) {
    ev.preventDefault();
    if ($('#sitio').value) return;                       // un bot completó el campo trampa
    limpiarErrores();
    var d = ahora(), est = L.estadoLocal(d, CFG), r = resumen();
    var datos = {
      carrito: r, nombre: $('#nombre').value, telefono: $('#telefono').value, direccion: $('#direccion').value,
      referencia: $('#referencia').value, entrega: $('#entrega').value, obs: $('#obs').value,
      pago: ($('input[name=pago]:checked') || {}).value || ''
    };
    var v = L.validarPedido(datos, CFG);
    if (!est.abierto && !CFG.permitirFueraDeHorario) { v.ok = false; v.errores.carrito = 'Ahora estamos cerrados. ' + L.textoEstado(est, d, CFG) + '.'; }
    if (!v.ok) {
      Object.keys(v.errores).forEach(function (k) {
        var e = $('[data-err="' + k + '"]'); if (e) e.textContent = v.errores[k];
        var c = e && e.closest('.campo'); if (c) c.classList.add('invalido');
      });
      var primero = $('.campo.invalido input, .campo.invalido select') || $('[data-err="carrito"]');
      if (primero && primero.focus) primero.focus();
      return;
    }

    var btn = $('#btnEnviar'); btn.disabled = true; btn.textContent = 'Confirmando…';
    store.set('dany.cliente.v1', { nombre: datos.nombre, telefono: datos.telefono, direccion: datos.direccion, referencia: datos.referencia, pago: datos.pago });

    var payload = {
      items: carrito.map(function (i) { return { id: i.id, tam: i.tam, cant: i.cant }; }),
      nombre: datos.nombre.trim(), telefono: datos.telefono.trim(), direccion: datos.direccion.trim(), referencia: datos.referencia.trim(),
      entrega: datos.entrega, pago: datos.pago, obs: datos.obs.trim(), fueraDeHorario: !est.abierto,
      totalCliente: r.total, enviadoEn: d.toISOString(),
      // Protección contra pedidos falsos (ver backend/README.md)
      sitio: $('#sitio').value, msEnPagina: Date.now() - cargadoEn, nonce: nonce()
    };

    registrarPedido(payload).then(function (res) {
      var lineas = r.lineas, total = r.total, porciones = r.porciones, id, registrado = false;
      if (res && res.id && Array.isArray(res.lineas) && res.lineas.length) {
        lineas = res.lineas; total = res.total; porciones = res.porciones; id = res.id; registrado = true;
      } else id = L.generarId(d, CFG, null);
      var recibo = L.armarRecibo({
        id: id, fecha: d, nombre: datos.nombre, telefono: datos.telefono, direccion: datos.direccion, referencia: datos.referencia,
        entrega: datos.entrega, pago: datos.pago, obs: datos.obs, lineas: lineas, total: total, porciones: porciones, fueraDeHorario: !est.abierto
      }, CFG);
      mostrarConfirmacion({ id: id, recibo: recibo, total: total, pago: datos.pago, registrado: registrado, hayBackend: !!CFG.backendUrl });
      carrito = []; guardarCarrito(); pintarCarrito();
      btn.textContent = 'Confirmar pedido'; btn.disabled = false;
    });
  }

  function mostrarConfirmacion(o) {
    $('#okId').textContent = o.id;
    var av = $('#okRegistro');
    if (o.hayBackend && !o.registrado) { av.hidden = false; av.textContent = 'No pudimos registrar el pedido en la planilla, pero podés enviarlo igual por WhatsApp.'; }
    else av.hidden = true;
    $('#okRecibo').textContent = o.recibo.replace(/\*/g, '');
    $('#btnWsp').href = L.urlWhatsApp(o.recibo, CFG);

    var medio = L.medioPago(CFG, o.pago), cuerpo = $('#okPagoCuerpo');
    clearInterval(timerCuenta);
    if (medio.requiereComprobante) {
      $('#okPagoTit').textContent = 'Pagá y mandá el comprobante';
      cuerpo.innerHTML =
        '<p>Pagá <strong>' + L.pesos(o.total) + '</strong> con ' + esc(medio.label) + ' a este alias y enviá la captura del comprobante <strong>en el mismo chat de WhatsApp</strong>. Cuando lo recibimos, empezamos a prepararlo.</p>' +
        '<div class="pago-dato"><span>Alias<br><b id="alias">' + esc(CFG.pago.alias) + '</b></span><button type="button" class="btn btn--ghost" id="btnAlias">Copiar</button></div>' +
        '<div class="pago-dato"><span>Titular<br><b style="font-size:1.05rem">' + esc(CFG.pago.titular) + '</b></span><span>' + esc(CFG.pago.banco) + '</span></div>' +
        '<p class="cuenta" id="cuenta" aria-live="off"></p>';
      var fin = Date.now() + CFG.pago.minutosComprobante * 60000, c = $('#cuenta');
      var tick = function () {
        var s = Math.max(0, Math.round((fin - Date.now()) / 1000));
        if (s === 0) { c.className = 'cuenta cuenta--fin'; c.textContent = 'Se terminó el tiempo. Escribinos por WhatsApp para confirmar si todavía podemos preparar tu pedido.'; clearInterval(timerCuenta); return; }
        c.textContent = 'Tenés ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' para enviar el comprobante';
      };
      tick(); timerCuenta = setInterval(tick, 1000);
    } else {
      $('#okPagoTit').textContent = 'Pagás al recibir';
      cuerpo.innerHTML = '<p>Tené preparado <strong>' + L.pesos(o.total) + '</strong> en efectivo para cuando llegue el pedido. No hace falta mandar comprobante. Recordá que el envío se acuerda con el repartidor.</p>';
    }
    abrirHoja('ok');
  }

  /* ---------- Utilidades ---------- */
  var toastT;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function copiar(texto, aviso) {
    var fin = function () { toast(aviso); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(fin, function () { copiarViejo(texto); fin(); });
    else { copiarViejo(texto); fin(); }
  }
  function copiarViejo(texto) {
    var t = document.createElement('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { /* nada */ } document.body.removeChild(t);
  }

  /* ---------- Eventos ---------- */
  function enlazar() {
    $('#lista').addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]'); if (b) agregar(b.getAttribute('data-add'), b.getAttribute('data-tam'));
    });
    $('#lineas').addEventListener('click', function (e) {
      var m = e.target.closest('[data-menos]'), p = e.target.closest('[data-mas]');
      if (m) cambiar(m.getAttribute('data-menos'), m.getAttribute('data-tam'), -1);
      if (p) cambiar(p.getAttribute('data-mas'), p.getAttribute('data-tam'), 1);
    });
    $('#btnCarrito').addEventListener('click', function () { abrirHoja('pedido'); });
    $$('[data-cerrar]').forEach(function (b) { b.addEventListener('click', cerrarHoja); });
    document.addEventListener('keydown', function (e) {
      if ($('#sheet').hidden) return;
      if (e.key === 'Escape') cerrarHoja();
      if (e.key === 'Tab') {                              // mantener el foco dentro de la hoja
        var f = $$('button:not([disabled]), a[href], input:not([tabindex="-1"]), select, textarea, summary', $('.sheet__panel')).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    $('#form').addEventListener('submit', onSubmit);
    $('#form').addEventListener('input', function (e) { var c = e.target.closest('.campo'); if (c) { c.classList.remove('invalido'); var er = $('[data-err]', c); if (er) er.textContent = ''; } });
    $('#okPagoCuerpo').addEventListener('click', function (e) { if (e.target.id === 'btnAlias') copiar(CFG.pago.alias, 'Alias copiado'); });
    $('#btnCopiar').addEventListener('click', function () { copiar($('#okRecibo').textContent, 'Mensaje copiado'); });
    $('#btnNuevo').addEventListener('click', function () { clearInterval(timerCuenta); cerrarHoja(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- Inicio ---------- */
  function iniciar() {
    $('#tiempo').textContent = CFG.negocio.tiempoEstimado;
    $('#lnkWsp').href = 'https://wa.me/' + CFG.negocio.whatsapp;
    $('#wspTxt').textContent = CFG.negocio.whatsappVisible;
    $('#lnkIg').href = CFG.negocio.instagram;
    cargarCarrito(); pintarEstado(); pintarHorarios(); pintarCatalogo(); pintarCarrito(); enlazar();
    setInterval(pintarEstado, 30000);
    cargarCatalogoRemoto();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
