# 01 - Arquitectura del Proyecto

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js | 16.2.12 |
| Lenguaje | TypeScript | - |
| Estilos | Tailwind CSS | v4 |
| Base de datos | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Realtime | Supabase Realtime | - |
| State Management | Zustand | - |
| Formularios | React Hook Form + Zod | - |
| Iconos | Lucide React | - |
| Hosting | Vercel | Hobby (gratis) |

## Estructura de Directorios

```
learnudd/
├── public/                    # Assets estáticos
├── src/
│   ├── app/
│   │   ├── (auth)/           # Rutas públicas (login)
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (protected)/      # Rutas protegidas (requieren login)
│   │   │   ├── page.tsx      # Home / Recomendaciones
│   │   │   ├── explore/      # Explorar notas y tutores
│   │   │   ├── library/      # Biblioteca personal
│   │   │   ├── favorites/    # Favoritos
│   │   │   ├── messages/     # Chat en tiempo real
│   │   │   ├── bookings/     # Reservas de clases
│   │   │   ├── publish/      # Publicar notas / ser tutor
│   │   │   ├── profile/      # Perfil y dashboard
│   │   │   └── onboarding/   # Onboarding de nuevos usuarios
│   │   ├── layout.tsx        # Layout raíz (Manrope font)
│   │   └── globals.css       # Estilos globales + Tailwind
│   ├── components/
│   │   ├── ui/               # Button, Input, Card, Badge, Skeleton, Toast
│   │   ├── layout/           # Navbar (bottom bar), Header
│   │   └── shared/           # VerifiedBadge, RatingStars, EmptyState, AIDeclaration
│   ├── lib/
│   │   ├── supabase/         # Client, Server, Middleware Supabase
│   │   └── utils/            # formatCLP, getInitials, validation schemas
│   ├── stores/               # Zustand: authStore, cartStore, uiStore
│   ├── types/                # TypeScript types y constants
│   └── middleware.ts         # Route protection middleware
├── supabase/
│   ├── migrations/           # SQL migrations
│   └── seed*.sql             # Datos de prueba
└── notas/                    # Esta documentación
```

## Flujo de Autenticación

```
Login Form → supabase.auth.signInWithPassword()
           → Middleware verifica sesión (getUser)
           → Si no hay sesión → redirect /login
           → Si hay sesión → página solicitada
```

## Decisiones de Diseño

- **Mobile-first**: Diseñado para 390x844px (iPhone), responsive hacia arriba
- **UDD Branding**: Colores institucionales (azul #005293, deep #062B4F, sky #008DD2, gold #C89B3C)
- **Tipografía**: Manrope (Google Fonts)
- **Navegación inferior**: Bottom bar con 5 tabs + botón flotante de publicar
- **Email @udd.cl**: Solo se aceptan correos institucionales
