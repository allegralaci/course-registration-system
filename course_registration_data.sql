USE course_registration;

INSERT INTO Course (department, number, name, credits)
VALUES
('Information Systems', 'INFO 465', 'Cloud Computing', 3),
('Information Systems', 'INFO 370', 'Database Systems', 3),
('Information Systems', 'INFO 325', 'Systems Analysis', 3),
('Information Systems', 'INFO 300', 'Information Technology Infrastructure', 3),
('Marketing', 'MKTG 302', 'Marketing Research', 3),
('Marketing', 'MKTG 410', 'Digital Marketing', 3);

INSERT INTO Instructor (first_name, last_name)
VALUES
('Sarah', 'Johnson'),
('Michael', 'Brown'),
('David', 'Wilson'),
('Emily', 'Davis'),
('Jennifer', 'Smith'),
('Michael', 'McGarry');

INSERT INTO Student
    (student_id, student_number, first_name, last_name)
VALUES
(1,  '1001001', 'Nathan',   'Reinoehl'),
(2,  '1001002', 'John',     'Miller'),
(3,  '1001003', 'Emily',    'Carter'),
(4,  '1001004', 'Jessica',  'Lee'),
(5,  '1001005', 'Daniel',   'White'),
(6,  '1001006', 'Sophia',   'Martin'),
(7,  '1001007', 'Olivia',   'Green'),
(8,  '1001008', 'Jacob',    'Harris'),
(9,  '1001009', 'Ethan',    'Young'),
(10, '1001010', 'Ava',      'Scott');

-- Test logins (username / password). Only the bcrypt hash is stored.
-- Usernames are first initial + last name, lowercase. If two people would
-- share a username, add a number to the newer one (jsmith, jsmith2).
-- Students:    nreinoehl / TestPass123   jmiller / TestPass456
--              ecarter / Pass1003   jlee / Pass1004      dwhite / Pass1005
--              smartin / Pass1006   ogreen / Pass1007    jharris / Pass1008
--              eyoung / Pass1009    ascott / Pass1010
-- Instructors: sjohnson, mbrown, dwilson, edavis, jsmith, mmcgarry / TestPass123
-- Administrator: admin / AdminPass123
INSERT INTO Account (username, password_hash, role, student_id, instructor_id)
VALUES
('nreinoehl', '$2b$10$CdeA6iDHG1ZExbM1OOnNxOUmTPNkPcE2p8bixUaDs72CowNvYIaDC', 'student', 1, NULL),
('jmiller',   '$2b$10$kGGq4ChZ.7FkrVWUEXZHt.fllzTExFPrNPh.oXOBOhSkKjMPOBhf2', 'student', 2, NULL),
('ecarter',   '$2b$10$4ZNzUmpsHSjqIXr4u7ZHZuQWXRUcgszKlqNWd6MDn1f/NyqiG1URW', 'student', 3, NULL),
('jlee',      '$2b$10$Ly99OwdzkMVtTcdA.c3TuOdWG/sFt./MJpK/5Pg57EEsCcLO.NTO2', 'student', 4, NULL),
('dwhite',    '$2b$10$7ECDnzd.4oz.ruas3ZiLOO2t5VsHJMPCTN8/lT3XPBt/jGnvnvGOe', 'student', 5, NULL),
('smartin',   '$2b$10$mOC1nbTczqWXQK0Jk0fhU.16JDqIkRBDfwIXbMR9H4dP63VTTS4r2', 'student', 6, NULL),
('ogreen',    '$2b$10$Y4gwVrtYvnLz2Q6IdvFbkuj5ytBvQW3XOYyBNvLUwWUWkTEi7RxXq', 'student', 7, NULL),
('jharris',   '$2b$10$ywHk89LxEIVM0QK4YImUyO7nMNxyvbYsawuoQx6AMscuYqu4/F5V6', 'student', 8, NULL),
('eyoung',    '$2b$10$hbrJzxF9iqm4chTP6L/giuIjdcxlQMHIkDpkzwI.ZvR5qj0jm7sHq', 'student', 9, NULL),
('ascott',    '$2b$10$Y/B/EGT3WLeYM903LjF47e.byFmCeyzfEk490xUhn.QXpxCjfHZXq', 'student', 10, NULL),
('sjohnson',  '$2b$10$rtGovFhaOkVLZscd9n7UPejBKF16z.0fL4IKj69CRf9LAAagrtgVW', 'instructor', NULL, 1),
('mbrown',    '$2b$10$pSnh4cwlABcy4kmQY..rkuBzhPjAcTShhcJ7HFGbdia4.l.ZCUO/.', 'instructor', NULL, 2),
('dwilson',   '$2b$10$xvEDIgY8kEKlZWvWLUASBeW5Wpe57Clwi3GO/njedYW/J3kR1jc2K', 'instructor', NULL, 3),
('edavis',    '$2b$10$54USpSTC7.uzJ5vUULe5EOB9OaPWTR3nq8ij2WxqWgokWcl6bgf52', 'instructor', NULL, 4),
('jsmith',    '$2b$10$rBosVVZR9aqrxk8diHh8Le2rcK0zjwfWeFCeQgFeKcw4Fc/HgSIUC', 'instructor', NULL, 5),
('mmcgarry',  '$2b$10$2HrIMo41r6UY2ZFH5Q0Yqu1YB1vUC3WEz7xdBnNl.oXNdWDX.dNYO', 'instructor', NULL, 6),
('admin',     '$2b$10$k4dbRCzpDeyl54POvHKCIe.L1nShqBrKGlworIFSXZYw0dGN8dNYa', 'administrator', NULL, NULL);

INSERT INTO Session
(course_id, instructor_id, section, days, time, location, max_enrollment)
VALUES
(1, 1, '001', 'MW', '09:00 AM - 10:15 AM', 'Online', 25),
(2, 2, '001', 'TR', '10:30 AM - 11:45 AM', 'Building A Room 101', 30),
(3, 3, '001', 'MW', '01:00 PM - 02:15 PM', 'Hybrid', 20),
(4, 6, '001', 'TR', '12:30 PM - 01:45 PM', 'Building B Room 108', 30),
(5, 4, '001', 'F', '09:00 AM - 11:50 AM', 'Building B Room 205', 3),
(6, 5, '001', 'MW', '12:30 PM - 01:45 PM', 'Building B Room 108', 30);

INSERT INTO Prerequisite (course_id, prerequisite_course_id)
VALUES
(2, 3),
(1, 2);

INSERT INTO Enrollment (student_id, session_id, status)
VALUES
(1, 1, 'Enrolled'),
(1, 2, 'Enrolled'),
(2, 1, 'Enrolled'),
(3, 2, 'Enrolled'),
(4, 3, 'Enrolled'),
(5, 4, 'Enrolled'),
(6, 5, 'Enrolled'),
(7, 1, 'Enrolled'),
(8, 2, 'Enrolled'),
(9, 3, 'Enrolled'),
(10, 4, 'Enrolled'),
-- Session 5 (MKTG 302) is full: 3 of 3 seats, for testing SESSION_FULL.
(7, 5, 'Enrolled'),
(8, 5, 'Enrolled');
