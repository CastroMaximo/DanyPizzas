# Dany Pizzas — Sistema web de pedidos

[![Pruebas y publicación](https://github.com/CastroMaximo/DanyPizzas/actions/workflows/deploy.yml/badge.svg)](https://github.com/CastroMaximo/DanyPizzas/actions/workflows/deploy.yml)

| | |
|---|---|
| **Universidad** | Universidad Nacional de Moquegua · Facultad de Ingenierías · EP de Ingeniería de Sistemas e Informática |
| **Asignatura** | Ingeniería de Software · Comisión A |
| **Docente** | Dr. Alexander Morales Gonzales |
| **Estudiante** | Máximo Daniel Castro |
| **PYME cliente** | Dany Pizzas — Chilecito, La Rioja, Argentina (3 personas, solo envío a domicilio) |
| **Sitio en producción** | **https://castromaximo.github.io/DanyPizzas/** · QR: [`docs/qr-sitio.png`](docs/qr-sitio.png) |

## El problema y la solución

Dany Pizzas tomaba todos sus pedidos conversando por WhatsApp: la carta se reenviaba a mano, el total se sumaba a mano y no quedaba ningún registro. Con un solo celular y una sola persona atendiendo, en las noches fuertes se cometían errores y se perdían pedidos.

El sistema es un sitio web *mobile-first* donde el cliente:

1. **Elige sus pizzas** — entera (8 porciones) o mitad (4), incluido “mitad y mitad”.
2. **Completa sus datos** de entrega y forma de pago (Mercado Pago, transferencia o efectivo).
3. **Confirma**: el sistema calcula el total, asigna un número de pedido `DP-AAMMDD-NNN`, lo registra en una planilla mensual de Google Sheets y abre WhatsApp con el recibo ya redactado.

WhatsApp sigue siendo el centro de la operación del negocio; el sitio ordena lo que antes se hacía a mano. El dueño cambia precios y disponibilidad editando una hoja de cálculo, sin tocar código.

## Entregables

| Entregable | Dónde |
|---|---|
| Presentación de la exposición (20 diapositivas) | [`docs/presentacion/DanyPizzas_Presentacion.pptx`](docs/presentacion/DanyPizzas_Presentacion.pptx) |
| Anexos de la presentación | [`docs/presentacion/DanyPizzas_Anexos.pptx`](docs/presentacion/DanyPizzas_Anexos.pptx) |
| Dossier de transición (sociotécnico, UAT, pase a producción) | [`docs/entregas/Dossier_Transicion_DanyPizzas.pdf`](docs/entregas/Dossier_Transicion_DanyPizzas.pdf) · [`.docx`](docs/entregas/Dossier_Transicion_DanyPizzas.docx) |
| Requisitos funcionales y no funcionales (RF-01…RF-20, RNF-01…RNF-15) con trazabilidad a pruebas | [`docs/analisis/requisitos.md`](docs/analisis/requisitos.md) |
| FODA, matrices EFI/EFE y posición estratégica | [`docs/analisis/foda.md`](docs/analisis/foda.md) |
| Diagrama causa-efecto (Ishikawa) | [`docs/analisis/ishikawa.md`](docs/analisis/ishikawa.md) |
| Memoria descriptiva de la empresa | [`docs/analisis/memoria-descriptiva.md`](docs/analisis/memoria-descriptiva.md) |
| Evaluación económico-financiera (VAN, TIR, B/C, recupero, Monte Carlo) | [`docs/analisis/evaluacion-economica.md`](docs/analisis/evaluacion-economica.md) · script reproducible en [`docs/analisis/economia/`](docs/analisis/economia/) |
| Diagramas UML y C4 (casos de uso, clases, contexto, contenedores, secuencia) | [`diagramas/`](diagramas/README.md) |
| Capturas del sitio (celular y PC) | [`docs/capturas/`](docs/capturas/) |
| Guías técnicas: publicación y backend | [`docs/PUBLICAR.md`](docs/PUBLICAR.md) · [`backend/README.md`](backend/README.md) |

## Arquitectura

```
 Cliente (navegador)  ──HTTPS──▶  Sitio estático (GitHub Pages)
        │                              │  GET catálogo / POST pedido (JSON)
        │                              ▼
        │                    Backend Google Apps Script ──▶ Google Sheets
        │                    (recalcula el total, numera,     (hoja Catalogo +
        │                     protege contra pedidos falsos)   Pedidos AAAA-MM)
        ▼
  WhatsApp del negocio  ◀── enlace wa.me con el recibo
```

| Capa | Tecnología | Archivo |
|---|---|---|
| Configuración del negocio | JavaScript | [`site/js/config.js`](site/js/config.js) |
| Catálogo (respaldo local) | JavaScript | [`site/data/catalogo.js`](site/data/catalogo.js) |
| Lógica de negocio (precios, mitades, horario, validación, recibo) | JavaScript puro, sin dependencias | [`site/js/lib.js`](site/js/lib.js) |
| Interfaz | HTML + CSS + JavaScript | [`site/index.html`](site/index.html) · [`site/js/app.js`](site/js/app.js) · [`site/css/styles.css`](site/css/styles.css) |
| Backend | Google Apps Script | [`backend/Code.gs`](backend/Code.gs) |
| Base de datos | Google Sheets (una hoja por mes) | — |
| Integración y despliegue continuos | GitHub Actions → GitHub Pages | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) |

Decisiones principales: **costo $0** (sin hardware ni servidores propios), **sin cuentas ni contraseñas** para el cliente, **el servidor recalcula el total** con los precios de la planilla (un cliente que manipule el navegador no puede alterar el importe) y **el sitio sigue funcionando si el backend falla** (el pedido llega igual por WhatsApp).

## Calidad

**44 pruebas automáticas** ([`tests/`](tests/)): 26 de la lógica del sitio (precios, mitades, horarios con cruce de medianoche, validación, número de pedido, recibo, enlace de WhatsApp, catálogo) y 18 del backend con Google simulado (que calcule exactamente lo mismo que el sitio, numeración, neutralización de fórmulas y protecciones contra pedidos falsos).

GitHub Actions las ejecuta en cada cambio: **si alguna falla, el sitio no se publica**. Las pruebas de aceptación con el negocio (UAT) están en la sección II del dossier.

## Cómo ejecutarlo

Requisitos: Python 3 para servir el sitio y Node.js 18 o superior para las pruebas. No hay paquetes que instalar.

```bash
git clone https://github.com/CastroMaximo/DanyPizzas.git
cd DanyPizzas

node --test                            # 44 pruebas
python3 -m http.server 8000 -d site    # abrir http://localhost:8000
```

El negocio abre de martes a domingo de 21:00 a 00:30 (hora de Argentina). Para ver el sitio “abierto” en otro horario, se puede simular la hora: `http://localhost:8000/?ahora=2026-10-13T22:00`.

## Estructura

```
site/           sitio publicado (HTML, CSS y JavaScript sin dependencias)
backend/        Google Apps Script y su guía de instalación
tests/          pruebas automáticas (node --test)
diagramas/      UML y C4 (.drawio editable, .mmd, .png, .svg)
docs/analisis/  requisitos, FODA, Ishikawa, memoria descriptiva, evaluación económica
docs/entregas/  dossier de transición
docs/presentacion/  presentación de la exposición, anexos y su generador
docs/capturas/  capturas del sitio
```
