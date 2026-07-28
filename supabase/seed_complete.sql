-- Complete seed data for LearnUDD
-- Run this in Supabase SQL Editor

-- User IDs
DO $$
DECLARE
  martina_id UUID := '9cb7f825-83a8-4747-8187-5dfd4c2caaf8';
  benjamin_id UUID := 'db2da380-6a87-4855-a7fa-ce70e1590cf3';
  sofia_id UUID := 'd9109777-4369-4b0a-b7ad-7a20490732dc';
  tomas_id UUID := '07d9c541-a906-479e-afcd-736d53862999';
  
  note1_id UUID := gen_random_uuid();
  note2_id UUID := gen_random_uuid();
  note3_id UUID := gen_random_uuid();
  note4_id UUID := gen_random_uuid();
  note5_id UUID := gen_random_uuid();
  note6_id UUID := gen_random_uuid();
  note7_id UUID := gen_random_uuid();
  note8_id UUID := gen_random_uuid();
  
  benjamin_tutor_id UUID := gen_random_uuid();
  sofia_tutor_id UUID := gen_random_uuid();
  tomas_tutor_id UUID := gen_random_uuid();
BEGIN

-- ============ NOTES ============
INSERT INTO notes (id, author_id, title, description, major, course, semester, material_type, price, pages, ai_declaration, ai_details, status, downloads)
VALUES
  (note1_id, martina_id, 'Resumen Cálculo II - Derivadas e Integrales', 'Resumen completo del ramo Cálculo II cubriendo derivadas parciales, integrales múltiples y series de Fourier. Incluye ejemplos resueltos y fórmulas clave.', 'Ingeniería Civil Informática', 'Cálculo II', '2do Semestre', 'resumen', 3500, 28, 'assisted', 'Se utilizó IA para organizar y resumir apuntes de clase. Todo el contenido fue revisado y verificado por el estudiante.', 'active', 47),
  
  (note2_id, benjamin_id, 'Guía de Ejercicios Programación Avanzada', '45 ejercicios resueltos de programación avanzada: patrones de diseño, concurrencia, y estructuras de datos avanzadas con ejemplos en Python.', 'Ingeniería Civil Informática', 'Programación Avanzada', '5to Semestre', 'guia_ejercicios', 5000, 35, 'none', NULL, 'active', 32),
  
  (note3_id, sofia_id, 'Formulario Derecho Civil - Obligaciones', 'Formulario completo de Derecho Civil con todos los artículos relevantes del Código Civil chileno sobre obligaciones, contratos y responsabilidad civil.', 'Derecho', 'Derecho Civil', '3er Semestre', 'formulario', 4000, 18, 'none', NULL, 'active', 28),
  
  (note4_id, martina_id, 'Apuntes Álgebra Lineal - Espacios Vectoriales', 'Apuntes detallados de la segunda mitad del ramo: espacios vectoriales, transformaciones lineales, valores propios y diagonalización.', 'Ingeniería Civil Informática', 'Álgebra Lineal', '2do Semestre', 'apuntes_clase', 0, 42, 'none', NULL, 'active', 63),
  
  (note5_id, benjamin_id, 'Preparación Certamen Estadística', 'Guía de preparación para el certamen de Estadística con 30 ejercicios tipo certamen, resueltos paso a paso, cubriendo distribuciones de probabilidad e inferencia.', 'Ingeniería Civil Informática', 'Estadística', '4to Semestre', 'preparacion_certamen', 6000, 22, 'generated', 'Generado con IA a partir de exámenes anteriores y material del profesor. Revisado y corregido por el autor.', 'active', 19),
  
  (note6_id, sofia_id, 'Mapa Conceptual Derecho Público', 'Mapa conceptual completo de Derecho Público: fuentes del derecho, organización del Estado, derecho administrativo y derechos fundamentales.', 'Derecho', 'Derecho Público', '2do Semestre', 'mapa_conceptual', 2500, 8, 'assisted', 'Se usó IA para generar el layout visual del mapa conceptual. El contenido fue creado y verificado manualmente.', 'active', 41),
  
  (note7_id, tomas_id, 'Resumen Anatomía I - Sistema Muscular', 'Resumen del sistema muscular con descripciones anatómicas, inserciones, inervaciones y funciones de los principales músculos del cuerpo humano.', 'Medicina', 'Anatomía I', '1er Semestre', 'resumen', 4500, 30, 'none', NULL, 'active', 22),
  
  (note8_id, tomas_id, 'Pauta Autorizada Estadística Médica', 'Resumen del curso de Estadística aplicada a Medicina con enfoque en biostatistics, pruebas diagnósticas y epidemiología básica.', 'Medicina', 'Estadística', '2do Semestre', 'pauta_autorizada', 3000, 15, 'none', NULL, 'active', 11);

-- ============ TUTORS ============
INSERT INTO tutors (id, user_id, bio, experience, hourly_price, campus, modalities, verified, total_classes)
VALUES
  (benjamin_tutor_id, benjamin_id, 'Tutor certificado en programación y matemáticas. Me especializo en hacer temas complejos fáciles de entender. Más de 50 horas de tutoría.', '3 años de experiencia dando clases particulares y workshops en la UDD', 15000, 'Santiago', ARRAY['online', 'presencial'], true, 52),
  (sofia_tutor_id, sofia_id, 'Estudiante de Derecho UDD con promedio 6.5. Tutora en ramos jurídicos con material propio y estrategias de estudio probadas.', '2 años tutorando compañeros de carrera y estudiantes de otros programas', 12000, 'Santiago', ARRAY['online'], true, 38),
  (tomas_tutor_id, tomas_id, 'Estudiante de Medicina UDD. Tutor en ciencias básicas y estadística. Uso método clínico para enseñar anatomía y fisiología.', '1 año de experiencia en tutorías de ciencias', 13000, 'Vitacura', ARRAY['presencial', 'online'], false, 15);

-- ============ TUTOR COURSES ============
INSERT INTO tutor_courses (tutor_id, course_name, major)
VALUES
  (benjamin_tutor_id, 'Programación Avanzada', 'Ingeniería Civil Informática'),
  (benjamin_tutor_id, 'Cálculo II', 'Ingeniería Civil Informática'),
  (benjamin_tutor_id, 'Estadística', 'Ingeniería Civil Informática'),
  (benjamin_tutor_id, 'Álgebra Lineal', 'Ingeniería Civil Informática'),
  (sofia_tutor_id, 'Derecho Civil', 'Derecho'),
  (sofia_tutor_id, 'Derecho Público', 'Derecho'),
  (tomas_tutor_id, 'Anatomía I', 'Medicina'),
  (tomas_tutor_id, 'Estadística', 'Medicina');

-- ============ TUTOR SCHEDULES ============
INSERT INTO tutor_schedules (tutor_id, date, start_time, end_time, available, recurring)
VALUES
  (benjamin_tutor_id, CURRENT_DATE + 1, '10:00', '12:00', true, true),
  (benjamin_tutor_id, CURRENT_DATE + 1, '14:00', '16:00', true, true),
  (benjamin_tutor_id, CURRENT_DATE + 2, '10:00', '12:00', true, true),
  (benjamin_tutor_id, CURRENT_DATE + 3, '15:00', '17:00', true, false),
  (sofia_tutor_id, CURRENT_DATE + 1, '09:00', '11:00', true, true),
  (sofia_tutor_id, CURRENT_DATE + 2, '14:00', '16:00', true, true),
  (sofia_tutor_id, CURRENT_DATE + 3, '09:00', '11:00', true, false),
  (tomas_tutor_id, CURRENT_DATE + 1, '16:00', '18:00', true, true),
  (tomas_tutor_id, CURRENT_DATE + 2, '16:00', '18:00', true, true),
  (tomas_tutor_id, CURRENT_DATE + 4, '10:00', '12:00', true, false);

-- ============ TUTOR RATINGS ============
INSERT INTO tutor_ratings (user_id, tutor_id, rating, comment, verified_class)
VALUES
  (martina_id, benjamin_tutor_id, 5, 'Excelente tutor, explica todo super claro. Las clases online son muy efectivas.', true),
  (sofia_id, benjamin_tutor_id, 5, 'Me ayudó a aprobar Cálculo II. Súper paciente y metódico.', true),
  (tomas_id, benjamin_tutor_id, 4, 'Muy buen profesor de programación. Las clases son dinámicas.', true),
  (martina_id, sofia_tutor_id, 5, 'Las clases de Derecho Civil son extraordinarias. Material muy completo.', true),
  (benjamin_id, sofia_tutor_id, 5, 'Sofía domina el tema y sabe explicar de forma simple.', true),
  (martina_id, tomas_tutor_id, 4, 'Tomás es bueno explicando anatomía con casos clínicos.', true),
  (sofia_id, tomas_tutor_id, 4, 'Buena explicación de estadística aplicada a medicina.', true);

-- ============ NOTE RATINGS ============
INSERT INTO note_ratings (user_id, note_id, rating, comment, verified_purchase)
VALUES
  (benjamin_id, note1_id, 5, 'Muy completo y bien organizado. Aprobé gracias a este resumen.', true),
  (sofia_id, note1_id, 4, 'Buen material, fácil de seguir.', true),
  (martina_id, note2_id, 5, 'La mejor guía de ejercicios que encontré. Súper útil.', true),
  (tomas_id, note2_id, 4, 'Ejemplos claros y bien explicados.', true),
  (martina_id, note3_id, 5, 'Formulario super completo. Lo uso para todos los certámenes.', true),
  (benjamin_id, note4_id, 5, 'Estos apuntes me salvaron el ramo. Muy detallados.', true),
  (martina_id, note5_id, 4, 'Buen material de preparación. Los ejercicios son similares al certamen real.', true),
  (benjamin_id, note6_id, 5, 'El mapa conceptual es perfecto para repasar antes del examen.', true),
  (sofia_id, note7_id, 4, 'Muy útil para estudiar anatomía. Las descripciones son claras.', true);

-- ============ LIBRARY (purchased notes) ============
INSERT INTO library (user_id, note_id, progress)
VALUES
  (benjamin_id, note1_id, 100),
  (sofia_id, note1_id, 75),
  (martina_id, note2_id, 100),
  (tomas_id, note2_id, 60),
  (martina_id, note3_id, 100),
  (benjamin_id, note4_id, 100),
  (martina_id, note5_id, 45),
  (benjamin_id, note6_id, 100),
  (sofia_id, note7_id, 30);

-- ============ FAVORITES ============
INSERT INTO favorites (user_id, note_id)
VALUES
  (martina_id, note2_id),
  (martina_id, note3_id),
  (benjamin_id, note1_id),
  (benjamin_id, note5_id),
  (sofia_id, note2_id),
  (sofia_id, note7_id),
  (tomas_id, note1_id),
  (tomas_id, note4_id);

INSERT INTO favorites (user_id, tutor_id)
VALUES
  (martina_id, benjamin_tutor_id),
  (sofia_id, benjamin_tutor_id),
  (tomas_id, benjamin_tutor_id),
  (benjamin_id, sofia_tutor_id);

-- ============ MESSAGES ============
INSERT INTO messages (sender_id, receiver_id, content, read, created_at)
VALUES
  (martina_id, benjamin_id, 'Hola Benja, ¿cuándo tendrás disponibilidad para una clase de Cálculo II?', true, NOW() - INTERVAL '2 days'),
  (benjamin_id, martina_id, 'Hola Martina! Tengo espacio el jueves a las 15:00. ¿Te sirve?', true, NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
  (martina_id, benjamin_id, 'Perfecto, el jueves 15:00. ¿La hacemos online?', true, NOW() - INTERVAL '2 days' + INTERVAL '3 hours'),
  (benjamin_id, martina_id, 'Sí, te envío el link de Zoom antes de la clase. ¡Nos vemos!', false, NOW() - INTERVAL '2 days' + INTERVAL '4 hours'),
  (sofia_id, benjamin_id, 'Benja, ¿tienes material para preparar el certamen de Estadística?', true, NOW() - INTERVAL '1 day'),
  (benjamin_id, sofia_id, 'Sí! Tengo una guía de preparación que te puede servir. ¿La comparto por aquí?', true, NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
  (tomas_id, sofia_id, 'Sofía, ¿haces clases de Derecho para estudiantes de Medicina?', true, NOW() - INTERVAL '3 hours'),
  (sofia_id, tomas_id, 'Hola Tomás! Sí, puedo ayudarte con los módulos de derecho que lleves. ¿Cuál necesitas?', false, NOW() - INTERVAL '2 hours');

END $$;

-- ============ VERIFY ============
SELECT 'NOTES: ' || COUNT(*) FROM notes
UNION ALL
SELECT 'TUTORS: ' || COUNT(*) FROM tutors
UNION ALL
SELECT 'TUTOR_COURSES: ' || COUNT(*) FROM tutor_courses
UNION ALL
SELECT 'TUTOR_SCHEDULES: ' || COUNT(*) FROM tutor_schedules
UNION ALL
SELECT 'TUTOR_RATINGS: ' || COUNT(*) FROM tutor_ratings
UNION ALL
SELECT 'NOTE_RATINGS: ' || COUNT(*) FROM note_ratings
UNION ALL
SELECT 'LIBRARY: ' || COUNT(*) FROM library
UNION ALL
SELECT 'FAVORITES: ' || COUNT(*) FROM favorites
UNION ALL
SELECT 'MESSAGES: ' || COUNT(*) FROM messages;
