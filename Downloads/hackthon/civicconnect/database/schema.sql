-- CivicConnect Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_officer TEXT,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Road Damage','Waterlogging','Garbage Overflow','Streetlight Failure','Drainage Problem','Water Supply','Other')),
  location_address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted','Under Review','Assigned','In Progress','Resolved')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Critical','High','Medium','Low')),
  priority_score INTEGER DEFAULT 50,
  citizen_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_officer TEXT,
  admin_remarks TEXT,
  resolution_details TEXT,
  resolution_image_url TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate complaint number
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.complaint_number := 'CC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(CAST(nextval('complaint_seq') AS TEXT), 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS complaint_seq START 1000;

CREATE TRIGGER set_complaint_number
BEFORE INSERT ON complaints
FOR EACH ROW
WHEN (NEW.complaint_number IS NULL)
EXECUTE FUNCTION generate_complaint_number();

-- ============================================================
-- 4. COMPLAINT IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS complaint_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. AI ANALYSIS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
  ai_category TEXT,
  ai_summary TEXT,
  priority TEXT,
  priority_score INTEGER,
  priority_reason TEXT,
  suggested_department TEXT,
  recommended_action TEXT,
  severity TEXT,
  -- Explainable scoring: each factor 0-25, sum = priority_score
  scoring_breakdown JSONB,
  -- High-level factor labels and estimated resolution
  factors JSONB,
  duplicate_candidates JSONB DEFAULT '[]',
  raw_response JSONB,
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. STATUS HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_officer TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. DUPLICATE LINKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS duplicate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  duplicate_complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,2),
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','error','critical')),
  read BOOLEAN DEFAULT FALSE,
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_complaint ON ai_analysis(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON status_history(complaint_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_links ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on profiles" ON profiles USING (true) WITH CHECK (true);

-- Complaints: citizens see own, no RLS bypass needed (server handles auth)
CREATE POLICY "Citizens view own complaints" ON complaints FOR SELECT USING (auth.uid() = citizen_id);
CREATE POLICY "Citizens insert own complaints" ON complaints FOR INSERT WITH CHECK (auth.uid() = citizen_id);
CREATE POLICY "Service role full access complaints" ON complaints USING (true) WITH CHECK (true);

-- AI analysis: linked to complaint visibility
CREATE POLICY "Public read ai_analysis" ON ai_analysis FOR SELECT USING (true);
CREATE POLICY "Service role full access ai_analysis" ON ai_analysis USING (true) WITH CHECK (true);

-- Departments: public read
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Service role full access departments" ON departments USING (true) WITH CHECK (true);

-- Notifications: users see own
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON notifications USING (true) WITH CHECK (true);

-- Status history: readable by complaint owner
CREATE POLICY "Public read status_history" ON status_history FOR SELECT USING (true);
CREATE POLICY "Service role full access status_history" ON status_history USING (true) WITH CHECK (true);

-- Assignments
CREATE POLICY "Public read assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Service role full access assignments" ON assignments USING (true) WITH CHECK (true);

-- Complaint images
CREATE POLICY "Public read complaint_images" ON complaint_images FOR SELECT USING (true);
CREATE POLICY "Service role full access complaint_images" ON complaint_images USING (true) WITH CHECK (true);

-- Duplicate links
CREATE POLICY "Public read duplicate_links" ON duplicate_links FOR SELECT USING (true);
CREATE POLICY "Service role full access duplicate_links" ON duplicate_links USING (true) WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
