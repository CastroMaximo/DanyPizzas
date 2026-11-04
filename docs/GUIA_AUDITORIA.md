# Guía para la auditoría — Dany Pizzas

Material para el compañero que audita el proyecto (Ingeniería de Software · Auditoría de desarrollo y calidad cruzada).

## 1. Material entregado

| Qué | Dónde |
|---|---|
| Repositorio | https://github.com/CastroMaximo/DanyPizzas |
| Aplicación en producción | https://castromaximo.github.io/DanyPizzas/ (sin instalación; celular o PC) |
| Requisitos RF-01…RF-20 y RNF-01…RNF-15 con trazabilidad a pruebas | [`docs/analisis/requisitos.md`](analisis/requisitos.md) |
| Arquitectura (C4 contexto y contenedores, clases, casos de uso, secuencia) | [`diagramas/`](../diagramas/README.md) y sección *Arquitectura* del [README](../README.md) |
| API del backend | [`docs/API.md`](API.md) |
| Seguridad y configuración | [`SECURITY.md`](../SECURITY.md) |
| Flujo de trabajo y convención de commits | [`CONTRIBUTING.md`](../CONTRIBUTING.md) · [`CHANGELOG.md`](../CHANGELOG.md) |
| Pruebas de aceptación con el negocio (UAT) | sección II de [`docs/entregas/Dossier_Transicion_DanyPizzas.pdf`](entregas/Dossier_Transicion_DanyPizzas.pdf) |
| Ejecuciones de CI | https://github.com/CastroMaximo/DanyPizzas/actions |

**Credenciales:** el cliente no necesita cuenta ni contraseña (decisión de diseño, RNF de usabilidad). El "panel del dueño" es la planilla de Google Sheets: **no se comparte el enlace** porque contiene datos personales de clientes reales; se muestra en vivo durante la sesión, junto con el editor de Apps Script.

## 2. Ejecutar desde cero

```bash
git clone https://github.com/CastroMaximo/DanyPizzas.git
cd DanyPizzas
node --test                          # 50 pruebas (Node 18+, sin instalar paquetes)
npm run test:cobertura               # con cobertura
python3 -m http.server 8000 -d site  # abrir http://localhost:8000
```

El negocio abre martes a domingo de 21:00 a 00:30 (hora de Argentina). Para probar en otro horario se simula la hora con el parámetro `?ahora=`:

| URL | Qué se ve |
|---|---|
| `/?ahora=2026-11-04T22:00` | abierto (miércoles 22:00) |
| `/?ahora=2026-11-05T00:20` | abierto, faltan 10 min para cerrar (cruce de medianoche) |
| `/?ahora=2026-11-02T22:00` | cerrado: lunes |
| `/?ahora=2026-11-04T15:00` | cerrado: de día (deja armar el pedido y avisa) |

> ⚠️ En el sitio publicado **cada pedido confirmado se registra en la planilla real y abre el WhatsApp del negocio.** Para pruebas de esquina conviene usar la copia local (sin backend: dejar `backendUrl: ''` en `site/js/config.js`) o avisar antes; las filas de prueba se marcan `Descartado`.

## 3. Casos de prueba sugeridos

| # | Caso | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Camino feliz | 1 Muzza entera + mitad Napolitana, datos completos, efectivo | Total $13.500, ID `DP-AAMMDD-NNN`, WhatsApp con el recibo |
| 2 | Mitad y mitad | Mitad Muzza + mitad Fugazzeta | $4.500 + $5.000 = $9.500 |
| 3 | Carrito vacío | Abrir el pedido sin pizzas | Botón *Confirmar* deshabilitado |
| 4 | Campos vacíos | Confirmar sin datos | 4 mensajes de error junto a cada campo y foco en el primero |
| 5 | Solo espacios | Nombre = "   " | "Escribí tu nombre." |
| 6 | Teléfono inválido | `abc123` | "Revisá el teléfono…" |
| 7 | Límite de cantidad | Tocar `+` más de 20 veces | Se detiene en 20 |
| 8 | Texto largo | Pegar 600 caracteres en el nombre | Se corta en 80 (igual que la planilla) |
| 9 | Inyección HTML | Nombre `<img src=x onerror=alert(1)>` | No se ejecuta (no aparece ninguna alerta); llega como texto al recibo |
| 10 | Inyección de fórmula | Dirección `=HYPERLINK("http://x")` | En la planilla queda como texto |
| 11 | Doble toque | Tocar *Confirmar* dos veces rápido | Una sola fila (botón se bloquea + `nonce`) |
| 12 | Backend caído | Bloquear `script.google.com` en DevTools | Se confirma igual con ID local `DP-AAMMDD-XXX` y el botón de WhatsApp lleva el recibo |
| 13 | Manipular el precio | Cambiar `totalCliente` en el `POST` | La planilla registra el total calculado por el servidor |
| 14 | Bot rápido | `POST` con `msEnPagina: 100` | `{ ok: false, error: "Pedido rechazado" }` |
| 15 | Responsive | 360 px, 390 px, 768 px, 1366 px | Sin desbordes; carrito como panel inferior en celular |

## 4. Limitaciones conocidas (declaradas)

1. **Historial de Git:** hasta la v1.2.0 se trabajó directo en `main` sin convención de commits; desde la v1.2.1 se usa GitHub Flow con PR y Conventional Commits ([`CONTRIBUTING.md`](../CONTRIBUTING.md)).
2. **Sin pruebas end-to-end en el repositorio:** el flujo en navegador se probó con Playwright durante el desarrollo, pero esos scripts no quedaron versionados. Las 50 pruebas automáticas cubren la lógica (cobertura de líneas ≈ 99 % en `lib.js`, `config.js` y `catalogo.js`) y el backend simulado; `app.js` (interfaz) no tiene cobertura automática.
3. **Backend con URL pública:** las barreras frenan bots y abusos casuales, no a alguien decidido (ver [`SECURITY.md`](../SECURITY.md)). La validación final es humana: sin WhatsApp y comprobante, no se prepara.
4. **Uso real limitado:** al 13/10 hubo pedidos de prueba, no uso sostenido de clientes.
5. **Acciones de GitHub con Node 20 deprecado:** funcionan (GitHub las ejecuta con Node 24), pendiente actualizar versiones.
