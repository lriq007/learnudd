// Locally redeclared subset of src/types/index.ts — ionic-app is a separate
// npm project (own package.json), so types are not imported cross-project.
// Only the shapes actually used by the ported UI kit / stores are kept here
// (per Code Map: Profile, AIDeclaration, shape of CartItem).

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  campus: string | null;
  major: string | null;
  semester: number | null;
  interests: string[];
  verified: boolean;
  created_at: string;
  onboarding_completed: boolean;
}

export type AIDeclaration = 'none' | 'assisted' | 'generated';

// CAP-2: ported from src/types/index.ts (MaterialType líneas 17-24, Note
// líneas 29-52, Tutor+TutorCourse líneas 73-95, Favorite líneas 167-177,
// MAJOR_OPTIONS líneas 196-209, MATERIAL_TYPE_LABELS líneas 224-232). Only
// the fields Home/Explore/Favorites actually read are kept — same pruning
// approach CAP-7 already used for Profile/CartItem above. `status`/
// `ai_declaration` stay inline unions/the existing AIDeclaration type rather
// than adding NoteStatus (not in this spec's Code Map list of new exports).
export type MaterialType =
  | 'resumen'
  | 'guia_ejercicios'
  | 'formulario'
  | 'mapa_conceptual'
  | 'apuntes_clase'
  | 'preparacion_certamen'
  | 'pauta_autorizada';

export interface Note {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  major: string;
  course: string;
  semester: string | null;
  material_type: MaterialType;
  price: number;
  currency: string;
  pages: number | null;
  file_url: string | null;
  cover_url: string | null;
  ai_declaration: AIDeclaration;
  ai_details: string | null;
  status: 'draft' | 'review' | 'active' | 'paused' | 'rejected';
  downloads: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  average_rating?: number;
  ratings_count?: number;
}

export interface TutorCourse {
  id: string;
  tutor_id: string;
  course_name: string;
  major: string;
}

export interface Tutor {
  id: string;
  user_id: string;
  bio: string | null;
  experience: string | null;
  hourly_price: number;
  campus: string;
  modalities: string[];
  verified: boolean;
  total_classes: number;
  created_at: string;
  user?: Profile;
  courses?: TutorCourse[];
  average_rating?: number;
  ratings_count?: number;
}

// CAP-4: ported from src/types/index.ts (TutorSchedule líneas 97-106,
// TutorRating líneas 108-117, BookingStatus/PaymentStatus líneas 119-120,
// Booking líneas 123-140) for the tutor detail and bookings pages.
// PaymentMethod is not ported — no payment gateway integration in either
// app (Boundaries: "sin pasarela de pago real"), so nothing here reads it.
export interface TutorSchedule {
  id: string;
  tutor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
  recurring: boolean;
  created_at: string;
}

export interface TutorRating {
  id: string;
  user_id: string;
  tutor_id: string;
  rating: number;
  comment: string | null;
  verified_class: boolean;
  created_at: string;
  user?: Profile;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  schedule_id: string | null;
  course: string;
  modality: 'presencial' | 'online';
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_amount: number | null;
  notes: string | null;
  meeting_link: string | null;
  location: string | null;
  created_at: string;
  tutor?: Tutor;
  student?: Profile;
  schedule?: TutorSchedule;
}

export interface Favorite {
  id: string;
  user_id: string;
  note_id: string | null;
  tutor_id: string | null;
  created_at: string;
  note?: Note;
  tutor?: Tutor;
}

// CAP-3: ported from src/types/index.ts (NoteRating líneas 62-71, LibraryItem
// líneas 179-187) for the note detail and library pages.
export interface NoteRating {
  id: string;
  user_id: string;
  note_id: string;
  rating: number;
  comment: string | null;
  verified_purchase: boolean;
  created_at: string;
  user?: Profile;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  note_id: string;
  purchased_at: string;
  last_accessed: string | null;
  progress: number;
  note?: Note;
}

export const MAJOR_OPTIONS = [
  'Ingeniería Civil Informática',
  'Ingeniería Comercial',
  'Derecho',
  'Medicina',
  'Psicología',
  'Arquitectura',
  'Enfermería',
  'Ingeniería Civil',
  'Ingeniería Ambiental',
  'Periodismo',
  'Design',
  'Odontología',
] as const;

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  resumen: 'Resumen',
  guia_ejercicios: 'Guía de Ejercicios',
  formulario: 'Formulario',
  mapa_conceptual: 'Mapa Conceptual',
  apuntes_clase: 'Apuntes de Clase',
  preparacion_certamen: 'Preparación de Certamen',
  pauta_autorizada: 'Pauta Autorizada',
};

// CAP-3: SEMESTER_OPTIONS moved here from onboarding.page.ts's local const
// now that publish-note.page.ts is a second consumer — same criterion CAP-2
// used to move MAJOR_OPTIONS out of onboarding.page.ts. MATERIAL_TYPE_OPTIONS
// is derived from MATERIAL_TYPE_LABELS with Object.entries, ported 1:1 from
// src/types/index.ts (líneas 234-236).
export const SEMESTER_OPTIONS = [
  '1° Semestre',
  '2° Semestre',
  '3° Semestre',
  '4° Semestre',
  '5° Semestre',
  '6° Semestre',
  '7° Semestre',
  '8° Semestre',
  '9° Semestre',
  '10° Semestre',
] as const;

export const MATERIAL_TYPE_OPTIONS = Object.entries(MATERIAL_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export interface CartItem {
  id: string;
  type: 'note' | 'booking';
  title: string;
  price: number;
  image?: string;
}
