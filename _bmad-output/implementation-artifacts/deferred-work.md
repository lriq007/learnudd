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
  evidence: Hallazgo de review (blind-hunter) sobre CAP-1, pero el catch-all es un patch ya aplicado en CAP-7 (para no romper los links de Header/Navbar hacia dominios aún no migrados) — preexistente, no causado ni agravado por CAP-1. Revisar si conviene distinguir "dominio no migrado todavía" de "ruta que nunca existirá" cuando estén los 6 dominios (CAP-2 a CAP-6).
