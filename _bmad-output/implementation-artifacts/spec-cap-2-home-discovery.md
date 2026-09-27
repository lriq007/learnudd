---
title: 'CAP-2: Home & Discovery en Ionic+Angular'
type: 'feature'
created: '2026-09-26'
status: 'done'
route: 'dispatch' # oneshot | dispatch — set by step-02's route gate after design
review_loop_iteration: 0
context: []
baseline_commit: 'a52929e8c2d6b463b7e9600949934bb9ff897ca5'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** El MVP Next.js resuelve home/feed, explorar (apuntes+tutores) y favoritos contra Supabase bajo `(protected)/`; con CAP-1 (auth+guards) y CAP-7 (kit+stores) ya migrados, `ionic-app/` sigue sin ningún dominio de producto real — `/kit` es el destino temporal post-login y ningún servicio fuera de `AuthService` consulta Supabase todavía.

**Approach:** Construir en `ionic-app/` las páginas standalone `home` (`/`), `explore` (`/explore`) y `favorites` (`/favorites`) detrás de `protectedGuard`, con dos componentes de UI nuevos (`NoteCard`/`TutorCard`) reusados por las 3, y extraer un `SupabaseService` compartido (primera vez que más de un dominio necesita el cliente) consumido por nuevos `NotesService`/`TutorsService`/`FavoritesService` y por el `AuthService` existente. `/` deja de redirigir a `/kit`; `/kit` sigue existiendo para la demo del UI kit.

## Boundaries & Constraints

**Always:** Standalone + signals/`computed()`; `@if`/`@for`/`@empty`; `ngModel` explícito (`[ngModel]="v()" (ngModelChange)="v.set($event)"`); reutilizar `app-button`/`app-card`/`app-input`/`app-badge`/`app-skeleton`/`app-empty-state`/`app-rating-stars`/`app-verified-badge` en vez de HTML nativo — incluye reemplazar el `<div class="skeleton">` crudo del MVP por `AppSkeletonComponent` y el `<input>` crudo de búsqueda por `AppInputComponent`, y el `<button>` crudo de la acción de `EmptyState` en Favoritos por `AppButtonComponent`. `SupabaseService` porta tal cual el patrón null-fallback de `AuthService` (cliente `null` si faltan env vars o `createClient` lanza; nunca lanza hacia el caller); `AuthService` se refactoriza para inyectar `SupabaseService` en vez de construir su propio cliente (evita dos instancias de `GoTrueClient` sobre el mismo storage key) sin cambiar ninguna de sus firmas ni su comportamiento observable. `MAJOR_OPTIONS` se mueve de `onboarding.page.ts` a `shared/models.ts` (ahora tiene 2 consumidores) e `onboarding.page.ts` la importa desde ahí.

**Never:** No se implementa el toggle de favorito (agregar/quitar) — vive en el detalle de nota (`explore/notes/[id]`, CAP-3), fuera de alcance; Favoritos es de solo lectura, igual que en el MVP. No se corrigen los 4 bugs de `known-issues.md`. No se adopta `UiService` (CAP-7) en Explore — el MVP nunca conectó su `uiStore` equivalente; Explore mantiene estado local por página, paridad fiel (incluye que los filtros se pierdan al salir y volver a entrar). No se agrega manejo de error de Supabase que el MVP no tiene (`data ?? []`, error ignorado). No se corrige el filtro de tutores por relación anidada (`.or()`/`.contains()` sobre `courses`) sin verificarlo contra Supabase real — se porta tal cual y se documenta en `deferred-work.md`, no se intenta arreglar a ciegas. No se construyen CAP-3 a CAP-6 (detalle de nota, biblioteca, publicar, perfil de tutor, reservas, mensajería, perfil/dashboard) ni CAP-8 (Vercel).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Home sin notas/tutores | Ambas queries devuelven `[]` | Secciones renderizan vacías, sin `EmptyState` (paridad: MVP no maneja este caso) | N/A |
| Explore cambia de tab o filtro mientras carga | `activeTab`/`searchQuery`/`filters` cambian antes de resolver el fetch anterior | El resultado del fetch obsoleto se descarta; solo se aplica el de la última consulta | N/A |
| Explore sin resultados | Fetch resuelve `[]` tras cargar | `EmptyState` con texto/ícono según `activeTab` | N/A |
| Favoritos vacío | `favorites` tabla sin filas para el usuario | `EmptyState` con acción "Explorar" (`AppButtonComponent`) → navega a `/explore` | N/A |
| Favorito con `note` o `tutor` nulo | Un registro de `favorites` trae solo uno de los dos poblado | Renderiza `NoteCard` o `TutorCard` según cuál exista, nunca ambos | N/A |

</frozen-after-approval>

## Code Map

- `ionic-app/src/app/shared/models.ts` -- agregar `Note`, `Tutor`, `TutorCourse`, `Favorite`, `MaterialType`, `MATERIAL_TYPE_LABELS`, `MAJOR_OPTIONS` (portar de `src/types/index.ts` líneas 17-24, 29-52, 73-95, 168-177, 189-196, 224-232).
- `ionic-app/src/app/onboarding/onboarding.page.ts` -- quitar el literal local `MAJOR_OPTIONS`, importar desde `shared/models`.
- `ionic-app/src/app/shared/state/supabase.service.ts` -- nuevo; extrae el campo privado `supabase` de `auth.service.ts` (líneas 23-30) a un servicio inyectable con getter `client: SupabaseClient | null`.
- `ionic-app/src/app/shared/state/auth.service.ts` -- inyectar `SupabaseService`, usar `this.supabase.client` en vez de construir su propio `createClient(...)`; sin cambios de comportamiento.
- `ionic-app/src/app/shared/state/notes.service.ts` -- nuevo; `fetchHome()` (paridad `(protected)/page.tsx` líneas 25-31: `active`, orden desc, `limit(5)`), `search({query, major, materialType})` (paridad `explore/page.tsx` líneas 46-63).
- `ionic-app/src/app/shared/state/tutors.service.ts` -- nuevo; `fetchHome()` (paridad `page.tsx` líneas 32-36: `verified`, `limit(3)`), `search({query, major})` (paridad `explore/page.tsx` líneas 64-85, incluido el filtro sospechoso de relación anidada -- portar literal).
- `ionic-app/src/app/shared/state/favorites.service.ts` -- nuevo; `fetchAll(userId)` (paridad `favorites/page.tsx` líneas 26-30).
- `ionic-app/src/app/shared/ui/note-card/note-card.component.ts(.html)(.scss)` -- nuevo; input `note: Note`, `showMaterialBadge = false`, `showRating = true`; cubre las 3 variantes list de Home/Explore/Favoritos (badge de tipo de material solo en Explore; rating oculto en Favoritos) más la variante compacta de "Mejor evaluados" (`page.tsx` líneas 178-207) vía `variant: 'list' | 'compact'`.
- `ionic-app/src/app/shared/ui/tutor-card/tutor-card.component.ts(.html)(.scss)` -- nuevo; input `tutor: Tutor`, `subtitle: string` (texto ya formateado por el caller -- Home usa `courses?.[0]?.course_name`, Explore el join completo, Favoritos solo `major`), `showModalities = false`, `showRating = true`.
- `ionic-app/src/app/home/home.page.ts(.html)(.scss)` -- nuevo; paridad `(protected)/page.tsx` completo (saludo, link búsqueda→`/explore`, quick actions→`/explore?tab=`, 3 secciones).
- `ionic-app/src/app/explore/explore.page.ts(.html)(.scss)` -- nuevo; paridad `explore/page.tsx` completo (tabs pill, search bar sobre `AppInputComponent`, panel de filtros, lee `tab` de `ActivatedRoute.queryParamMap` en vez de `useSearchParams()`/`Suspense`).
- `ionic-app/src/app/favorites/favorites.page.ts(.html)(.scss)` -- nuevo; paridad `favorites/page.tsx` completo.
- `ionic-app/src/app/app.routes.ts` -- agregar `''` (home, `protectedGuard`, reemplaza el redirect a `kit`), `explore` (`protectedGuard`), `favorites` (`protectedGuard`); `kit` sigue existiendo tal cual.

## Tasks & Acceptance

**Execution:**
- [x] `shared/models.ts` -- agregar tipos/constantes de dominio -- base para services y páginas.
- [x] `onboarding.page.ts` -- importar `MAJOR_OPTIONS` compartido -- elimina duplicado.
- [x] `shared/state/supabase.service.ts` -- extraer cliente compartido -- base para los 3 services nuevos.
- [x] `shared/state/auth.service.ts` -- consumir `SupabaseService` -- evita clientes duplicados.
- [x] `shared/state/{notes,tutors,favorites}.service.ts` -- queries de dominio -- paridad con las 3 páginas del MVP.
- [x] `shared/ui/note-card/`, `shared/ui/tutor-card/` -- componentes compartidos -- evita triplicar markup en home/explore/favorites.
- [x] `home/home.page.ts`, `explore/explore.page.ts`, `favorites/favorites.page.ts` -- las 3 páginas -- dominio CAP-2 completo.
- [x] `app.routes.ts` -- registrar rutas -- expone los 3 flujos navegables.
- [x] Tests unitarios para las 5 filas de la matriz I/O (mock de Supabase, patrón `notes.service.spec.ts` estilo `auth.service.spec.ts` de CAP-7).

**Acceptance Criteria:**
- [x] Given un usuario autenticado visita `/`, when las queries de notas/tutores resuelven, then ve saludo, quick actions y las 3 secciones sin ir a `/kit`. Verificado en `home.page.spec.ts`; `/` ahora carga `HomePage` en `app.routes.ts`.
- [x] Given Explore con `?tab=tutors`, when la página carga, then el tab "Clases" queda activo sin re-fetch de notas. Verificado en `explore.page.spec.ts`.
- [x] Given Explore sin resultados tras buscar, when el fetch resuelve `[]`, then se muestra `EmptyState` con el texto correcto para el tab activo. Verificado en `explore.page.spec.ts` (ambos tabs).
- [x] Given un usuario sin favoritos, when visita `/favorites`, then ve `EmptyState` con botón "Explorar" que navega a `/explore`. Verificado en `favorites.page.spec.ts`.

## Implementation Notes

**Build/verification:** `cd ionic-app && npm run build` -- 0 errores (solo un warning preexistente-de-tipo de presupuesto de estilo en `home.page.scss`, 104 bytes sobre el budget de 2.00 kB -- no bloqueante, no pedido por Verification). `cd ionic-app && npm test -- --no-watch` -- 15 test files / 50 tests, todos en verde (incluye los 6 `.spec.ts` nuevos/extendidos de esta Task list: `notes.service.spec.ts`, `tutors.service.spec.ts`, `favorites.service.spec.ts`, `home.page.spec.ts`, `explore.page.spec.ts`, `favorites.page.spec.ts`). `cd ionic-app && npm run lint` -- sin hallazgos.

**Decisión (documentada, no silenciosa) -- `TutorCardComponent.showRating` también oculta el `VerifiedBadge`:** el Code Map solo expone 2 inputs booleanos para `tutor-card` (`showModalities`, `showRating`), replicando el patrón de 2 flags de `note-card` (Design Notes). Pero al revisar `favorites/page.tsx` líneas 80-98, el tutor-card de Favoritos no solo omite el rating/precio -- tampoco renderiza el `VerifiedBadge` que Home/Explore siempre muestran cuando `tutor.verified` es true. Agregar un 3er input no documentado habría contradicho el Code Map; en vez de eso, `showRating() === false` (ya la única variante que usa Favoritos) también gatea el `VerifiedBadge`, ya que es el único flag que este componente expone para "la fila secundaria de metadata". Alternativa descartada: agregar `showVerifiedBadge` como 3er input -- excede la superficie que pide el Code Map sin necesidad real (ningún caller necesita las 2 señales desacopladas).

**Decisión (documentada, no silenciosa) -- la ruta catch-all `**` sigue apuntando a `/kit`:** el Code Map de `app.routes.ts` solo pide agregar `''`, `explore`, `favorites` y dice "kit sigue existiendo tal cual" -- no pide retocar el wildcard existente (heredado de CAP-7, ya discutido y aceptado como riesgo preexistente en el Review Triage Log de CAP-1, punto 11). Se dejó literal: los links de Header/Navbar a `/messages`/`/library`/`/profile`/`/publish` (CAP-4 a CAP-6, aún no construidos) siguen cayendo en `/kit` en vez de en el nuevo `/` (home). Si se prefiere que ese fallback apunte a home ahora que existe, es un cambio de una línea fuera del alcance literal de este spec.

**No implementado / diferido (ya cubierto por Boundaries/Never, no es un gap nuevo):** el filtro anidado de tutores por relación (`.or()`/`.contains()` sobre `courses`) se porta literal, sin verificar contra Supabase real (Never); no se agregó manejo de error de Supabase que el MVP no tiene (`data ?? []` en los 3 services nuevos); no se implementó el toggle de favorito; no se tocó ningún dominio CAP-3 a CAP-6. El riesgo ya documentado en CAP-1 ("nada llama `fetchUser()` al bootstrap") sigue vigente sin cambios -- `protectedGuard` en `/`, `/explore` y `/favorites` hereda ese mismo riesgo.

## Spec Change Log

## Review Triage Log

Revisión con 3 capas (blind-hunter, edge-case-hunter, verification-gap) sobre el diff completo de este spec (`ionic-app/`, ~73.6 kB). 21 hallazgos crudos entre las 3 capas, consolidados en 16 entradas donde 2+ capas apuntaban a la misma causa raíz.

1. **verification-gap — `guestGuard`/`login.page.ts`/`callback.page.ts`/`onboarding.page.ts` siguen navegando a `/kit`, nunca a `/`** — verdict: `high`. Verificado en los 4 call sites y en los 3 tests que fijan `/kit` literal (`auth.guard.spec.ts:69`, `callback.page.spec.ts:74`, `onboarding.page.spec.ts:78`), ninguno tocado por este diff: el Home nuevo es inalcanzable por el flujo normal de auth. La Intención congelada ("`/` deja de redirigir a `/kit`") no deja ambigüedad sobre cuál debería ser el destino -- no es un intent_gap.
2. **blind-hunter — `tutors.service.ts` `.contains('courses.major', [...])` sobre relación anidada, sin verificar contra Supabase real** — verdict: `medium` (riesgo real, no verificable sin proyecto real). La decisión de portarlo tal cual ya está en el Never congelado de este spec, que además compromete documentarlo en `deferred-work.md` -- compromiso incumplido, no el código.
3. **blind-hunter — `tutor-card.component.scss` hardcodea `rgba(6, 43, 79, 0.1)` en vez de una variable CSS**, a diferencia de todo el resto del SCSS nuevo — verdict: `low`, real (drift si `--udd-deep` cambia alguna vez).
4. **edge-case-hunter (claim) — `home.page.spec.ts` solo cubre la fila vacía de la matriz I/O, sin asserts independientes de saludo/quick-actions**, mientras el AC afirma que esos elementos se ven — verdict: `low`, real gap entre el AC y lo que el test fija.
5. **blind-hunter + edge-case-hunter — NoteCard/TutorCard enlazan a `/explore/notes/:id`/`/explore/tutors/:id`, rutas no registradas, caen al wildcard `**`→`/kit`** — verdict: `medium` (real, se dispara en cualquier click de card), pero es el mismo patrón ya establecido y documentado en CAP-1/CAP-7 (wildcard→`/kit` para dominios aún no migrados) aplicado a 2 sitios nuevos -- no es un problema nuevo de esta historia.
6. **blind-hunter + edge-case-hunter (x3) — `NotesService`/`TutorsService`/`FavoritesService` solo guardan cliente `null`, no un `reject()`; `explore/home/favorites.page.ts` no tienen `.catch()` → `loading()` queda `true` para siempre ante una falla real de red** — verdict: `medium` si ocurriera, pero el `fetchData`/`useEffect` del MVP tiene exactamente el mismo hueco (sin catch en ningún lado), y el Never congelado de este spec excluye explícitamente agregar manejo de error que el MVP no tiene.
7. **edge-case-hunter — filtro `major` del tab Apuntes sigue aplicándose silenciosamente a la búsqueda de tutores tras cambiar de tab, sin UI para verlo/limpiarlo** — verdict: `false`. Confirmado contra `explore/page.tsx:160-204`: el mismo `filters` compartido, el mismo panel gateado solo a `activeTab==='notes'` -- paridad exacta con el MVP.
8. **blind-hunter — `explore.page.ts` sin debounce en la búsqueda (1 fetch por tecla)** — verdict: `false`. Confirmado contra el `useEffect([searchQuery])` del MVP -- mismo comportamiento, sin debounce ahí tampoco.
9. **blind-hunter — `home.page.ts` `courseNotes` no filtra por carrera/curso del usuario pese al título "Para tus ramos"** — verdict: `false`. Confirmado contra `(protected)/page.tsx:126` (`notes.slice(0,3)`, sin filtro) -- paridad exacta.
10. **blind-hunter — `tutors.service.ts` sin `.order()`, orden inestable** — verdict: `false`. Confirmado contra `(protected)/page.tsx:32-36` -- el MVP tampoco ordena esa query.
11. **blind-hunter — botones ícono-only (limpiar búsqueda, toggle filtros) sin `aria-label`** — verdict: `false` en cuanto a "causado por este diff". Confirmado contra `explore/page.tsx:139-157` -- el MVP tiene el mismo hueco de accesibilidad en esos mismos botones.
12. **blind-hunter — fila de Favoritos con `note` y `tutor` ambos `null` no renderiza nada, sin placeholder** — verdict: `false`. Confirmado contra `favorites/page.tsx:53-99` -- misma estructura `{fav.note && …} {fav.tutor && …}`, mismo hueco.
13. **edge-case-hunter — precio de nota negativo no muestra ni badge "Gratis" ni precio** — verdict: `false`. Confirmado contra los mismos checks `===0`/`>0` del MVP -- paridad exacta, y `price` nunca es negativo en la práctica (controlado por servidor).
14. **edge-case-hunter — `material_type` fuera del union no tiene fallback en el label** — verdict: `false`. Confirmado contra el mismo lookup sin guardas de `explore/page.tsx:235` -- paridad exacta.
15. **blind-hunter — `#ffffff` hardcodeado en `explore.page.scss`/`home.page.scss` en vez de token de tema** — verdict: `low`, rechazado: CAP-7 excluyó explícitamente cualquier tema oscuro (Non-goal), así que la consecuencia citada (no se adapta a dark mode) nunca ocurre en esta app.
16. **verification-gap (other) — `TutorCardComponent` con `showRating=false` también oculta el verified badge, sin test que construya un tutor `verified: true` para ejercitarlo** — verdict: `low`; el propio reviewer lo dejó fuera del bar formal de hallazgo. Sin acción -- coincide con la Decisión ya documentada en Implementation Notes.

**Ruteo:** Puntos 7, 8, 9, 10, 11, 12, 13, 14 → rechazados (`false`, paridad fiel confirmada contra el MVP). Punto 16 → sin acción (reviewer no lo filed formalmente). Punto 15 → rechazado (`low`, non-goal de dark mode hace la consecuencia inaplicable). Puntos 5 y 6 → `defer` (patrón/hueco preexistente del MVP o de CAP-1/CAP-7, no causado por esta historia). Puntos 1, 2, 3, 4 → `patch` (fixes triviales, sin ambigüedad de intención, sin superficie nueva).

## Design Notes

Los 3 usos de tarjeta de nota difieren solo en 2 flags booleanos observados en el código actual: Home-lista sin badge de material y con rating, Explore-lista con badge de material y con rating, Favoritos sin badge y sin rating. Mismo patrón para tutor-card, salvo que el subtítulo (curso vs. carrera) varía en formato entre las 3 páginas -- por eso se pasa como `string` ya formateado en vez de intentar unificar la lógica de formato dentro del componente.

`AuthService`→`SupabaseService` es una extracción mecánica (mismo patrón null-fallback, mismas firmas públicas de `AuthService`); no reabre ninguna decisión congelada de CAP-1.

## Verification

**Commands:**
- `cd ionic-app && npm run build` -- expected: 0 errores de TypeScript/plantillas.
- `cd ionic-app && npm test -- --no-watch` -- expected: los tests nuevos de la matriz I/O pasan (Supabase mockeado).
- `cd ionic-app && npm run lint` -- expected: sin hallazgos nuevos.

**Manual checks (if no CLI):**
- Navegar a `/` y confirmar que ya no redirige a `/kit`; navegar `/explore?tab=tutors` y confirmar el tab activo correcto.
