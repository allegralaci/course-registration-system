// routes/sessions.js - GET /sessions/available and POST /sessions/:id/register.
// Matches the endpoints described in API_CONTRACT.md. Both need a logged-in student,
// checked by the shared requireRole in middleware/auth.js.
const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

// GET /sessions/available - every session, with its course, instructor, and
// enrolled_count. Full sessions are still listed so the page can show them
// with a disabled button. Optional filter: ?course_id=
router.get('/available', requireRole('student'), async (req, res) => {
  const courseId = Number(req.query.course_id);
  const filter = Number.isInteger(courseId) && courseId > 0;

  try {
    const [rows] = await db.query(
      `SELECT s.session_id, s.course_id, s.instructor_id, s.section, s.days, s.time,
              s.location, s.max_enrollment,
              c.department, c.number, c.name, c.credits,
              i.first_name, i.last_name,
              (SELECT COUNT(*) FROM Enrollment e
                WHERE e.session_id = s.session_id AND e.status = 'Enrolled') AS enrolled_count
       FROM Session s
       JOIN Course c ON c.course_id = s.course_id
       JOIN Instructor i ON i.instructor_id = s.instructor_id
       ${filter ? 'WHERE s.course_id = ?' : ''}
       ORDER BY c.number, s.section`,
      filter ? [courseId] : []
    );

    const sessions = rows.map((row) => ({
      session_id: row.session_id,
      course_id: row.course_id,
      instructor_id: row.instructor_id,
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
      },
      instructor: {
        instructor_id: row.instructor_id,
        first_name: row.first_name,
        last_name: row.last_name
      }
    }));

    res.json({ sessions });
  } catch (err) {
    console.error('GET /sessions/available failed:', err.code || err.message);
    sendError(res, 500, 'SERVER_ERROR', 'Could not load sessions. Please try again.');
  }
});

// POST /sessions/:id/register - registers the logged-in student. The student
// comes from the token, never from the request body.
router.post('/:id/register', requireRole('student'), async (req, res) => {
  const sessionId = Number(req.params.id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return sendError(res, 404, 'SESSION_NOT_FOUND', 'Session not found.');
  }

  let conn;

  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // FOR UPDATE locks this session's row until the transaction ends, so two
    // students registering at the same moment are handled one after the other
    // and cannot both take the last seat.
    const [sessions] = await conn.query(
      `SELECT s.session_id, s.course_id, s.section, s.max_enrollment, c.number
       FROM Session s
       JOIN Course c ON c.course_id = s.course_id
       WHERE s.session_id = ?
       FOR UPDATE`,
      [sessionId]
    );

    if (sessions.length === 0) {
      await conn.rollback();
      return sendError(res, 404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    const session = sessions[0];

    // A student may hold only one section of a course.
    const [existing] = await conn.query(
      `SELECT e.enrollment_id
       FROM Enrollment e
       JOIN Session s ON s.session_id = e.session_id
       WHERE e.student_id = ? AND s.course_id = ?`,
      [req.student_id, session.course_id]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return sendError(res, 409, 'ALREADY_REGISTERED',
        'You are already registered for ' + session.number + '.');
    }

    // The prerequisite check (Story 7) is added in Sprint 3.

    const [counts] = await conn.query(
      `SELECT COUNT(*) AS enrolled_count
       FROM Enrollment
       WHERE session_id = ? AND status = 'Enrolled'`,
      [sessionId]
    );
    const enrolledCount = Number(counts[0].enrolled_count);

    if (enrolledCount >= session.max_enrollment) {
      await conn.rollback();
      return sendError(res, 409, 'SESSION_FULL',
        session.number + ', Section ' + session.section + ' is full.');
    }

    const [result] = await conn.query(
      `INSERT INTO Enrollment (student_id, session_id, status)
       VALUES (?, ?, 'Enrolled')`,
      [req.student_id, sessionId]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Successfully registered for ' + session.number +
        ', Section ' + session.section + '.',
      enrollment: {
        enrollment_id: result.insertId,
        student_id: req.student_id,
        session_id: sessionId,
        status: 'Enrolled'
      },
      session: {
        session_id: sessionId,
        max_enrollment: session.max_enrollment,
        enrolled_count: enrolledCount + 1
      }
    });
  } catch (err) {
    if (conn) {
      await conn.rollback().catch(() => {});
    }

    // The database's UNIQUE (student_id, session_id) rule is a safety net
    // in case the same request arrives twice at once.
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'ALREADY_REGISTERED',
        'You are already registered for this session.');
    }

    console.error('POST /sessions/:id/register failed:', err.code || err.message);
    sendError(res, 500, 'SERVER_ERROR', 'Could not complete the registration. Please try again.');
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

module.exports = router;
