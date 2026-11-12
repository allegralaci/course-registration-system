// routes/instructors.js - GET /instructors/:id/sessions: the logged-in instructor's sessions.
// Matches the endpoint described in API_CONTRACT.md. Only an instructor may call it,
// and only for their own id. Both rules are checked by middleware/auth.js.
const express = require('express');
const db = require('../db');
const { requireRole, requireOwnId } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/:id/sessions',
  requireRole('instructor'),
  requireOwnId('instructor_id'),
  async (req, res) => {
    // The instructor comes from the login token, never from the request.
    const instructorId = req.user.instructor_id;

    try {
      // enrolled_count is not stored anywhere: it is the number of Enrollment
      // rows for the session with status 'Enrolled'.
      const [rows] = await db.query(
        `SELECT s.session_id, s.section, s.days, s.time, s.location, s.max_enrollment,
                c.course_id, c.department, c.number, c.name, c.credits,
                (SELECT COUNT(*) FROM Enrollment e
                  WHERE e.session_id = s.session_id AND e.status = 'Enrolled') AS enrolled_count
         FROM Session s
         JOIN Course c ON c.course_id = s.course_id
         WHERE s.instructor_id = ?
         ORDER BY c.number, s.section`,
        [instructorId]
      );

      const sessions = rows.map((row) => ({
        session_id: row.session_id,
        section: row.section,
        days: row.days,
        time: row.time,
        location: row.location,
        max_enrollment: row.max_enrollment,
        enrolled_count: Number(row.enrolled_count),
        course: {
          course_id: row.course_id,
          department: row.department,
          number: row.number,
          name: row.name,
          credits: row.credits
        }
      }));

      res.json({ instructor_id: instructorId, sessions });
    } catch (err) {
      // Log only the error code. Details could reveal database settings.
      console.error('GET /instructors/:id/sessions failed:', err.code || err.message);
      res.status(500).json({
        error: { code: 'SERVER_ERROR', message: 'Could not retrieve sessions.' }
      });
    }
  }
);

module.exports = router;