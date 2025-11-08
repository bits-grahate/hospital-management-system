-- SQL commands to reset Patient and Doctor table IDs to start from 1
-- Run these in H2 Console for respective services

-- ============================================
-- PATIENT SERVICE (Port 8001)
-- JDBC URL: jdbc:h2:mem:patientdb
-- Username: sa
-- Password: (empty)
-- ============================================

-- Method 1: TRUNCATE TABLE (Recommended - Also resets sequence automatically)
TRUNCATE TABLE patients;
ALTER TABLE patients ALTER COLUMN patient_id RESTART WITH 1;

-- ============================================
-- DOCTOR SERVICE (Port 8002)
-- JDBC URL: jdbc:h2:mem:doctordb
-- Username: sa
-- Password: (empty)
-- ============================================

-- Method 1: TRUNCATE TABLE (Recommended - Also resets sequence automatically)
TRUNCATE TABLE doctors;
ALTER TABLE doctors ALTER COLUMN doctor_id RESTART WITH 1;

-- ============================================
-- APPOINTMENT SERVICE (Port 8003)
-- JDBC URL: jdbc:h2:mem:appointmentdb
-- Username: sa
-- Password: (empty)
-- ============================================

-- Method 1: TRUNCATE TABLE (Recommended - Also resets sequence automatically)
TRUNCATE TABLE appointments;
ALTER TABLE appointments ALTER COLUMN appointment_id RESTART WITH 1;

-- ============================================
-- BILLING SERVICE (Port 8004)
-- JDBC URL: jdbc:h2:mem:billingdb
-- Username: sa
-- Password: (empty)
-- ============================================

-- Method 1: TRUNCATE TABLE (Recommended - Also resets sequence automatically)
TRUNCATE TABLE bills;
ALTER TABLE bills ALTER COLUMN bill_id RESTART WITH 1;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running the above, verify by:
-- 1. Run: SELECT MAX(patient_id) FROM patients; -- Should return NULL or 0
-- 2. Run: SELECT MAX(doctor_id) FROM doctors; -- Should return NULL or 0
-- 3. Run: SELECT MAX(appointment_id) FROM appointments; -- Should return NULL or 0
-- 4. Run: SELECT MAX(bill_id) FROM bills; -- Should return NULL or 0
-- 5. Insert a test record and check if ID starts from 1
