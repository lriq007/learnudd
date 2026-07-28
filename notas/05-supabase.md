# 05 - Configuración de Supabase

## Crear Proyecto

1. Ve a [supabase.com](https://supabase.com) → Sign up / Login
2. **New Project** → Nombre: `learnudd` → Password de DB (guardar)
3. Seleccionar región más cercana
4. Esperar ~2 minutos a que se cree

## Credenciales

Ubicación: **Settings → API** (dentro del proyecto)

| Credencial | Uso | Ubicación en .env |
|-----------|-----|-------------------|
| Project URL | Endpoint REST | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` key (JWT) | Cliente browser | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key (JWT) | Admin/API server | `SUPABASE_SERVICE_ROLE_KEY` |

**IMPORTANTE**: Supabase ahora muestra keys nuevas (`sb_publishable_...`, `sb_secret_...`). Estas NO funcionan con `@supabase/ssr` v0.12.3. Usar las **Legacy keys** en formato JWT (empiezan con `eyJ...`). Se encuentran en la misma página Settings → API, scrolling hacia abajo.

## Crear Schema

1. Ve a **SQL Editor** dentro de Supabase
2. Copia el contenido de `supabase/migrations/001_initial_schema.sql`
3. Click **Run**
4. Verificar que las 13 tablas se crearon correctamente

## Crear Usuarios Demo

1. En **SQL Editor**, pegar y ejecutar el script de creación de usuarios usando la **Admin API**:

```bash
# Crear cada usuario (repetir para benjamin, sofia, tomas)
curl -X POST "https://<PROJECT_REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<EMAIL>","password":"test123456","email_confirm":true,"user_metadata":{"full_name":"<NOMBRE>"}}'
```

2. Luego insertar profiles:

```sql
INSERT INTO profiles (id, email, full_name, campus, major, semester, interests, verified, onboarding_completed)
SELECT ...
FROM auth.users au WHERE au.email LIKE '%@udd.cl';
```

## Poblar Datos de Prueba

Ejecutar `supabase/seed_complete.sql` en el SQL Editor para crear:
- 8 notas de ejemplo
- 3 tutores con horarios
- Ratings de tutores y notas
- Mensajes de ejemplo
- Favoritos y biblioteca

## Row Level Security (RLS)

RLS está habilitado en todas las tablas. Las políticas permiten:
- **SELECT público**: profiles, notes (active), tutors, ratings
- **INSERT/UPDATE propio**: profiles, notes, tutors, bookings, messages
- **DELETE propio**: notes, favorites, library

## Variables de Entorno para Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://tkcclisegjhpjxwyxivl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```
