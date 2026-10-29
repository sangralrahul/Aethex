-- Aethex Doctors (doctors.aethex.in): doctors who list their own practice, appointments, reviews, prescriptions,
-- Ask a doctor and health articles (worker/find.ts). The Worker also creates these tables on first use.
--   npx wrangler d1 migrations apply aethex --remote
CREATE TABLE IF NOT EXISTS find_doctors (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending',
  name TEXT NOT NULL, gender TEXT, specialty TEXT NOT NULL, qualifications TEXT NOT NULL,
  reg_no TEXT NOT NULL, reg_council TEXT NOT NULL, experience INTEGER NOT NULL DEFAULT 0,
  clinic TEXT NOT NULL, address TEXT NOT NULL, locality TEXT, city TEXT NOT NULL, pincode TEXT NOT NULL,
  fee INTEGER NOT NULL, video INTEGER NOT NULL DEFAULT 0, video_fee INTEGER, languages TEXT, about TEXT, services TEXT,
  hours TEXT NOT NULL, admin_note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS find_appointments (
  id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, user_id TEXT NOT NULL, patient_name TEXT NOT NULL, patient_phone TEXT NOT NULL,
  patient_email TEXT, patient_age INTEGER, date TEXT NOT NULL, time TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'clinic',
  reason TEXT, status TEXT NOT NULL DEFAULT 'booked', link TEXT, note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS find_reviews (
  id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, appointment_id TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL,
  rating INTEGER NOT NULL, text TEXT, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS find_prescriptions (
  id TEXT PRIMARY KEY, appointment_id TEXT NOT NULL UNIQUE, doctor_id TEXT NOT NULL, user_id TEXT NOT NULL,
  diagnosis TEXT, items TEXT NOT NULL, advice TEXT, tests TEXT, follow_up TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS find_questions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, specialty TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  age INTEGER, gender TEXT, status TEXT NOT NULL DEFAULT 'open', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS find_answers (
  id TEXT PRIMARY KEY, question_id TEXT NOT NULL, doctor_id TEXT NOT NULL, body TEXT NOT NULL, helpful INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS find_votes (answer_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (answer_id, user_id));
CREATE TABLE IF NOT EXISTS find_articles (
  id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT, body TEXT NOT NULL,
  specialty TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS find_doctors_search ON find_doctors(status, city, specialty);
CREATE INDEX IF NOT EXISTS find_questions_list ON find_questions(specialty, created_at);
CREATE INDEX IF NOT EXISTS find_answers_q ON find_answers(question_id, created_at);
CREATE INDEX IF NOT EXISTS find_answers_doc ON find_answers(doctor_id);
CREATE INDEX IF NOT EXISTS find_articles_list ON find_articles(specialty, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS find_appt_slot ON find_appointments(doctor_id, date, time) WHERE status != 'cancelled';
CREATE INDEX IF NOT EXISTS find_appt_user ON find_appointments(user_id, date);
CREATE INDEX IF NOT EXISTS find_reviews_doctor ON find_reviews(doctor_id, created_at);
