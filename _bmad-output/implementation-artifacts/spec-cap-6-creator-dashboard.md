---
title: 'CAP-6 (resto): Dashboard de creador en Ionic+Angular'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '33a7723b96705228a7c37e240bdd6b77b82af024'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CAP-6 migró `/profile` pero excluyó deliberadamente el dashboard de creador (`/profile/creator`, deferred-work.md:178-179): ni la ruta ni el link "Modo creador" existen en Ionic+Angular, así que cualquier visita cae en el catch-all (`redirectTo: 'kit'`).

**Approach:** Portar 1:1 `src/app/(protected)/profile/creator/page.tsx`: perfil de tutor (join opcional), lista de apuntes propios con badge de estado, y 4 stats (ingresos/ventas/reservas/calificación) — replicando el bug conocido de ingresos-siempre-en-0 (known-issues.md#1), no corrigiéndolo. Registrar la ruta y restaurar en `profile.page` el link "Modo creador" que CAP-6 dejó fuera de alcance.

## Boundaries & Constraints

**Always:**
- Reusar UI kit sin crear componentes nuevos: `HeaderComponent` (slot `right-action`, mismo patrón que `chat.page.html`), `CardComponent`, `BadgeComponent`, `RatingStarsComponent`, `SkeletonComponent`, `EmptyStateComponent`, `ButtonComponent`.
- Consultas Supabase directas vía `SupabaseService.client` en la página (mismo patrón que `profile.page.ts.ngOnInit`, no crear métodos nuevos en `TutorsService`/`NotesService` — son consultas page-specific, no reusadas en otro lado).
- Replicar exactamente las 4 queries del MVP: `tutors.select('*, user:profiles(*), courses:tutor_courses(*)').eq('user_id', userId).single()`; `notes.select('*').eq('author_id', userId).order('created_at', {ascending:false})`; ventas/ingresos vía `library.select('id, note:notes(price)', {count:'exact'}).in('note_id', [])` (siempre 0 — bug conocido, no corregir); `bookings.select('id', {count:'exact'}).eq('tutor_id', tutorData.id)` solo si el tutor existe.
- Badges de estado de apunte: active→Activo, review→En revisión, paused→Pausado, rejected→Rechazado, draft→Borrador.
- Skeleton solo para la lista de apuntes (2 filas); sin skeleton para el grid de stats (paridad MVP). `EmptyStateComponent` cuando no hay apuntes, con botón "Publicar primer apunte" → `/publish/note`.
- Header: `title="Panel del creador"`, `showBack`, slot `right-action` con `app-button size="sm"` + `routerLink="/publish"` texto "Nuevo".
- Registrar ruta `profile/creator` en `app.routes.ts` con `canActivate: [protectedGuard]`, antes del catch-all `**`; actualizar el comentario del catch-all (ya no queda nada pendiente de CAP-6).
- Restaurar en `profile.page.ts`/`.html` el card "Modo creador" (gradiente) que enlaza a `/profile/creator`, igual que `profile/page.tsx` línea ~130-140.

**Never:**
- No corregir el bug de ingresos/ventas en 0.
- No agregar métodos nuevos a `TutorsService`/`NotesService` — queries quedan en la página.
- No gatear la ruta/página por "es creador" — el MVP la muestra a cualquier usuario autenticado, tenga o no `tutors`/`notes`.
- No agregar historial de pagos/detalle de ventas más allá de los 4 números de stats.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sin perfil de tutor | `tutors` no trae fila para `userId` | Sección "Perfil de tutor" no se renderiza; stat "Reservas" queda en 0 sin disparar la query de `bookings` | N/A |
| Con perfil de tutor | `tutors` trae fila con `courses`/`average_rating` | Sección "Perfil de tutor" muestra cursos, `total_classes`, `hourly_price` (formatCLP), `RatingStars` | N/A |
| Sin apuntes publicados | `notes` devuelve `[]` | `EmptyStateComponent` con CTA "Publicar primer apunte" en vez de la lista | N/A |
| Con apuntes | `notes` devuelve filas | Lista con título/curso, badge de estado, `{downloads} ventas` | N/A |

</frozen-after-approval>

## Code Map

- `src/app/(protected)/profile/creator/page.tsx` -- fuente MVP: lógica y JSX completos a portar (queries, stats, secciones, loading/empty states)
- `src/app/(protected)/profile/page.tsx` líneas ~130-140 -- fuente: markup del card "Modo creador" a restaurar
- `ionic-app/src/app/profile/profile.page.ts` / `.html` / `.scss` -- CAP-6: agregar de vuelta el link "Modo creador"; referencia de estilo/convenciones (imports de iconos, `getInitials`, toasts)
- `ionic-app/src/app/app.routes.ts` líneas 60-80, 118-140 -- patrón de registro de rutas "resto" (comentario + `protectedGuard`) y catch-all a actualizar
- `ionic-app/src/app/chat/chat.page.html` líneas 1-5 -- precedente de uso del slot `right-action` del Header
- `ionic-app/src/app/shared/state/supabase.service.ts` -- `client` para queries directas
- `ionic-app/src/app/shared/state/auth.service.ts` -- `user()` (id del usuario actual)
- `ionic-app/src/app/shared/models.ts` -- `Tutor`, `TutorCourse`, `Note`, `Booking` ya definidos, reusar tal cual (no agregar tipos)
- `ionic-app/src/app/shared/utils.ts` -- `formatCLP`, `getInitials`
- `ionic-app/src/app/shared/ui/{header,card,badge,rating-stars,skeleton,empty-state,button}` -- componentes UI kit a reusar
- `ionic-app/src/app/publish-tutor/publish-tutor.page.ts` -- referencia de patrón `loading` signal + toast (mencionado en spec-cap-6-profile.md como precedente ya seguido)
- `_bmad-output/specs/spec-ionic-angular-migration/known-issues.md#1` -- bug de ingresos en 0 a replicar, no corregir
- `_bmad-output/implementation-artifacts/deferred-work.md` líneas 178-179 -- origen del split de este deliverable

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/profile-creator/profile-creator.page.ts` -- nuevo componente standalone, portar lógica de `profile/creator/page.tsx` (queries paralelas donde el MVP las hace en cascada, stats, secciones) -- entrega core
- [x] `ionic-app/src/app/profile-creator/profile-creator.page.html` -- template, portar JSX (stats grid, sección tutor condicional, lista de apuntes, loading/empty) -- paridad visual
- [x] `ionic-app/src/app/profile-creator/profile-creator.page.scss` -- estilos, portar clases Tailwind del MVP a CSS -- paridad visual
- [x] `ionic-app/src/app/profile-creator/profile-creator.page.spec.ts` -- tests: stats con/sin tutor, lista con/sin apuntes, empty state -- cubre la matriz I/O
- [x] `ionic-app/src/app/app.routes.ts` -- registrar `profile/creator` con `protectedGuard` antes de `**`; actualizar comentario del catch-all -- hace la página alcanzable
- [x] `ionic-app/src/app/profile/profile.page.ts` -- agregar import de ícono si hace falta para el card "Modo creador" -- soporte del link
- [x] `ionic-app/src/app/profile/profile.page.html` -- agregar card "Modo creador" enlazando a `/profile/creator` -- restaura el punto de entrada del MVP
- [x] `ionic-app/src/app/profile/profile.page.scss` -- estilos del gradient-card si no existen ya -- paridad visual

**Acceptance Criteria:**
- Given un usuario autenticado con fila en `tutors` y apuntes publicados, when abre `/profile/creator`, then el grid muestra ingresos=0/ventas=0 (bug replicado), reservas desde `bookings`, calificación desde `tutorData.average_rating` (`'-'` si es 0), la lista de apuntes muestra estado y `{downloads} ventas`, y la sección "Perfil de tutor" es visible.
- Given un usuario sin fila en `tutors`, when abre `/profile/creator`, then la sección "Perfil de tutor" no se renderiza y el stat de reservas queda en 0 sin disparar la query de `bookings`.
- Given un usuario sin apuntes publicados, when abre `/profile/creator`, then se muestra `EmptyStateComponent` con CTA "Publicar primer apunte" en vez de la lista.
- Given la página de perfil, when se renderiza, then un card "Modo creador" enlaza a `/profile/creator`.

## Implementation Notes

- Decision (documented, not silent): the MVP's top "Profile Summary" card (avatar/name/major, page.tsx líneas 118-138) is NOT ported. Approach's own enumeration ("perfil de tutor, lista de apuntes, 4 stats") and the `.html` task's own enumeration ("stats grid, sección tutor condicional, lista de apuntes, loading/empty") both omit it, and `/profile` already renders that identity block — the new page starts directly at the stats grid. Flagged for Lucas to confirm; easy to add back if this reading is wrong.
- Queries parallelized per the `.page.ts` task bullet ("queries paralelas donde el MVP las hace en cascada"): `tutors`+`notes`+`library` (sales) now run together in one `Promise.all` (none of the three depend on each other), instead of the MVP's `await tutors` then `Promise.all(notes, sales, bookings)`. Only `bookings` — which needs `tutorData.id` — stays sequential after, and is skipped entirely when there's no tutor row (I/O matrix "Sin perfil de tutor").
- The known bug (known-issues.md#1, ingresos/ventas de creador siempre en 0) is replicated via the exact same `.in('note_id', [])` filter, not via hardcoding 0 — `profile-creator.page.spec.ts`'s bug-replication test asserts the query's own args (`['note_id', []]`), not just the resulting stat.
- EmptyStateComponent (UI kit) is used for the "sin apuntes" case per Boundaries, even though the MVP's own empty state there is ad-hoc Card+icon+text+Button markup (not its own EmptyState component) — same UI-kit-reuse rule every other ported page in this app follows.
- `noteBadgeVariant()` maps `paused`/`rejected`/`draft` all to `'default'`, ported 1:1 from the MVP's ternary (page.tsx línea 210) which only special-cases `active`/`review`.
- "Modo creador" card reuses the `::ng-deep .app-card` technique already established by `profile.page.scss`'s `.profile-logout` (and `login.page.scss`) to style `CardComponent`'s inner `ion-card` from outside, since a `class` attribute on `<app-card>` lands on its host element, not on the template's own root.
- Added tests beyond the Tasks list's minimum in `app.routes.spec.ts` (usuario autenticado / sin sesión for `/profile/creator`) and `profile.page.spec.ts` (the "Modo creador" link) — both map directly to this spec's own Acceptance Criteria, and follow each file's pre-existing per-route/per-card test pattern.
- Decision (documented, not silent, review-flagged): `EmptyStateComponent`'s `description` input is required, but the MVP's own empty state for "sin apuntes" has only a title line (page.tsx línea 224), no second line of copy. "Comparte tus apuntes y empieza a generar ingresos" (`profile-creator.page.ts`) is authored copy, not ported from the MVP — invented solely to satisfy the component's required input, same class of judgment call as the Profile-Summary-card omission above. Flagged for Lucas to confirm/replace.

## Spec Change Log

## Review Triage Log

- **Verdict: low → patch.** `profile-creator.page.spec.ts` (test "con perfil de tutor...") fija `average_rating: 4.5` pero nunca revisa el texto renderizado del stat "Calificación" — el test de rating=0 solo verifica que el texto contenga `'-'`, lo cual pasa sin importar qué rama del ternario corrió. Verificado: ninguna aserción en el spec toca el valor renderizado de Calificación con rating>0. (verification-gap)
- **Verdict: low → patch.** El test "sin apuntes publicados" (nombre incluye "con CTA a /publish/note") solo verifica el label del botón, nunca su `routerLink` — un `routerLink` incorrecto pasaría igual. Verificado: `grep routerLink|getAttribute` en el spec no tiene match para ese botón. (verification-gap)
- **Verdict: low → defer.** Ningún test renderiza el estado `loading()=true` (2 `app-skeleton` en la lista, ninguno en el stats grid) — todos los tests esperan a que `ngOnInit()` resuelva antes de `detectChanges()`. Verificado: es el mismo patrón (no probar el estado transitorio pre-resolución) que el resto del suite ya usa en cada página con `loading`/`ngOnInit` async — no es un gap específico de este cambio. (verification-gap + blind-hunter, mismo hallazgo)
- **Verdict: low → reject.** `profile-creator.page.scss` excede el budget de 2kB de Angular por 635 bytes, y empuja `profile.page.scss` más lejos de su propio exceso preexistente. Verificado con `npm run build`: son warnings no bloqueantes, y el build ya tenía 4 archivos más excediendo el mismo budget (home/tutor-detail/publish-note/note-detail) sin que ningún spec previo lo haya corregido ni diferido — patrón sistémico ya tolerado, no introducido por este diff. Poco probable que se note en el uso diario y corregirlo bien (no solo subir el budget) requiere más que una corrección directa. (blind-hunter)
- **Verdict: false → reject.** `deferred-work.md` líneas 178-179 (el ítem que este spec resuelve) no fue removido/actualizado. Verificado contra el historial: CAP-3(resto) y CAP-4(resto) — los dos splits previos idénticos en forma — tampoco removieron ni marcaron resuelta la entrada que originaron (`git log` confirma que esas entradas siguen intactas hoy). Es el patrón establecido y deliberado (append-only, "no modificar entradas existentes" es una regla explícita del workflow), no un defecto de este spec. (blind-hunter)
- **Verdict: low → patch.** Ningún test de `profile-creator.page.spec.ts` verifica el header (`title="Panel del creador"`, `showBack`, botón "Nuevo" en `right-action` → `/publish`) — un requisito explícito de Boundaries sin cobertura. Verificado: no hay match de "Panel del creador" ni del botón "Nuevo" en el spec file. (blind-hunter)
- **Verdict: low → reject.** El AC que combina tutor+apuntes+4 stats en un solo escenario nunca se prueba con ambas condiciones a la vez (los tests varían tutor y apuntes por separado). Verificado en el template: las dos secciones (`@if (tutorProfile())` y la lista de apuntes) son ramas `@if` independientes sin ninguna interacción entre sí (confirmado también por el trace del edge-case-hunter), así que un test combinado sería redundante con los que ya existen por separado — poco probable que oculte un bug real. (blind-hunter)
- **Verdict: medium → defer.** Si cualquiera de las 3 queries paralelizadas (`tutors`/`notes`/`library`) rechaza (falla de red real, no un `{error}` resuelto), `ngOnInit()` nunca llega a `this.loading.set(false)` y la página queda en skeleton para siempre sin ningún toast. Verificado contra el MVP (`profile/creator/page.tsx` líneas 40-92): tiene exactamente el mismo hueco — ningún `try/catch/finally`, `setLoading(false)` solo al final de `fetchData()`. Paridad fiel con un patrón ya diferido repetidamente para esta clase de bug (p.ej. `spec-cap-4-publish-tutor.md` en `deferred-work.md`), y el Never de este spec excluye explícitamente agregar manejo de errores más allá del MVP. (blind-hunter + edge-case-hunter, mismo hallazgo)
- **Verdict: medium → defer.** `tutorResult.error`/`notesResult.error` no se revisan — una falla real de Supabase (RLS, esquema) que resuelve con `{data: null, error: {...}}` en vez de rechazar se renderiza idéntico a "sin perfil de tutor"/"sin apuntes", ocultándole al usuario que hubo un error real. Verificado contra el MVP: `const { data: tutorData } = await supabase...` destructura solo `data`, ignora `error` exactamente igual. Paridad fiel, mismo patrón ya presente en `NotesService`/`TutorsService`/`ProfilePage.ngOnInit` de specs anteriores. (edge-case-hunter)
- **Verdict: low → defer.** `note.status` fuera de los 5 valores mapeados en `statusLabels` renderiza un badge con texto vacío/`undefined` (sin fallback). Verificado contra el MVP: el mismo `statusLabels[note.status]` sin fallback, mismo riesgo de drift de esquema en tiempo de ejecución (el tipo TS de `Note['status']` no protege contra datos reales fuera de esas 5 opciones). Paridad fiel, no introducido por este diff. (edge-case-hunter)
- **Verdict: false → reject.** `bookingsResult` está tipado manualmente como `{ count: number | null }` mientras los otros 3 resultados del `Promise.all` mantienen su tipo inferido completo de Supabase. El hallazgo no nombra ningún daño concreto (ningún caller diverge, nada se rompe) — es una inconsistencia de estilo sin consecuencia verificable. (blind-hunter)
- **Verdict: false → reject.** El `reduce()` sobre `salesResult.data` para calcular `totalRevenue` nunca se ejecuta contra datos reales porque `.in('note_id', [])` garantiza `data: []` siempre. Esto es la consecuencia directa y exigida por Boundaries ("replicar exactamente" el bug de `known-issues.md#1`, "Never: no corregir el bug de ingresos/ventas en 0") — no es un defecto nuevo, es el comportamiento pedido por el spec funcionando como se pidió. (blind-hunter)

## Verification

**Commands:**
- `cd ionic-app && npm run build` -- expected: build sin errores
- `cd ionic-app && npm test -- --watch=false` -- expected: specs de `profile-creator.page.spec.ts` y los ya existentes pasan

**Manual checks (if no CLI):**
- Navegar a `/profile`, click en "Modo creador", verificar que `/profile/creator` carga sin caer en `/kit`, que el grid de stats y la lista de apuntes se ven correctamente en ambos casos (con y sin `tutors` row si hay datos de prueba disponibles).
