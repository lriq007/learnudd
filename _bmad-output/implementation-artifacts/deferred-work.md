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
