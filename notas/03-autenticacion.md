# 03 - Autenticación

## Configuración

- **Proveedor**: Supabase Auth (email + password)
- **Dominio permitido**: Solo `@udd.cl`
- **Métodos de login**: Password y Magic Link
- **Protección de rutas**: Middleware de Next.js con `supabase.auth.getUser()`

## Usuarios Demo

| Email | Nombre | Carrera | Semestre |
|-------|--------|---------|----------|
| martina@udd.cl | Martina Silva | Ingeniería Civil Informática | 6 |
| benjamin@udd.cl | Benjamín Rojas | Ingeniería Civil Informática | 10 |
| sofia@udd.cl | Sofía Contreras | Derecho | 8 |
| tomas@udd.cl | Tomás Muñoz | Medicina | 4 |

**Contraseña para todos**: `test123456`

## Cómo se Crearon los Usuarios

Los usuarios se crearon usando la **Admin API** de Supabase con la `service_role` key:

```bash
curl -X POST "https://tkcclisegjhpjxwyxivl.supabase.co/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "martina@udd.cl",
    "password": "test123456",
    "email_confirm": true,
    "user_metadata": {"full_name": "Martina Silva"}
  }'
```

**Importante**: Usar `"email_confirm": true` para evitar que pida confirmación por email.

## Credenciales de Supabase

```
URL:    https://tkcclisegjhpjxwyxivl.supabase.co
Anon:   eyJhbGci... (key JWT con role "anon")
Secret: eyJhbGci... (key JWT con role "service_role")
```

Las keys nuevas de Supabase (`sb_publishable_...`) no son compatibles con `@supabase/ssr` v0.12.3. Se deben usar las keys JWT clásicas que se encuentran en Settings → API → "Legacy anon / service_role keys".

## Flujo de Login

```
1. Usuario ingresa email + contraseña
2. Client-side: supabase.auth.signInWithPassword({email, password})
3. Supabase verifica credenciales en auth.users
4. Retorna session + access_token
5. Middleware verifica sesión en cada request (getUser)
6. Si no hay sesión → redirect a /login
7. Cookies se actualizan para mantener la sesión
```

## Archivos Relacionados

- `src/app/(auth)/login/page.tsx` - Formulario de login
- `src/app/(auth)/callback/page.tsx` - Callback de auth (magic link)
- `src/lib/supabase/client.ts` - Cliente browser
- `src/lib/supabase/server.ts` - Cliente server-side
- `src/lib/supabase/middleware.ts` - Lógica de middleware
- `src/middleware.ts` - Middleware de Next.js
