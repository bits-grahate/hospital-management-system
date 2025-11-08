-- SQL INSERT statements for Doctors
-- Run this in H2 Console for Doctor Service (port 8002)
-- JDBC URL: jdbc:h2:mem:doctordb
-- Username: sa
-- Password: (empty)

-- Clear existing data first (optional)
-- DELETE FROM doctors;

-- Insert Doctors from CSV
INSERT INTO doctors (name, email, phone, department, specialization, created_at, active) VALUES
('Dr. Aditya Iyer', 'doc610@mail.com', '9752166954', 'Cardiology', 'Cardiologist', '2024-11-02 03:11:45', true),
('Dr. Pari Das', 'doc257@mail.com', '9026850785', 'Orthopedics', 'Neurologist', '2025-03-17 04:22:27', true),
('Dr. Karan Iyer', 'doc186@mail.com', '9948944311', 'Pediatrics', 'Neurologist', '2024-03-23 17:32:17', true),
('Dr. Raj Singh', 'doc38@mail.com', '9433945965', 'Pediatrics', 'Cardiologist', '2023-10-19 09:35:02', true),
('Dr. Neha Menon', 'doc638@mail.com', '9767259461', 'Dermatology', 'Cardiologist', '2023-09-04 00:45:57', true),
('Dr. Diya Singh', 'doc15@mail.com', '9509941847', 'Dermatology', 'Neurologist', '2024-10-07 10:36:09', true),
('Dr. Karan Khan', 'doc250@mail.com', '9411571078', 'Neurology', 'Neurologist', '2023-01-04 23:38:23', true),
('Dr. Diya Iyer', 'doc858@mail.com', '9594153554', 'Neurology', 'Cardiologist', '2024-01-06 23:18:57', true),
('Dr. Rohan Reddy', 'doc240@mail.com', '9843493976', 'Orthopedics', 'Neurologist', '2023-02-27 12:11:28', true),
('Dr. Aditya Singh', 'doc989@mail.com', '9588454746', 'Orthopedics', 'Cardiologist', '2024-12-30 07:52:41', true),
('Dr. Diya Menon', 'doc639@mail.com', '9668883377', 'Dermatology', 'Cardiologist', '2023-04-17 06:54:37', true),
('Dr. Ananya Iyer', 'doc233@mail.com', '9740684690', 'Cardiology', 'Neurologist', '2024-07-10 20:28:55', true),
('Dr. Pari Reddy', 'doc150@mail.com', '9246116364', 'Dermatology', 'Cardiologist', '2023-12-27 16:36:45', true),
('Dr. Karan Iyer', 'doc471@mail.com', '9208961435', 'Pediatrics', 'Neurologist', '2024-12-10 16:04:24', true),
('Dr. Diya Patel', 'doc394@mail.com', '9813326083', 'Cardiology', 'Cardiologist', '2025-07-31 00:28:21', true),
('Dr. Karan Iyer', 'doc795@mail.com', '9763666768', 'Cardiology', 'Cardiologist', '2024-04-24 21:51:09', true),
('Dr. Karan Sharma', 'doc594@mail.com', '9319342783', 'Dermatology', 'Neurologist', '2023-09-13 14:39:38', true),
('Dr. Diya Khan', 'doc991@mail.com', '9873191987', 'Pediatrics', 'Neurologist', '2023-05-21 06:44:06', true),
('Dr. Raj Sharma', 'doc271@mail.com', '9546658912', 'Cardiology', 'Neurologist', '2023-12-10 21:10:02', true),
('Dr. Vivaan Khan', 'doc932@mail.com', '9761009125', 'Pediatrics', 'Neurologist', '2024-07-30 08:18:42', true),
('Dr. Neha Reddy', 'doc602@mail.com', '9714044903', 'Pediatrics', 'Neurologist', '2024-01-02 18:55:01', true),
('Dr. Pari Verma', 'doc703@mail.com', '9396029980', 'Orthopedics', 'Cardiologist', '2023-03-20 13:42:12', true),
('Dr. Pari Patel', 'doc129@mail.com', '9728558277', 'Dermatology', 'Cardiologist', '2024-03-06 17:33:19', true),
('Dr. Aditya Gupta', 'doc554@mail.com', '9216007231', 'Cardiology', 'Cardiologist', '2024-10-15 22:32:49', true),
('Dr. Neha Verma', 'doc764@mail.com', '9043542679', 'Dermatology', 'Neurologist', '2024-12-12 13:03:46', true);

