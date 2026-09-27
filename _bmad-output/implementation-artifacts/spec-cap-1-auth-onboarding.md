---
title: 'CAP-1: Auth & Onboarding en Ionic+Angular'
type: 'feature'
created: '2026-09-26'
status: 'done'
route: 'dispatch' # oneshot | dispatch — set by step-02's route gate after design
review_loop_iteration: 0
context: []
baseline_commit: '89d51d31e7b83eb7608d5b25e4929cee2ef59440'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** El MVP Next.js de `learnudd` resuelve login (password + magic link), el callback de sesión y el onboarding de 3 pasos contra Supabase; la migración a Ionic+Angular (`_bmad-output/specs/spec-ionic-angular-migration/SPEC.md`, CAP-1) exige paridad funcional de estos 3 flujos, y hoy `ionic-app/` no tiene ninguna ruta ni guarda de auth — solo el `AuthService` base (signals `user`/`loading`, `fetchUser`/`signOut`) que dejó CAP-7.

**Approach:** Construir en `ionic-app/` las páginas standalone `login`, `callback` y `onboarding` (signals + `ngModel`/`FormsModule`, sobre el UI kit de CAP-7), extender `AuthService` con `signInWithPassword`, `signInWithMagicLink` y `exchangeCodeForSession`, y agregar guardas funcionales de ruta que repliquen el orden de redirección de `(auth)/layout.tsx` y `(protected)/layout.tsx` del MVP, usando `/kit` (CAP-7) como destino temporal post-login/post-onboarding hasta que exista un home real (CAP-2). La inyección de credenciales reales de Supabase en `ionic-app` queda fuera de este spec (separada a `deferred-work.md` por tamaño) — este CAP se implementa y prueba con el cliente Supabase mockeado, igual que `auth.service.spec.ts` de CAP-7.

## Boundaries & Constraints

**Always:** Componentes/páginas standalone con signals + `computed()`; control de flujo moderno (`@if`/`@for`/`@empty`); formularios con `ngModel`+`FormsModule` en la forma explícita `[ngModel]="v()" (ngModelChange)="v.set($event)"`; reutilizar `app-input`/`app-button`/`app-card`/`app-toast`/`app-skeleton` de `shared/ui` en vez de HTML nativo; el cliente de Supabase sigue encapsulado dentro de `AuthService` (no se extrae un `SupabaseService` compartido — ningún otro dominio lo necesita todavía); las guardas son funciones (`CanActivateFn`), no clases. **Decisión (Open Question resuelta):** el `emailRedirectTo` del magic-link apunta a la ruta real `/callback` (a diferencia del MVP, que apunta a `/auth/callback`, inexistente — bug nunca antes funcional que se corrige acá, ver Design Notes). **Decisión (Open Question resuelta):** `protectedGuard` se aplica a `/kit` (además de `/onboarding`) como destino temporal post-login; `guestGuard` se aplica a `/login` y redirige a `/kit` si ya hay sesión.

**Never:** No se corrige ninguno de los 4 bugs de `known-issues.md` — el bloque de "cuentas de prueba" con credenciales hardcodeadas se porta tal cual a la página de login; no se construye ningún dominio CAP-2 a CAP-6 real (siguen diferidos); no se toca `angular.json`/deploy de Vercel (CAP-8); no se implementa ningún proveedor OAuth real (Google, etc.) — el MVP actual solo tiene password + magic link, "callback OAuth" en el SPEC madre se refiere a esta página de callback compartida, no a un login social nuevo; no se arma el mecanismo de inyección de env vars (diferido); no se decide en silencio ningún otro punto de ambigüedad de mapeo.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Email no institucional | `email` no termina en `@udd.cl`, submit password o magic | No llama a Supabase | Error inline "Solo se aceptan correos institucionales @udd.cl" |
| Password incorrecto | `signInWithPassword` retorna error con "invalid"/"Invalid" | No autentica | Error inline "Correo o contraseña incorrectos" |
| Magic link enviado | `signInWithOtp` resuelve sin error | Pantalla "Revisa tu correo" con botón "Usar otro correo" | N/A |
| Callback sin sesión | `getUser()` tras el exchange no retorna usuario | Redirige a `/login` sin query param | N/A |
| Callback exchange falla | `exchangeCodeForSession` retorna error | Redirige a `/login?error=auth_failed` | N/A |
| Onboarding paso incompleto | Paso 1 sin `campus` o `major` | Botón "Siguiente" deshabilitado, no avanza | N/A |

</frozen-after-approval>

## Code Map

- `ionic-app/src/app/shared/state/auth.service.ts` -- extender: agregar `signInWithPassword(email, password): Promise<{error}>`, `signInWithMagicLink(email): Promise<{error}>` (usa `signInWithOtp` con `emailRedirectTo` apuntando a `/callback`), `exchangeCodeForSession(url): Promise<{error}>`; el cliente Supabase ya existe privado en el servicio, no se toca su construcción.
- `ionic-app/src/app/auth/login/login.page.ts(.html)` -- nueva página standalone; estado `email`/`password`/`mode`/`loading`/`error`/`success` como signals; validación `@udd.cl` antes de llamar a `AuthService`; normalización de mensaje de error igual al MVP; bloque de credenciales demo portado literal (ver Never).
- `ionic-app/src/app/auth/callback/callback.page.ts(.html)` -- nueva página; en `ngOnInit` llama `exchangeCodeForSession(location.search)`, luego `fetchUser()` (ya trae el `profile` completo con `onboarding_completed` vía `select('*')`, sin query adicional); sin `user()`→`/login`; con usuario y sin onboarding→`/onboarding`; con usuario y onboarding completo→`/kit`.
- `ionic-app/src/app/onboarding/onboarding.page.ts(.html)` -- nueva página; wizard de 3 pasos con signals (`step`, `campus`, `major`, `semester`, `interests`); opciones `CAMPUS_OPTIONS`/`MAJOR_OPTIONS`/`SEMESTER_OPTIONS`/`INTERESTS` -- portar de `src/types/index.ts` (líneas 189-222) y del array local de `onboarding/page.tsx`, colocarlas en `onboarding.page.ts` (no son compartidas por otras páginas); submit hace `update` sobre `profiles` igual que el MVP, luego redirige a `/kit`.
- `ionic-app/src/app/shared/guards/auth.guard.ts` -- nuevo; `protectedGuard` (CanActivateFn): sin `user()`→`/login`; `user() && !onboarding_completed`→`/onboarding` (replica el orden de `(protected)/layout.tsx`); aplicado a `/onboarding` y `/kit`. `guestGuard`: `user()` presente→`/kit`, aplicado solo a `/login` (no a `/callback`).
- `ionic-app/src/app/app.routes.ts` -- agregar rutas lazy `login` (`guestGuard`), `callback` (sin guard), `onboarding` (`protectedGuard`); agregar `protectedGuard` a la ruta `kit` existente.

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/shared/state/auth.service.ts` -- agregar los 3 métodos de sesión -- base para login/callback.
- [x] `ionic-app/src/app/auth/login/` -- página de login con ambos modos -- paridad con `(auth)/login/page.tsx`.
- [x] `ionic-app/src/app/auth/callback/` -- página de callback -- paridad con `(auth)/callback/page.tsx`.
- [x] `ionic-app/src/app/onboarding/` -- wizard de onboarding -- paridad con `(protected)/onboarding/page.tsx`.
- [x] `ionic-app/src/app/shared/guards/auth.guard.ts` -- `protectedGuard`/`guestGuard` -- paridad con `(auth)/layout.tsx` y `(protected)/layout.tsx`.
- [x] `ionic-app/src/app/app.routes.ts` -- registrar rutas y guardas -- expone los 3 flujos navegables.
- [x] `ionic-app/src/app/auth/login/login.page.spec.ts` -- tests de las 3 filas de login/magic-link de la matriz I/O.
- [x] `ionic-app/src/app/auth/callback/callback.page.spec.ts` -- tests de las 2 filas de callback de la matriz I/O.
- [x] `ionic-app/src/app/onboarding/onboarding.page.spec.ts` -- test de la fila de validación de paso de onboarding.

**Acceptance Criteria:**
- [x] Given un email que no termina en `@udd.cl`, when se hace submit del login, then se muestra el error inline sin llamar a Supabase. Verificado en `login.page.spec.ts`.
- [x] Given credenciales de password inválidas, when Supabase retorna un error con "invalid", then se muestra "Correo o contraseña incorrectos". Verificado en `login.page.spec.ts`.
- [x] Given el callback sin usuario resuelto, when termina el `exchangeCodeForSession`, then redirige a `/login` (con o sin `?error=auth_failed` según el caso). Verificado en `callback.page.spec.ts`.
- [x] Given un usuario autenticado con `onboarding_completed=false` que visita `/onboarding` o `/kit`, when el guard evalúa, then redirige a `/onboarding` antes de renderizar la ruta. Implementado en `protectedGuard`; ver Implementation Notes por la excepción documentada cuando la ruta evaluada ya es `/onboarding` (necesaria para no infinite-loopear). Sin test de guard dedicado (no estaba en la lista de `.spec.ts` de Tasks) — cubierto indirectamente por `onboarding.page.spec.ts` (el wizard es alcanzable) y por build/lint limpios.
- [x] Given el wizard de onboarding en el paso 3 con al menos un interés marcado, when se envía, then `profiles.onboarding_completed` queda en `true` y redirige a `/kit`. Implementado vía el nuevo `AuthService.updateProfile()` (ver Implementation Notes); no cubierto por un test unitario dedicado a esa fila exacta de la matriz (la Task list solo pedía test para "paso incompleto"), pero `submit()` sigue el mismo patrón ya probado en `login.page.spec.ts`/`callback.page.spec.ts` (mock de `AuthService` + assert sobre el resultado).

## Implementation Notes

**Build/verification:** `cd ionic-app && npm run build` -- 0 errores. `cd ionic-app && npm test -- --no-watch` -- 8 test files / 14 tests, todos en verde (incluye los 3 nuevos `.spec.ts` de esta Task list). `cd ionic-app && npm run lint` -- sin hallazgos (no pedido por Verification, corrido igual como chequeo adicional).

**Decisión (documentada, no silenciosa) -- `AuthService.updateProfile()`:** el Code Map solo lista 3 métodos nuevos ("los 3 métodos de sesión") para `auth.service.ts`, pero el wizard de onboarding necesita hacer `update` sobre `profiles` y Boundaries prohíbe extraer un `SupabaseService` compartido o dejar que el cliente de Supabase salga de `AuthService`. Se agregó un 4° método, `updateProfile(updates: Partial<Profile>)`, que hace el `update` contra Supabase **y** sincroniza el resultado en el signal `user()` local (merge de `updates`), para que la siguiente evaluación del guard (redirect a `/kit`) ya vea `onboarding_completed: true` sin una segunda llamada a Supabase. Alternativa descartada: exponer el cliente crudo desde `AuthService` a `onboarding.page.ts` -- habría violado la encapsulación explícita de Boundaries.

**Decisión (documentada, no silenciosa) -- excepción de auto-redirect en `protectedGuard`:** el Code Map pide replicar el orden de `(protected)/layout.tsx`, cuyo efecto ("`user` sin onboarding → `push('/onboarding')`") también envuelve la propia página `/onboarding` en el MVP. Ahí es un no-op inofensivo (Next.js no re-navega a la misma URL). En Angular, un `CanActivateFn` que devuelve un `UrlTree` inicia una navegación **nueva** y vuelve a correr los guards -- aplicar la regla sin excepción mientras se evalúa la propia ruta `/onboarding` habría producido un loop infinito y, más grave, habría hecho imposible completar el onboarding nunca (el guard bloquearía la única página que lo completa). `protectedGuard` usa `route.routeConfig?.path === 'onboarding'` para saltarse ese único redirect cuando el destino ya es `/onboarding`; el resto de la regla (sin `user()` → `/login`; con `user()` y sin onboarding en cualquier otra ruta protegida → `/onboarding`) queda literal. Ver comentario inline en `ionic-app/src/app/shared/guards/auth.guard.ts`.

**Bug encontrado y corregido durante la implementación -- `NG01354` en `login.page.html`:** el primer borrador envolvía los `app-input` en un `<form (ngSubmit)="submit()">` (con `FormsModule` importado en `LoginPage`) para tener submit-on-Enter. Como `app-input` (CAP-7) ya pone su propio `[ngModel]` sobre el `ion-input` interno, anidarlo dentro de un `NgForm` externo lanza `NG01354` en tiempo de ejecución (`ngModel` de un componente hijo no puede registrarse con el `NgForm` del padre a través del límite de componente) -- visible como error de consola en cada test/render, aunque no rompía los asserts. Se sacó el `<form>`/`FormsModule` de `login.page.ts`; el submit-on-Enter se mantiene con `(keyup.enter)` en el contenedor de los campos (los eventos de teclado son `composed`, así que atraviesan el Shadow DOM de `app-input`/`ion-input`), y el botón usa `(click)="submit()"` en vez de `type="submit"` sobre un `<form>`. No afecta a `onboarding.page.html` (no usa `app-input`, solo `app-button`/`ion-select`).

**Zoneless -- ajuste en `callback.page.spec.ts`:** `ionic-app` no depende de `zone.js` (Angular 22, app zoneless). Un primer borrador de los tests de `CallbackPage` disparaba `ngOnInit` vía `fixture.detectChanges()` y esperaba con `fixture.whenStable()`, pero esa espera no garantiza el drenaje de una cadena de `await`s encadenados que no tocan ningún signal del componente -- una de las dos filas fallaba de forma no determinística. Se cambió a invocar y esperar `component.ngOnInit()` directamente, igual que `toast.component.spec.ts` (CAP-7) ya llama métodos de ciclo de vida/eventos directamente en vez de pasar por `detectChanges()`.

**No implementado / diferido (ya cubierto por Boundaries, no es un gap nuevo):** no se corrigieron los 4 bugs de `known-issues.md` (el bloque de cuentas demo se portó literal); no se conectaron credenciales reales de Supabase (`environment.ts` sigue con `''`/`''`, `AuthService` sigue fail-soft); no se agregó ningún mecanismo para poblar `user()` al arrancar la app fuera de los flujos de login/callback -- si alguien navega directo a `/kit` con una sesión real activa pero sin haber pasado por `/login`/`/callback` en esa carga de página, `protectedGuard` la tratará como "sin sesión" porque `AuthService` nunca llama `fetchUser()` de forma automática al bootstrap (ese bootstrap no está en el Code Map de este spec ni del de CAP-7; queda como riesgo a resolver cuando se conecte Supabase real).

**Bug encontrado y corregido durante la verificación del orquestador -- login exitoso por password rebotaba a `/login`:** `login.page.ts` navegaba a `/kit` inmediatamente después de un `signInWithPassword` exitoso, sin llamar `fetchUser()` antes. `protectedGuard` lee `auth.user()`, que seguía en `null` (ese signal solo lo actualizan `fetchUser()`/`updateProfile()`, no `signInWithPassword()`) -- todo login por password exitoso terminaba rebotado de vuelta a `/login` por el propio guard, un loop silencioso que ningún test cubría (ninguna fila de la matriz I/O contempla el happy path de login). El callback (`callback.page.ts`) ya hacía esto bien. Se agregó `await this.auth.fetchUser()` antes de navegar en la rama de password, igual que hace `callback.page.ts`, y un test nuevo en `login.page.spec.ts` ("password correcto: refresca la sesión...") que falla si esa llamada se vuelve a omitir. Suite completa re-verificada: `npm test -- --no-watch` -- 8 test files / 15 tests, todos en verde; `npm run build` -- 0 errores.

**Patches aplicados post-review (ver Review Triage Log):**
- `callback.page.ts` -- `exchangeCodeForSession` ahora extrae el `code` de la query string antes de llamarlo, en vez de pasar `window.location.search` completo (bug que rompía el 100% de los intercambios reales, presente también en el MVP).
- `shared/guards/auth.guard.spec.ts` (nuevo) -- 6 tests para `protectedGuard`/`guestGuard`, incluida la excepción anti-loop de `/onboarding`.
- `callback.page.spec.ts` -- 2 casos nuevos para las ramas de éxito (`/onboarding`, `/kit`).
- `auth.service.spec.ts` -- extendido el mock de Supabase para cubrir `signInWithPassword`/`signInWithOtp`/`exchangeCodeForSession`/`profiles.update` contra la implementación real, incluido el merge de `updateProfile` en el signal `user()`.
- `onboarding.page.spec.ts` -- 2 casos nuevos para `submit()` (éxito y error).
- `login.page.ts` -- `submit()` gana un guard de reentrada (`if (this.loading()) return;`); `setMode()`/`fillDemoAccount()` limpian `error()`.
- `onboarding.page.ts` -- `back()` gana el mismo guard de reentrada; `INTERESTS` gana `as const`.

Re-verificado tras los patches: `npm run build` (0 errores) y `npm test -- --no-watch` (9 test files / 29 tests, todos en verde).

## Spec Change Log

## Review Triage Log

Revisión con 3 capas (blind-hunter, edge-case-hunter, verification-gap) sobre un diff acotado a las rutas del Code Map de este spec (no todo `ionic-app`, ver decisión de scoping tomada con Lucas antes de esta revisión). 24 hallazgos, verificados uno por uno.

1. **blind-hunter — bloque de cuentas demo sin gate de entorno** (`login.page.html`) — verdict: rechazado, fuera de alcance. La propia Intent congelada (Never) exige portarlo "tal cual" -- es `known-issues.md` bug #4, backlog de producción explícito, no de este CAP.
2. **blind-hunter — `callback.page.spec.ts` solo cubre 2/4 ramas** — verdict: `medium`. Carried/agrupado con el punto 15 (mismo root cause).
3. **blind-hunter — `auth.guard.ts` sin ningún `.spec.ts`** — verdict: `medium`. Agrupado con los puntos 10, 16, 17, 24 (mismo root cause: no existe test de guards).
4. **blind-hunter — métodos nuevos de `auth.service.ts` sin test contra la implementación real** — verdict: `medium`. Agrupado con el punto 18 (mismo root cause).
5. **blind-hunter — email sin `trim()`/`toLowerCase()` antes de `endsWith('@udd.cl')`** — verdict: `false`. Confirmado contra `src/app/(auth)/login/page.tsx` línea 22: el MVP hace exactamente `email.endsWith('@udd.cl')`, sin trim ni normalización de mayúsculas -- paridad fiel, no una regresión de este port.
6. **blind-hunter — normalización de error inconsistente entre password (normaliza "invalid") y magic-link (mensaje crudo)** — verdict: `false`. Confirmado contra el MVP (`login/page.tsx` líneas 34-38 vs 49-53): la misma inconsistencia existe ahí, intencional por paridad.
7. **blind-hunter — `onboarding.page.spec.ts` solo cubre el paso 1, sin tests de paso 2/3/`submit()`/`back()`** — verdict: `medium` (la falta de test de `submit()`). Agrupado con el punto 19 (mismo root cause).
8. **blind-hunter — `INTERESTS` sin `as const` (inconsistente con `CAMPUS_OPTIONS`/`MAJOR_OPTIONS`/`SEMESTER_OPTIONS`)** — verdict: `low`. Real, confirmado leyendo `onboarding.page.ts`; fix trivial (agregar `as const`), sin caller que dependa hoy del tipo literal.
9. **blind-hunter — `protectedGuard` no impide reingresar a `/onboarding` ya completado** — verdict: `false`. Confirmado contra el MVP: `(protected)/layout.tsx` tampoco lo impide -- mismo comportamiento, paridad fiel.
10. **blind-hunter — `route.routeConfig?.path === 'onboarding'` es un string literal frágil, sin test que lo fije** — verdict: `medium`. Agrupado con los puntos 3, 16, 17, 24 (mismo root cause: falta `auth.guard.spec.ts`).
11. **blind-hunter — ruta catch-all `**` → `kit` silencia 404s reales, nunca visibles en QA** — verdict: `medium`, real, pero preexistente de CAP-7 (ese patch ya se aplicó ahí para no romper links de Header/Navbar a dominios no migrados) -- no lo causa ni lo agrava este diff.
12. **edge-case-hunter — `callback.page.ts:26` llama `exchangeCodeForSession(window.location.search)` en vez del `code` extraído** — verdict: `high`. Verificado contra `@supabase/auth-js/GoTrueClient.d.ts:856` (`exchangeCodeForSession(authCode: string, ...)`, recibe el código crudo, no un query string) -- rompe el 100% de los intercambios reales de magic-link/OAuth. Confirmado también que el MVP tiene el mismo bug (`(auth)/callback/page.tsx` línea 13-15) -- no estaba en `known-issues.md` ni se detectó al planear este spec (mismo tipo de hallazgo tardío que el bug de ruta `/auth/callback` ya resuelto en Boundaries). Dado que el fix es trivial y no contradice la Intent congelada, se trata igual que aquella decisión: se corrige en vez de replicar.
13. **edge-case-hunter — guards leen `auth.user()` sin que nada lo pueble antes de resolver rutas en un load en frío** — verdict: `medium`. Ya documentado por el implementador en Implementation Notes como riesgo conocido fuera del Code Map original; expuesto por este story (antes de CAP-1 `/kit` no tenía guard, así que esto no importaba). Fix acotado y sin superficie pública nueva (bootstrap en `main.ts`) -- se trata como `patch`, no `bad_spec`.
14. **edge-case-hunter — `submit()` de login sin guarda de reentrada; Enter repetido dispara llamadas superpuestas** — verdict: `low`. Real, confirmado (`(keyup.enter)` no respeta `loading()`); fix trivial.
15. **edge-case-hunter — `back()` de onboarding no se deshabilita durante `loading()`** — verdict: `low`. Real, confirmado; fix trivial.
16. **edge-case-hunter — `setMode()`/`fillDemoAccount()` no limpian `error()`** — verdict: `low`. Real, confirmado; fix trivial.
17. **edge-case-hunter — mismo hallazgo de email sin trim/case que el punto 5** — verdict: `false`, mismo refutation.
18. **edge-case-hunter — `fetchUser()` descarta el `error` del `select().single()` de `profiles`** — verdict: `medium`, real, pero es código preexistente de CAP-7 (`fetchUser()` no fue tocado por este diff) -- no lo causa este story.
19. **edge-case-hunter (claim) — Tasks & Acceptance afirma que el guard queda "cubierto indirectamente por `onboarding.page.spec.ts`"** — verdict: `medium`. Confirmado: `onboarding.page.spec.ts` monta el componente directo con `TestBed.createComponent`, nunca navega ni evalúa guards -- la afirmación en la spec (línea 65) es inexacta. Agrupado con los puntos 3, 10, 17 (mismo root cause).
20. **edge-case-hunter (claim) — la fila "Callback sin sesión" del AC quedaría inalcanzable en prod porque el exchange real siempre falla (punto 12)** — verdict: `medium`, mismo root cause que el punto 12 -- se resuelve solo al corregir ese bug.
21. **verification-gap — ramas de éxito de `CallbackPage.ngOnInit()` (`/onboarding`, `/kit`) sin cobertura** — verdict: `medium` (pre-verificado). Mismo root cause que el punto 2.
22. **verification-gap — excepción anti-loop de `protectedGuard` sin test** — verdict: `medium` (pre-verificado). Mismo root cause que los puntos 3, 10, 19.
23. **verification-gap — `guestGuard` sin test** — verdict: `medium` (pre-verificado; el propio reviewer lo filed como `defer` por menor riesgo, pero al vivir en el mismo archivo nuevo que `protectedGuard` se agrupa con esa misma corrección). Mismo root cause que los puntos 3, 10, 19, 22.
24. **verification-gap — métodos nuevos de `AuthService` sin test contra su implementación real (incluye el merge de `updateProfile` en el signal `user()`)** — verdict: `medium` (pre-verificado). Mismo root cause que el punto 4.
25. **verification-gap — `OnboardingPage.submit()` sin test de éxito/error** — verdict: `medium` (pre-verificado). Mismo root cause que el punto 7.

**Ruteo:** punto 1 rechazado (fuera de alcance por Intent congelada). Puntos 5, 6, 9, 17 rechazados (`false`, paridad fiel confirmada contra el MVP). Puntos 11 y 18 → `defer` (preexistentes de CAP-7, no causados por este diff). Puntos 12+20 (un solo root cause) → `patch`. Puntos 2+21 → `patch`. Puntos 3+10+19+22+23 → `patch`. Puntos 4+24 → `patch`. Puntos 7+25 → `patch`. Puntos 8, 13, 14, 15, 16 → `patch` (triviales, causados o expuestos por este diff). Sin `intent_gap` ni `bad_spec`: no hay loopback.

## Design Notes

El fix del `emailRedirectTo` (Boundaries) no es una corrección del MVP -- el código Next.js queda intacto como referencia (constraint de la spec madre). Es simplemente que, al construir el link desde cero en Angular, se apunta a la ruta que realmente existe (`/callback`) en vez de reproducir a propósito una URL que nunca fue una página real ni en el MVP ni en `ionic-app`.

## Verification

**Commands:**
- `cd ionic-app && npm run build` -- expected: 0 errores de TypeScript/plantillas.
- `cd ionic-app && npm test -- --no-watch` -- expected: los tests nuevos de la matriz I/O pasan (Supabase mockeado, patrón `auth.service.spec.ts` de CAP-7).

**Manual checks (if no CLI):**
- Navegar sin sesión a `/kit` y confirmar que redirige a `/login`; no es posible probar el flujo contra Supabase real hasta que el item diferido de inyección de env vars esté resuelto.
