# Flujo de trabajo

## Ramas (GitHub Flow)

| Rama | Uso |
|---|---|
| `main` | producción: lo que está en `main` se publica solo en GitHub Pages. Nunca se trabaja directo en ella. |
| `feat/<tema>` | funcionalidad nueva |
| `fix/<tema>` | corrección de un error |
| `docs/<tema>` · `ci/<tema>` · `test/<tema>` | documentación, integración continua, pruebas |

Pasos para cualquier cambio:

1. `git checkout -b fix/<tema>` desde `main` actualizado.
2. Commits pequeños (un cambio lógico cada uno).
3. `node --test` en verde antes de subir.
4. *Pull request* hacia `main`. GitHub Actions corre las pruebas en el PR; **si fallan, no se fusiona**.
5. Al fusionar, Actions vuelve a probar y publica el sitio.
6. Cada versión publicada lleva su etiqueta (`v1.2.1`) y una entrada en [`CHANGELOG.md`](CHANGELOG.md).

Se eligió GitHub Flow en lugar de Git Flow (con `develop` y `release/*`) porque hay un solo desarrollador y un único entorno de producción: una rama `develop` duplicaría `main` sin agregar control. La barrera de calidad es el CI en cada PR.

> **Nota de trazabilidad:** hasta la v1.2.0 (06–10/10/2026) se trabajó directamente sobre `main` con commits descriptivos en español, sin convención formal. A partir de la v1.2.1 se aplica este flujo y la convención de abajo.

## Mensajes de commit (Conventional Commits)

```
<tipo>(<alcance opcional>): <qué cambia, en presente>

<por qué, si no es obvio>
```

Tipos: `feat`, `fix`, `docs`, `test`, `ci`, `refactor`, `style`, `chore`.
Ejemplos: `fix(formulario): limitar el largo de los campos igual que el backend` · `docs(api): documentar el contrato del backend`.

## Pruebas

```bash
node --test                      # todas las pruebas
npm run test:cobertura           # con reporte de cobertura
```

Toda regla de negocio nueva va en `site/js/lib.js` (lógica pura, sin DOM) con su prueba en `tests/`. Si cambia un cálculo, cambiarlo **también** en `backend/Code.gs`: `tests/backend.test.js` verifica que ambos den lo mismo.
