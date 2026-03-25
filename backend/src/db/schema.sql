-- School Management System Schema
-- PostgreSQL

-- Create and activate the project schema
CREATE SCHEMA IF NOT EXISTS school_ms;
SET search_path TO school_ms;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  date_of_birth DATE,
  grade_class VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student-Teacher relationships
CREATE TABLE IF NOT EXISTS student_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, teacher_user_id)
);

-- Student-Parent relationships
CREATE TABLE IF NOT EXISTS student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, parent_user_id)
);

-- Evaluation templates
CREATE TABLE IF NOT EXISTS evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluation questions
CREATE TABLE IF NOT EXISTS evaluation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES evaluation_templates(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  answer_type VARCHAR(20) NOT NULL CHECK (answer_type IN ('rating', 'yes_no', 'short_text', 'single_select')),
  required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  options_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  teacher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  evaluation_date DATE NOT NULL,
  general_notes TEXT,
  strengths_text TEXT,
  struggles_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, teacher_user_id, subject_id, evaluation_date)
);

-- Evaluation answers
CREATE TABLE IF NOT EXISTS evaluation_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES evaluation_questions(id) ON DELETE RESTRICT,
  answer_rating INTEGER CHECK (answer_rating >= 1 AND answer_rating <= 5),
  answer_yes_no BOOLEAN,
  answer_text TEXT,
  answer_select VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluation media attachments
CREATE TABLE IF NOT EXISTS evaluation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teacher hours
CREATE TABLE IF NOT EXISTS teacher_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work_date DATE NOT NULL,
  hours_worked NUMERIC(5,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 24),
  notes TEXT,
  created_by_admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_user_id, work_date)
);

-- Export logs
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(100) NOT NULL,
  date_from DATE,
  date_to DATE,
  row_count INTEGER NOT NULL DEFAULT 0,
  exported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs (optional but good)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  action VARCHAR(50) NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_teachers_student ON student_teachers(student_id);
CREATE INDEX IF NOT EXISTS idx_student_teachers_teacher ON student_teachers(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_student ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent ON student_parents(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher ON evaluations(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_answers_eval ON evaluation_answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_teacher_hours_teacher ON teacher_hours(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_hours_date ON teacher_hours(work_date);
CREATE INDEX IF NOT EXISTS idx_evaluation_attachments_eval ON evaluation_attachments(evaluation_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluation_templates_updated_at ON evaluation_templates;
CREATE TRIGGER update_evaluation_templates_updated_at BEFORE UPDATE ON evaluation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluation_questions_updated_at ON evaluation_questions;
CREATE TRIGGER update_evaluation_questions_updated_at BEFORE UPDATE ON evaluation_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluation_answers_updated_at ON evaluation_answers;
CREATE TRIGGER update_evaluation_answers_updated_at BEFORE UPDATE ON evaluation_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_hours_updated_at ON teacher_hours;
CREATE TRIGGER update_teacher_hours_updated_at BEFORE UPDATE ON teacher_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
