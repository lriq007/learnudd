export type UserRole = 'student' | 'creator' | 'tutor';

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

export type MaterialType =
  | 'resumen'
  | 'guia_ejercicios'
  | 'formulario'
  | 'mapa_conceptual'
  | 'apuntes_clase'
  | 'preparacion_certamen'
  | 'pauta_autorizada';

export type NoteStatus = 'draft' | 'review' | 'active' | 'paused' | 'rejected';
export type AIDeclaration = 'none' | 'assisted' | 'generated';

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
  status: NoteStatus;
  downloads: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  average_rating?: number;
  ratings_count?: number;
}

export interface NoteSample {
  id: string;
  note_id: string;
  page_number: number;
  file_url: string;
  created_at: string;
}

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

export interface TutorCourse {
  id: string;
  tutor_id: string;
  course_name: string;
  major: string;
}

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
export type PaymentMethod = 'webpay' | 'mercadopago' | 'free';

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

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  booking_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Payment {
  id: string;
  user_id: string;
  note_id: string | null;
  booking_id: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  external_id: string | null;
  created_at: string;
}

export type FavoriteType = 'note' | 'tutor';

export interface Favorite {
  id: string;
  user_id: string;
  note_id: string | null;
  tutor_id: string | null;
  created_at: string;
  note?: Note;
  tutor?: Tutor;
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

export const CAMPUS_OPTIONS = [
  'Santiago',
  'Vitacura',
  'Concepción',
  'Valparaíso',
] as const;

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

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  resumen: 'Resumen',
  guia_ejercicios: 'Guía de Ejercicios',
  formulario: 'Formulario',
  mapa_conceptual: 'Mapa Conceptual',
  apuntes_clase: 'Apuntes de Clase',
  preparacion_certamen: 'Preparación de Certamen',
  pauta_autorizada: 'Pauta Autorizada',
};

export const MATERIAL_TYPE_OPTIONS = Object.entries(MATERIAL_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
