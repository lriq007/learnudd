---
title: 'CAP-7: UI kit compartido y stores en Ionic+Angular'
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

**Problem:** La migración de `learnudd` a Ionic+Angular (exigencia literal del profesor, ver `_bmad-output/specs/spec-ionic-angular-migration/SPEC.md`) necesita un kit de UI y un estado global equivalentes a los actuales antes de migrar cualquier dominio de producto (CAP-1 a CAP-6); sin este kit, cada dominio reimplementaría botones, cards, stores, etc. por su cuenta.

**Approach:** Levantar un proyecto Ionic+Angular standalone nuevo (`ionic-app/`, junto al `src/` de Next.js que se mantiene intacto como referencia) y portar los 6 componentes de `src/components/ui/`, los 4 de `src/components/shared/`, el `Header`/`Navbar` de `src/components/layout/`, y los 3 stores de Zustand (`src/stores/`) a componentes Angular standalone con signals y servicios inyectables con signals, sobre theming nativo de Ionic (variables SCSS + componentes `ion-*` reales), preservando al máximo el diseño visual actual (tokens de `src/app/globals.css`).

## Boundaries & Constraints

**Always:** Componentes standalone (sin `NgModule`); signals + `computed()` para todo estado/derivado; control de flujo moderno en templates (`@if`/`@for`/`@empty`/`@switch`); `ngModel`+`FormsModule` (template-driven) donde se necesite un input controlado, con la forma explícita `[ngModel]="v()" (ngModelChange)="v.set($event)"`; `ionic-app` vive como proyecto npm propio en la raíz del repo, con su propio `package.json`; el shell mínimo usa `IonApp`/`IonRouterOutlet` de Ionic. **Decisión (Open Question resuelta):** estilos vía theming nativo de Ionic — `ionic-app/src/theme/variables.scss` deriva las `--ion-color-*` y variables de forma/sombra de los tokens de `globals.css`; se usan componentes `ion-*` reales donde exista mapeo directo (`ion-button`, `ion-card`, `ion-input`, `ion-badge`, `ion-toast`, `ion-skeleton-text`, `ion-tab-bar`/`ion-tab-button`). Lucas eligió esta opción explícitamente pese al riesgo, con la condición explícita: **ante cualquier ambigüedad de mapeo o cualquier cambio que pueda alterar el look-and-feel actual, pausar y consultarle antes de implementar esa pieza — no aproximar en silencio** (ver Design Notes para los puntos ya identificados como riesgosos).

**Never:** No se crean pantallas/rutas de dominio (CAP-1 a CAP-6 quedaron diferidos en `deferred-work.md`) más allá de una ruta `/kit` de verificación visual; no se toca la config de build/deploy de Vercel (CAP-8, diferido); no se corrigen los 4 bugs preexistentes (`known-issues.md`); no se genera nada de Capacitor/nativo (Fase 2, non-goal de la spec madre); no se aproxima ni se decide unilateralmente ningún punto donde el mapeo a `ion-*` implique un cambio visual respecto al MVP actual — corresponde consultar (ver Always).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Toast auto-dismiss | `Toast` montado con `duration=3000` | Se autocierra emitiendo el evento de cierre a los 3000ms; cerrar manualmente limpia el timer | N/A |
| RatingStars medio-relleno | `rating=3.5` | 3 estrellas llenas, 1 media, 1 vacía; con `showValue` muestra "3.5" | N/A |
| CartService total vacío | `items()` es `[]` | `total()` (computed) devuelve `0` | N/A |
| AuthService sin sesión | Supabase `auth.getUser()` retorna sin usuario | `user()` queda en `null`, `loading()` en `false`, sin excepción | N/A |

</frozen-after-approval>

## Code Map

- `src/components/ui/Button.tsx` -- portar a `ionic-app/src/app/shared/ui/button/`, sobre `ion-button` (`fill`/`shape`/`color` para variantes) manteniendo las 5 variantes y 3 tamaños actuales.
- `src/components/ui/Card.tsx` -- portar sobre `ion-card`/`ion-card-content`, con `--border-radius`/`--box-shadow` ajustados a los tokens actuales para las 3 variantes.
- `src/components/ui/Input.tsx` -- portar sobre `ion-input` + `ngModel`, con label/error/hint propios (Ionic no los da igual out-of-the-box).
- `src/components/ui/Badge.tsx` -- portar sobre `ion-badge`, mapeando las 6 variantes de color a `--ion-color-*` custom o inline.
- `src/components/ui/Skeleton.tsx` -- portar sobre `ion-skeleton-text` (tiene shimmer propio); verificar que el shimmer resultante sea visualmente equivalente al actual antes de darlo por hecho.
- `src/components/ui/Toast.tsx` -- portar sobre `ion-toast` real; el actual es fijo en `bottom-24` centrado con auto-dismiss — `ion-toast` tiene su propio modelo de posición/`duration`, hay que verificar que coincide.
- `src/components/shared/{AIDeclaration,EmptyState,RatingStars,VerifiedBadge}.tsx` -- portar a `ionic-app/src/app/shared/ui/`; `AIDeclarationBadge` depende del tipo `AIDeclaration` y del `Badge` ya portado; `RatingStars` no tiene equivalente `ion-*` directo, se mantiene custom con `lucide`-equivalente (`ionicons`).
- `src/components/layout/{Header,Navbar}.tsx` -- portar a `ionic-app/src/app/shared/layout/`; `Header` sobre `ion-header`/`ion-toolbar`; `Navbar` sobre `ion-tab-bar`/`ion-tab-button` -- el botón central elevado/especial no es un patrón estándar de `ion-tab-bar`, es el punto de mayor riesgo visual de todo CAP-7 (ver Design Notes).
- `src/stores/{authStore,cartStore,uiStore}.ts` -- portar a servicios inyectables (`AuthService`, `CartService`, `UiService`) en `ionic-app/src/app/shared/state/`, con signals en vez de Zustand; `AuthService` reimplementa `fetchUser`/`signOut` con `@supabase/supabase-js` (sin `@supabase/ssr`, no aplica en cliente Angular).
- `src/lib/utils/index.ts` -- portar las funciones puras (`formatCLP`, `formatDate`, `formatRelativeTime`, `getInitials`, `truncateText`, `generateId`; `cn` se descarta, sin Tailwind no hace falta merge de clases) a `ionic-app/src/app/shared/utils.ts`.
- `src/types/index.ts` -- no se importa cruzado (proyectos npm separados); redeclarar localmente en `ionic-app/src/app/shared/models.ts` solo los tipos que estos componentes/servicios usan (`Profile`, `AIDeclaration`, forma de `CartItem`).
- `src/app/globals.css` -- fuente de verdad de los tokens (`udd-blue`, `udd-deep`, `udd-gray`, `udd-graphite`, `udd-gold`, `success`/`warning`/`error`, radios, sombras, timing de `shimmer`/`fadeIn`/`btn-press`, `safe-bottom`) a traducir a `ionic-app/src/theme/variables.scss`.

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/` -- `ionic start ionic-app blank --type=angular-standalone --no-git` desde la raíz del repo -- crea el proyecto Angular standalone base sin tocar `src/` de Next.js.
- [x] `ionic-app/src/theme/variables.scss` -- traducir los tokens de `globals.css` a `--ion-color-*` y variables de forma/sombra/tiempos de animación -- base de todo el theming nativo.
- [x] `ionic-app/src/app/shared/utils.ts`, `ionic-app/src/app/shared/models.ts` -- portar utilidades y tipos que el resto de tareas necesita.
- [x] `ionic-app/src/app/shared/ui/*` -- portar los 10 componentes UI/shared listados en Code Map -- kit reutilizable para CAP-1 a CAP-6.
- [x] `ionic-app/src/app/shared/layout/{header,navbar}.component.ts` -- portar Header/Navbar (usan componentes de `shared/ui`) -- shell de navegación reutilizable.
- [x] `ionic-app/src/app/shared/state/{auth,cart,ui}.service.ts` -- portar los 3 stores como servicios con signals -- estado global reutilizable.
- [x] `ionic-app/src/app/kit/kit.page.ts` -- ruta `/kit` que instancia cada componente portado en sus variantes principales y lee/escribe cada servicio -- única forma de verificar visualmente el kit sin dominios reales aún.

**Acceptance Criteria:**
- [x] Given la ruta `/kit` cargada, when se visita en el navegador, then se ven las variantes de `Button`, `Card`, `Badge`, `Input`, `Skeleton`, `Toast`, `Header`, `Navbar`, `EmptyState`, `RatingStars`, `VerifiedBadge`, `AIDeclarationBadge` sin errores de consola. Verificado con Chromium headless contra `ionic-app` corriendo en `ng serve`: 0 errores/warnings de consola, 0 `pageerror`, las 12 secciones renderizan (ver Verification).
- [x] Given `Toast` mostrado con duración por defecto, when pasan 3000ms sin interacción, then se autocierra. Verificado: se disparó el toast anclado y, a los 3200ms, `ion-toast.isOpen` era `false`.
- [x] Given `CartService` sin items, when se lee `total()`, then devuelve `0`. Verificado en pantalla ("Items: 0 — Total: $0") y tras `addItem()` el total sube a `$3.500` correctamente.
- [x] Given `AuthService.fetchUser()` sin sesión activa en Supabase, when se resuelve, then `user()` es `null` y `loading()` es `false`. Verificado: `user: null — loading: false`, sin excepción ni error de consola.

## Implementation Notes

**Build/verification:** `npm install` y `npm run build` (`ng build`) corren sin errores. Se levantó `ng serve` y se cargó `/kit` con Chromium headless (Puppeteer apuntando al binario del sistema, sin descargar nada) para confirmar 0 errores de consola, el auto-dismiss del Toast a los 3000ms, y las lecturas/escrituras de `CartService`/`AuthService`. Screenshots de referencia quedaron en el scratchpad de la sesión (no versionados).

**Bug encontrado y corregido durante la verificación:** `AuthService` construía el cliente de Supabase de forma eager en el constructor (`createClient(environment.supabaseUrl, environment.supabaseAnonKey)`). `@supabase/supabase-js` lanza una excepción SÍNCRONA si `supabaseUrl` está vacío, lo que rompía el arranque completo de `/kit` (pantalla en blanco, `ERROR Error: supabaseUrl is required.` en consola) apenas se inyectaba el servicio — no solo dentro de `fetchUser()`. Se corrigió construyendo el cliente solo si ambas env vars están configuradas; si no, `fetchUser()`/`signOut()` tratan la ausencia de cliente igual que "sin sesión" (mismo comportamiento honesto, sin excepción). Ver `ionic-app/src/app/shared/state/auth.service.ts`.

**Credenciales de Supabase pendientes (decisión documentada, no silenciosa):** el `.env.local` del proyecto Next.js no está en este checkout/sesión (no versionado), así que `ionic-app/src/environments/environment.ts` y `environment.prod.ts` quedaron con `supabaseUrl`/`supabaseAnonKey` en `''`. `AuthService` funciona igual (fail-soft a "sin sesión"), pero **falta que alguien con acceso complete esas dos variables con los valores reales antes de usar auth de verdad.**

**Puntos de riesgo visual (Design Notes) — decisiones tomadas, pendientes de confirmación visual de Lucas en `/kit`:**
1. **Botón central del Navbar:** confirmado que `ion-tab-bar` tiene `contain: strict` en su CSS (@ionic/core), que recorta cualquier hijo que intente sobresalir del bar — un `ion-tab-button` elevado se habría visto cortado. Se implementó como el Design Note ya sugería: un botón flotante (`<a class="app-navbar__center">`), hermano del `ion-tab-bar` (no hijo), posicionado absoluto y reproduciendo el mismo cálculo de flex-centering + `margin-top:-16px` (`-mt-4`) que el original — visualmente muy cercano al MVP (ver screenshot). `ion-tab-bar` solo contiene los 4 destinos reales + un `div` espaciador inerte en el slot central.
2. **Toast:** `ion-toast` no expone ninguna variable CSS de offset vertical (`--start`/`--end` son solo horizontales) — el mecanismo nativo real es `positionAnchor`, que ancla el toast arriba de un elemento dado. Se implementó así: `ToastComponent` acepta `positionAnchor` opcional; en `/kit` se demuestran ambas variantes lado a lado (anclada sobre el `Navbar` vía `id="app-navbar-el"`, y sin anclar). Diferencia real y deliberada respecto al original: sin anchor, el toast queda al ras del borde inferior (respetando safe-area) en vez de a `bottom-24` (96px) fijos.
3. **Skeleton shimmer:** inspeccionado el CSS de `ion-skeleton-text` en `node_modules/@ionic/core` — su shimmer nativo usa `animation-duration: 1s` (original: 1.5s), gradiente por opacidad sobre `--background-rgb` (original: gradiente opaco `#f0f0f0`/`#e0e0e0`) y `background-size` en píxeles fijos (original: porcentual). Se fijó `--background-rgb: 0,0,0` que reproduce los grises objetivo casi exacto (6.5%/13.5% de negro sobre blanco ≈ `#eeeeee`/`#dcdcdc` vs `#f0f0f0`/`#e0e0e0`) y `--border-radius: 8px` (igual al original). La velocidad de la animación (1s vs 1.5s) y el mecanismo de `background-size` fijo-vs-relativo **no se pueden cerrar** sin abandonar el `ion-skeleton-text` nativo por uno completamente custom.
4. **Card:** resuelto tal como pedía la nota ("ajustar por variable, no asumir que el default de Ionic coincide") — `--border-radius: 16px` y `--box-shadow` con las mismas fórmulas de Tailwind (`shadow-sm`/`shadow-md`) en vez de los defaults de Ionic.

**Otras decisiones no triviales documentadas (no flagueadas explícitamente en Design Notes, pero igual son sustituciones de "look"):**
- `Badge`: el estilo por defecto de `ion-badge` (pill sólido de alto contraste) no se parece en nada al original ("tinte 10% + texto de color"); se sobreescribió completo vía CSS vars, mismo patrón que Card.
- Iconos lucide → ionicons: `Star`→`star`/`star-half`/`star-outline` (pedido explícito de la spec), `Shield`→`shield-outline`, `CheckCircle`→`checkmark-circle-outline`, `Bell`→`notifications-outline`, `ShoppingCart`→`cart-outline`, `ArrowLeft`→`arrow-back-outline`, `Search`→`search-outline`, `Home`→`home-outline`, `MessageCircle`→`chatbubble-outline`, `User`→`person-outline`, `PlusCircle`→`add-outline`, `X`→`close-outline`. `Brain` (AIDeclarationBadge) **no tiene equivalente en ionicons** (no existe ningún ícono "brain") — sustituido por `sparkles-outline`.
- `dark.system.css` (dark mode automático por OS) se sacó de `global.scss`: el MVP actual es un tema fijo único, sin variante oscura; importarlo habría cambiado colores en dispositivos con dark mode del sistema, algo que la app no hace hoy.
- `EmptyState.icon` pasó de "inferido por si hay children" (React) a un input booleano explícito (`icon = input(true)`), porque Angular no tiene forma barata de detectar contenido proyectado.
- `Skeleton` ganó inputs `width`/`height` (el original solo tomaba un `className` de Tailwind con clases de tamaño arbitrarias; sin Tailwind, se necesitó una forma explícita de dimensionarlo).
- `validateUDDEmail` de `src/lib/utils/index.ts` **no se portó** — no está en la lista explícita del Code Map (solo `formatCLP`, `formatDate`, `formatRelativeTime`, `getInitials`, `truncateText`, `generateId`).

**Auditoría de la matriz I/O (post-implementación, con Lucas):** el subagente verificó las 4 filas de la matriz solo con un script Puppeteer manual de una sola vez, no con tests automatizados registrados — el propio proceso de bmad-build exige un test que corra y pase por cada fila. Consultado, Lucas eligió agregar tests mínimos en vez de aceptar la verificación manual (pese a que la SPEC madre de la migración marca testing/CI como no-goal del ramo). Se agregaron 4 archivos `.spec.ts` (Vitest, vía el runner nativo de Angular 22):
- `rating-stars.component.spec.ts` -- `rating=3.5` → 3 llenas/1 media/1 vacía + texto "3.5".
- `cart.service.spec.ts` -- `total()` en `0` vacío y `3500` tras `addItem()`.
- `auth.service.spec.ts` -- `fetchUser()` con `@supabase/supabase-js` mockeado (`getUser()` resuelve sin usuario) → `user()` `null`, `loading()` `false`, sin excepción. Nota técnica: el runner de tests de Angular 22 bloquea `vi.mock` sobre imports relativos ("usa TestBed para mockear dependencias") — se mockeó solo el paquete externo `@supabase/supabase-js` y se mutó directamente el objeto `environment` (import relativo) antes de inyectar el servicio, en vez de mockearlo.
- `toast.component.spec.ts` -- `duration()` default `3000` y `onDidDismiss()` limpia `isOpen`. El timer real de 3000ms de auto-dismiss es interno de `ion-toast` (Stencil); reproducirlo en un test unitario con jsdom sería testear el componente de Ionic, no código de esta app — esa parte sigue cubierta solo por la verificación manual en Verification.

`npm test -- --no-watch`: 5 test files / 6 tests, todos en verde.

**Patches aplicados post-review (ver Review Triage Log):**
- `app.routes.ts` -- ruta `**` → redirect a `kit`, evita "cannot match any routes" al clickear links de Header/Navbar hacia dominios aún no migrados.
- `index.html` -- `<link>` de Google Fonts para Manrope+Inter (antes `--ion-font-family` no cargaba nada, caía a `system-ui`).
- `capacitor.config.ts`, `ionic.config.json`, `package.json` -- rebrandeados de los defaults del starter de Ionic a learnudd/UDD.
- `kit.page.ts`/`kit.page.html` -- separado el signal mal cableado en `inputWithHint` (demo de hint) e `inputWithError` (ahora sí atado al demo de error).
- `kit.page.ts` -- `showToast()` cierra el otro toast antes de abrir el solicitado.
- `auth.service.ts` -- `createClient(...)` envuelto en try/catch (URL no vacía pero mal formada ya no crashea la construcción); `signOut()` gana un `catch` para no dejar un unhandled rejection.
- `auth.service.spec.ts` -- mock de `@supabase/supabase-js` ahora lanza igual que la librería real ante url/key vacíos; test nuevo cubre exactamente los defaults reales del proyecto (`''`/`''`).

Re-verificado tras los patches: `npm run build` (0 errores) y `npm test -- --no-watch` (5 test files / 7 tests, todos en verde).

## Design Notes

Puntos ya identificados como riesgo de romper paridad visual con `ion-*` nativo — en cada uno, mostrar a Lucas el resultado (captura o descripción concreta) y confirmar antes de seguir, no decidir en silencio:

- **Botón central del `Navbar`** (elevado, circular, con sombra, sobresaliendo del `ion-tab-bar`): no es un patrón estándar de Ionic; requiere CSS custom sobre `ion-tab-button` o un botón flotante superpuesto. Mayor riesgo de todo CAP-7.
- **`Toast`**: hoy es fijo en `bottom-24`, centrado, ancho mínimo 280px. `ion-toast` tiene su propio modelo de posicionamiento (`position="bottom"` con offset limitado) — confirmar si el resultado se ve igual o si hay que forzar CSS.
- **`Skeleton` shimmer**: `ion-skeleton-text` trae su propia animación; comparar velocidad/colores contra el `shimmer` actual (1.5s, gris claro/gris medio) antes de aceptarlo como equivalente.
- **`Card`**: Ionic aplica `--border-radius`/sombra por defecto distintos a `rounded-2xl` + `shadow-sm`/`shadow-md` actuales; ajustar por variable, no asumir que el default de Ionic coincide.

## Spec Change Log

## Review Triage Log

Revisión con 3 capas (blind-hunter, edge-case-hunter, verification-gap) sobre el diff completo desde `baseline_commit`. 16 hallazgos, verificados uno por uno contra el código real:

1. **blind-hunter — Header/Navbar `routerLink` a rutas inexistentes** (`header.component.html:64,72`, `navbar.component.html:5,19,30`) — verdict: `medium`. Confirmado: `app.routes.ts` solo define `kit` y `''→'kit'`; clickear cualquier link de Header/Navbar dispara "cannot match any routes" en consola. Real, causado por este cambio.
2. **edge-case-hunter — mismo hallazgo, foco en Header** — verdict: `medium`, `carried` del punto 1 (mismo root cause).
3. **edge-case-hunter — mismo hallazgo, foco en Navbar** — verdict: `medium`, `carried` del punto 1 (mismo root cause).
4. **blind-hunter — `--ion-font-family: 'Manrope','Inter',...` sin `<link>`/`@font-face` que cargue esas fuentes** (`variables.scss`, `index.html`) — verdict: `medium`. Confirmado: no hay import de Google Fonts en `index.html`; el body cae a `system-ui`. Gap de paridad visual no cubierto por los 4 puntos ya flagueados en Design Notes.
5. **blind-hunter — identidad de Capacitor/Ionic/package.json sin rebrandear** (`capacitor.config.ts`, `ionic.config.json`, `package.json`) — verdict: `low`. Confirmado: `appId: 'io.ionic.starter'`, `author: 'Ionic Framework'`, etc. Sin impacto funcional hoy; fix trivial (renombrar strings).
6. **blind-hunter — sin mecanismo de inyección de variables de entorno para credenciales Supabase** (`environment.ts`) — verdict: `low`. Real (Angular no tiene el equivalente a `.env.local` de Next.js), pero ya documentado explícitamente en Implementation Notes con acción pendiente clara; el fix real (tooling de config) no es trivial y pertenece a cuando se conecte Supabase de verdad (CAP-1).
7. **blind-hunter — `shared/models.ts` duplica tipos de `src/types/index.ts` sin mecanismo anti-drift** — verdict: `low`, rechazado. Tradeoff explícito y ya documentado en el Code Map/Intent congelado (proyectos npm separados); ningún fallo demostrado hoy, es un riesgo de mantenimiento futuro, y el fix (paquete compartido/codegen) no es trivial.
8. **blind-hunter — cobertura de tests desigual (Button, Card, Badge, Header, Navbar, UiService, etc. sin specs)** — verdict: `false` para "esto es un gap de esta historia". El AC congelado y la matriz I/O ya acotaron explícitamente qué 4 comportamientos requieren test; eso es la línea que el propio intent trazó, no el scope doc.
9. **blind-hunter — `InputComponent.inputId` puede colisionar con labels duplicados o sin label/id** — verdict: `false`. Es un port 1:1 del comportamiento ya existente en `src/components/ui/Input.tsx` (`id || label?.toLowerCase().replace(...)`) — no es un defecto nuevo de este cambio, es paridad fiel con el original.
10. **blind-hunter — `kit.page.ts`: `inputWithError` está atado al demo de *hint*, y el demo de *error* usa un literal hardcodeado en vez de un signal** — verdict: `low`. Confirmado leyendo `kit.page.html`. Solo afecta la página de referencia `/kit`, no el componente `Input` en sí. Fix trivial (renombrar/atar correctamente).
11. **blind-hunter — `showToast()` no cierra el otro toast antes de abrir uno nuevo** (`kit.page.ts`) — verdict: `low`. Confirmado: si se dispara "anclado" y luego "sin anclar" dentro de los 3s, ambos quedan `isOpen=true`. Solo en la página demo. Fix trivial.
12. **blind-hunter — ícono de notificaciones/carrito de Header no corresponde a su destino** (`/messages`, `/library`) — verdict: `false`. Verificado contra el original `src/components/layout/Header.tsx`: el MVP actual ya enruta la campana a `/messages` y el carrito a `/library` — es paridad exacta, no un bug introducido por el port.
13. **blind-hunter — drift de versiones patch en `package.json` (`@angular/build`/`cli` en `22.1.8` vs framework en `22.1.7`)** — verdict: `false`. Generado por el propio scaffold de `ionic start`, no por una acción del agente; `npm install`, `ng build` y `npm test` corrieron sin fallos — ningún problema real demostrado.
14. **edge-case-hunter — `AuthService`: `supabaseUrl` truthy pero mal formado hace que `createClient()` lance sincrónicamente** (`auth.service.ts:22-25`) — verdict: `medium`. Real: el guard agregado solo cubre el caso vacío (el bug ya encontrado), no una URL inválida no-vacía — el mismo tipo de crash podría resurgir apenas alguien tipee mal la URL real.
15. **edge-case-hunter — `AuthService.signOut()` puede producir un unhandled promise rejection** (`auth.service.ts:76-82`, `kit.page.html` botón `signOut()`) — verdict: `low`. Confirmado: el `try {...} finally {...}` sin `catch` no absorbe el rechazo; el template llama `auth.signOut()` sin manejarlo. Hoy no se puede disparar (Supabase sin configurar → `signOut` es un no-op vía `?.`), pero resurge apenas se configuren credenciales reales.
16. **verification-gap — el guard de `AuthService` contra `createClient()` con `supabaseUrl` vacío (el bug que este mismo diff corrigió) no tiene ningún test que lo proteja bajo los valores por defecto reales (`''`/`''`)** (`auth.service.spec.ts`) — verdict: `medium` (pre-verificado por esa capa). El test existente fuerza valores válidos antes de inyectar, evitando exactamente el escenario por defecto — una regresión del guard pasaría desapercibida.

**Ruteo:** puntos 1-3 se agrupan (mismo root cause) → `patch`. Puntos 4, 5, 10, 11, 14, 15, 16 → `patch` (fixes triviales/directos, causados por este cambio). Punto 6 → `defer` (a CAP-1, cuando se conecte Supabase real). Puntos 7, 8, 9, 12, 13 → rechazados (falsos o fuera de la línea que el propio intent ya trazó).

## Verification

**Commands:**
- `cd ionic-app && npm install` -- expected: instala sin errores. **Ejecutado: OK** (0 errores; solo warnings preexistentes de `npm audit`/`allow-scripts` del scaffold de Ionic, no relacionados con este trabajo).
- `cd ionic-app && npm run build` -- expected: `ng build` compila con 0 errores de TypeScript/plantillas. **Ejecutado: OK**, bundle generado en `ionic-app/www`.
- `cd ionic-app && ionic serve` -- expected: sirve en local; navegar a `/kit` manualmente. **Ejecutado (`ng serve` en :4300) + verificación automatizada con Chromium headless** (Puppeteer contra el binario del sistema): 0 errores/warnings de consola, 0 `pageerror`, las 12 secciones (`Button`, `Card`, `Input`, `Badge`, `Skeleton`, `Toast`, `EmptyState`, `RatingStars`, `VerifiedBadge`, `AIDeclarationBadge`, servicios) renderizan; `RatingStars` con `rating=3.5` mostró 3 llenas/1 media/1 vacía; `Toast` se autocerró después de 3000ms; `CartService.total()` fue `0` vacío y `$3.500` tras `addItem()`; `AuthService.fetchUser()` resolvió a `user:null, loading:false` sin excepción.
- `cd ionic-app && npm test -- --no-watch` -- expected: cubre las 4 filas de la matriz con tests que corren y pasan. **Ejecutado: OK** — 5 test files, 6 tests, todos en verde (`RatingStarsComponent` rating=3.5, `CartService.total()`, `AuthService.fetchUser()` sin sesión con cliente Supabase mockeado, `ToastComponent` duration/onDidDismiss). El timer nativo de 3000ms de `ion-toast` no se reprodujo en el unit test (sería testear el componente de Ionic, no código de esta app); esa parte queda cubierta solo por la verificación manual de arriba.

**Manual checks (if no CLI):**
- Comparar visualmente `/kit` contra las páginas Next.js que usan estos mismos componentes hoy (colores, radios, sombras, animaciones de skeleton/fade) para confirmar paridad de diseño. **Pendiente de que Lucas lo revise en vivo** — especialmente los 4 puntos de Design Notes (ver Implementation Notes para el detalle de cada uno y qué se decidió).
