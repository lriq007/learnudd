---
title: 'CAP-6: Perfil de usuario en Ionic+Angular'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'ddbe5d20119bf8e73e72840faac3c2b2c0340e8f'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CAP-1/CAP-2/CAP-3/CAP-4/CAP-5/CAP-7 migraron auth, home/explore/favorites, notes marketplace, tutoring/bookings y mensajería, pero `/profile` no existe en Ionic+Angular todavía: el link ya wired en el navbar (ícono "Perfil") cae en el catch-all (`redirectTo: 'kit'`). El dashboard de creador (`/profile/creator`) queda fuera de este spec (ver `deferred-work.md`).

**Approach:** Portar 1:1 desde el MVP Next.js (`src/app/(protected)/profile/page.tsx`) la página de perfil: datos del usuario (nombre, verificado, carrera, email), 3 stats (biblioteca/favoritos/publicados) vía counts paralelos, menú de navegación a biblioteca/favoritos/reservas/pago/ayuda, y logout — reusando `AuthService` y el UI kit existente. **Decisión (human, 2026-09-27):** el MVP es de solo lectura, pero se agrega edición inline de `full_name`/`major` (los dos campos visibles en esta página) usando `AuthService.updateProfile()`, que ya existe sin uso — funcionalidad nueva respecto al MVP, deliberada.

## Boundaries & Constraints

**Always:**
- Reusar `AuthService.user()`/`signOut()`/`updateProfile()` (ya existen, no reimplementar) y UI kit existente (`HeaderComponent`, `CardComponent`, `ButtonComponent`, `InputComponent`, `VerifiedBadgeComponent`, `SkeletonComponent`, `ToastComponent`) sin crear componentes nuevos.
- Registrar la ruta `profile` con `protectedGuard`, antes del catch-all `**`, siguiendo el patrón de `favorites`.
- Los 3 counts (library/favorites/notes publicados) se cargan en paralelo (`Promise.all`) igual que el MVP, con `getInitials()` para el avatar-círculo.
- "Métodos de pago" y "Ayuda" siguen siendo enlaces muertos (`#`), igual que el MVP — no crear esas páginas.
- Botón "Editar perfil" alterna a modo edición con `app-input` para `full_name`/`major` (`ngModel` explícito sobre signals); "Guardar" deshabilitado si algún campo queda vacío tras `.trim()`; "Cancelar" descarta cambios sin llamar a `updateProfile()`. Patrón de `loading` signal + toast de éxito/error igual a `publish-tutor.page.ts`.

**Never:**
- Agregar upload de avatar/imagen — el MVP no lo tiene.
- Permitir editar `email`, `campus`, `avatar_url` ni `verified` — solo `full_name`/`major` entran en el alcance de edición.
- Agregar manejo de error de red explícito para los counts (si falla, mostrar 0, igual que el MVP `|| 0`) — mismo patrón ya diferido repetidamente (CAP-2/3/4/5).
- Tocar `AuthService`, `NavbarComponent`, o el `redirectTo: 'kit'` del catch-all para otras rutas.
- Construir `/profile/creator` (dashboard de creador) — diferido, ver `deferred-work.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Perfil cargado | usuario autenticado con `profiles.full_name`/`major`/`verified` | Header "Mi perfil", avatar-iniciales, nombre, badge verificado si aplica, carrera, email, 3 stats numéricas | N/A |
| Counts fallan | query de library/favorites/notes rechaza | Stat correspondiente muestra 0 | Silencioso, igual que el MVP |
| Sin sesión | usuario sin `auth.user()` | `protectedGuard` redirige a login | N/A |
| Logout | click en "Cerrar sesión" | `AuthService.signOut()`, sale del área protegida | N/A |
| Editar y guardar | modo edición, `full_name`/`major` no vacíos tras `.trim()` | `updateProfile()` actualiza signal local, toast éxito, vuelve a modo lectura | Si `{error}` no-nulo, toast de error, permanece en modo edición |
| Editar con campo vacío | modo edición, `full_name` o `major` en blanco/solo espacios | Botón "Guardar" deshabilitado | N/A |

</frozen-after-approval>

## Code Map

- `src/app/(protected)/profile/page.tsx` -- fuente MVP a portar 1:1 (185 líneas)
- `supabase/migrations/001_initial_schema.sql:8-20` -- columnas de `profiles` (ya portadas en `ionic-app/src/app/shared/models.ts:6-18`)
- `ionic-app/src/app/shared/state/auth.service.ts:38-39,49,83,148` -- `user` signal, `fetchUser()`, `signOut()`, `updateProfile(updates): Promise<{error}>` -- reusar directo para guardar `full_name`/`major`
- `ionic-app/src/app/shared/ui/` -- `button/`, `card/`, `input/`, `verified-badge/`, `skeleton/`, `toast/` a reusar
- `ionic-app/src/app/shared/utils.ts` -- `getInitials()` para avatar-círculo
- `ionic-app/src/app/app.routes.ts` -- catch-all `**` y patrón de ruta protegida (ej. `favorites`) a copiar
- `ionic-app/src/app/shared/layout/navbar/navbar.component.ts:39` -- link a `/profile` ya wired, sin cambios
- `ionic-app/src/app/publish-tutor/publish-tutor.page.ts:60,69-71,112,132,135-139` -- patrón de `loading` signal + toast a replicar para guardar la edición

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/profile/profile.page.ts` -- crear componente standalone con signals para user, stats (library/favorites/notesPublished), `editing`, `fullNameDraft`/`majorDraft`, `loading`, toast -- página nueva de dominio
- [x] `ionic-app/src/app/profile/profile.page.html` -- template con Header, avatar+iniciales, badge verificado, carrera/email (modo lectura) o `app-input` para nombre/carrera (modo edición), 3 stats, menú (biblioteca/favoritos/reservas/pago/ayuda), botones Editar/Guardar/Cancelar/logout -- port del MVP con `@if`/`@for` + edición inline nueva
- [x] `ionic-app/src/app/profile/profile.page.scss` -- estilos equivalentes al MVP -- paridad visual
- [x] `ionic-app/src/app/app.routes.ts` -- agregar `{ path: 'profile', loadComponent: ..., canActivate: [protectedGuard] }` antes de `**` -- desbloquea el link ya wired en el navbar

**Acceptance Criteria:**
- Given un usuario autenticado, when navega a `/profile`, then ve sus datos y 3 stats correctos sin caer en el catch-all.
- Given click en "Cerrar sesión", when se ejecuta, then `AuthService.signOut()` corre y el usuario sale del área protegida.
- Given modo edición con `full_name`/`major` válidos, when se hace click en "Guardar", then `AuthService.updateProfile()` corre, el signal `user` se sincroniza y aparece un toast de éxito.

## Implementation Notes

## Spec Change Log

## Review Triage Log

- **[verification-gap] Per-user scoping de los 3 counts no está verificado por el test.** Verdict: `low`. `makeSupabaseStub().eq` es `vi.fn(() => Promise.resolve(...))` sin registrar sus argumentos — el test no puede distinguir un `.eq('user_id', userId)` correcto de uno con campo o id equivocado. Agrupado con el hallazgo de blind-hunter sobre el mismo stub. Route: `patch`.
- **[blind] "Counts fallan" (fila de la matriz I/O) solo prueba el cliente `null`, no una query que resuelve con `count`/`error` mientras el cliente existe.** Verdict: `low`. Mismo stub de `makeSupabaseStub` que el hallazgo anterior — mismo root cause, agrupado en el mismo `patch`.
- **[blind] `profile.page.ts`/`.html` no usa `SkeletonComponent` mientras cargan los 3 stats.** Verdict: `false`. Verificado contra la investigación de CAP-6: el MVP (`profile/page.tsx`) tampoco tiene loading state visual para estos stats ("arrancan en 0") — la Approach pide portar 1:1, y `SkeletonComponent` en Boundaries lista componentes disponibles a reusar, no un mandato de agregar skeleton donde el MVP no lo tiene.
- **[blind] Fallback de avatar `getInitials(user()?.full_name || 'EU')` renderiza `'E'`, no `'EU'`.** Verdict: `low`. Confirmado leyendo `shared/utils.ts:37-44`: `getInitials` separa por espacios y `'EU'` no tiene ninguno, así que el resultado es `'E'`. Route: `patch`.
- **[blind] Comentario de `.profile-logout` en el SCSS dice portar `"text-red-500 hover:bg-red-50"` pero solo implementa el color de texto.** Verdict: `low`. Confirmado: solo `--color: var(--ion-color-danger)`, sin regla de `hover` con fondo. Route: `patch`.
- **[blind] El modo edición oculta por completo el badge verificado y el email.** Verdict: `low`, rechazado. Es un patrón de formulario razonable (alternar a campos editables oculta temporalmente info de solo lectura no relacionada); nada se pierde ni se bloquea, y el fix requeriría reestructurar el template para duplicar esos elementos fuera del `@if`/`@else` — más que una corrección directa, y poco probable que un usuario lo perciba como un problema real.
- **[blind] El test de `canSave()` con campo vacío solo prueba `fullNameDraft` vacío, no el caso simétrico con `majorDraft` vacío.** Verdict: `low`. El código (`&&` de dos `.trim()`) es correcto por inspección, pero falta el caso simétrico. Route: `patch`.
- **[blind] Ningún test cubre `verified: false` (ausencia del badge).** Verdict: `low`. Confirmado que solo se prueba `verified: true` (default de `baseUser`). Route: `patch`.
- **[edge-case] `Promise.all` de los 3 counts no maneja un `reject()` real (no solo un `{error}` resuelto).** Verdict: `false`. El propio Boundaries frozen ("Never: agregar manejo de error de red explícito para los counts") excluye explícitamente esto por decisión humana ya aprobada; un reject real de todas formas deja `stats` en su valor inicial `{0,0,0}`, el mismo resultado visible que exige el Never — fuera de alcance por el propio intent congelado.
- **[edge-case] `ProfilePage.signOut()` nunca navega tras `AuthService.signOut()` — el usuario permanece en `/profile` con datos obsoletos/vacíos en vez de salir del área protegida.** Verdict: `medium`. Confirmado: no hay `router.navigate`/`parseUrl` en `signOut()`, y no existe ningún listener reactivo de `onAuthStateChange` en toda la app (`grep` sobre `shared/` y `app.routes.ts` no encuentra ninguno) que redirija automáticamente — a diferencia del MVP, cuyo `(protected)/layout.tsx` sí reacciona al cambio de `user`. Contradice el AC frozen "el usuario sale del área protegida". Route: `patch`.

## Verification

**Manual checks (if no CLI):**
- Navegar a `/profile` autenticado: verificar datos, stats, y que los 5 ítems del menú naveguen o queden como `#` según corresponda.
- Click en "Cerrar sesión": verificar que expulsa de rutas protegidas.
