-- LearnUDD Seed Data
-- Run this AFTER the schema migration
-- NOTE: Users must be created first via Auth, then run this seed

-- =====================================================
-- STEP 1: Create test users in Supabase Auth first
-- Go to: Authentication > Users > Add user
-- Create these 4 users with "Auto Confirm" enabled:
--   1. martina@udd.cl  (password: test123456)
--   2. benjamin@udd.cl (password: test123456)
--   3. sofia@udd.cl    (password: test123456)
--   4. tomas@udd.cl    (password: test123456)
-- =====================================================

-- =====================================================
-- STEP 2: Run this AFTER creating the 4 users above
-- This will update their profiles with UDD data
-- =====================================================

-- Update profiles with UDD data (assumes trigger already created basic profiles)
UPDATE profiles SET
  full_name = 'Martina Silva',
  campus = 'Santiago',
  major = 'Ingeniería Civil Informática',
  semester = 6,
  interests = ARRAY['Cálculo II', 'Álgebra Lineal', 'Programación Avanzada'],
  verified = TRUE,
  onboarding_completed = TRUE
WHERE email = 'martina@udd.cl';

UPDATE profiles SET
  full_name = 'Benjamín Rojas',
  campus = 'Santiago',
  major = 'Ingeniería Civil Informática',
  semester = 10,
  interests = ARRAY['Programación Avanzada', 'Cálculo II', 'Estadística'],
  verified = TRUE,
  onboarding_completed = TRUE
WHERE email = 'benjamin@udd.cl';

UPDATE profiles SET
  full_name = 'Sofía Contreras',
  campus = 'Santiago',
  major = 'Derecho',
  semester = 8,
  interests = ARRAY['Derecho Civil', 'Derecho Público'],
  verified = TRUE,
  onboarding_completed = TRUE
WHERE email = 'sofia@udd.cl';

UPDATE profiles SET
  full_name = 'Tomás Muñoz',
  campus = 'Vitacura',
  major = 'Medicina',
  semester = 4,
  interests = ARRAY['Anatomía I', 'Estadística'],
  verified = TRUE,
  onboarding_completed = TRUE
WHERE email = 'tomas@udd.cl';

-- =====================================================
-- STEP 3: Now insert notes, tutors, etc.
-- Run this AFTER the profile updates above
-- =====================================================

-- Get user IDs into variables
DO $$
DECLARE
  martina_id UUID;
  benjamin_id UUID;
  sofia_id UUID;
  tomas_id UUID;
  benjamin_tutor_id UUID;
  sofia_tutor_id UUID;
  martina_tutor_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO martina_id FROM profiles WHERE email = 'martina@udd.cl';
  SELECT id INTO benjamin_id FROM profiles WHERE email = 'benjamin@udd.cl';
  SELECT id INTO sofia_id FROM profiles WHERE email = 'sofia@udd.cl';
  SELECT id INTO tomas_id FROM profiles WHERE email = 'tomas@udd.cl';

  -- =====================================================
  -- SAMPLE NOTES
  -- =====================================================

  INSERT INTO notes (author_id, title, description, major, course, semester, material_type, price, pages, ai_declaration, status, downloads) VALUES
    (martina_id, 'Resumen completo Certamen 1 - Cálculo II', 'Resumen exhaustivo de todos los temas del primer certamen de Cálculo II. Incluye teoría, ejemplos resueltos y ejercicios similares a los de la prueba.', 'Ingeniería Civil Informática', 'Cálculo II', '3° Semestre', 'resumen', 3990, 45, 'none', 'active', 126),
    (benjamin_id, 'Guía de ejercicios resueltos - Álgebra Lineal', 'Compilación de ejercicios resueltos cubriendo vectores, matrices, transformaciones lineales y valores propios.', 'Ingeniería Civil Informática', 'Álgebra Lineal', '2° Semestre', 'guia_ejercicios', 2490, 32, 'none', 'active', 89),
    (sofia_id, 'Mapa conceptual - Temas 1 a 3 Microeconomía', 'Mapa visual que conecta los conceptos fundamentales de Oferta y Demanda, Elasticidad, y Costos. Ideal para repaso rápido.', 'Ingeniería Comercial', 'Microeconomía', '2° Semestre', 'mapa_conceptual', 0, 8, 'none', 'active', 203),
    (martina_id, 'Formulario completo - Estadística', 'Todas las fórmulas y tablas estadísticas organizadas por tema. Incluye distribuciones de probabilidad, intervalos de confianza y pruebas de hipótesis.', 'Ingeniería Comercial', 'Estadística', '4° Semestre', 'formulario', 5490, 12, 'assisted', 'active', 156),
    (benjamin_id, 'Preparación certamen final - Programación Avanzada', 'Guía completa para el certamen final. Incluye teoría de objetos, patrones de diseño, estructuras de datos y ejercicios de código resueltos.', 'Ingeniería Civil Informática', 'Programación Avanzada', '5° Semestre', 'preparacion_certamen', 4990, 68, 'none', 'active', 78),
    (sofia_id, 'Apuntes de clase - Derecho Civil I', 'Apuntes completos de las primeras 8 clases del semestre. Incluye capacidad jurídica, representación y actos jurídicos.', 'Derecho', 'Derecho Civil', '1° Semestre', 'apuntes_clase', 1990, 56, 'none', 'active', 45);

  -- =====================================================
  -- SAMPLE TUTORS
  -- =====================================================

  INSERT INTO tutors (user_id, bio, experience, hourly_price, campus, modalities, verified, total_classes) VALUES
    (benjamin_id, 'Estudiante de 5° año de Ingeniería Civil Informática. Me especializo en programación, algoritmos y matemáticas. He ayudado a más de 40 compañeros a aprobar ramos difíciles.', '3 años dando clases particulares a compañeros de la UDD', 12000, 'Santiago', ARRAY['presencial', 'online'], true, 48),
    (sofia_id, 'Estudiante de 4° año de Derecho. Asistente de cátedra en Derecho Civil I y II. Metodología práctica y enfocada en resolver pruebas.', '2 años como asistente de cátedra + tutoría individual', 10000, 'Santiago', ARRAY['presencial', 'online'], true, 32),
    (martina_id, 'Egresada de Ingeniería Civil Informática. Trabajo como desarrolladora full-stack. Me apasiona enseñar matemáticas y programación de forma clara y práctica.', '4 años de experiencia en tutoría + 2 años trabajando como dev', 15000, 'Vitacura', ARRAY['online'], true, 65);

  -- Get tutor IDs
  SELECT id INTO benjamin_tutor_id FROM tutors WHERE user_id = benjamin_id;
  SELECT id INTO sofia_tutor_id FROM tutors WHERE user_id = sofia_id;
  SELECT id INTO martina_tutor_id FROM tutors WHERE user_id = martina_id;

  -- =====================================================
  -- SAMPLE TUTOR COURSES
  -- =====================================================

  INSERT INTO tutor_courses (tutor_id, course_name, major) VALUES
    (benjamin_tutor_id, 'Programación Avanzada', 'Ingeniería Civil Informática'),
    (benjamin_tutor_id, 'Cálculo II', 'Ingeniería Civil Informática'),
    (benjamin_tutor_id, 'Álgebra Lineal', 'Ingeniería Civil Informática'),
    (sofia_tutor_id, 'Derecho Civil', 'Derecho'),
    (sofia_tutor_id, 'Derecho Público', 'Derecho'),
    (martina_tutor_id, 'Cálculo II', 'Ingeniería Civil Informática'),
    (martina_tutor_id, 'Estadística', 'Ingeniería Comercial'),
    (martina_tutor_id, 'Programación Avanzada', 'Ingeniería Civil Informática');

  -- =====================================================
  -- SAMPLE TUTOR SCHEDULES (next 2 weeks)
  -- =====================================================

  INSERT INTO tutor_schedules (tutor_id, date, start_time, end_time, available) VALUES
    -- Benjamín's schedules
    (benjamin_tutor_id, CURRENT_DATE + 1, '10:00', '12:00', true),
    (benjamin_tutor_id, CURRENT_DATE + 1, '14:00', '16:00', true),
    (benjamin_tutor_id, CURRENT_DATE + 2, '10:00', '12:00', true),
    (benjamin_tutor_id, CURRENT_DATE + 3, '16:00', '18:00', true),
    (benjamin_tutor_id, CURRENT_DATE + 4, '10:00', '12:00', true),
    (benjamin_tutor_id, CURRENT_DATE + 7, '14:00', '16:00', true),
    -- Sofía's schedules
    (sofia_tutor_id, CURRENT_DATE + 1, '11:00', '13:00', true),
    (sofia_tutor_id, CURRENT_DATE + 2, '15:00', '17:00', true),
    (sofia_tutor_id, CURRENT_DATE + 3, '11:00', '13:00', true),
    (sofia_tutor_id, CURRENT_DATE + 5, '10:00', '12:00', true),
    (sofia_tutor_id, CURRENT_DATE + 8, '11:00', '13:00', true),
    -- Martina's schedules (online only)
    (martina_tutor_id, CURRENT_DATE + 1, '18:00', '20:00', true),
    (martina_tutor_id, CURRENT_DATE + 3, '18:00', '20:00', true),
    (martina_tutor_id, CURRENT_DATE + 5, '18:00', '20:00', true),
    (martina_tutor_id, CURRENT_DATE + 7, '18:00', '20:00', true);

  -- =====================================================
  -- SAMPLE RATINGS (notes) - Use Tomás as the reviewer
  -- =====================================================

  INSERT INTO note_ratings (user_id, note_id, rating, comment, verified_purchase) VALUES
    (tomas_id, (SELECT id FROM notes WHERE title LIKE '%Cálculo II%' LIMIT 1), 5, 'Excelente resumen, cubre todos los temas del certamen. Muy bien organizado.', true),
    (sofia_id, (SELECT id FROM notes WHERE title LIKE '%Cálculo II%' LIMIT 1), 5, 'Me ayudó a aprobar el certamen. Super completo.', true),
    (benjamin_id, (SELECT id FROM notes WHERE title LIKE '%Cálculo II%' LIMIT 1), 4, 'Muy bueno, solo le faltaban algunos ejercicios del tema 3.', true),
    (tomas_id, (SELECT id FROM notes WHERE title LIKE '%Álgebra Lineal%' LIMIT 1), 5, 'Los ejercicios resueltos son idénticos a los de la prueba. Súper útil.', true),
    (martina_id, (SELECT id FROM notes WHERE title LIKE '%Álgebra Lineal%' LIMIT 1), 4, 'Buena guía, pero algunos ejercicios podrían tener más detalle.', true),
    (tomas_id, (SELECT id FROM notes WHERE title LIKE '%Microeconomía%' LIMIT 1), 5, 'El mapa conceptual es perfecto para repasar antes de la prueba.', true),
    (benjamin_id, (SELECT id FROM notes WHERE title LIKE '%Microeconomía%' LIMIT 1), 5, 'Muy visual y fácil de entender. Lo recomiendo.', true),
    (tomas_id, (SELECT id FROM notes WHERE title LIKE '%Estadística%' LIMIT 1), 4, 'Todas las fórmulas organizadas. Le faltaba la tabla t-Student.', true),
    (benjamin_id, (SELECT id FROM notes WHERE title LIKE '%Estadística%' LIMIT 1), 5, 'Imprescindible para el ramo. Todo lo que necesitas en un solo PDF.', true);

  -- =====================================================
  -- SAMPLE RATINGS (tutors)
  -- =====================================================

  INSERT INTO tutor_ratings (user_id, tutor_id, rating, comment, verified_class) VALUES
    (tomas_id, benjamin_tutor_id, 5, 'Benjamín es excelente explicando. Aprobé Programación Avanzada gracias a él.', true),
    (martina_id, benjamin_tutor_id, 5, 'Muy paciente y claro. Explica con ejemplos prácticos.', true),
    (tomas_id, sofia_tutor_id, 5, 'Sofía domina el tema y te prepara exactamente para cómo son las pruebas.', true),
    (benjamin_id, sofia_tutor_id, 4, 'Muy buena tutora, solo que a veces va un poco rápido.', true),
    (benjamin_id, martina_tutor_id, 5, 'Martina es la mejor tutora que he tenido. Sus explicaciones son claras y va al grano.', true),
    (tomas_id, martina_tutor_id, 5, 'Increíble tutora. Me ayudó a entender Cálculo II como nunca.', true);

END $$;
