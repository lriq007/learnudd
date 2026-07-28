# 06 - Despliegue en Vercel

## Primer Deploy (Setup Inicial)

### 1. Preparar el repositorio

```bash
cd /ruta/al/proyecto/learnudd
git init
git add .
git commit -m "LearnUDD MVP"
```

### 2. Crear repo en GitHub

- Ir a [github.com/new](https://github.com/new)
- Nombre: `learnudd`
- No inicializar con README (ya hay código)
- **Create repository**

### 3. Subir código a GitHub

```bash
# Con SSH (recomendado):
git remote add origin git@github.com:TU_USUARIO/learnudd.git
git branch -M main
git push -u origin main
```

**Si SSH no funciona**, verificar:
```bash
# Verificar que la SSH key está agregada en GitHub (Settings → SSH Keys)
ssh -T git@github.com

# Si el remote usa un host SSH personalizado (ej: github.com-uni):
git remote set-url origin git@github.com-uni:TU_USUARIO/learnudd.git
```

### 4. Desplegar en Vercel

1. Ir a [vercel.com](https://vercel.com) → Login con GitHub
2. **Add New Project** → Importar repo `learnudd`
3. Configuración:
   - Framework: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build` (default)
4. **Environment Variables** (agregar las 3):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tkcclisegjhpjxwyxivl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service_role key JWT) |

5. Click **Deploy**
6. Esperar ~2 minutos
7. URL generada: `https://learnudd.vercel.app` (o similar)

### 5. Verificar

- Abrir URL de Vercel
- Login con `martina@udd.cl` / `test123456`
- Verificar que todas las páginas funcionan

## Deploys Subsequentes

Cada `git push` a la rama `main` activa un deploy automático en Vercel.

```bash
# Hacer cambios
git add .
git commit -m "Descripción del cambio"
git push
# Vercel detecta el push y hace build automático
```

## Variables de Entorno en Vercel

Ubicación: **Project Settings → Environment Variables**

Se pueden configurar por ambiente:
- **Production**: Variables para la app en producción
- **Preview**: Variables para deploys de preview (PRs)
- **Development**: Variables para `vercel dev` local

## Dominio Personalizado (Opcional)

1. **Project Settings → Domains**
2. Agregar dominio personalizado
3. Configurar DNS en tu proveedor de dominio:
   - Type: CNAME
   - Name: `@` o subdomain
   - Value: `cname.vercel-dns.com`

## Plan Gratuito (Hobby)

| Recurso | Límite |
|---------|--------|
| Builds | 1,000/mes |
| Bandwidth | 100 GB/mes |
| Serverless Functions | 100 GB-hrs/mes |
| Almacenamiento | 1 GB |
| Duración máxima de función | 10 segundos (Hobby) |

Para un MVP, el plan gratuito es más que suficiente.
