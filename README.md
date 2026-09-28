# LearnUDD

Marketplace de apuntes y tutorías entre pares para estudiantes UDD. Stack: **Ionic + Angular** (frontend, `ionic-app/`) + **Supabase** (Postgres, Auth, Storage).

## Estado del proyecto

Nació como MVP en Next.js/React y fue migrado a Ionic+Angular para cumplir los requisitos del ramo. Actualmente en transición de MVP a versión de producción, con el objetivo de uso real por estudiantes UDD (no solo entrega de curso).

## Partes del proyecto (trabajo en equipo)

| Responsable | Módulos |
|---|---|
| Base — Lucas  (main) | `kit/`, `shared/` (ui, layout, guards, state/Supabase), `auth/`, `onboarding/` |
| Compañero — Jesús (Descubrimiento y Apuntes) | `home/`, `explore/`, `favorites/`, `note-detail/`, `library/`, `publish/`, `publish-note/` |
| Compañero — Jose (Tutorías y Social) | `tutor-detail/`, `bookings/`, `publish-tutor/`, `messages/`, `chat/`, `profile/`, `profile-creator/` |

Todos los módulos viven en `ionic-app/src/app/`.

## Cómo correrlo localmente

```bash
cd ionic-app
npm install
cp .env.example .env.local   # completar SUPABASE_URL y SUPABASE_ANON_KEY
npm start                     # ng serve --configuration=local
```

## Despliegue en Vercel

- **Root Directory**: `ionic-app`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `www`
- **Environment Variables**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Project Settings → Environment Variables)

Cada push a `main` dispara un deploy automático. Las credenciales se inyectan en build time vía `ionic-app/scripts/inject-env.mjs`.
