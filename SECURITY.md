# Seguridad y configuración

## ¿Hay credenciales en el código?

No. El repositorio no contiene contraseñas, claves de API, tokens ni cadenas de conexión. Lo que aparece en [`site/js/config.js`](site/js/config.js) es información **pública por naturaleza**:

| Dato | Por qué no es un secreto |
|---|---|
| Número de WhatsApp | es el canal de pedidos: se publica para que el cliente escriba |
| Alias de cobro `castro.md` y titular | se muestran al cliente para que pague (igual que en el chat de WhatsApp) |
| URL del backend (`backendUrl`) | la usa el navegador del cliente; cualquier sitio estático la expone |

## ¿Por qué no hay archivo `.env`?

El sitio es **estático** (HTML, CSS y JavaScript que corren en el navegador del cliente). Todo lo que llega al navegador es visible para quien lo abra, así que un `.env` no ocultaría nada: se compilaría dentro del mismo JavaScript. La práctica correcta en este tipo de arquitectura es **no poner secretos del lado del cliente**, y así se hizo.

El único recurso privado es la **planilla de Google Sheets**, que tiene datos personales de los clientes. No se accede con una clave guardada en el código: el script corre con la cuenta de Google del negocio y la planilla no se comparte. La configuración del backend que no debe estar en el código (el interruptor `PEDIDOS_WEB`) se guarda en las **Propiedades del script** de Apps Script, que cumplen el papel de variables de entorno.

## Cómo se protege una URL pública

Como el backend acepta pedidos de cualquiera, se combinan barreras (detalle en [`backend/README.md`](backend/README.md) y [`docs/API.md`](docs/API.md)):

- El **servidor recalcula el total** con los precios de la planilla: modificar el navegador no cambia el importe.
- Validación y límites de tamaño en el servidor y en el formulario (los mismos valores, verificados por [`tests/formulario.test.js`](tests/formulario.test.js)).
- Neutralización de fórmulas (`=`, `+`, `-`, `@`) para evitar inyección en la planilla.
- Escape de HTML en todo lo que se pinta en pantalla (función `esc` en `app.js`).
- Campo trampa, tiempo mínimo en la página, límites por teléfono, por hora y por día, `nonce` contra duplicados e interruptor de pausa.
- Regla de negocio: un pedido solo se prepara si llega por WhatsApp con el mismo ID y, si no es en efectivo, con el comprobante.

## Limitaciones conocidas

- Alguien que lea el código puede imitar un envío válido. Mitigación actual: la confirmación por WhatsApp. Mejora propuesta: Cloudflare Turnstile o reCAPTCHA.
- Las barreras usan la caché de Apps Script (se pierden si Google la limpia antes de tiempo).

## Reportar un problema

Escribir a maximodanielcastro2004@gmail.com o abrir un *issue* sin datos personales.
