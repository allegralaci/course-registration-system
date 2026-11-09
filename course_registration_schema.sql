CREATE DATABASE IF NOT EXISTS course_registration;
USE course_registration;

CREATE TABLE Student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE Instructor (
    instructor_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE Course (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    number VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    credits INT NOT NULL
);

CREATE TABLE Session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    instructor_id INT NOT NULL,
    section VARCHAR(20),
    days VARCHAR(50),
    time VARCHAR(50),
    location VARCHAR(100),
    max_enrollment INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES Course(course_id),
    FOREIGN KEY (instructor_id) REFERENCES Instructor(instructor_id)
);

CREATE TABLE Enrollment (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status VARCHAR(30),
    UNIQUE (student_id, session_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id),
    FOREIGN KEY (session_id) REFERENCES Session(session_id)
);

CREATE TABLE Prerequisite (
    course_id INT NOT NULL,
    prerequisite_course_id INT NOT NULL,
    PRIMARY KEY (course_id, prerequisite_course_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id),
    FOREIGN KEY (prerequisite_course_id) REFERENCES Course(course_id)
);

-- Every login: students, instructors, and administrators.
-- A student account links to a Student row, an instructor account to an
-- Instructor row, and an administrator account to neither.
CREATE TABLE Account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'administrator') NOT NULL,
    student_id INT UNIQUE,
    instructor_id INT UNIQUE,
    FOREIGN KEY (student_id) REFERENCES Student(student_id),
    FOREIGN KEY (instructor_id) REFERENCES Instructor(instructor_id),
    CHECK (
        (role = 'student'       AND student_id IS NOT NULL AND instructor_id IS NULL) OR
        (role = 'instructor'    AND instructor_id IS NOT NULL AND student_id IS NULL) OR
        (role = 'administrator' AND student_id IS NULL AND instructor_id IS NULL)
    )
);

-- Courses each student has finished, checked against Prerequisite at registration.
CREATE TABLE CompletedCourse (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);
