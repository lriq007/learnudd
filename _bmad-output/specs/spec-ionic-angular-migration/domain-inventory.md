# Inventario de dominios y rutas (MVP Next.js actual)

Relevado leyendo directamente `src/app` y `src/components` del MVP. 17 rutas `page.tsx` + 2 layouts de sección, agrupadas en los 7 dominios usados por CAP-1 a CAP-7 de `SPEC.md`. (La sesión de arquitectura previa contó 19 — incluía los 2 layouts de sección junto a las 17 páginas.)

## 1. Auth & Onboarding (CAP-1)

| Ruta Next.js actual | Función |
|---|---|
| `(auth)/login` | Login |
| `(auth)/callback` | Callback OAuth |
| `(auth)/layout.tsx` | Layout de sección auth |
| `(protected)/onboarding` | Onboarding post-login |

## 2. Home / Discovery (CAP-2)

| Ruta Next.js actual | Función |
|---|---|
| `(protected)/` (page.tsx raíz) | Home / feed |
| `(protected)/explore` | Explorar (apuntes + tutores) |
| `(protected)/favorites` | Favoritos |
| `(protected)/layout.tsx` | Layout de sección protegida (navbar/header compartidos) |

## 3. Notes Marketplace (CAP-3)

| Ruta Next.js actual | Función |
|---|---|
| `(protected)/explore/notes/[id]` | Detalle de apunte |
| `(protected)/library` | Biblioteca de apuntes (comprados/guardados) |
| `(protected)/publish` | Hub de publicación (elige apunte o tutoría) |
| `(protected)/publish/note` | Publicar apunte |

## 4. Tutoring / Bookings (CAP-4)

| Ruta Next.js actual | Función |
|---|---|
| `(protected)/explore/tutors/[id]` | Perfil de tutor |
| `(protected)/bookings` | Reservas |
| `(protected)/publish/tutor` | Publicarse como tutor |

## 5. Messaging — Supabase Realtime (CAP-5)

| Ruta Next.js actual | Función |
|---|---|
| `(protected)/messages` | Lista de conversaciones |
| `(protected)/messages/[id]` | Chat individual (Supabase Realtime) |

## 6. Profile / Creator Dashboard (CAP-6)

| Ruta Next.js actual | Función |
|---|---|
| `(protected)/profile` | Perfil de usuario |
| `(protected)/profile/creator` | Dashboard de creador (ver bug de ingresos en `known-issues.md`) |

## 7. UI kit compartido (CAP-7)

Sin ruta propia; usado por los otros 6 dominios.

**Componentes UI (`src/components/ui/`):** Badge, Button, Card, Input, Skeleton, Toast.

**Compartidos (`src/components/shared/`):** AIDeclaration, EmptyState, RatingStars, VerifiedBadge.

**Layout (`src/components/layout/`):** Header, Navbar.

**Estado global (`src/stores/`):** authStore, cartStore, uiStore — a reconstruir como signals/servicios Angular.

**Backend (`src/lib/supabase/`):** client.ts, server.ts, middleware.ts — se mantienen conceptualmente (mismo proyecto Supabase), adaptados al cliente Angular.
