# Backend mínimo: Google Sheets + Apps Script

Sirve para tres cosas, sin servidor propio y sin costo:
1. **Registrar cada pedido** en una planilla, una hoja por mes (`Pedidos 2026-10`, `Pedidos 2026-11`…).
2. **Dar el ID del pedido** en orden (`DP-261013-001`, `-002`…).
3. **Que el dueño cambie precios** editando la hoja `Catalogo` (sin tocar código).

El sitio funciona igual si esto no está configurado (usa el catálogo local y un ID aleatorio), así que se puede activar después.

## Pasos (10 minutos)

1. Entrá a <https://sheets.google.com> con la cuenta Google del negocio y creá una planilla nueva: **Dany Pizzas – Pedidos**.
2. Menú **Extensiones → Apps Script**. Borrá lo que haya y pegá todo el contenido de `backend/Code.gs`. Guardá (💾).
3. En el selector de funciones (arriba) elegí **`configurarPlanilla`** y tocá **Ejecutar**. Google pide permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (nombre del proyecto) → Permitir*. Al terminar vas a ver las hojas `Catalogo` y `Pedidos AAAA-MM`.
4. **Implementar → Nueva implementación** → engranaje ⚙ → **Aplicación web**:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier persona**
   - **Implementar** y copiá la **URL de la aplicación web** (termina en `/exec`).
5. Abrí `site/js/config.js` y pegá la URL en `backendUrl: '...'`.
6. Probala: abrí en el navegador `LA_URL/exec?action=catalogo` → tiene que mostrar las pizzas en JSON.
7. Publicá el sitio de nuevo (`git add . && git commit -m "Activar backend" && git push`).

## Cómo se usa día a día
- **Cambiar un precio o sacar una pizza:** hoja `Catalogo` → editá `precio_entera` o poné `NO` en `disponible`. El sitio lo toma solo (la mitad se recalcula sola).
- **Ver pedidos:** hoja del mes. La columna **Estado** tiene un menú (Nuevo, Pagado, En preparación, Entregado, Cancelado).
- **Cambié el código de `Code.gs`:** *Implementar → Administrar implementaciones → ✏ editar → Versión: Nueva versión → Implementar*. (Si creás una implementación nueva, la URL cambia y hay que pegarla otra vez en `config.js`.)

## Qué hace el servidor por seguridad
- **Recalcula el total** con los precios de la hoja: aunque alguien modifique el navegador, el total registrado es el correcto.
- Valida campos, limita tamaños y cantidades (máx. 20 por ítem, 30 ítems, 20 KB por pedido).
- Usa un bloqueo para que dos pedidos simultáneos no reciban el mismo ID.
- Evita que un texto como `=SUMA(...)` se ejecute como fórmula en la planilla.

### Protección contra pedidos falsos (v1.2)
La URL del backend es pública (está en el código del sitio), así que se combinan barreras simples. Todas se ajustan en `CFG.SEGURIDAD` de `Code.gs`:

| Barrera | Qué frena | Valor |
|---|---|---|
| Campo trampa (`sitio`) | Bots que completan todos los campos | debe venir vacío |
| Tiempo mínimo en la página | Envíos automáticos instantáneos | ≥ 4 segundos |
| Límite por teléfono | Una persona mandando pedidos en serie | 3 por hora (mismo número en cualquier formato) |
| Límite general | Una avalancha de pedidos | 40 por hora y 150 por día |
| Código único por envío (`nonce`) | Filas duplicadas por doble toque o reintento | se recuerda 10 min |
| Interruptor `PEDIDOS_WEB` | Un ataque en curso | `NO` = deja de registrar |

**Si el backend rechaza un pedido, el cliente no se queda trabado:** el sitio le da un ID igual y abre WhatsApp. Solo no queda la fila en la planilla.

**Regla de negocio (la barrera más fuerte):** un pedido solo se prepara si llega **por WhatsApp con el mismo ID** y, si no es en efectivo, con el comprobante. Si en la planilla aparece una fila que nunca llegó por WhatsApp, poné su Estado en **Descartado**.

**Pausar el registro web** (por ejemplo, si alguien está llenando la planilla de basura): en Apps Script → ⚙ *Configuración del proyecto* → *Propiedades de la secuencia de comandos* → agregar `PEDIDOS_WEB` con valor `NO`. Para reactivarlo, borrala o poné `SI`. No hace falta volver a implementar.

## Límites conocidos (para la exposición y la v2)
- Estas barreras frenan bots y abusos casuales; alguien que lea el código podría imitar un envío válido (por eso la confirmación por WhatsApp sigue siendo obligatoria). Mejora futura: reCAPTCHA / Cloudflare Turnstile, o verificación del teléfono.
- La planilla contiene **datos personales** (nombre, teléfono, dirección): mantenerla privada (no compartir el enlace) y borrarlos si un cliente lo pide.
- Google Apps Script tiene cuotas diarias; para este volumen sobran.
- Si ya habías implementado una versión anterior de `Code.gs`: pegá el nuevo código y hacé *Administrar implementaciones → ✏ → Nueva versión* (la URL no cambia). La hoja del mes ya creada no tiene el estado "Descartado" en el menú: agregalo a mano en *Datos → Validación de datos* o borrá la hoja de prueba.
