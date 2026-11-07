# API del backend — Dany Pizzas

Backend: **Google Apps Script** publicado como aplicación web ([`backend/Code.gs`](../backend/Code.gs)).
Datos: **Google Sheets** (hoja `Catalogo` + una hoja `Pedidos AAAA-MM` por mes).

| | |
|---|---|
| URL base | la de `backendUrl` en [`site/js/config.js`](../site/js/config.js) (termina en `/exec`) |
| Formato | JSON (UTF-8) |
| Autenticación | ninguna: la URL es pública por diseño (ver [Seguridad](../SECURITY.md)) |
| Versión | 1.2 |

> Apps Script responde siempre **HTTP 200**, incluso ante un error. El resultado se lee en el campo `ok` del cuerpo.

---

## 1. `GET ?action=catalogo` — leer el catálogo

Devuelve las pizzas de la hoja `Catalogo` (las que el dueño marca con `Disponible = NO` vienen con `disponible: false`).

```bash
curl -L "$URL?action=catalogo"
```

**Respuesta**
```json
{
  "ok": true,
  "catalogo": [
    { "id": "muzza", "nombre": "Muzza", "ingredientes": "salsa de tomate, mozzarella, orégano, olivas verdes", "precio": 8500, "disponible": true }
  ]
}
```

`GET` sin parámetros devuelve `{ "ok": true, "mensaje": "Dany Pizzas: backend activo" }` (sirve como chequeo de salud).

Si falla o tarda más de 6 s, el sitio usa el catálogo local ([`site/data/catalogo.js`](../site/data/catalogo.js)).

---

## 2. `POST` — registrar un pedido

Se envía con `Content-Type: text/plain;charset=utf-8` (evita la consulta CORS *preflight*, que Apps Script no responde). El cuerpo es JSON.

**Solicitud**
```json
{
  "items": [
    { "id": "muzza", "tam": "E", "cant": 2 },
    { "id": "fugazzeta", "tam": "M", "cant": 1 }
  ],
  "nombre": "Juan Pérez",
  "telefono": "3825 123456",
  "direccion": "San Martín 123",
  "referencia": "portón negro",
  "entrega": "asap",
  "pago": "efectivo",
  "obs": "sin olivas",
  "fueraDeHorario": false,
  "totalCliente": 22000,
  "enviadoEn": "2026-10-10T01:15:00.000Z",
  "sitio": "",
  "msEnPagina": 45000,
  "nonce": "3f9a0c1b2d4e5f6a7b8c9d0e"
}
```

| Campo | Tipo | Regla |
|---|---|---|
| `items` | lista (1 a 30) | `id` del catálogo y disponible · `tam` = `E` (entera) o `M` (mitad) · `cant` entero de 1 a 20 |
| `nombre` | texto | 2 a 80 caracteres |
| `telefono` | texto | hasta 30 caracteres, al menos 8 dígitos |
| `direccion` | texto | 5 a 160 caracteres |
| `referencia` | texto | opcional, hasta 160 |
| `entrega` | texto | `asap` o una hora `HH:MM`, hasta 40 |
| `pago` | texto | `mp`, `transferencia` o `efectivo` |
| `obs` | texto | opcional, hasta 300 |
| `fueraDeHorario` | booleano | informativo |
| `totalCliente` | número | **se ignora**: el servidor recalcula el total con los precios de la planilla |
| `sitio` | texto | campo trampa: debe venir vacío |
| `msEnPagina` | número | milisegundos desde que se abrió la página: mínimo 4000 |
| `nonce` | texto | 16 a 64 caracteres hexadecimales, único por envío |

Límite del cuerpo: 20.000 caracteres. Los saltos de línea se reemplazan por espacios y los textos que empiezan con `= + - @` se guardan como texto (no como fórmula).

**Respuesta correcta**
```json
{
  "ok": true,
  "id": "DP-261010-001",
  "total": 22000,
  "porciones": 20,
  "lineas": [
    { "id": "muzza", "nombre": "Muzza", "tam": "E", "cant": 2, "unit": 8500, "subtotal": 17000 },
    { "id": "fugazzeta", "nombre": "Fugazzeta", "tam": "M", "cant": 1, "unit": 5000, "subtotal": 5000 }
  ]
}
```

El `id` es secuencial por día: `DP-AAMMDD-NNN`. Si se reenvía el mismo `nonce` dentro de 10 minutos, se devuelve la misma respuesta y **no** se agrega otra fila.

**Respuesta con error**
```json
{ "ok": false, "error": "Teléfono inválido" }
```

| Mensaje de `error` | Causa |
|---|---|
| `Pedido inválido` | el cuerpo no es un objeto JSON |
| `Pedido demasiado grande` | más de 20.000 caracteres |
| `Carrito inválido` | `items` vacío, no es lista o tiene más de 30 |
| `Falta el nombre` · `Teléfono inválido` · `Falta la dirección` · `Medio de pago inválido` | validación de datos |
| `Pizza no disponible: <id>` · `Cantidad inválida` · `Tamaño inválido` | validación del carrito |
| `Pedido rechazado` | campo trampa completo, envío en menos de 4 s o `nonce` inválido |
| `Demasiados pedidos desde este teléfono…` | más de 3 por hora del mismo número |
| `Demasiados pedidos en este momento…` | más de 40 por hora en total |
| `Se alcanzó el límite de pedidos web de hoy` | más de 150 en el día |
| `Registro web pausado` | propiedad `PEDIDOS_WEB = NO` |

**Comportamiento del sitio ante un error:** el cliente no se queda trabado. El sitio genera un ID local (`DP-AAMMDD-XXX`) y abre WhatsApp igual; solo falta la fila en la planilla.

---

## 3. Probar la API

- **Automáticamente:** [`tests/backend.test.js`](../tests/backend.test.js) ejecuta `Code.gs` con Google simulado (18 pruebas: cálculo, numeración, fórmulas, límites y duplicados).
- **A mano:** el `curl` de la sección 1 contra la URL real. Para el `POST`, usar una herramienta como Postman con el ejemplo de arriba **y después marcar la fila como `Descartado`** en la planilla (es la base de datos real del negocio).

Diagrama de secuencia del pedido: [`diagramas/secuencia-pedido.png`](../diagramas/secuencia-pedido.png).
