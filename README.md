# Dany Pizzas — pedidos por WhatsApp

🌐 **Sitio publicado:** https://castromaximo.github.io/DanyPizzas/ · QR: [`docs/qr-sitio.png`](docs/qr-sitio.png)

Sitio web para que los clientes de **Dany Pizzas** (Chilecito, La Rioja) vean las pizzas, armen su pedido y lo envíen por WhatsApp con un recibo listo. Proyecto de Ingeniería de Software.

**Flujo:** elegir pizzas (entera o mitad) → completar datos → *Confirmar pedido* (ID + recibo) → *Enviar por WhatsApp* → pagar (Mercado Pago / transferencia / efectivo) y mandar comprobante → se prepara.

## Probarlo en tu computadora (sin instalar nada raro)
```bash
cd site
python3 -m http.server 8000      # y abrir http://localhost:8000
```
Modo demo (simula la hora de Argentina, útil de día para mostrar "abierto"):
`http://localhost:8000/?ahora=2026-10-13T22:00`

## Pruebas automáticas
```bash
node --test          # Node 18+; no hay que instalar paquetes
```

## Cambiar datos del negocio
Todo en **`site/js/config.js`** (WhatsApp, alias, horarios, tiempo estimado, etc.) y **`site/data/catalogo.js`** (pizzas y precios).
Con el backend activo, los precios se cambian en la hoja `Catalogo` de Google Sheets.

## Publicar (GitHub Pages)
Guía completa paso a paso: **[`docs/PUBLICAR.md`](docs/PUBLICAR.md)**.
1. Subir el repo a GitHub (rama `main`).
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada `git push` corre las pruebas y, si pasan, publica `site/`. La URL queda `https://castromaximo.github.io/DanyPizzas/`.

## Backend (registro mensual de pedidos)
Ver `backend/README.md`.

## Estructura
```
site/        sitio (HTML/CSS/JS sin dependencias)
backend/     Google Apps Script
tests/       pruebas unitarias
diagramas/   UML y C4 (casos de uso, clases, contexto, contenedores, secuencia)
docs/        recursos y documentación
HANDOFF.md   estado del proyecto y decisiones
```
