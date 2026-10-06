# Publicar Dany Pizzas (paso a paso)

Dirección pública del sitio (dominio gratuito de GitHub Pages):
**https://castromaximo.github.io/DanyPizzas/**
QR listo para imprimir: `docs/qr-sitio.png`

Hay 3 partes. La 1 y la 2 dejan el sitio en internet (≈10 min). La 3 activa la planilla de pedidos (≈10 min, opcional pero recomendada para la exposición).

---

## Parte 1 — Subir el código a GitHub

El repositorio `CastroMaximo/DanyPizzas` ya existe y está vacío. El ZIP **ya trae el commit hecho**, solo falta empujarlo.

```bash
cd ~/Descargas                       # o donde descargaste el ZIP
unzip DanyPizzas_v1_2_repo.zip          # crea la carpeta DanyPizzas/ (con el historial de git)
cd DanyPizzas
git status                           # debe decir: "On branch main ... nothing to commit"
git push -u origin main
```

Cuando pida credenciales:
- **Usuario:** `CastroMaximo`
- **Contraseña:** NO es tu contraseña de GitHub, es un **token**: GitHub → foto de perfil → *Settings* → *Developer settings* → *Personal access tokens* → *Tokens (classic)* → *Generate new token (classic)* → tildá **repo** y **workflow** → *Generate* → copialo y pegalo como contraseña.

> Alternativa sin terminal: en VS Code, *Archivo → Abrir carpeta* → `danypizzas` → panel *Control de código fuente* → **Publicar rama / Sync**. VS Code abre el navegador para iniciar sesión.

> Si `git push` dice *rejected* porque el repo ya tiene algo (por ejemplo un README creado desde la web): `git pull --rebase origin main` y después `git push -u origin main`.

## Parte 2 — Activar GitHub Pages (una sola vez)

1. Entrá a https://github.com/CastroMaximo/DanyPizzas → **Settings** → **Pages**.
2. En *Build and deployment* → *Source*: elegí **GitHub Actions**.
3. Pestaña **Actions** → workflow *Pruebas y publicación* → si no corrió solo, **Run workflow**.
4. Cuando termina en verde (≈1 min), abrí https://castromaximo.github.io/DanyPizzas/

Requisito: el repositorio tiene que ser **público** (Pages gratis no publica repos privados). *Settings → General → Danger Zone → Change visibility* si hiciera falta. No hay datos sensibles en el código: el alias y el WhatsApp ya son públicos para los clientes.

Desde ahora, **cada `git push` a `main` corre las 44 pruebas y, si pasan, publica solo**. Si alguna prueba falla, no se publica (queda la versión anterior).

## Parte 3 — Activar la planilla de pedidos (Google Sheets)

Seguí `backend/README.md` (pasos 1 a 6). Al final tenés una URL que termina en `/exec`. Pegala en `site/js/config.js`:

```js
backendUrl: 'https://script.google.com/macros/s/XXXXXXXX/exec',
```

y publicá:

```bash
git add site/js/config.js
git commit -m "Activar backend de pedidos"
git push
```

Verificación: abrí el sitio, hacé un pedido de prueba → tiene que salir un ID tipo `DP-261013-001` (secuencial, no letras al azar) y aparecer una fila en la hoja `Pedidos 2026-10`.

---

## Checklist de “producto terminado”

- [ ] Sitio abre en https://castromaximo.github.io/DanyPizzas/ desde PC y celular
- [ ] Pestaña Actions en verde
- [ ] Backend desplegado y `backendUrl` cargada
- [ ] Pedido de prueba: ID secuencial + fila en la planilla + mensaje llega al WhatsApp 3825 62-0508
- [ ] Cambiar un precio en la hoja `Catalogo` y verlo reflejado en el sitio
- [ ] QR (`docs/qr-sitio.png`) escaneado con un celular → abre el sitio
- [ ] Capturas para la presentación (sitio publicado, pedido en WhatsApp, fila en la planilla)

## Problemas comunes

| Síntoma | Solución |
|---|---|
| La página da 404 | Esperá 1–2 min después del primer deploy; revisá que Pages esté en *GitHub Actions* y que Actions esté en verde |
| Actions en rojo en “Pruebas” | Abrí el log: alguna prueba falló. Corré `node --test` en tu PC para ver cuál |
| Actions en rojo en “publicar” con error de Pages | Falta el paso 2 de la Parte 2 |
| Los cambios no aparecen | El navegador guardó la versión vieja: Ctrl+Shift+R |
| Sale “No pudimos registrar el pedido en la planilla” | URL del backend mal pegada, o el Apps Script no está implementado con acceso “Cualquier persona” |
