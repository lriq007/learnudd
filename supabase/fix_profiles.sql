-- Fix: Create profiles for existing users
-- Run this in SQL Editor

INSERT INTO profiles (id, email, full_name, campus, major, semester, interests, verified, onboarding_completed)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  CASE 
    WHEN email = 'martina@udd.cl' THEN 'Santiago'
    WHEN email = 'benjamin@udd.cl' THEN 'Santiago'
    WHEN email = 'sofia@udd.cl' THEN 'Santiago'
    WHEN email = 'tomas@udd.cl' THEN 'Vitacura'
  END,
  CASE 
    WHEN email = 'martina@udd.cl' THEN 'Ingeniería Civil Informática'
    WHEN email = 'benjamin@udd.cl' THEN 'Ingeniería Civil Informática'
    WHEN email = 'sofia@udd.cl' THEN 'Derecho'
    WHEN email = 'tomas@udd.cl' THEN 'Medicina'
  END,
  CASE 
    WHEN email = 'martina@udd.cl' THEN 6
    WHEN email = 'benjamin@udd.cl' THEN 10
    WHEN email = 'sofia@udd.cl' THEN 8
    WHEN email = 'tomas@udd.cl' THEN 4
  END,
  CASE 
    WHEN email = 'martina@udd.cl' THEN ARRAY['Cálculo II', 'Álgebra Lineal', 'Programación Avanzada']
    WHEN email = 'benjamin@udd.cl' THEN ARRAY['Programación Avanzada', 'Cálculo II', 'Estadística']
    WHEN email = 'sofia@udd.cl' THEN ARRAY['Derecho Civil', 'Derecho Público']
    WHEN email = 'tomas@udd.cl' THEN ARRAY['Anatomía I', 'Estadística']
  END,
  TRUE,
  TRUE
FROM auth.users
WHERE email IN ('martina@udd.cl', 'benjamin@udd.cl', 'sofia@udd.cl', 'tomas@udd.cl')
AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id);

-- Verify
SELECT id, email, full_name, major FROM profiles WHERE email LIKE '%@udd.cl';
