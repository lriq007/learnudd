# 02 - Base de Datos

## Schema (PostgreSQL)

Archivo: `supabase/migrations/001_initial_schema.sql`

### Tablas Principales

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `profiles` | Perfiles de usuario | FK → auth.users(id) |
| `notes` | Apuntes/notas publicadas | FK → profiles(id) |
| `note_samples` | Muestras de notas (2-3 págs preview) | FK → notes(id) |
| `note_ratings` | Calificaciones de notas | FK → profiles(id), notes(id) |
| `tutors` | Perfiles de tutor | FK → profiles(id) |
| `tutor_courses` | Ramos que dicta cada tutor | FK → tutors(id) |
| `tutor_schedules` | Horarios disponibles | FK → tutors(id) |
| `tutor_ratings` | Calificaciones de tutores | FK → profiles(id), tutors(id) |
| `bookings` | Reservas de clases | FK → profiles(id), tutors(id) |
| `messages` | Mensajes entre usuarios | FK → profiles(id) |
| `favorites` | Notas y tutores guardados | FK → profiles(id), notes(id), tutors(id) |
| `library` | Notas compradas | FK → profiles(id), notes(id) |
| `payments` | Pagos registrados | FK → profiles(id), notes(id), bookings(id) |

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas principales:

- **profiles**: Lectura pública, escritura solo propio
- **notes**: Lectura pública si status='active', escritura solo autor
- **tutors**: Lectura pública, escritura solo propio
- **bookings**: Solo participantes (estudiante + tutor)
- **messages**: Solo remitente y receptor
- **favorites/library**: Solo el propio usuario
- **payments**: Solo el propio usuario

### Índices de Performance

```sql
CREATE INDEX idx_notes_course ON notes(course);
CREATE INDEX idx_notes_major ON notes(major);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_author ON notes(author_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);
CREATE INDEX idx_tutors_campus ON tutors(campus);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
-- ... y más
```

### Triggers

```sql
-- Auto-crear perfil cuando un usuario se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-actualizar updated_at en notes
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tipos de Material (ENUM para notes.material_type)

- `resumen` - Resumen del ramo
- `guia_ejercicios` - Guía de ejercicios resueltos
- `formulario` - Formulario/fórmulas
- `mapa_conceptual` - Mapa conceptual
- `apuntes_clase` - Apuntes de clase
- `preparacion_certamen` - Preparación para certamen
- `pauta_autorizada` - Pauta autorizada

### Estados de Nota

- `draft` → `review` → `active` → `paused` / `rejected`
