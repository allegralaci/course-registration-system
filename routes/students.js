
// routes/students.js - student-specific endpoints.

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole, requireOwnId } = require('../middleware/auth');

// GET /students/:id/enrollments
// Return only the logged-in student's enrolled sessions.
router.get(
  '/:id/enrollments',
  requireRole('student'),
  requireOwnId('student_id'),
  async (req, res) => {
    try {
      const studentId = req.user.student_id;

      const [enrollments] = await db.query(
        `SELECT
          c.name AS course,
          s.section,
          s.days,
          s.time,
          s.location,
          CONCAT(i.first_name, ' ', i.last_name) AS instructor
        FROM Enrollment e
        JOIN Session s ON e.session_id = s.session_id
        JOIN Course c ON s.course_id = c.course_id
        JOIN Instructor i ON s.instructor_id = i.instructor_id
        WHERE e.student_id = ?
          AND e.status = 'Enrolled'
        ORDER BY c.department, c.number, s.section`,
        [studentId]
      );

      res.json({ enrollments });
    } catch (err) {
      console.error('Get student enrollments failed:', err.code || err.message);
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Could not retrieve enrollments.'
        }
      });
    }
  }
);

module.exports = router;
