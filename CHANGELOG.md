# Historial de versiones

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones según [SemVer](https://semver.org/lang/es/).

## [1.2.1] — 2026-11-04
### Corregido
- El formulario limita el largo de nombre, teléfono, dirección y referencia igual que el backend (antes el recibo de WhatsApp podía mostrar un nombre más largo que el guardado en la planilla).
### Agregado
- Prueba que compara los límites del formulario con los del backend (50 pruebas en total).
- Reporte de cobertura en CI (`npm run test:cobertura`).
- Documentación de la API ([`docs/API.md`](docs/API.md)), de seguridad ([`SECURITY.md`](SECURITY.md)), del flujo de trabajo ([`CONTRIBUTING.md`](CONTRIBUTING.md)) y guía para auditoría ([`docs/GUIA_AUDITORIA.md`](docs/GUIA_AUDITORIA.md)).

## [1.2.0] — 2026-10-06
### Agregado
- Fotos de Calabresa, De la Casa y Doble Muzza; logo nuevo “DANY PIZZAS”.
- Protección contra pedidos falsos en el backend (campo trampa, tiempo mínimo, límites, `nonce`, interruptor) y 10 pruebas nuevas.
- Publicación en GitHub Pages con pruebas obligatorias en GitHub Actions.
- Backend Google Apps Script + Google Sheets en producción.
### Cambiado
- 07/10: redondeo de mitades al múltiplo de $500 más cercano (empate hacia arriba), confirmado con el negocio.

## [1.0.0] — 2026-10-05
Anterior al repositorio: se entregó como paquete `.zip` y se subió como parte de la 1.2.0.
### Agregado
- Carta, carrito con entera/mitad y “mitad y mitad”, formulario de entrega y pago, recibo y apertura de WhatsApp.
