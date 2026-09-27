---
id: SPEC-ionic-angular-migration
companions: [domain-inventory.md, conventions.md, known-issues.md]
sources: []
---

> **Canonical contract.** Este SPEC y los archivos en `companions:` son el contrato completo, validado por preservación, de qué construir, probar y validar. No hay documentos fuente externos: el contenido nace de una sesión de bmad-party-mode (ver `.memlog.md`) y de una lectura directa del código actual.

# Migración de learnudd a Ionic + Angular

## Why

El profesor del curso exige, de forma literal, que el proyecto use Ionic, Angular y Supabase — un mandato del curso, no una elección técnica de Lucas. El MVP actual de `learnudd` (marketplace de apuntes y tutorías entre pares para estudiantes UDD) está construido en Next.js/React. Esto obliga a reescribir el frontend completo mientras se preserva Supabase como backend. La migración importa doblemente: cumple el requisito del ramo y es un paso real hacia el objetivo de Lucas de llevar `learnudd` a producción para uso real de estudiantes UDD, no solo a aprobar el curso.

## Capabilities

- **CAP-1**
  - **intent:** Un usuario puede autenticarse (login, callback OAuth) y completar onboarding en la app Ionic+Angular.
  - **success:** Los 3 flujos (login, callback, onboarding) funcionan en Ionic+Angular con paridad de comportamiento frente al MVP Next.js — ver `domain-inventory.md`.

- **CAP-2**
  - **intent:** Un usuario puede ver su home/feed, explorar apuntes y tutores, y marcar favoritos.
  - **success:** Home, explorar y favoritos operan en Ionic+Angular con paridad funcional frente al MVP.

- **CAP-3**
  - **intent:** Un usuario puede ver el detalle de un apunte, revisar su biblioteca de apuntes y publicar un apunte propio.
  - **success:** Detalle de apunte, biblioteca y publicación de apunte operan en Ionic+Angular con paridad funcional frente al MVP.

- **CAP-4**
  - **intent:** Un usuario puede ver el perfil de un tutor, reservar una tutoría y publicarse como tutor.
  - **success:** Perfil de tutor, reservas y publicación de tutoría operan en Ionic+Angular con paridad funcional frente al MVP.

- **CAP-5**
  - **intent:** Un usuario puede ver su lista de conversaciones y chatear en tiempo real con otro usuario.
  - **success:** Lista de mensajes y chat individual funcionan sobre Supabase Realtime en Ionic+Angular, con paridad funcional frente al MVP.

- **CAP-6**
  - **intent:** Un usuario puede ver y editar su perfil, y un creador puede ver su dashboard de creador.
  - **success:** Perfil y dashboard de creador operan en Ionic+Angular con paridad funcional frente al MVP (el cálculo de ingresos en 0 es un bug preexistente, no se corrige aquí — ver `known-issues.md`).

- **CAP-7**
  - **intent:** La app cuenta con un kit de componentes UI compartidos y manejo de estado global equivalentes a los actuales (botones, cards, inputs, badges, skeleton, toast, header, navbar, stores de auth/cart/ui).
  - **success:** Cada componente/store del kit compartido existe como componente standalone Angular con signals, reutilizado por al menos dos de los dominios CAP-1 a CAP-6.

- **CAP-8**
  - **intent:** La app web Ionic+Angular resultante está desplegada y accesible en línea (Fase 1 del roadmap).
  - **success:** La app corre desplegada en Vercel y es accesible públicamente con los 7 dominios funcionando; el build command/output de Vercel quedó reconfigurado para compilar la app Ionic+Angular (reemplaza `next build`).

## Constraints

- Solo Ionic, Angular y Supabase son exigencia literal del profesor; Vercel es preferencia propia de Lucas, no del curso.
- Supabase se mantiene como backend tal cual; no se introduce un backend nuevo.
- Angular: standalone components (sin NgModule), signals + `computed()` para estado y derivados, control de flujo moderno en templates (`@if`/`@for`/`@empty`/`@switch`, no `*ngIf`/`*ngFor`), formularios template-driven con `ngModel`/`FormsModule` (no Reactive Forms) — detalle técnico en `conventions.md`.
- Corte limpio: no se desarrolla nada nuevo en Next.js/React desde el inicio de esta migración; el código Next.js existente no se borra, queda como referencia.
- Roadmap en dos fases: esta spec cubre solo la Fase 1 (app web Ionic+Angular en Vercel). El empaquetado nativo (Fase 2) es un non-goal explícito de esta spec.
- Plazo: la migración base (los 7 dominios funcionando en Ionic+Angular) debe estar lista hoy 2026-09-26; pulido/mejoras adicionales quedan para iteraciones posteriores.
- Deploy: se trabaja directo sobre `main` (sin rama de migración separada), aceptando que Vercel muestre builds fallidos mientras el proyecto está a medio migrar — un build roto no tumba el sitio, Vercel sigue sirviendo el último deploy exitoso. Antes de que CAP-8 se dé por completo, el build command/output de Vercel debe reconfigurarse de `next build` a la app Ionic+Angular.

## Non-goals

- Empaquetado nativo iOS/Android vía Capacitor (Fase 2 del roadmap) — spec futura, no esta.
- Corregir los 4 bugs de producción preexistentes (ingresos en 0, filtro de tabs sin implementar, pago simulado, credenciales demo hardcodeadas) — quedan en backlog de producción, documentados en `known-issues.md`.
- Desarrollar funcionalidades nuevas más allá de la paridad funcional con el MVP Next.js actual.
- Testing automatizado/CI: no es foco de este ramo ni se evalúa en esta entrega. Posible trabajo futuro de Lucas una vez entienda el enfoque a usar.

## Success signal

La app `learnudd` corre end-to-end en Ionic+Angular+Supabase, desplegada y accesible en Vercel, con los 7 dominios (Auth&Onboarding, Home/Discovery, Notes Marketplace, Tutoring/Bookings, Messaging, Profile/Creator, UI kit) funcionando con paridad respecto al MVP Next.js — verificable por el profesor contra la exigencia literal de stack (Ionic, Angular, Supabase).

## Assumptions

- "Paridad funcional" no incluye corregir los bugs preexistentes ya detectados (quedan fuera, en `known-issues.md`).
- Vercel se asume como plataforma de deploy web de la Fase 1 por preferencia de Lucas, no por exigencia del curso.
