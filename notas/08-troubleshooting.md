# 08 - Troubleshooting (Errores y Soluciones)

## 1. Login muestra error `{}`

**Error**: Al intentar login, se muestra un objeto vacío `{}` en lugar de un mensaje de error.

**Causa**: La tabla `profiles` no tenía registros para los usuarios de `auth.users`. El trigger `handle_new_user()` no se ejecutó porque los usuarios se crearon con INSERT directo.

**Solución**: Insertar profiles manualmente:
```sql
INSERT INTO profiles (id, email, full_name, campus, major, semester, interests, verified, onboarding_completed)
SELECT au.id, au.email, ...
FROM auth.users au WHERE au.email LIKE '%@udd.cl';
```

---

## 2. `AuthRetryableFetchError: {}`

**Error**: El cliente Supabase no puede conectar con el servidor auth.

**Causa**: Las API keys en formato `sb_publishable_...` no son compatibles con `@supabase/ssr` v0.12.3.

**Solución**: Usar las **Legacy keys** en formato JWT (`eyJ...`) que se encuentran en Settings → API → scroll hacia abajo en el dashboard de Supabase.

---

## 3. `Database error querying schema` (500)

**Error**: El endpoint `/auth/v1/token` retorna 500 con "Database error querying schema".

**Causa**: Los usuarios se crearon con INSERT directo en `auth.users`, corrompiendo el estado de autenticación de GoTrue.

**Solución**: 
1. Eliminar los usuarios corruptos
2. Recrearlos usando la **Admin API** con `email_confirm: true`
3. Crear profiles por separado

```bash
# Crear usuario correctamente
curl -X POST "https://<REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE>" \
  -H "Authorization: Bearer <SERVICE_ROLE>" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@udd.cl","password":"test123456","email_confirm":true,"user_metadata":{"full_name":"Name"}}'
```

---

## 4. `operator does not exist: character varying = uuid`

**Error**: Al intentar borrar usuarios de `auth.refresh_tokens`.

**Causa**: `auth.refresh_tokens.user_id` es de tipo `varchar`/`text`, pero `auth.users.id` es `uuid`.

**Solución**: Cast explícito:
```sql
DELETE FROM auth.refresh_tokens WHERE user_id IN (SELECT id::text FROM auth.users WHERE ...);
```

---

## 5. `column "confirmed_at" can only be updated to DEFAULT`

**Error**: Al intentar actualizar `confirmed_at` en `auth.users`.

**Causa**: `confirmed_at` es una columna generada (computed) en versiones recientes de Supabase.

**Solución**: Solo actualizar `email_confirmed_at`:
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email LIKE '%@udd.cl';
```

---

## 6. Página raíz muestra template de Next.js

**Error**: Después del login, se muestra la página default de Next.js en lugar de la home de la app.

**Causa**: Existía un `src/app/page.tsx` con el template default que tenía prioridad sobre `(protected)/page.tsx`.

**Solución**: Eliminar `src/app/page.tsx`:
```bash
rm src/app/page.tsx
```

---

## 7. `git push` falla con "Password authentication is not supported"

**Error**: GitHub ya no acepta autenticación por contraseña para operaciones Git.

**Solución**: Usar SSH:
```bash
# Generar SSH key
ssh-keygen -t ed25519 -C "usuario@github.com"

# Copiar key pública
cat ~/.ssh/id_ed25519.pub

# Agregar en GitHub → Settings → SSH Keys

# Cambiar remote a SSH
git remote set-url origin git@github.com:TU_USUARIO/learnudd.git

# Push
git push -u origin main
```

---

## 8. TypeScript build error: `error_description` no existe en `AuthError`

**Error**: En Vercel, el build falla con "Property 'error_description' does not exist on type 'AuthError'".

**Causa**: La propiedad `error_description` no existe en el tipo `AuthError` de Supabase.

**Solución**: Remover la referencia:
```typescript
// Antes
const errorMsg = authError.message || authError.error_description || JSON.stringify(authError);
// Después
const errorMsg = authError.message || JSON.stringify(authError);
```

---

## 9. Rate limit en Supabase Auth

**Error**: `over_email_send_rate_limit` al crear múltiples usuarios vía signup.

**Causa**: Supabase limita la cantidad de emails de confirmación enviados por minuto.

**Solución**: Usar la Admin API con `email_confirm: true` que no envía email:
```bash
curl -X POST ".../auth/v1/admin/users" -d '{"email_confirm":true,...}'
```

---

## 10. Middleware deprecation warning en Next.js 16

**Warning**: `The "middleware" file convention is deprecated. Please use "proxy" instead.`

**Estado**: Next.js 16 treat `middleware.ts` como `proxy.ts`. El middleware sigue funcionando pero puede requerir migración futura a la convención `proxy.ts`.

**Acción**: No afecta funcionalidad por ahora. Monitorear actualizaciones de Next.js.
