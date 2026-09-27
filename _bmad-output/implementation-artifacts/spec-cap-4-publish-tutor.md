---
title: 'CAP-4 (resto): Publicar tutoría en Ionic+Angular'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '9eafc67f01a842ed249337d27c2bb23903f684de'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CAP-4 migró detalle de tutor y reservas, pero la tarjeta "Ofrecer clases" del chooser (`/publish`, ya enlaza a `/publish/tutor`) sigue cayendo en el catch-all — el formulario de creación de perfil de tutor no existe en Ionic+Angular.

**Approach:** Portar 1:1 `src/app/(protected)/publish/tutor/page.tsx` (formulario de una sola página, no wizard) a `ionic-app/src/app/publish-tutor/`, reusando los patrones de `publish-note.page.ts` (signals, `app-button` toggle, `ToastComponent`) y el patrón de mutación de `NotesService.create()` para el nuevo `TutorsService.create()`.

## Boundaries & Constraints

**Always:** Paridad fiel con el MVP — una sola página sin pasos (no wizard como `publish-note`), mismos campos (`bio`, `experience`, `hourly_price` default `10000`, `campus` default `'Santiago'` vía `CAMPUS_OPTIONS`, `modalities` toggle `['presencial', 'online']`, `courses` lista dinámica de `{course_name, major}` con al menos una fila), misma validación `canSubmit` (`bio && modalities.length > 0 && courses.some(c => c.course_name && c.major)`), mismo insert en 2 pasos (`tutors` primero, luego `tutor_courses` filtrado a filas completas, sin chequear su error).

**Never:** No construir gestión de `tutor_schedules`/disponibilidad (el MVP no la toca en este flujo). No agregar guarda contra perfil de tutor duplicado (`tutors.user_id` es `UNIQUE`) más allá de lo que el MVP maneja — un conflicto de constraint cae en el mismo toast genérico de error. No agregar manejo de errores de red más allá del MVP (`error`/`!tutor` → toast genérico, sin try/catch). No tocar `/profile/creator` ni CAP-6.

**Decisión (Open Question resuelta):** Tras un submit exitoso, sin redirect — solo el toast de éxito, el usuario se queda en la página. Mismo precedente que CAP-3 (`spec-cap-3-publish-note.md`): `/profile/creator` (CAP-6) no existe todavía.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Campos incompletos | `bio` vacío, o `modalities` vacío, o ningún curso con `course_name` y `major` | Botón "Crear perfil de tutor" deshabilitado (`canSubmit()` false) | N/A |
| Submit ok | `canSubmit()` true, click en submit | Insert en `tutors`, luego insert en `tutor_courses` (filas filtradas), toast success, sin redirect | N/A |
| Insert en `tutors` falla | Supabase devuelve `error` o `!tutor` | Toast error "Error al crear perfil de tutor", `loading` vuelve a `false`, no se intenta insert en `tutor_courses` | Mismo genérico que el MVP |
| Insert en `tutor_courses` falla | Insert en `tutors` OK, insert en `tutor_courses` devuelve `error` | Toast success igual (mismo fire-and-forget del MVP) | Error descartado, igual que el MVP |
| Agregar/quitar curso | Click en "Agregar" / ícono quitar (oculto si solo queda 1 fila) | Lista de cursos crece/decrece | N/A |

</frozen-after-approval>

## Code Map

- `src/app/(protected)/publish/tutor/page.tsx` -- MVP fuente completa: `formData` (líneas 22-29), `toggleModality`/`addCourse`/`removeCourse`/`updateCourse` (líneas 31-58), `handleSubmit` (líneas 60-102), `canSubmit` (líneas 104-107).
- `ionic-app/src/app/publish/publish.page.html:25` -- ya enlaza `routerLink="/publish/tutor"`, no requiere cambios.
- `ionic-app/src/app/publish-note/publish-note.page.ts` -- patrón golden a replicar (no el wizard de pasos, solo las convenciones): signals por campo, `inject(AuthService)`/`inject(TutorsService)`, `ToastComponent` con `toastOpen`/`toastType`/`toastMessage` + `showToast()`, `app-button [variant]` toggle para las 2 opciones de modalidad (mismo patrón que la grilla de tipo de material).
- `ionic-app/src/app/shared/state/tutors.service.ts` -- agregar `create(userId, data)`: mismo patrón sin try/catch que `NotesService.create()` (client null-check → `{error: 'Error al crear perfil de tutor'}`), 2 inserts secuenciales (`tutors` luego `tutor_courses` filtrado), el segundo insert no propaga su error.
- `ionic-app/src/app/shared/models.ts` -- agregar `CAMPUS_OPTIONS` (cerca de `MAJOR_OPTIONS`, portado de `src/types/index.ts:189-194`) y `CreateTutorInput` (cerca de `Tutor`/`TutorCourse`, mismo criterio que `CreateNoteInput` en `notes.service.ts`).
- `ionic-app/src/app/app.routes.ts:65-68` -- agregar ruta `publish/tutor` (`protectedGuard`) después de `publish/note`, antes del catch-all. Actualizar el comentario del catch-all (líneas 91-104) quitando la mención de `/publish/tutor` como ruta aún capturada.
- `ionic-app/src/app/app.routes.spec.ts` -- agregar tests de resolución para `/publish/tutor` (autenticado y redirect a `/login`), mismo patrón que los ya existentes para `/publish/note` (líneas 108-125).
- `ionic-app/src/app/shared/ui/button|input/*.component.ts` -- reusar tal cual, sin cambios de API.

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/shared/models.ts` -- agregar `CAMPUS_OPTIONS` y `CreateTutorInput`.
- [x] `ionic-app/src/app/shared/state/tutors.service.ts` -- agregar método `create(userId, data)`.
- [x] `ionic-app/src/app/shared/state/tutors.service.spec.ts` -- tests de `create()`: éxito (2 inserts), error en insert de `tutors` (no intenta `tutor_courses`), error silenciado en insert de `tutor_courses`.
- [x] `ionic-app/src/app/publish-tutor/publish-tutor.page.ts` + `.html` + `.scss` -- formulario, port 1:1 de `publish/tutor/page.tsx`.
- [x] `ionic-app/src/app/publish-tutor/publish-tutor.page.spec.ts` -- test de `canSubmit`, agregar/quitar curso, submit éxito/error.
- [x] `ionic-app/src/app/app.routes.ts` -- registrar `publish/tutor` antes del catch-all, actualizar comentario del catch-all.
- [x] `ionic-app/src/app/app.routes.spec.ts` -- tests de resolución para `/publish/tutor` (autenticado y sin sesión).

**Acceptance Criteria:**
- Given un usuario autenticado en `/publish/tutor` con `bio`, al menos 1 modalidad y al menos 1 curso completo, when hace click en "Crear perfil de tutor", then se inserta en `tutors` y `tutor_courses`, se ve el toast de éxito, y el usuario permanece en la página.
- Given campos requeridos incompletos (`bio` vacío, sin modalidad, o ningún curso con `course_name` y `major`), when se evalúa el formulario, then el botón de submit está deshabilitado.
- Given el insert en `tutors` falla, when hace submit, then se ve el toast de error y no se intenta el insert en `tutor_courses`.

## Implementation Notes

- `TutorsService.create()` mirrors `NotesService.create()`'s `{error}` pattern exactly: a null client and a failed/empty `tutors` insert both resolve to the same fixed `'Error al crear perfil de tutor'` string, the real Supabase error is never surfaced, and the second `tutor_courses` insert is unconditionally fire-and-forget (its error is never read, and it's skipped entirely both when there is no `tutorError`/`tutor` and when every course row is incomplete).
- `publish-tutor.page.ts` is a flat form, no `step`/`canProceed` -- only `canSubmit` (`bio && modalities.length > 0 && courses.some(complete)`), matching the frozen Boundaries and Design Notes explicitly.
- The dynamic courses list has no kit-component precedent (per Design Notes): implemented as `signal<CourseRow[]>` with `.update()` push/filter/map-by-index, same minimal logic as the MVP's array spreads. `removeCourse`'s icon-button is hidden via `@if (courses().length > 1)`, matching the MVP's `formData.courses.length > 1` guard.
- `hourlyPrice` uses a raw `ion-input type="number"` + manual `(ionInput)` handler (`setHourlyPrice`, `parseInt(String(value ?? ''), 10) || 0`) rather than `app-input`'s two-way `[(value)]`, since `InputComponent.value` is string-typed -- same established pattern `publish-note.page.ts` already uses for its numeric `price` field (step 3). `campus`/course `major` reuse the `ion-select` + `(ionChange)` pattern already established by `publish-note.page.ts`'s `major`/`semester` selects.
- Added `<app-header title="Ofrecer clases" [showBack]="true">` at the top of the page -- the MVP's `page.tsx` renders `<Header title="Ofrecer clases" showBack />` (unlike `publish/note/page.tsx`, which has no Header and uses its own progress bar instead); `[showBack]="true"` follows the same convention `tutor-detail.page.html`/`bookings` already use for a single-page (non-wizard) route.
- Icons: `Plus`→`addOutline`, `X`→`closeOutline` (both already used elsewhere in this app, e.g. `navbar.component.ts`/`explore.page.ts`/`toast.component.ts`), `CheckCircle`→`checkmarkCircleOutline` (already the established substitute, e.g. `publish-note.page.ts`). No new lucide→ionicons substitution introduced.
- `npx ng test`: 164/164 passed (24 files), including the 14 new/updated tests (`tutors.service.spec.ts` `create()`: 6 tests; `publish-tutor.page.spec.ts`: 10 tests; `app.routes.spec.ts`: 2 new route-resolution tests). No `auth.service.spec.ts` network flake was observed on this run. `npx ng build`: succeeds, no errors (pre-existing SCSS budget warnings on other components, unrelated to this change; `publish-tutor.page.scss` is not flagged). `npx ng lint`: clean.
- Ronda de review (blind-hunter + edge-case-hunter + verification-gap): 1 hallazgo `patch` aplicado por el mismo subagente de implementación — test de `experience: ''` → `null` agregado a `tutors.service.spec.ts` (`create()`, línea 165). 165/165 tests, `ng lint` limpio y `ng build` sin errores tras el fix (mismas 2 advertencias preexistentes de presupuesto SCSS en componentes no tocados por este spec). El resto de hallazgos se verificó como `false` (1, patrón `#ffffff` ya establecido en `publish-note.page.scss`/`onboarding.page.scss`/`note-detail.page.scss`) o `defer` (8, paridad fiel con el MVP o gaps de accesibilidad ya aceptados en specs anteriores) — ver Review Triage Log y las 8 nuevas entradas en `deferred-work.md`.

## Spec Change Log

## Review Triage Log

- **medium** — `TutorsService.create()` inserta `experience: data.experience || null` pero ningún test de `tutors.service.spec.ts` ejercita `experience` vacío/falsy para confirmar la coerción a `null` (verification-gap). Verificado: el fixture `input` compartido por todos los tests de `create()` siempre usa un `experience` truthy; si se quitara el `|| null` ningún test fallaría. Mismo patrón ya cubierto para `NotesService.create()` (`notes.service.spec.ts` líneas 256-267/275-298 con fixture all-empty). → **patch**.
- **medium** — Sin guarda contra `hourly_price` negativo ni `min` en el input numérico; el `CHECK (hourly_price >= 0)` de la tabla `tutors` rechazaría el insert y solo se vería el toast genérico, sin indicar la causa real (blind-hunter + edge-case-hunter). Verificado: `publish/tutor/page.tsx` línea 168 tiene exactamente el mismo `parseInt(e.target.value) || 0` sin `Math.max` ni `min` en su `Input`. Paridad fiel con el MVP. → **defer**.
- **low** — Filas de curso incompletas se descartan en silencio al hacer submit, sin avisar al usuario (blind-hunter). Verificado: `handleSubmit` del MVP (líneas 87-93) hace el mismo `.filter(c => c.course_name && c.major)` sin ningún aviso. Paridad fiel. → **defer**.
- **low** — Los botones toggle de modalidad no tienen `aria-pressed` y los `<label>` de Bio/Modalidades/Ramos no están asociados a sus controles vía `for`/`id` (blind-hunter). Real, pero misma clase de gap de accesibilidad ya aceptada y diferida en CAP-2/CAP-3. → **defer**.
- **false** — `.publish-tutor-actions` hardcodea `background: #ffffff` en vez de un token (blind-hunter). Verificado: `publish-note.page.scss:201` (`.publish-note-nav`, la barra sticky análoga), `onboarding.page.scss` y `note-detail.page.scss` ya usan ese mismo `#ffffff` literal para sus barras de acción — patrón repetido y ya aceptado, no una desviación de este diff.
- **low** — `canSubmit()`/el filtro de cursos no hacen `.trim()` (edge-case-hunter). Verificado: `canSubmit` del MVP (líneas 104-107) tampoco hace trim. Paridad fiel. → **defer**.
- **low** — `submit()` no vuelve a evaluar `canSubmit()` antes de llamar a `tutorsService.create()` (edge-case-hunter). Verificado: `handleSubmit` del MVP tampoco re-chequea `canSubmit`, solo el guard `if (!user) return`. Paridad fiel. → **defer**.
- **low** — `submit()` no tiene try/catch: si `tutorsService.create()` rechaza, `loading()` queda en `true` para siempre sin toast (edge-case-hunter). Verificado: el MVP tampoco tiene try/catch en `handleSubmit`. El Never de este spec excluye explícitamente agregar manejo de errores de red. → **defer**.
- **low** — `submit()` no tiene guarda anti doble-tap (edge-case-hunter). Verificado: el MVP tampoco la tiene, y el mismo gap ya fue diferido para `BookingsPage.handleBooking()` en `spec-cap-4-tutor-bookings.md`. → **defer**.
- **low** — `addCourse()` no tiene tope ni chequeo de duplicados, y `removeCourse()` no tiene guarda interna contra vaciar la lista (blind-hunter + edge-case-hunter). Verificado: el MVP tiene exactamente la misma lógica (`courses: [...formData.courses, {...}]` sin tope, `formData.courses.length > 1` solo en el JSX). Paridad fiel. → **defer**.
- **low** — El shape `{course_name, major}` está redeclarado 3 veces (`CreateTutorInput.courses`, `CourseRow` local, y los object literals de `tutors.service.spec.ts`) en vez de derivarlo de `TutorCourse` ya existente (blind-hunter). Real pero de bajo impacto — no hay evidencia de que vaya a causar una divergencia concreta pronto, y unificarlo requiere más que una corrección directa (introducir un alias/`Pick` y tocar los 3 sitios). → rechazado.

## Design Notes

`publish-tutor.page.ts` NO es un wizard: a diferencia de `publish-note.page.ts` (4 pasos, `step` signal, `canProceed` por paso), el MVP de tutor es un formulario plano de una sola pantalla con un único botón de submit al final — no introducir pasos ni `canProceed` que el MVP no tiene. La lista de cursos (`courses` signal, array de `{course_name, major}`) no tiene componente de kit equivalente; usar `signal<Array<{course_name: string; major: string}>>([{course_name: '', major: ''}])` con `.update()` para push/filter, análogo a como `publish-note.page.ts` maneja sus signals de campo simple pero sin precedente de lista dinámica en este repo — mantener la lógica mínima (push/filter/map por índice), igual que el MVP.

## Verification

**Commands:**
- `npx ng test` (desde `ionic-app/`) -- expected: todos los tests pasan (mismo flake preexistente de red en `auth.service.spec.ts` documentado en specs anteriores es aceptable, no introducido por este cambio).
- `npx ng build` -- expected: sin errores.
- `npx ng lint` -- expected: sin errores.
