---
title: 'CAP-4: Perfil de tutor + Reservas en Ionic+Angular'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '497b7122ce5c2b9c6b70dc41bf1dcb8dcf2e2bab'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CAP-1/CAP-2/CAP-3/CAP-7 migraron auth, home/explore/favorites, notes marketplace y el UI kit, pero el perfil de un tutor y el flujo de reservar una sesión todavía no existen en Ionic+Angular: el link de `TutorCard` a `/explore/tutors/:id` cae en el catch-all (`redirectTo: 'kit'`), y no hay página para ver las reservas propias.

**Approach:** Portar 1:1 desde el MVP Next.js el perfil de tutor (datos, horarios disponibles, reseñas, reservar un horario) y el listado de reservas del estudiante (`/bookings`), reusando el UI kit y los patrones de servicio ya establecidos (fetch fail-soft en servicios `Injectable`, mutaciones `{error: string|null}`, signals + `route.paramMap` con dedupe de id como en `note-detail.page.ts`).

## Boundaries & Constraints

**Always:**
- Reusar el UI kit y servicios ya existentes (`HeaderComponent`, `CardComponent`, `ButtonComponent`, `BadgeComponent`, `RatingStarsComponent`, `VerifiedBadgeComponent`, `EmptyStateComponent`, `SkeletonComponent`, `ToastComponent`, `SupabaseService`, `AuthService`, `protectedGuard`) sin crear componentes de kit nuevos.
- Paridad exacta con el MVP: selección simple de horario (lista de botones seleccionables, no calendario), reservar = insert en `bookings` + update `tutor_schedules.available = false`, sin pasarela de pago real (`payment_status` queda `'pending'`).
- Nuevos métodos de servicio siguen el patrón fail-soft ya establecido (cliente `null` → `[]`/`null`) y el patrón `{error: string|null}` de mutaciones ya usado en `NotesService`/`FavoritesService`.

**Never:**
- Implementar cancelar o editar una reserva — el MVP tampoco lo tiene, `/bookings` solo lista y crea.
- Agregar manejo de errores de red, guarda anti doble-tap, o resolver la race condition de horario (`available=false` después del insert, sin transacción) — gotchas de paridad ya conocidos, van a `deferred-work.md`.
- Construir `/publish/tutor` (wizard "Ofrecer clases", diferido a otro spec — ver `deferred-work.md`) ni `/messages` (CAP-5, diferido) ni el link de navegación hacia `/bookings` desde `/profile` (CAP-6, no migrado) — `/bookings` queda registrada como ruta pero sin entrada de navegación hasta CAP-6.
- Agregar botón de favorito al perfil de tutor — el MVP no lo tiene ahí (a diferencia del detalle de apunte).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Perfil de tutor válido | `GET /explore/tutors/:id` de un tutor existente | Datos, stats, bio, modalidades, cursos, horarios disponibles (`>= hoy`, máx 10), reseñas | N/A |
| Tutor inexistente | `id` sin match en `tutors` | "Tutor no encontrado" (texto plano centrado, sin `EmptyStateComponent`) | N/A |
| Reservar horario | click "Reservar horario" con un horario elegido | insert en `bookings` (`status`/`payment_status: 'pending'`) → update `tutor_schedules.available=false` → toast éxito, deselecciona horario | insert falla → toast "Error al crear la reserva" |
| Sin horario seleccionado | botón "Reservar horario" | disabled | N/A |
| Reservas del estudiante | `GET /bookings` | tabs Próximas/Anteriores (filtro client-side por `status`/fecha), badge de estado, monto | N/A |
| Reservas vacías en una tab | usuario sin reservas en la tab activa | `EmptyStateComponent` con CTA a `/explore` | N/A |

</frozen-after-approval>

## Code Map

- `ionic-app/src/app/shared/models.ts` -- agregar `TutorSchedule`, `TutorRating`, `Booking` y las uniones `BookingStatus`/`PaymentStatus` (paridad con `src/types/index.ts`, sección Tutor/Booking); `Tutor`/`TutorCourse` ya existen, reusar tal cual.
- `ionic-app/src/app/shared/state/tutors.service.ts` -- agregar `getById(id): Promise<Tutor | null>` -- portar la query de `src/app/(protected)/explore/tutors/[id]/page.tsx` líneas 44-51 (`select('*, user:profiles(*), courses:tutor_courses(*))').eq('id', id).single()`); `fetchHome`/`search` ya existen, no tocar.
- `ionic-app/src/app/shared/state/bookings.service.ts` -- crear -- `getSchedules(tutorId)` y `getRatings(tutorId)` (mismo archivo MVP, líneas 52-65), `create(userId, tutor, scheduleId): Promise<{error: string | null}>` (líneas 79-112: insert en `bookings` + update de `tutor_schedules`), `listForStudent(userId): Promise<Booking[]>` (`bookings/page.tsx` líneas 30-40, con `select('*, tutor:tutors(*, user:profiles(*)), schedule:tutor_schedules(*)')`).
- `ionic-app/src/app/app.routes.ts` -- agregar `explore/tutors/:id` → TutorDetailPage y `bookings` → BookingsPage, ambas con `canActivate: [protectedGuard]`, antes del catch-all `**`.
- `ionic-app/src/app/tutor-detail/tutor-detail.page.{ts,html,scss,spec.ts}` -- crear -- porta 1:1 `explore/tutors/[id]/page.tsx`; seguir el patrón de `note-detail.page.ts` (signals, suscripción a `route.paramMap` con dedupe de id vía `currentId`, `showToast` helper).
- `ionic-app/src/app/bookings/bookings.page.{ts,html,scss,spec.ts}` -- crear -- porta 1:1 `bookings/page.tsx` (tabs Próximas/Anteriores, filtro client-side sobre `status`/fecha de `schedule`).
- Íconos ionicons nuevos a importar por componente (sin registro global, mismo patrón per-componente ya usado): `calendarOutline` (reservar/fecha), `timeOutline` (horario), `videocamOutline`/`businessOutline` (modalidad online/presencial, sustituyen `Video`/`Building` de lucide), `checkmarkCircle` (horario seleccionado, sustituye `CheckCircle`), `chatbubbleOutline` (botón "Mensaje", ya usado en `navbar.component.ts`).

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/shared/models.ts` -- agregar `TutorSchedule`/`TutorRating`/`Booking` -- tipos que faltan para perfil y reservas
- [x] `ionic-app/src/app/shared/state/tutors.service.ts` -- agregar `getById` -- fetch del perfil de tutor
- [x] `ionic-app/src/app/shared/state/bookings.service.ts` -- crear -- horarios, reseñas, crear reserva, listar reservas del estudiante
- [x] `ionic-app/src/app/app.routes.ts` -- agregar las 2 rutas nuevas con `protectedGuard` -- hoy caen en el catch-all
- [x] `ionic-app/src/app/tutor-detail/` -- crear página -- ver perfil, horarios disponibles, reservar
- [x] `ionic-app/src/app/bookings/` -- crear página -- ver reservas propias (próximas/anteriores)
- [x] Tests unitarios para cada método de servicio nuevo y cada página nueva, cubriendo cada fila de la I/O & Edge-Case Matrix -- prevenir regresiones de paridad

**Acceptance Criteria:**
- Given un usuario autenticado, when navega a `/explore/tutors/:id` de un tutor existente, then ve perfil, stats, horarios disponibles y reseñas, igual que el MVP.
- Given un horario seleccionado, when pulsa "Reservar horario", then se crea la reserva, el horario queda marcado no disponible y ve un toast de éxito.
- Given un usuario sin sesión, when intenta entrar a `/bookings`, then `protectedGuard` lo redirige a `/login`.

## Implementation Notes

- Decision (documented, not silent): the Code Map's icon list only names 5 icons (`calendarOutline`, `timeOutline`, `videocamOutline`/`businessOutline`, `checkmarkCircle`, `chatbubbleOutline`). Two more lucide icons on the ported MVP page had no prior ionicons substitution anywhere in the codebase and needed one: `MapPin` → `locationOutline` (tutor detail's "Campus {campus}" row, and bookings' modality row for `presencial` — see next point) and `GraduationCap` → `schoolOutline` (tutor detail's "Ramos que enseña" course badges). Same outline-equivalent criterion CAP-2/CAP-3 already used.
- Decision (documented, not silent): the MVP itself uses two *different* lucide icons for "presencial" depending on the page — `Building` on the tutor profile's modality badge (`explore/tutors/[id]/page.tsx` línea 210), `MapPin` on the bookings list's inline modality row (`bookings/page.tsx` línea 148). Ported literally per-page rather than unifying: `businessOutline` on tutor-detail's modality badge, `locationOutline` on bookings' modality row.
- `handleBooking()` (tutor-detail.page.ts) preserves the MVP's own ordering quirk: `booking.set(true)` runs *before* the `schedules().find(...)` guard, so if that guard ever failed, `booking()` would stay stuck `true` (MVP has the identical bug — `setBooking(true)` before its own `schedule` lookup, líneas 82-85). In practice this guard is unreachable: `selectedSchedule` can only ever hold an id already present in the currently-loaded `schedules()` list. Kept as-is per Boundaries ("paridad exacta"), not fixed silently.
- 3 known parity gotchas from Boundaries/Never (no network error handling, no anti-double-tap guard, no fix for the `available=false` race condition) are logged in `deferred-work.md` per this spec's own instruction, verified line-by-line against the MVP first (same gaps exist there).

## Spec Change Log

- Code Map's icon list extended with `locationOutline`/`schoolOutline` (see Implementation Notes) — Code Map itself is not inside the frozen block, so this is a documented addition, not a renegotiation of the frozen Intent.

## Review Triage Log

- **[blind-hunter + edge-case-hunter + verification-gap]** `handleBooking()` deja el spinner de "Reservar horario" pegado en `true` para siempre si el horario seleccionado no está en `schedules()` — alcanzable porque `loadTutor()` nunca resetea `selectedSchedule` al cambiar de tutor (misma instancia reusada por el router en `/explore/tutors/:id`). — `medium`: verificado, comportamiento estándar de reuso de instancia de Angular Router (misma clase que el fix ya aplicado en CAP-3 a `note-detail.page.ts`), aunque hoy no hay ningún link in-app que encadene dos perfiles de tutor directamente. → **patch**.
- **[edge-case-hunter]** `loadTutor()` no descarta una respuesta más lenta si el `:id` de la ruta cambia mientras un fetch anterior sigue en vuelo — la resolución más lenta puede sobrescribir los datos del tutor más nuevo con datos del tutor anterior. — `medium`: real y demostrable (misma mecánica de reuso de instancia de Angular Router), aunque también requiere navegar directo entre dos perfiles de tutor sin pasar por explore. → **patch**.
- **[blind-hunter]** `BookingsService.create()` descarta el `{error}` del segundo `update` (`tutor_schedules.available=false`); si ese update falla, igual devuelve `{error: null}` y el usuario ve el toast de éxito aunque el horario nunca quedó marcado no disponible. — `low`: verificado que el MVP (`handleBooking`, líneas 100-104) tiene exactamente el mismo hueco (no desestructura el error de ese segundo `update`). Paridad fiel, excluida por el Never de este spec ("manejo de errores de red"), mismo patrón ya diferido para `NotesService.purchase()` en CAP-3. → **defer**.
- **[blind-hunter]** `TutorDetailPage.goToMessages()` navega a `/messages` sin id, a diferencia de `BookingsPage.goToChat(userId)` que navega a `/messages/:userId`. — `false`: verificado que el MVP tiene exactamente la misma inconsistencia entre ambas páginas (`explore/tutors/[id]/page.tsx`: `router.push('/messages')` sin id; `bookings/page.tsx`: `Link href={/messages/${booking.tutor?.user_id}}`) — paridad fiel, no una regresión introducida aquí.
- **[blind-hunter]** El botón de mensaje/chat ícono-only en el perfil de tutor no tiene `aria-label`. — `low`: verificado que el MVP tiene el mismo botón sin `aria-label`. Paridad fiel, misma clase de gap de accesibilidad ya diferida para los botones ícono-only de CAP-2. → **defer**.
- **[blind-hunter]** El comentario del catch-all en `app.routes.ts` (inventario de qué dominios siguen cayendo ahí) no se actualizó para las 2 rutas nuevas de este spec (`explore/tutors/:id`, `bookings`), que ya no caen ahí. — `low`: real, documentación desactualizada para un lector futuro; el fix es una corrección directa del texto del comentario. → **patch**.
- **[blind-hunter]** `payment_amount` en 0 se muestra como `-` en vez de `$0` formateado, por el operador ternario que trata `0` como falsy. — `low`: verificado que el MVP tiene exactamente el mismo ternario (`booking.payment_amount ? formatCLP(...) : '-'`). Paridad fiel. → **defer**.
- **[blind-hunter]** `upcoming()`/`past()` comparan la fecha del horario (medianoche local) contra la hora actual, así que una reserva de hoy más tarde cae en "Anteriores" apenas pasa la medianoche, horas antes de la clase real. — `low`: verificado que el MVP tiene exactamente la misma comparación. Cumple explícitamente el Always de este spec ("paridad exacta con el MVP"), no es un defecto introducido por este story. → **defer**.
- **[blind-hunter + edge-case-hunter]** `BookingsService.create()` cae a modality `'presencial'` cuando `tutor.modalities` está vacío (`[]`), registrando una modalidad que el tutor nunca configuró. — `low`: verificado que el MVP tiene exactamente el mismo fallback (`tutor.modalities.includes('online') ? 'online' : 'presencial'`). Paridad fiel. → **defer**.
- **[blind-hunter]** `<app-toast>` en `tutor-detail.page.html` no usa `positionAnchor`, pudiendo quedar oculto detrás de la barra de acciones fija inferior. — `low`: real, pero el mismo gap ya existe en `note-detail.page.html` (código preexistente, no tocado por este diff) — no es un defecto introducido por este story. → **defer**.
- **[edge-case-hunter]** El CTA "Explorar tutores" del EmptyState de `/bookings` navega a `/explore` en vez de `/explore?tab=tutors` (el destino exacto del MVP), aterrizando al usuario en la tab de Apuntes en vez de Tutores. — `low`: verificado contra el MVP (`bookings/page.tsx` línea 174: `href="/explore?tab=tutors"`); el fix es una corrección directa de un parámetro de query, no agrega complejidad. → **patch**.
- **[edge-case-hunter]** `upcoming()`/`past()` podrían fallar en clasificar una reserva si `schedule.date` no es parseable (`Invalid Date`), excluyéndola de ambas tabs. — `low`: no hay ningún flujo legítimo de la app que produzca una fecha no parseable desde Supabase (columna `date` siempre válida); el fix agregaría una guarda para un estado no demostrado como alcanzable. → **reject**.
- **[blind-hunter]** `ionic-app/angular.json` gana `"analytics": "..."` sin relación con esta feature. — `low`: confirmado que esta modificación ya estaba presente en el working tree antes de este spec (mismo ruido de tooling local ya documentado en `deferred-work.md` desde `spec-cap-3-publish-note.md`) — no causado por este story. → **defer**.

## Design Notes

Sustituciones de ícono lucide→ionicons (ver Code Map e Implementation Notes) siguen el mismo criterio que CAP-2/CAP-3 (outline equivalente más cercano). `/bookings` queda registrada y protegida por `protectedGuard` pero sin ningún link in-app hacia ella hasta que CAP-6 (Profile) agregue el ítem de menú "Mis reservas" — mismo patrón ya aceptado de rutas reales sin entrada de navegación todavía (p. ej. `/publish/note` antes de que existiera su chooser).

## Verification

**Commands:**
- `npx ng test` -- ejecutado tras los patches: 142/146 tests pasan; el 1 archivo/4 tests que fallan son el flake preexistente de `auth.service.spec.ts` (`TypeError: fetch failed`) — confirmado no relacionado: pasa aislado (6/6) y este diff nunca toca `auth.service.ts`/`.spec.ts` (`git diff --stat` contra el baseline no lo lista). Incluye los 8 tests de `tutor-detail.page.spec.ts` (+3 nuevos de la ronda de patches), 8 de `bookings.page.spec.ts`, 6 de `bookings.service.spec.ts`, 3 nuevos de `tutors.service.spec.ts` (`getById`), y las 4 rutas nuevas en `app.routes.spec.ts`.
- `npx ng build` -- ejecutado: build sin errores (solo warnings preexistentes de presupuesto de estilos por-componente en `note-detail`/`home`/`publish-note`, y ahora también en `tutor-detail`, los 4 bajo el umbral de *error* de 4kB — mismo patrón ya aceptado en specs previos).
- `npx ng lint` -- ejecutado: sin errores.

Patches aplicados tras la review (4, ver Review Triage Log): `loadTutor()` ahora resetea `selectedSchedule` en cada carga y descarta respuestas fuera de orden (`id !== this.currentId`) tras cada `await`; `handleBooking()` ya no deja `booking()` pegado en `true` si el horario no está en `schedules()` (muestra toast de error y libera el spinner); el comentario del catch-all en `app.routes.ts` menciona las 2 rutas nuevas; `goExplore()` navega a `/explore?tab=tutors` (paridad exacta con el MVP).
