-- SQL INSERT statements for Patients
-- Run this in H2 Console for Patient Service (port 8001)
-- JDBC URL: jdbc:h2:mem:patientdb
-- Username: sa
-- Password: (empty)

-- Clear existing data first (optional)
-- DELETE FROM patients;

-- Insert Patients from CSV
INSERT INTO patients (name, email, phone, dob, created_at, active) VALUES
('Vivaan Sharma', 'test760@mail.com', '9227680402', '1980-01-01', '2025-02-24 01:00:38', true),
('Rohan Sharma', 'test575@mail.com', '9165258086', '1980-01-01', '2024-06-12 13:27:31', true),
('Diya Gupta', 'test221@mail.com', '9930086875', '1980-01-01', '2024-08-11 00:47:04', true),
('Vivaan Singh', 'test301@mail.com', '9868570220', '1980-01-01', '2023-12-28 15:04:23', true),
('Vivaan Reddy', 'test285@mail.com', '9481367606', '1980-01-01', '2025-04-09 18:10:40', true),
('Ananya Gupta', 'test474@mail.com', '9396568720', '1980-01-01', '2024-05-05 00:56:31', true),
('Raj Iyer', 'test68@mail.com', '9298363942', '1980-01-01', '2024-01-19 02:56:23', true),
('Neha Singh', 'test270@mail.com', '9745391478', '1980-01-01', '2023-08-26 10:20:14', true),
('Aditya Reddy', 'test611@mail.com', '9039598076', '1980-01-01', '2025-04-14 03:42:17', true),
('Diya Menon', 'test115@mail.com', '9210779751', '1980-01-01', '2024-04-08 14:49:41', true),
('Neha Das', 'test204@mail.com', '9175750309', '1980-01-01', '2024-04-22 16:57:27', true),
('Ananya Sharma', 'test247@mail.com', '9890407714', '1980-01-01', '2025-05-04 02:09:49', true),
('Aditya Iyer', 'test541@mail.com', '9842572396', '1980-01-01', '2024-11-11 13:33:17', true),
('Neha Khan', 'test124@mail.com', '9200550700', '1980-01-01', '2023-02-18 19:09:35', true),
('Pari Verma', 'test527@mail.com', '9262195478', '1980-01-01', '2023-10-23 18:59:46', true),
('Vivaan Verma', 'test675@mail.com', '9444769043', '1980-01-01', '2023-06-19 17:50:41', true),
('Ananya Patel', 'test195@mail.com', '9511480880', '1980-01-01', '2025-04-19 18:34:44', true),
('Aarav Verma', 'test949@mail.com', '9724489103', '1980-01-01', '2024-12-07 19:56:29', true),
('Diya Reddy', 'test714@mail.com', '9995712955', '1980-01-01', '2024-05-02 04:02:05', true),
('Aarav Sharma', 'test599@mail.com', '9495058008', '1980-01-01', '2024-09-19 05:50:37', true),
('Vivaan Das', 'test253@mail.com', '9500653263', '1980-01-01', '2024-02-17 14:49:36', true),
('Raj Gupta', 'test688@mail.com', '9649906505', '1980-01-01', '2025-02-24 20:44:54', true),
('Diya Gupta', 'test956@mail.com', '9302245398', '1980-01-01', '2025-04-01 16:20:18', true),
('Aarav Singh', 'test307@mail.com', '9918287122', '1980-01-01', '2024-06-16 15:30:13', true),
('Ananya Iyer', 'test518@mail.com', '9498042076', '1980-01-01', '2024-02-11 22:24:00', true),
('Aditya Khan', 'test565@mail.com', '9751961035', '1980-01-01', '2024-10-29 15:36:36', true),
('Aditya Sharma', 'test316@mail.com', '9399036635', '1980-01-01', '2024-09-23 06:50:49', true),
('Rohan Gupta', 'test948@mail.com', '9989880739', '1980-01-01', '2024-01-21 12:20:43', true),
('Diya Gupta', 'test807@mail.com', '9730419388', '1980-01-01', '2023-12-13 07:11:32', true),
('Aarav Patel', 'test409@mail.com', '9389263959', '1980-01-01', '2023-06-29 04:15:07', true),
('Diya Gupta', 'test595@mail.com', '9921473653', '1980-01-01', '2025-06-14 16:45:37', true),
('Ananya Iyer', 'test46@mail.com', '9709577630', '1980-01-01', '2024-05-27 22:44:58', true),
('Rohan Menon', 'test680@mail.com', '9873344214', '1980-01-01', '2024-08-11 23:33:37', true),
('Aditya Das', 'test583@mail.com', '9350245644', '1980-01-01', '2023-11-28 23:21:56', true),
('Neha Khan', 'test813@mail.com', '9971056387', '1980-01-01', '2024-04-27 05:16:35', true),
('Ananya Patel', 'test151@mail.com', '9024804616', '1980-01-01', '2025-02-06 23:43:00', true),
('Raj Patel', 'test152@mail.com', '9607714195', '1980-01-01', '2023-03-20 00:16:37', true),
('Neha Patel', 'test940@mail.com', '9848695986', '1980-01-01', '2025-02-23 03:29:38', true),
('Raj Singh', 'test457@mail.com', '9874226756', '1980-01-01', '2024-03-02 13:44:05', true),
('Karan Verma', 'test731@mail.com', '9223512670', '1980-01-01', '2024-09-25 04:24:21', true),
('Pari Singh', 'test478@mail.com', '9424956873', '1980-01-01', '2023-01-10 03:49:18', true),
('Pari Iyer', 'test772@mail.com', '9388577842', '1980-01-01', '2025-01-24 10:02:45', true),
('Aarav Reddy', 'test345@mail.com', '9677899595', '1980-01-01', '2023-02-12 02:26:15', true),
('Vivaan Reddy', 'test139@mail.com', '9812343829', '1980-01-01', '2024-10-16 21:04:33', true),
('Diya Verma', 'test482@mail.com', '9059367679', '1980-01-01', '2023-11-06 16:42:17', true),
('Aarav Das', 'test157@mail.com', '9241942369', '1980-01-01', '2023-06-27 22:05:41', true),
('Aditya Iyer', 'test111@mail.com', '9595939158', '1980-01-01', '2024-01-13 06:04:52', true),
('Vivaan Iyer', 'test871@mail.com', '9687505606', '1980-01-01', '2023-01-20 15:42:22', true),
('Raj Khan', 'test109@mail.com', '9438411566', '1980-01-01', '2025-04-16 00:32:24', true),
('Karan Khan', 'test447@mail.com', '9853292475', '1980-01-01', '2024-08-11 17:44:43', true),
('Pari Sharma', 'test507@mail.com', '9812738720', '1980-01-01', '2023-10-24 19:05:59', true),
('Vivaan Patel', 'test738@mail.com', '9452474024', '1980-01-01', '2024-01-13 23:04:26', true),
('Diya Das', 'test378@mail.com', '9454737221', '1980-01-01', '2023-10-27 04:03:46', true),
('Pari Verma', 'test761@mail.com', '9571247952', '1980-01-01', '2023-06-06 03:53:05', true),
('Ananya Iyer', 'test233@mail.com', '9337100296', '1980-01-01', '2025-02-01 13:17:03', true),
('Vivaan Sharma', 'test588@mail.com', '9243928104', '1980-01-01', '2025-06-15 08:54:28', true),
('Aarav Gupta', 'test153@mail.com', '9890254567', '1980-01-01', '2024-08-13 21:31:14', true),
('Karan Khan', 'test305@mail.com', '9893667922', '1980-01-01', '2023-05-07 02:53:17', true),
('Aditya Patel', 'test178@mail.com', '9514640228', '1980-01-01', '2023-04-21 13:46:25', true),
('Ananya Iyer', 'test807b@mail.com', '9758112121', '1980-01-01', '2023-04-03 15:28:02', true);


