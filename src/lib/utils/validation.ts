import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Formato de correo inválido')
    .refine((email) => email.endsWith('@udd.cl'), {
      message: 'Solo se aceptan correos institucionales @udd.cl',
    }),
});

export const onboardingSchema = z.object({
  campus: z.string().min(1, 'Selecciona un campus'),
  major: z.string().min(1, 'Selecciona una carrera'),
  semester: z.string().min(1, 'Selecciona tu semestre'),
  interests: z.array(z.string()).min(1, 'Selecciona al menos un ramo'),
});

export const noteSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  major: z.string().min(1, 'Selecciona una carrera'),
  course: z.string().min(1, 'Ingresa el nombre del ramo'),
  semester: z.string().optional(),
  material_type: z.string().min(1, 'Selecciona el tipo de material'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  pages: z.number().min(1).optional(),
  ai_declaration: z.enum(['none', 'assisted', 'generated']),
  ai_details: z.string().optional(),
});

export const tutorSchema = z.object({
  bio: z.string().min(10, 'La biografía debe tener al menos 10 caracteres'),
  experience: z.string().optional(),
  hourly_price: z.number().min(1000, 'El precio mínimo es $1.000'),
  campus: z.string().min(1, 'Selecciona un campus'),
  modalities: z
    .array(z.string())
    .min(1, 'Selecciona al menos una modalidad'),
  courses: z
    .array(
      z.object({
        course_name: z.string().min(1, 'Ingresa el nombre del ramo'),
        major: z.string().min(1, 'Selecciona la carrera'),
      })
    )
    .min(1, 'Agrega al menos un ramo'),
});

export const bookingSchema = z.object({
  modality: z.enum(['presencial', 'online']),
  date: z.string().min(1, 'Selecciona una fecha'),
  start_time: z.string().min(1, 'Selecciona una hora'),
  course: z.string().min(1, 'Ingresa el ramo'),
  notes: z.string().optional(),
});

export const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
export type NoteFormData = z.infer<typeof noteSchema>;
export type TutorFormData = z.infer<typeof tutorSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type RatingFormData = z.infer<typeof ratingSchema>;
