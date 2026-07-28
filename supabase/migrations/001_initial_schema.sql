-- LearnUDD Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  campus TEXT,
  major TEXT,
  semester INTEGER,
  interests TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  major TEXT NOT NULL,
  course TEXT NOT NULL,
  semester TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN (
    'resumen', 'guia_ejercicios', 'formulario', 'mapa_conceptual',
    'apuntes_clase', 'preparacion_certamen', 'pauta_autorizada'
  )),
  price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
  currency TEXT DEFAULT 'CLP',
  pages INTEGER CHECK (pages > 0),
  file_url TEXT,
  cover_url TEXT,
  ai_declaration TEXT DEFAULT 'none' CHECK (ai_declaration IN ('none', 'assisted', 'generated')),
  ai_details TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'paused', 'rejected')),
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note samples (2-3 pages for preview)
CREATE TABLE note_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, page_number)
);

-- Note ratings
CREATE TABLE note_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, note_id)
);

-- Tutors table
CREATE TABLE tutors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  experience TEXT,
  hourly_price DECIMAL(10,2) NOT NULL CHECK (hourly_price >= 0),
  campus TEXT NOT NULL,
  modalities TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  total_classes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutor courses
CREATE TABLE tutor_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  course_name TEXT NOT NULL,
  major TEXT NOT NULL
);

-- Tutor schedules
CREATE TABLE tutor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (start_time < end_time)
);

-- Tutor ratings
CREATE TABLE tutor_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_class BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tutor_id)
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES tutor_schedules(id) ON DELETE SET NULL,
  course TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'online')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount DECIMAL(10,2),
  notes TEXT,
  meeting_link TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, note_id),
  UNIQUE(user_id, tutor_id),
  CHECK (note_id IS NOT NULL OR tutor_id IS NOT NULL)
);

-- Library table (purchased notes)
CREATE TABLE library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, note_id)
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'CLP',
  method TEXT NOT NULL CHECK (method IN ('webpay', 'mercadopago', 'free')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notes_course ON notes(course);
CREATE INDEX idx_notes_major ON notes(major);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_author ON notes(author_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);
CREATE INDEX idx_tutors_campus ON tutors(campus);
CREATE INDEX idx_tutor_schedules_date ON tutor_schedules(date);
CREATE INDEX idx_tutor_schedules_tutor ON tutor_schedules(tutor_id);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_library_user ON library(user_id);
CREATE INDEX idx_payments_user ON payments(user_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Notes: active notes are public, authors can manage their own
CREATE POLICY "Active notes are viewable by everyone"
  ON notes FOR SELECT
  USING (status = 'active' OR author_id = auth.uid());

CREATE POLICY "Authors can insert notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = author_id);

-- Note samples: viewable with note access
CREATE POLICY "Note samples follow note access"
  ON note_samples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_samples.note_id
      AND (notes.status = 'active' OR notes.author_id = auth.uid())
    )
  );

CREATE POLICY "Authors can manage own note samples"
  ON note_samples FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_samples.note_id
      AND notes.author_id = auth.uid()
    )
  );

-- Note ratings: viewable by everyone, insert by authenticated users
CREATE POLICY "Ratings are viewable by everyone"
  ON note_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ratings"
  ON note_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON note_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Tutors: public profiles, tutors manage their own
CREATE POLICY "Tutors are viewable by everyone"
  ON tutors FOR SELECT
  USING (true);

CREATE POLICY "Users can become tutors"
  ON tutors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tutors can update own profile"
  ON tutors FOR UPDATE
  USING (auth.uid() = user_id);

-- Tutor courses: follow tutor access
CREATE POLICY "Tutor courses are viewable by everyone"
  ON tutor_courses FOR SELECT
  USING (true);

CREATE POLICY "Tutors can manage own courses"
  ON tutor_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = tutor_courses.tutor_id
      AND tutors.user_id = auth.uid()
    )
  );

-- Tutor schedules: public, tutors manage their own
CREATE POLICY "Schedules are viewable by everyone"
  ON tutor_schedules FOR SELECT
  USING (true);

CREATE POLICY "Tutors can manage own schedules"
  ON tutor_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = tutor_schedules.tutor_id
      AND tutors.user_id = auth.uid()
    )
  );

-- Tutor ratings: viewable by everyone
CREATE POLICY "Tutor ratings are viewable by everyone"
  ON tutor_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tutor ratings"
  ON tutor_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Bookings: participants can view
CREATE POLICY "Booking participants can view"
  ON bookings FOR SELECT
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = bookings.tutor_id
      AND tutors.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM tutors
      WHERE tutors.id = bookings.tutor_id
      AND tutors.user_id = auth.uid()
    )
  );

-- Messages: sender and receiver can view
CREATE POLICY "Message participants can view"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update read status"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Favorites: users manage their own
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- Library: users view their own
CREATE POLICY "Users can view own library"
  ON library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own library"
  ON library FOR ALL
  USING (auth.uid() = user_id);

-- Payments: users view their own
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notes updated_at
CREATE OR REPLACE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
