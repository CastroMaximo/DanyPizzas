// El formulario no debe dejar escribir más de lo que el backend guarda (backend/Code.gs → validar/txt).
// Si no coinciden, el recibo de WhatsApp mostraría un texto distinto al de la planilla.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8');
const gs = fs.readFileSync(path.join(__dirname, '../backend/Code.gs'), 'utf8');

function maxlengthDe(id) {
  const tag = html.match(new RegExp('<(?:input|textarea)[^>]*id="' + id + '"[^>]*>'));
  assert.ok(tag, 'no existe el campo #' + id);
  const m = tag[0].match(/maxlength="(\d+)"/);
  assert.ok(m, 'el campo #' + id + ' no tiene maxlength');
  return Number(m[1]);
}
function limiteBackend(campo) {
  const m = gs.match(new RegExp('txt\\(d\\.' + campo + ',\\s*(\\d+)\\)'));
  assert.ok(m, 'Code.gs no limita d.' + campo);
  return Number(m[1]);
}

for (const campo of ['nombre', 'telefono', 'direccion', 'referencia', 'obs']) {
  test('formulario: #' + campo + ' tiene el mismo límite que el backend', () => {
    assert.equal(maxlengthDe(campo), limiteBackend(campo));
  });
}

test('formulario: los campos obligatorios están marcados como required', () => {
  for (const id of ['nombre', 'telefono', 'direccion']) {
    assert.match(html, new RegExp('id="' + id + '"[^>]*required'));
  }
});
