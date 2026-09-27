---
title: 'CAP-3 (resto): Publicar apunte en Ionic+Angular'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '616048a9c76023c3d720260dd1003b975904dc5d'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CAP-3 migró detalle de apunte y biblioteca, pero el botón central "+" del navbar (`/publish`) y el flujo de publicar un apunte (`/publish/note`) siguen sin construirse — caen en el catch-all (`redirectTo: 'kit'`).

**Approach:** Portar 1:1 `src/app/(protected)/publish/page.tsx` (chooser de 2 tarjetas) y `src/app/(protected)/publish/note/page.tsx` (wizard de 4 pasos) a Ionic+Angular, reusando el patrón de wizard ya establecido en `onboarding.page.ts/html` (signals + `canProceed` computed + `app-button` de variante toggle) y el patrón de mutación de `NotesService`.

## Boundaries & Constraints

**Always:** Paridad fiel con el MVP — mismos 4 pasos, mismos campos, misma validación por paso (`canProceed`), mismos precios rápidos `[0, 2490, 3990, 5490]`, mismo insert (`status: 'review'`, sin `file_url`/`cover_url`). La tarjeta "Ofrecer clases" del chooser enlaza a `/publish/tutor` (CAP-4, aún no migrado) y cae en el catch-all existente — mismo patrón ya aceptado en CAP-2/CAP-3 para links a dominios no migrados, no requiere ninguna decisión nueva.

**Never:** No subir archivos a Supabase Storage (el MVP no lo hace). No agregar manejo de errores de red más allá de lo que el MVP ya tiene (`error` de Supabase → toast genérico, sin try/catch). No construir `/publish/tutor` ni tocar CAP-4.

**Decisión (Open Question resuelta):** Tras un publish exitoso, sin redirect — solo el toast de éxito, el usuario se queda en el wizard (paso 4). No hay destino de `/profile/creator` (CAP-6, no migrado) todavía; se revisará cuando ese dashboard exista.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Chooser | Usuario autenticado entra a `/publish` | 2 tarjetas: "Publicar apunte" → `/publish/note`, "Ofrecer clases" → `/publish/tutor` | N/A |
| Wizard paso incompleto | Paso 1 sin `title` o `course` | Botón "Siguiente" deshabilitado (`canProceed()` false) | N/A |
| Wizard submit ok | Paso 4, click "Publicar" | Insert en `notes` (`status: 'review'`), toast success, sin redirect | N/A |
| Wizard submit error | Supabase insert devuelve `error` | Toast error "Error al publicar", `loading` vuelve a `false` | Mismo genérico que el MVP |

</frozen-after-approval>

## Code Map

- `src/app/(protected)/publish/page.tsx` -- MVP fuente del chooser (2 `Card` con `Link`).
- `src/app/(protected)/publish/note/page.tsx` -- MVP fuente del wizard de 4 pasos.
- `ionic-app/src/app/onboarding/onboarding.page.ts` y `.html` -- patrón golden para el wizard: `step` signal, `canProceed` computed, `app-button` con `[variant]` toggle para grillas de opciones, `ion-select` para dropdowns. Replicar la misma estructura, no reinventar.
- `ionic-app/src/app/shared/state/notes.service.ts` -- agregar `create()`, mismo patrón que `purchase()` (client null-check, sin try/catch, mapeo de campos 1:1 al insert del MVP líneas 59-72).
- `ionic-app/src/app/shared/models.ts` -- agregar `SEMESTER_OPTIONS` (mover el duplicado local de `onboarding.page.ts`, que pasa a importarlo desde acá al ganar un segundo consumer — mismo criterio que movió `MAJOR_OPTIONS` en CAP-2) y `MATERIAL_TYPE_OPTIONS` (derivado de `MATERIAL_TYPE_LABELS` con `Object.entries`, igual que `src/types/index.ts` líneas 234-236).
- `ionic-app/src/app/app.routes.ts` -- agregar rutas `publish` y `publish/note` (`protectedGuard`) antes del catch-all `**`. El botón central del navbar (`publishHref = '/publish'`, ya existente) queda funcional sin tocarlo.
- `ionic-app/src/app/shared/ui/button|card|input/*.component.ts` -- reusar tal cual, sin cambios de API.

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/shared/state/notes.service.ts` -- agregar método `create(authorId, data)` -- mismo insert que el MVP, sin manejo de errores extra.
- [x] `ionic-app/src/app/shared/state/notes.service.spec.ts` -- test de `create()` (éxito y error de Supabase).
- [x] `ionic-app/src/app/shared/models.ts` -- agregar `SEMESTER_OPTIONS` y `MATERIAL_TYPE_OPTIONS`.
- [x] `ionic-app/src/app/onboarding/onboarding.page.ts` -- reemplazar el `SEMESTER_OPTIONS` local por el import desde `shared/models`.
- [x] `ionic-app/src/app/publish/publish.page.ts` + `.html` + `.scss` -- chooser, port 1:1 de `publish/page.tsx`.
- [x] `ionic-app/src/app/publish/publish.page.spec.ts` -- smoke test de las 2 tarjetas y sus `routerLink`.
- [x] `ionic-app/src/app/publish-note/publish-note.page.ts` + `.html` + `.scss` -- wizard, port 1:1 de `publish/note/page.tsx`, patrón de `onboarding.page.ts`.
- [x] `ionic-app/src/app/publish-note/publish-note.page.spec.ts` -- test de `canProceed` por paso, submit éxito/error.
- [x] `ionic-app/src/app/app.routes.ts` -- registrar `publish` y `publish/note` antes del catch-all.

**Acceptance Criteria:**
- Given un usuario autenticado, when navega a `/publish`, then ve las 2 tarjetas y puede entrar al wizard.
- Given el wizard en paso 4, when el insert de Supabase tiene éxito, then se ve el toast de éxito y el usuario permanece en el wizard (sin redirect).
- Given el wizard en cualquier paso, when los campos requeridos de ese paso están vacíos, then "Siguiente"/"Publicar" está deshabilitado.

## Implementation Notes

- `NotesService.create()` sigue el mismo patrón de `{error}` genérico que `purchase()`: tanto un cliente null como un `error` de Supabase resuelven al mismo mensaje fijo `'Error al publicar'` (el mensaje real de Supabase nunca se propaga) — así el wizard solo reenvía el string recibido al toast, sin lógica de mensajes propia.
- `semester` en el wizard conserva la etiqueta completa de la opción (`'1° Semestre'`), sin el `split(' ')[0]` que sí hace `onboarding.page.ts` — paridad 1:1 con `publish/note/page.tsx`, que nunca hace ese split.
- `ai_details` queda en el modelo/insert (paridad con el MVP) pero el wizard no expone ningún control para editarlo, igual que `publish/note/page.tsx` — siempre viaja como `''` → `null`.
- `back()`/`next()` del wizard no llevan la guarda "ignorar mientras `loading()`" que sí tiene `onboarding.page.ts` — esa guarda es una adición propia de onboarding, no existe en el MVP del wizard de apuntes; se omitió a propósito para mantener paridad fiel con `publish/note/page.tsx`.
- Íconos lucide→ionicons: `BookOpen`→`bookOutline`, `Users`→`peopleOutline` (chooser); `Brain`→`sparklesOutline` (ya el sustituto establecido por `ai-declaration-badge.component.ts`); `CheckCircle`→`checkmarkCircleOutline` (ya usado en `note-detail.page.ts`). Ninguno es una sustitución nueva sin precedente en este repo.
- 100/100 tests (`npx ng test`), `npx ng build` y `npx ng lint` sin errores, corrido dos veces para confirmar estabilidad. La primera corrida mostró 4 fallas en `auth.service.spec.ts` (`TypeError: fetch failed`); no se tocó ese archivo en este spec y la segunda corrida (100/100) confirma que es el mismo flake de red preexistente ya documentado en `spec-cap-3-notes-marketplace.md`, no algo introducido acá.
- Ronda de review (blind-hunter + edge-case-hunter + verification-gap): 4 hallazgos `patch` aplicados por el mismo subagente — tests de resolución de ruta para `/publish`/`/publish/note` en `app.routes.spec.ts` (mirroring `/library`), test de `create()` con `price: 0` en `notes.service.spec.ts`, test de la transición paso 3→4 en `publish-note.page.spec.ts`, y el ícono de "Ofrecer clases" en `publish.page.scss` pasó de `rgba(0, 141, 210, 0.1)` hardcodeado al token ya establecido `rgba(var(--ion-color-tertiary-rgb), 0.1)`. 112/112 tests y `ng lint` limpio tras los fixes (mismo flake preexistente de `auth.service.spec.ts` sin tocar). El resto de hallazgos verificados como `false` (paridad fiel con el MVP) o `defer` (gaps preexistentes del MVP, fuera de alcance por Boundaries) — ver Review Triage Log y las nuevas entradas en `deferred-work.md`.
- `publish-note.page.scss` queda ~1kB sobre el presupuesto de 2kB por componente de Angular (warning, no error de build) — mismo patrón tolerado ya existente en `note-detail.page.scss`/`home.page.scss`.

## Spec Change Log

## Review Triage Log

- **medium** — `app.routes.ts` registra `publish` y `publish/note` sin ningún test que resuelva esas rutas contra el array `routes` real (blind-hunter + verification-gap). Verificado: `app.routes.spec.ts` tiene ese exacto patrón para `/library` y `/explore/notes/:id` (con su propio comentario explicando por qué importa), pero no para las 2 rutas nuevas; `publish.page.spec.ts`/`publish-note.page.spec.ts` instancian el componente directo con `provideRouter([])`, nunca resuelven contra `routes`. Un typo o guard faltante pasaría undetected. → **patch**.
- **medium** — `NotesService.create()`/`submit()` nunca se ejercitan con `price: 0` (nota gratis) (verification-gap). Verificado: todos los tests usan `price: 2490`; un futuro "arreglo de consistencia" que agregue `|| null` a `price` (como ya tiene `pages`) pasaría todos los tests actuales y silenciosamente rompería apuntes gratis. → **patch**.
- **low** — Ningún test de `publish-note.page.spec.ts` ejercita la transición paso 3→4 ni los computed `progress()`/`stepLabel()` (blind-hunter). Verificado: los tests cubren paso1→2 y paso2→3, pero no más allá. → **patch**.
- **low** — `publish.page.scss` hardcodea `rgba(0, 141, 210, 0.1)` para el ícono de "Ofrecer clases" en vez del token ya establecido `rgba(var(--ion-color-tertiary-rgb), 0.1)` (blind-hunter, parte de un finding más amplio). Verificado: `ai-declaration-badge.component.scss` y `home.page.scss` ya usan ese token para el mismo tinte "sky"; el resto del finding (uso de `#ffffff` literal) es **false** — es el patrón repetido en `note-detail.page.scss`, `onboarding.page.scss`, `home.page.scss` y `library.page.scss`, no una desviación de este diff. → **patch** (solo el valor rgb literal).
- **false** — "`aiDetails` es scaffolding muerta sin control en el template" (blind-hunter + verification-gap "other findings"). Verificado contra `src/app/(protected)/publish/note/page.tsx`: el MVP tampoco expone ningún control para `ai_details` — `formData.ai_details` queda en `''` ahí también. Paridad fiel, no un gap introducido por este spec.
- **false** — "`pages: data.pages \|\| null` es inconsistente con `price` pasado crudo, parece un bug" (blind-hunter). Verificado contra `publish/note/page.tsx` líneas 59-72: el MVP tiene exactamente esa misma asimetría (`pages: formData.pages || null` vs `price: formData.price` sin fallback). Paridad 1:1, no una desviación de este puerto.
- **false** — "El wizard no tiene `app-header`, sin título ni forma de salir" (blind-hunter). Verificado: `publish/note/page.tsx` tampoco usa `Header` — mismo patrón que `onboarding.page.ts` (que tampoco lo usa). Paridad fiel con el MVP y con el wizard ya existente.
- **defer** — Validación de `title()`/`course()` sin `.trim()` (paso 1) acepta solo-espacios (blind-hunter + edge-case-hunter). Verificado: `canProceed()` del MVP (`return formData.title && formData.course`) tampoco hace trim. Pre-existente, no causado por este story.
- **defer** — `setPrice()` no tiene piso en 0 (permite precio negativo) (blind-hunter + edge-case-hunter). Verificado: el MVP tampoco clampea (`parseInt(e.target.value) || 0`, sin `Math.max`). Pre-existente.
- **defer** — `pagesInput` no tiene piso en 0 (permite páginas negativas) (edge-case-hunter). Verificado: el MVP tampoco clampea (mismo `parseInt(...) || 0`). Pre-existente.
- **defer** — `back()` no se bloquea mientras `submit()` está en vuelo (edge-case-hunter). Verificado: el botón "Atrás" del MVP tampoco se deshabilita durante el submit (a diferencia de `onboarding.page.ts`, que sí agrega esa guarda). Pre-existente, y el Never de este spec excluye agregar guardas que el MVP no tiene.
- **defer** — Si `notesService.create()` rechaza (falla de red real) en vez de resolver `{error}`, `loading()` queda en `true` para siempre sin toast (edge-case-hunter). Verificado: el MVP tampoco tiene try/catch en `handleSubmit`. Mismo patrón ya documentado en `deferred-work.md` para CAP-2/CAP-3; el Never de este spec excluye explícitamente agregar manejo de errores de red.
- **defer** — `submit()` no hace nada visible si `auth.user()` no tiene id (sesión expirada a mitad del wizard) (edge-case-hunter). Verificado: el MVP tampoco muestra nada (`if (!user) return;`). Pre-existente.
- **defer** — Ningún control del wizard tiene `aria-pressed`/`aria-valuenow` (grillas de tipo de material, declaración de IA, precios rápidos, barra de progreso) (blind-hunter). Real, pero misma clase de gap de accesibilidad ya aceptada y diferida en CAP-2 (botones ícono-only sin `aria-label`) — el MVP tampoco los tiene.
- **defer** — No hay guarda de "cambios sin guardar" al navegar fuera del wizard a mitad de flujo (blind-hunter). Verificado: el MVP tampoco la tiene; agregarla sería una feature nueva, no paridad.
- **defer** — `ionic-app/angular.json` incluye una clave `"analytics"` con un UUID, generada localmente por el CLI de Angular/Ionic, no relacionada a esta feature (blind-hunter). Verificado: esta modificación ya estaba presente en el working tree antes de empezar este spec (ruido de tooling local, no parte de ningún commit).
</content>
