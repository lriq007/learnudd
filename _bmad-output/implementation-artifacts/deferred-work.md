- source_spec: none
  summary: CAP-1 Auth & Onboarding — migrar login, callback OAuth y onboarding a Ionic+Angular con paridad funcional.
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios.

- source_spec: none
  summary: CAP-2 Home & Discovery — migrar home/feed, explorar y favoritos a Ionic+Angular con paridad funcional.
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios.

- source_spec: none
  summary: CAP-3 Notes Marketplace — migrar detalle de apunte, biblioteca y publicación de apunte a Ionic+Angular con paridad funcional.
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios.

- source_spec: none
  summary: CAP-4 Tutoring & Bookings — migrar perfil de tutor, reservas y publicación de tutoría a Ionic+Angular con paridad funcional.
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios.

- source_spec: none
  summary: CAP-5 Messaging — migrar lista de conversaciones y chat en tiempo real (Supabase Realtime) a Ionic+Angular con paridad funcional.
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios.

- source_spec: none
  summary: CAP-6 Profile & Creator Dashboard — migrar perfil de usuario y dashboard de creador a Ionic+Angular con paridad funcional.
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios.

- source_spec: none
  summary: CAP-8 Deploy Fase 1 — desplegar la app Ionic+Angular en Vercel y reconfigurar el build command/output (reemplaza next build).
  evidence: Split del SPEC de migración Ionic+Angular (8 CAPs); se prioriza CAP-7 (UI kit + stores) como base compartida antes de migrar dominios. Además depende de que los demás CAPs estén migrados.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-7-ui-kit-stores.md`
  summary: ionic-app/src/environments/environment.ts no tiene mecanismo de inyección de variables de entorno (equivalente al .env.local de Next.js) para las credenciales reales de Supabase — hoy son placeholders vacíos.
  evidence: Hallazgo de review (blind-hunter) sobre CAP-7. Angular reemplaza environment.ts en build time (fileReplacements) pero no inyecta secrets desde un archivo gitignoreado; llenar los valores reales hoy significa editar un archivo trackeado. No es urgente para CAP-7 (el kit no necesita auth real), pero hay que resolverlo antes o durante CAP-1 (Auth & Onboarding), cuando se conecte Supabase de verdad.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-1-auth-onboarding.md`
  summary: Implementar el mecanismo de inyección de credenciales reales de Supabase en ionic-app — script prestart/prebuild con dotenv que lee ionic-app/.env.local (gitignorado vía el patrón .env* ya existente en la raíz) y genera environment.ts/environment.prod.ts; en Vercel (CAP-8) el mismo script debería leer las env vars nativas del build, sin dotenv.
  evidence: Split por tamaño del spec de CAP-1 (superaba el rango de tokens sugerido) — CAP-1 se implementa y prueba con Supabase mockeado; sin este item resuelto no se puede probar login/onboarding contra un proyecto Supabase real en ionic-app.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-1-auth-onboarding.md`
  summary: ionic-app/src/app/shared/state/auth.service.ts#fetchUser() descarta el `error` de la consulta `profiles.select().single()` — una falla real (RLS, esquema, red) se trata en silencio igual que "sin sesión", sin nada que lo distinga ni lo loguee.
  evidence: Hallazgo de review (edge-case-hunter) sobre CAP-1. `fetchUser()` es código preexistente de CAP-7, no tocado por el diff de CAP-1 — no lo causa este story. Vale la pena revisarlo cuando se conecten credenciales reales de Supabase y sea posible observar fallas reales de la consulta.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-1-auth-onboarding.md`
  summary: La ruta catch-all (`path: '**', redirectTo: 'kit'`) en ionic-app/src/app/app.routes.ts silencia cualquier URL no reconocida, incluyendo typos y rutas rotas — un 404 real nunca es visible durante desarrollo o QA, se ve igual que "la app funcionó".
  evidence: Hallazgo de review (blind-hunter) sobre CAP-1, pero el catch-all es un patch ya aplicado en CAP-7 (para no romper los links de Header/Navbar hacia dominios aún no migrados) — preexistente, no causado ni agravado por CAP-1. Revisar si conviene distinguir "dominio no migrado todavía" de "ruta que nunca existirá" cuando estén los 6 dominios (CAP-2 a CAP-6). Nota CAP-2: `NoteCard`/`TutorCard` ahora enlazan a `/explore/notes/:id` y `/explore/tutors/:id` (CAP-3/CAP-4, aún no construidas), que caen en este mismo catch-all — dos sitios nuevos del mismo patrón ya aceptado, se resuelve solo cuando existan esas rutas.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-2-home-discovery.md`
  summary: NotesService/TutorsService/FavoritesService solo devuelven `[]` cuando el cliente Supabase es `null`; ninguno atrapa un `reject()` real (falla de red), y home/explore/favorites.page.ts no tienen `.catch()` — ante una falla de red real, `loading()` queda en `true` para siempre sin ningún feedback visible.
  evidence: Hallazgo de review (blind-hunter + edge-case-hunter) sobre CAP-2. El `fetchData`/`useEffect` del MVP (`(protected)/page.tsx`, `explore/page.tsx`, `favorites/page.tsx`) tiene exactamente el mismo hueco — ningún `try/catch` alrededor de sus llamadas a Supabase — así que esto es paridad fiel, no una regresión de CAP-2; además el Never congelado de este spec excluye explícitamente agregar manejo de error que el MVP no tiene. Revisar junto con el resto de los 6 dominios cuando se decida agregar manejo de errores de red real (probablemente al conectar Supabase real, CAP-1's item de env vars).

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-2-home-discovery.md`
  summary: Los botones ícono-only de limpiar-búsqueda y toggle-de-filtros en explore.page.html no tienen `aria-label` — un usuario de screen reader no tiene indicación de qué hace cada botón.
  evidence: Hallazgo de review (blind-hunter) sobre CAP-2. Confirmado que el MVP (`explore/page.tsx:139-157`) tiene el mismo hueco de accesibilidad en esos mismos botones — paridad fiel, no causado por CAP-2. Vale la pena resolverlo en una pasada de accesibilidad dedicada sobre toda la app, no solo Explore.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-2-home-discovery.md`
  summary: ionic-app/src/app/shared/state/tutors.service.ts#search() usa `.contains('courses.major', [major])` sobre `courses`, que es una relación embebida (`courses:tutor_courses(*)` vía join), no una columna de la tabla base `tutors` — sin verificar contra un proyecto Supabase real, no está confirmado que PostgREST acepte `.contains()` apuntando a una relación anidada de esta forma (podría no filtrar nada, lanzar error, o comportarse distinto de lo esperado).
  evidence: Ported literal desde `explore/page.tsx` líneas 64-85 (el MVP tiene el mismo filtro, igual sin verificar). Boundaries/Never de CAP-2 exige no "arreglar a ciegas" este filtro sin verificarlo contra Supabase real, y documentarlo aquí en su lugar. Revisar cuando exista un proyecto Supabase real conectado (mismo momento que el item de credenciales/env vars de CAP-1) — probar `search({ major })` con datos reales y, si PostgREST rechaza o ignora el filtro, reemplazarlo por el patrón correcto para filtrar por una columna de una relación anidada (probablemente un `.filter()`/`or()` sobre el alias del join, o una función RPC).

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-notes-marketplace.md`
  summary: Publicar apunte — chooser `/publish` (elegir "Publicar apunte" vs "Ofrecer clases") + wizard de 4 pasos `/publish/note`, portados desde `src/app/(protected)/publish/page.tsx` y `src/app/(protected)/publish/note/page.tsx`.
  evidence: Split por tamaño del spec de CAP-3 (2820 tokens, superaba bastante el rango sugerido de 900-1600) — se prioriza el lado de comprar/ver (detalle de apunte + biblioteca), ya enlazado desde NoteCard/Header de CAP-2. Pendiente resolver al implementar: el MVP redirige tras publicar con éxito a `/profile/creator` (CAP-6, aún no migrado), así que no hay un destino de redirect obvio hasta que ese dashboard exista (opciones: home, `/library` — aunque una nota en `review` no aparece ahí, que solo lista compras —, o no redirigir y solo mostrar el toast). El MVP tampoco sube archivos (`notes.file_url`/`cover_url` nunca se setean desde ningún flujo), así que el wizard no necesita upload a Supabase Storage. El botón central "+" del navbar ya apunta a `/publish` y seguirá cayendo en el catch-all (`redirectTo: 'kit'`) hasta que este item se implemente. En el chooser, la tarjeta "Ofrecer clases" queda enlazada a `/publish/tutor` (CAP-4, también diferido) y cae en el mismo catch-all, igual que ya aceptan los links de NoteCard/TutorCard de CAP-2.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-notes-marketplace.md`
  summary: Ningún flujo async nuevo de note-detail/library maneja errores de red ni tiene guardas de estado — `ngOnInit` de ambas páginas deja `loading()` en `true` para siempre si `getById`/`getRatings`/`checkFavorite`/`listPurchased` rechaza; `purchase()` deja `purchasing()` colgado ante un rechazo real; `toggleFavorite()` no revierte el estado optimista si `toggle()` devuelve `{error}`; ni `purchase()` ni `toggle()` tienen guarda anti doble-tap; y no hay chequeo de compra duplicada antes de insertar en `library` (violaría su `unique(user_id, note_id)`, mostrando el toast de error genérico).
  evidence: Hallazgo de review (blind-hunter + edge-case-hunter) sobre CAP-3, verificado contra el MVP línea por línea — cada uno de estos huecos existe igual en `explore/notes/[id]/page.tsx` y `library/page.tsx` (ningún `try/catch`, ningún chequeo de propiedad previo a comprar, ningún guard anti doble-click). Paridad fiel; el Never de este spec excluye explícitamente "agregar manejo de errores de red" y "chequeo de compra duplicada". Mismo patrón general ya documentado para NotesService/TutorsService/FavoritesService en el item de CAP-2 de arriba. Revisar junto con el resto cuando se decida agregar manejo de errores real (momento de Supabase real conectado, item de CAP-1).

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-notes-marketplace.md`
  summary: Tras una compra exitosa en el detalle de apunte, `note()` nunca se re-sincroniza — el contador de descargas mostrado en pantalla queda desactualizado por 1; y si el `update` de `notes.downloads` dentro de `NotesService.purchase()` falla, el error se descarta en silencio (el usuario igual ve el toast "¡El apunte ya es tuyo!").
  evidence: Hallazgo de review (blind-hunter + edge-case-hunter) sobre CAP-3. Verificado que el MVP (`handlePurchase`, `explore/notes/[id]/page.tsx` líneas 73-100) tiene exactamente el mismo par de huecos: nunca vuelve a fijar `note` tras la compra, y no desestructura el `error` del segundo `update`. Paridad fiel, excluida por el mismo Never de "manejo de errores de red" de este spec.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-notes-marketplace.md`
  summary: El botón "Abrir apunte" de `ionic-app/src/app/library/library.page.html` (ícono de documento junto a cada item) no tiene ningún `(click)` — es un dead button.
  evidence: Hallazgo de review (blind-hunter) sobre CAP-3. Verificado que el MVP (`library/page.tsx` líneas 108-110) tiene el mismo botón sin `onClick`. Paridad fiel — no había ninguna página de "abrir/leer apunte" que portar (no existe en el MVP), así que no hay destino real al que enlazar todavía. Revisar si conviene darle un destino cuando exista un visor de apuntes o al menos redirigir a `/explore/notes/:id` del mismo apunte.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-publish-note.md`
  summary: El wizard de publicar apunte (`publish-note.page.ts`) no valida `title`/`course` con `.trim()` (paso 1), ni pone piso en 0 para `price`/`pages` (permite negativos) — un usuario puede publicar con campos solo-espacios o precios/páginas negativos.
  evidence: Hallazgo de review (blind-hunter + edge-case-hunter) sobre este spec. Verificado que `publish/note/page.tsx` (MVP) tiene exactamente las mismas 3 faltas de validación (`canProceed` sin trim, `parseInt(...) || 0` sin `Math.max` en ambos campos numéricos). Paridad fiel — el Always de este spec pide "misma validación por paso", que excluye agregar validación que el MVP no tiene. Revisar junto con el resto de validaciones de formularios cuando se decida ir más allá de paridad fiel con el MVP.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-publish-note.md`
  summary: En el wizard de publicar apunte, el botón "Atrás" no se deshabilita mientras `submit()` está en vuelo, y si `NotesService.create()` rechaza (falla de red real, no un `{error}` resuelto) en vez de resolver, `loading()` queda en `true` para siempre sin ningún toast.
  evidence: Hallazgo de review (edge-case-hunter) sobre este spec. Verificado que `publish/note/page.tsx` (MVP) tampoco deshabilita "Atrás" durante el submit ni tiene try/catch en `handleSubmit`. Mismo patrón ya diferido para CAP-2 (servicios) y CAP-3 (detalle/biblioteca) — el Never de este spec excluye explícitamente agregar manejo de errores de red más allá del MVP. Revisar junto con esos ítems cuando exista Supabase real conectado.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-publish-note.md`
  summary: `PublishNotePage.submit()` no hace nada visible (ni toast ni cambio de estado) si `auth.user()` no tiene id — por ejemplo, sesión expirada a mitad del wizard.
  evidence: Hallazgo de review (edge-case-hunter) sobre este spec. Verificado que `publish/note/page.tsx` (MVP) tiene el mismo comportamiento (`if (!user) return;`, sin ningún feedback). Paridad fiel, no un gap introducido por este spec.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-publish-note.md`
  summary: Los controles del wizard de publicar apunte (grillas de tipo de material, declaración de IA, precios rápidos, barra de progreso) no tienen `aria-pressed`/`aria-valuenow` — un usuario de screen reader no puede distinguir qué opción está seleccionada.
  evidence: Hallazgo de review (blind-hunter) sobre este spec. Misma clase de gap de accesibilidad ya diferida para CAP-2 (botones ícono-only sin `aria-label` en Explore) — el MVP tampoco tiene estos atributos. Vale la pena resolverlo en una pasada de accesibilidad dedicada sobre toda la app, no solo este wizard.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-publish-note.md`
  summary: El wizard de publicar apunte no advierte al usuario si navega fuera a mitad de flujo (los 4 pasos de datos ingresados se pierden en silencio).
  evidence: Hallazgo de review (blind-hunter) sobre este spec. El MVP tampoco tiene esta guarda — sería una feature nueva, no paridad. Revisar si vale la pena agregarla cuando se haga una pasada de UX dedicada sobre formularios largos de la app.

- source_spec: `_bmad-output/implementation-artifacts/spec-cap-3-publish-note.md`
  summary: `ionic-app/angular.json` tiene una clave `"cli.analytics"` con un UUID que no corresponde a ningún spec — quedó en el working tree antes de este spec (generada localmente por el CLI de Angular/Ionic la primera vez que corrió `ng`/`ionic` en esta máquina).
  evidence: Hallazgo de review (blind-hunter) sobre este spec. Verificado que la modificación ya existía en el working tree al iniciar este spec — ruido de tooling local, no relacionado a ninguna feature. Revisar si conviene revertirla o agregar esa clave al `.gitignore`/config para que no vuelva a ensuciar diffs futuros.
