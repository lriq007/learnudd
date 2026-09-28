---
title: 'CAP-8: fileReplacements de producción apuntando al placeholder vacío en vez de environment.local.ts'
type: 'bugfix'
created: '2026-09-27'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La configuración `production` de `ionic-app/angular.json` reemplaza `environment.ts` por `environment.prod.ts` (placeholder con `supabaseUrl`/`supabaseAnonKey` vacíos), no por `environment.local.ts` (el archivo que `scripts/inject-env.mjs` genera en el `prebuild` con las credenciales reales, leídas de `.env.local` en local o de las env vars nativas `SUPABASE_URL`/`SUPABASE_ANON_KEY` en Vercel). El build en Vercel compila sin error, pero `SupabaseService` recibe credenciales vacías y su cliente queda `null` en producción.

**Approach:** Apuntar el `fileReplacements` de la configuración `production` en `angular.json` a `src/environments/environment.local.ts` (el mismo archivo que ya usa la configuración `local` para `ng serve`), y eliminar `environment.prod.ts`, que queda sin ninguna referencia tras el cambio.

</frozen-after-approval>

## Implementation Notes

- `ionic-app/angular.json` -- `fileReplacements` de la configuración `production` cambiado de `environment.prod.ts` a `environment.local.ts`.
- `ionic-app/src/environments/environment.prod.ts` -- eliminado (sin referencias tras el cambio).
- `ionic-app/src/environments/environment.ts` -- comentario de cabecera actualizado (ya no menciona `environment.prod.ts`); sigue siendo el placeholder vacío para `ng test` / configuraciones sin fileReplacement.
- Verificado con `SUPABASE_URL=https://test.supabase.co SUPABASE_ANON_KEY=test-anon-key npm run build`: el bundle `www/main-*.js` resultante contiene esos valores (antes del fix habría contenido strings vacíos). Luego se regeneró `environment.local.ts` con las credenciales reales de `.env.local` (`node scripts/inject-env.mjs`).
- `ionic-app/scripts/inject-env.mjs` -- hallazgo de review: el archivo generado siempre traía `production: false` hardcodeado, incluso en el build real de producción (ahora que `production` apunta a este archivo). Nada lee hoy `environment.production` (verificado con grep), pero es una trampa latente. Fix: `production: process.env['npm_lifecycle_event'] === 'prebuild'` -- `npm run build` dispara el hook `prebuild` (`true`), `npm start` dispara `prestart` (`false`). Verificado manualmente simulando ambos hooks.
- `ionic-app/src/environments/environment.ts` -- hallazgo de review: el comentario nuevo decía "AuthService/SupabaseService fail soft", subestimando el alcance real (el null-fallback de `client` vive en `SupabaseService`, pero lo consumen también `NotesService`, `TutorsService`, `BookingsService`, `FavoritesService`, `MessagesService`). Corregido para nombrar el patrón completo.
- Hallazgos de review fuera de alcance de este spec (archivos de trabajo en curso del usuario no tocados: `notas/09-ionic-angular-sistema.md`, `deferred-work.md` entradas viejas) -- registrados en `deferred-work.md`, ver Review Triage Log.

## Review Triage Log

- `inject-env.mjs` genera `production: false` fijo aunque el build sea el de producción real -- **medium** (trampa latente para la primera feature que lea `environment.production`; verificado con grep que hoy nada lo lee). Patcheado: se usa `npm_lifecycle_event` para distinguir `prebuild`/`prestart`.
- Comentario en `environment.ts` nombraba solo `AuthService/SupabaseService`, no los demás servicios que consumen el mismo null-fallback -- **low** (cosmético, comentario propio de este mismo diff). Patcheado: comentario ampliado a los 6 servicios.
- `notas/09-ionic-angular-sistema.md` queda desactualizado por este fix (árbol de directorios, diagrama de fileReplacements, tabla de specs relacionadas) -- **medium**, pero archivo de trabajo en curso del usuario fuera del alcance de este spec. Diferido en `deferred-work.md`.
- `notas/09-ionic-angular-sistema.md` §13 indica un Output Directory de Vercel (`dist/.../browser`) que no coincide con el real (`www`) -- **medium**, pero preexistente (no causado por este fix) y en archivo fuera de alcance. Diferido en `deferred-work.md`.
- `deferred-work.md` (entrada de CAP-1) menciona `environment.ts/environment.prod.ts` como archivos que el mecanismo de inyección genera -- **rechazado**: es un log append-only de entradas ya cerradas; el propio workflow prohíbe editar entradas viejas, y el impacto de la referencia desactualizada es mínimo (documentación interna del propio proceso BMAD, no código ni guía de usuario).
- Hallazgos sobre `enviables compañeros/*.md` (bug de orden de rutas, falta de guía de `.env.local`, falta de lint/test) y sobre `notas/README.md` (falta de contexto sobre la entrada 09) -- **rechazados para este spec**: archivos totalmente ajenos a CAP-8 (materiales para compañeros / notas personales), ya presentes sin tocar en el árbol antes de este spec; no se agregó entrada en `deferred-work.md` porque no derivan de este `source_spec`. Mencionados al usuario como FYI en el resumen final.
- Carpeta `enviables compañeros/` sin entrada en `.gitignore` (riesgo de que un `git add -A` la incluya) -- **rechazado para este spec**: gestión de espacio de trabajo del propio usuario, ya conocida (se le preguntó explícitamente por el árbol sucio antes de empezar y eligió continuar sin tocarlo).
