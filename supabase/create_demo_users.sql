-- LearnUDD - Create demo users
DO $$
DECLARE
  martina_id UUID := gen_random_uuid();
  benjamin_id UUID := gen_random_uuid();
  sofia_id UUID := gen_random_uuid();
  tomas_id UUID := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'martina@udd.cl') THEN
    RAISE NOTICE 'Users already exist, skipping';
    RETURN;
  END IF;

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  VALUES
    ('00000000-0000-0000-0000-000000000000', martina_id, 'authenticated', 'authenticated', 'martina@udd.cl', crypt('test123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Martina Silva"}'::jsonb),
    ('00000000-0000-0000-0000-000000000000', benjamin_id, 'authenticated', 'authenticated', 'benjamin@udd.cl', crypt('test123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Benjamín Rojas"}'::jsonb),
    ('00000000-0000-0000-0000-000000000000', sofia_id, 'authenticated', 'authenticated', 'sofia@udd.cl', crypt('test123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Sofía Contreras"}'::jsonb),
    ('00000000-0000-0000-0000-000000000000', tomas_id, 'authenticated', 'authenticated', 'tomas@udd.cl', crypt('test123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Tomás Muñoz"}'::jsonb);

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), martina_id, 'martina@udd.cl', format('{"sub": "%s", "email": "martina@udd.cl"}', martina_id)::jsonb, 'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), benjamin_id, 'benjamin@udd.cl', format('{"sub": "%s", "email": "benjamin@udd.cl"}', benjamin_id)::jsonb, 'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), sofia_id, 'sofia@udd.cl', format('{"sub": "%s", "email": "sofia@udd.cl"}', sofia_id)::jsonb, 'email', NOW(), NOW(), NOW()),
    (gen_random_uuid(), tomas_id, 'tomas@udd.cl', format('{"sub": "%s", "email": "tomas@udd.cl"}', tomas_id)::jsonb, 'email', NOW(), NOW(), NOW());

  RAISE NOTICE 'Done!';
END $$;

SELECT id, email, raw_user_meta_data->>'full_name' as name FROM auth.users WHERE email LIKE '%@udd.cl';
