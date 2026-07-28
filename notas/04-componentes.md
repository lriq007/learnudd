# 04 - Componentes y Páginas

## Componentes UI (`src/components/ui/`)

| Componente | Descripción |
|-----------|-------------|
| `Button.tsx` | Botón con variantes: primary, secondary, outline, ghost, danger |
| `Input.tsx` | Input con label, error state, icono opcional |
| `Card.tsx` | Card con hover effect y opciones de padding |
| `Badge.tsx` | Badge para etiquetas (verificado, semestre, etc.) |
| `Skeleton.tsx` | Loading skeleton para estados de carga |
| `Toast.tsx` | Notificaciones toast (success, error, info) |

## Componentes Compartidos (`src/components/shared/`)

| Componente | Descripción |
|-----------|-------------|
| `VerifiedBadge.tsx` | Badge azul de "Verificado" |
| `RatingStars.tsx` | Estrellas de calificación (1-5) |
| `EmptyState.tsx` | Estado vacío con ícono y mensaje |
| `AIDeclaration.tsx` | Badge de declaración de uso de IA |

## Layout (`src/components/layout/`)

| Componente | Descripción |
|-----------|-------------|
| `Navbar.tsx` | Bottom bar con 5 tabs: Inicio, Explorar, Publicar, Biblioteca, Perfil |
| `Header.tsx` | Header superior con título y acciones |

## Páginas (`src/app/`)

### Públicas
- `/login` - Login con email/password y magic link
- `/auth/callback` - Callback de autenticación

### Protegidas
- `/` - Home con recomendaciones y notas destacadas
- `/explore` - Explorar notas y tutores con filtros
- `/explore/notes/[id]` - Detalle de nota con compra
- `/explore/tutors/[id]` - Perfil de tutor con reserva
- `/library` - Biblioteca de notas compradas
- `/favorites` - Notas y tutores guardados
- `/messages` - Lista de conversaciones
- `/messages/[id]` - Chat en tiempo real
- `/bookings` - Reservas de clases
- `/publish` - Hub de publicación
- `/publish/note` - Publicar nota (formulario 4 pasos)
- `/publish/tutor` - Ser tutor (formulario)
- `/profile` - Perfil de usuario
- `/profile/creator` - Dashboard de creador
- `/onboarding` - Onboarding de 3 pasos

## Estado Global (Zustand)

| Store | Propósito |
|-------|-----------|
| `authStore.ts` | Sesión de usuario, login/logout, perfil |
| `cartStore.ts` | Carrito de compras de notas |
| `uiStore.ts` | Estado de UI (toasts, modals, sidebar) |
