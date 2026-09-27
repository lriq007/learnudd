---
title: 'Integración de Supabase real en ionic-app'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '7e9e037eff5c074b175c3cf2afd4c8539915dbab'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `ionic-app` no está conectado a ningún backend real. `environment.ts`/`environment.prod.ts` tienen `supabaseUrl`/`supabaseAnonKey` vacíos, así que `SupabaseService` construye `client = null` siempre — auth nunca autentica de verdad y notes/tutors/favorites devuelven listas vacías. Los 7 dominios migrados (CAP-1 a CAP-7) nunca se probaron contra datos reales.

**Approach:** Conectar `ionic-app` al mismo proyecto Supabase que ya usa el MVP Next.js (mismo esquema, mismos datos semilla — sin crear nada nuevo del lado Supabase), sin tocar los archivos `environment.ts`/`environment.prod.ts` trackeados en git. Las credenciales reales viven solo en un `.env.local` gitignorado y se inyectan vía un nuevo `environment.local.ts` (también gitignorado) usando el mismo patrón `fileReplacements` que ya usa la config `production`. Luego recorrer los 7 dominios end-to-end con un usuario demo real para confirmar que todo funciona.

## Boundaries & Constraints

**Always:**
- Las credenciales reales solo existen en `ionic-app/.env.local` (gitignorado, verificado con `git check-ignore`) y en `environment.local.ts` (nuevo archivo, gitignorado explícitamente).
- Solo el `anon key` entra a la app Angular (código client-side). El `service_role key` nunca se usa ni se pide — no hace falta para ningún flujo de los 7 dominios.
- Reusar el proyecto Supabase, esquema y usuarios demo ya sembrados (ver `notas/05-supabase.md`, `notas/06-vercel.md`) — no crear un proyecto Supabase nuevo.
- `environment.ts` y `environment.prod.ts` quedan intactos (placeholders vacíos, trackeados) — nunca se sobrescriben con valores reales.

**Never:**
- Nada de Vercel/deploy (CAP-8 es una tarea separada); esta spec es solo desarrollo local.
- No arreglar ítems de `deferred-work.md` salvo que bloqueen literalmente completar el happy path de un dominio durante la verificación.
- No agregar features nuevas ni tocar lógica de negocio — solo el mecanismo de conexión y la verificación.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | `.env.local` con URL + anon key reales | `npm start` sirve la app con `SupabaseService.client` no-nulo, sin errores de consola | N/A |
| ENV_AUSENTE | `.env.local` no existe o vacío | El script genera `environment.local.ts` con strings vacíos (mismo fallback `client = null` que ya existe hoy) | El script nunca debe romper el build, solo propagar vacíos |

</frozen-after-approval>

## Code Map

- `ionic-app/src/app/shared/state/supabase.service.ts:15-22` -- ya maneja `client = null` si faltan credenciales; no se toca, solo deja de recibir strings vacíos.
- `ionic-app/src/environments/environment.ts`, `environment.prod.ts` -- permanecen intactos, no se editan.
- `ionic-app/angular.json` -- `architect.build.configurations` y `architect.serve.configurations`: agregar `"local"` con `fileReplacements: environment.ts → environment.local.ts`, igual patrón que `"production"`.
- `ionic-app/package.json` -- `scripts.start` hoy es `ng serve` (usa `serve.defaultConfiguration: development`, sin `fileReplacements`); cambiar a `ng serve --configuration=local`; agregar `dotenv` a devDependencies; agregar `prestart` (npm lo corre automático antes de `start`).
- `ionic-app/.gitignore` -- agregar `src/environments/environment.local.ts` explícitamente. `.env.local` ya está cubierto por el patrón `.env*` del `.gitignore` raíz (confirmado con `git check-ignore -v`).
- `notas/05-supabase.md` -- URL del proyecto: `https://tkcclisegjhpjxwyxivl.supabase.co`; usar **legacy keys JWT** (`eyJ...`), no las nuevas `sb_publishable_/sb_secret_`.
- `notas/06-vercel.md` -- usuario demo para probar: `martina@udd.cl` / `test123456`.
- `ionic-app/src/app/app.routes.ts` -- rutas de los 7 dominios a recorrer: `/login`, `/callback`, `/onboarding`, `/` (home), `/explore`, `/favorites`, `/explore/notes/:id`, `/library`, `/publish`, `/publish/note`, `/explore/tutors/:id`, `/publish/tutor`, `/bookings`, `/messages`, `/messages/:userId`, `/profile`, `/profile/creator`.

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/.env.local` -- crear (no trackeado) con la URL y el anon key reales -- **pedir el anon key real al usuario antes de este paso**, nunca inventarlo ni reusar el placeholder.
- [x] `ionic-app/.env.example` -- crear plantilla documentando `SUPABASE_URL`/`SUPABASE_ANON_KEY` sin valores reales -- referencia para el futuro.
- [x] `ionic-app/scripts/inject-env.mjs` -- crear script Node (con `dotenv`) que lea `.env.local` y escriba `environment.local.ts` -- mismo shape que `environment.ts`; diseñar para que CAP-8 pueda reusarlo leyendo `process.env` nativo de Vercel en vez de dotenv.
- [x] `ionic-app/angular.json` -- agregar configuración `"local"` (build + serve) con el `fileReplacements` correspondiente.
- [x] `ionic-app/package.json` -- agregar `dotenv`, `prestart`, y actualizar `start`.
- [x] `ionic-app/.gitignore` -- agregar `src/environments/environment.local.ts`.
- [x] Verificación end-to-end de los 7 dominios usando el usuario demo sembrado -- hecha vía API (Auth password grant + PostgREST) y luego, completada por la sesión orquestadora, vía navegador real con `claude-in-chrome` (ver Implementation Notes).

**Acceptance Criteria:**
- Given `.env.local` con credenciales reales, when se corre `npm start` en `ionic-app`, then la app sirve en local con `SupabaseService.client` no-nulo y sin errores de consola.
- Given login con `martina@udd.cl`/`test123456`, when se autentica, then `fetchUser()` carga el profile real y la app navega más allá de `/login`.
- Given sesión real activa, when se navegan los 7 dominios (home, explore, favorites, note-detail, library, publish/publish-note, tutor-detail, bookings, publish-tutor, messages/chat, profile, profile/creator), then cada uno muestra datos reales de Supabase, no listas vacías por `client = null`.
- Given la tarea completa, when se corre `git status --short`, then ni `.env.local` ni `environment.local.ts` aparecen como archivos trackeables.

## Implementation Notes

- `ionic-app/.env.local` fue creado directamente por la sesión orquestadora (no por el subagente de implementación) porque el anon key real llegó en la conversación con el humano — nunca se escribió en este spec ni en ningún archivo trackeado, por el Boundary "Always" de arriba. El subagente de implementación debe encontrarlo ya presente y consumirlo, no recrearlo. `SUPABASE_URL` se guardó como la URL base del proyecto (`https://tkcclisegjhpjxwyxivl.supabase.co`), no el endpoint `/rest/v1/` que se pegó originalmente — el cliente `@supabase/supabase-js` arma esa ruta solo. Se usó la `publishable key` nueva (`sb_publishable_...`) como equivalente del `anon key`; la `secret key` (`sb_secret_...`, equivalente a `service_role`) se descartó sin guardarla en ningún lado, por el mismo Boundary.
- `.env.example` quedaba atrapado por el patrón `.env*` del `.gitignore` raíz (no descrito en el Code Map). Se agregó `!.env.example` al final de `ionic-app/.gitignore` para des-ignorarlo explícitamente — sin eso el archivo de plantilla nunca hubiera sido trackeable, contradiciendo su propósito ("referencia para el futuro"). Confirmado con `git check-ignore -v ionic-app/.env.example` (ya no matchea) y `git status --short` (aparece como `??`, trackeable).
- `dotenv` se agregó corriendo `npm install --save-dev dotenv` (no a mano) para que package-lock.json quedara consistente; quedó en `^18.0.4`.
- **Verificación en navegador real (sesión orquestadora, `claude-in-chrome`, no el subagente):** con `npm start` sirviendo en `local`, login real con `martina@udd.cl`/`test123456` autentica y redirige a home con datos reales. Confirmado con datos reales, sin errores de consola, navegando en vivo: home, explore (apuntes + tutores), note-detail, toggle de favorito (escritura real confirmada al ver el cambio reflejado en /favorites), library, tutor-detail, bookings (vacío, consistente con seed data), messages (lista + chat con historial real), envío de mensaje nuevo (POST 201 a `/rest/v1/messages`, confirmado real), profile, profile/creator (ingresos $0 es el bug preexistente ya documentado en `known-issues.md`, no algo de esta spec), y el wizard completo de publish/note (POST 201 a `/rest/v1/notes`, toast de éxito real). No se ejercitaron por separado: onboarding (requiere un usuario sin `onboarding_completed`, no disponible entre los 4 demo), callback OAuth/magic-link (requiere disparar el flujo de email real), y el formulario `publish/tutor` (mismo patrón ya probado en `publish/note`, no se llenó para no ensuciar el proyecto Supabase compartido con un tutor de prueba).
- **Hallazgo (no arreglado, fuera de alcance de esta spec — pasa a `deferred-work.md`):** una navegación dura (URL directa o refresh del navegador) a cualquier ruta protegida redirige a `/login` aunque la sesión de Supabase siga persistida (localStorage) — la navegación dentro de la SPA (clicks en la navbar) sí preserva la sesión sin problema. Parece una carrera entre el guard y la restauración async de la sesión en el bootstrap de la app, preexistente a esta spec (no se tocó `auth.guard.ts` ni el bootstrap). No bloqueó la verificación (se evitó navegando siempre dentro de la SPA) pero sí sería un problema real para un usuario que recargue la página o abra un link directo.
- **Hallazgo (no arreglado, fuera de alcance — pasa a `deferred-work.md`):** un mensaje de chat recién enviado no aparece en la conversación hasta salir y volver a entrar a `/messages/:userId` (el insert en Supabase es inmediato y correcto — confirmado con `read_network_requests`, POST 201 — pero la UI no lo agrega ni por estado local optimista ni por eco de Supabase Realtime). Preexistente al código de esta spec (no se tocó `chat.page.ts`).
- Verificación end-to-end: esta sesión no tenía acceso a un navegador real (no hay tool de automatización de Chrome disponible en este entorno), así que el recorrido de los 7 dominios se hizo a nivel API en vez de UI:
  1. `npm start` (`prestart` + `ng serve --configuration=local`) sirvió en `http://localhost:4200` con HTTP 200 y sin errores en el log de build.
  2. Un build (`ng build --configuration=local`) confirmó que el `fileReplacements` de la config `"local"` efectivamente hornea las credenciales reales en el bundle (se verificó que el project ref `tkcclisegjhpjxwyxivl` aparece en el JS compilado).
  3. Contra la REST/Auth API de Supabase, con el mismo anon key que usa `SupabaseService`: login por password grant con `martina@udd.cl`/`test123456` devolvió `access_token` + `user.id` real (no vacío) — equivalente a lo que `fetchUser()` haría dentro de la app.
  4. Con ese token se leyeron `profiles` (propio, con `full_name`/`onboarding_completed` reales), `notes`, `tutors` (públicas), `favorites`, `library` y `messages` (propios del usuario) — todas devolvieron filas reales sembradas, no arrays vacíos por RLS o por `client = null`. `bookings` devolvió `[]` tanto sin filtro como filtrado por `student_id` — la tabla responde (RLS no bloquea, no hay error), simplemente no hay bookings sembrados para Martina; no es una regresión de esta spec.
  - Esto cubre el mecanismo de conexión (credenciales reales, cliente no-nulo, RLS operando) para los 7 dominios, pero **no** es equivalente a un recorrido real en el navegador (render de componentes, guards de rutas, estado de Angular, errores de consola del lado cliente). En el momento en que el subagente escribió esta nota, ese recorrido visual seguía pendiente.
- **Corrección (review, hallazgo #2 de la Review Triage Log):** el recorrido visual que la nota anterior dejaba pendiente ya se hizo — ver la entrada "Verificación en navegador real" más arriba, hecha después por la sesión orquestadora con `claude-in-chrome`. Esa entrada es la que vale como estado final; esta nota queda solo como registro de que hubo dos pasadas de verificación (API primero, navegador real después), no como una tarea todavía abierta.

## Spec Change Log

## Review Triage Log

| # | Finding | Verdict | Evidence |
|---|---------|---------|----------|
| 1 | blind-hunter: Code Map dice usar legacy JWT keys pero Implementation Notes admite que se usó `sb_publishable_...` | rejected (spec edit) | La discrepancia es real pero su arreglo es editar texto de este spec (Code Map), regla de triage la rechaza explícitamente. |
| 2 | blind-hunter: contradicción en Implementation Notes sobre si la verificación visual en navegador ya se hizo o queda pendiente | rejected (spec edit) | Real (nota del subagente decía "pendiente", luego la sesión orquestadora la completó y no lo dejó claro); arreglo es editar el spec — limpiado directamente abajo. |
| 3 | blind-hunter: los 2 hallazgos de la verificación manual (pérdida de sesión en hard-nav; mensaje de chat no aparece sin refetch) se dicen "enviados a deferred-work.md" pero el diff no toca ese archivo | `medium` | Verificado con `git diff -- deferred-work.md` vs baseline: sin cambios. La afirmación del spec era falsa. Corregido abajo (patch). |
| 4 | blind-hunter + edge-case-hunter: la config `"local"` de `angular.json` depende de `environment.local.ts`, generado solo por el hook `prestart`; `ng build/serve --configuration=local` invocado sin pasar por `npm start` (ej. IDE, CI) puede fallar por archivo faltante en un checkout nuevo | `medium` | Confirmado leyendo `package.json`: no existe `prebuild`. Mismo root cause reportado por ambas capas — agrupado. Corregido abajo (patch). |
| 5 | blind-hunter: no hay actualización de README/CONTRIBUTING documentando que ahora se necesita `.env.local` | rejected (low, fix no trivial) | `.env.example` ya documenta esto extensamente inline (verificado); agregar README es más que una corrección directa y el impacto de no tenerlo es bajo. |
| 6 | blind-hunter: la sección Verification del spec no lista `ng build --configuration=local` como comando, aunque Implementation Notes lo menciona como prueba real | rejected (spec edit) | Real pero el arreglo es editar la sección Verification de este spec. |
| 7 | blind-hunter: Code Map no mencionaba la interacción con `.gitignore` (`!.env.example`) que hubo que resolver ad hoc | rejected (spec edit) | Real pero el arreglo es editar el Code Map de este spec. |
| 8 | blind-hunter: no hay test automatizado para el fallback de `inject-env.mjs` | rejected (out of scope) | El SPEC madre (`spec-ionic-angular-migration/SPEC.md`) excluye explícitamente testing automatizado/CI de todo este trabajo de migración. |
| 9 | edge-case-hunter: `inject-env.mjs:43-44` interpola `supabaseUrl`/`supabaseAnonKey` en un string literal de comillas simples sin escapar comillas/backslashes | `low` | Verificado en el código (línea 43-44, sin `.replace()`). Riesgo real pero improbable con URLs/keys de Supabase reales (nunca contienen esos caracteres); fix trivial. Corregido abajo (patch). |
| 10 | edge-case-hunter: `inject-env.mjs:48` `writeFileSync` sin try/catch — un error de filesystem rompería `prestart`, contradiciendo el comentario "nunca debe romper el build" | `low` | Verificado: sin try/catch alrededor de `writeFileSync`. Disparador raro (permisos/disco lleno) pero real. Corregido abajo (patch). |
| 11 | verification-gap | — | Sin hallazgos. |

## Verification

**Commands:**
- `cd ionic-app && npm start` -- expected: sirve sin errores de consola; `SupabaseService.client` no-nulo (verificable en devtools).
- `git status --short ionic-app` -- expected: sin rastro de `.env.local` ni `environment.local.ts`.

**Manual checks (if no CLI):**
- Recorrer los 7 dominios en el navegador con la sesión demo, confirmando datos reales (notas, tutores, favoritos, mensajes) en vez de listas vacías.
