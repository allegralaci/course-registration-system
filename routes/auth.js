// routes/auth.js - POST /login: one login for students, instructors, and administrators.
// Matches the endpoint described in API_CONTRACT.md. The user's role comes from
// the Account table and is written into the token, so the API, not the page,
// decides what each user may do.
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (isBlank(username) || isBlank(password)) {
    return sendError(res, 400, 'MISSING_FIELDS', 'Please enter your username and password.');
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured.');
    return sendError(res, 500, 'SERVER_ERROR', 'Login is temporarily unavailable.');
  }

  try {
    // A student account links to Student, an instructor account to Instructor,
    // and an administrator account to neither, so its names come back null.
    const [accounts] = await db.query(
      `SELECT a.account_id, a.username, a.password_hash, a.role,
              a.student_id, a.instructor_id, s.student_number,
              COALESCE(s.first_name, i.first_name) AS first_name,
              COALESCE(s.last_name, i.last_name) AS last_name
       FROM Account a
       LEFT JOIN Student s ON s.student_id = a.student_id
       LEFT JOIN Instructor i ON i.instructor_id = a.instructor_id
       WHERE a.username = ?`,
      [username.trim()]
    );

    if (accounts.length === 0) {
      return sendError(res, 401, 'USER_NOT_FOUND', 'Username not found.');
    }

    const account = accounts[0];

    // Passwords are case-sensitive and never trimmed.
    const passwordMatches = await bcrypt.compare(password, account.password_hash);

    if (!passwordMatches) {
      return sendError(res, 401, 'INCORRECT_PASSWORD', 'Incorrect password.');
    }

    const token = jwt.sign(
      {
        account_id: account.account_id,
        role: account.role,
        student_id: account.student_id,
        instructor_id: account.instructor_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Never send the password hash back.
    res.json({
      account_id: account.account_id,
      username: account.username,
      role: account.role,
      first_name: account.first_name,
      last_name: account.last_name,
      student_id: account.student_id,
      student_number: account.student_number,
      instructor_id: account.instructor_id,
      token
    });
  } catch (err) {
    // Log only the error code. Details could reveal database settings.
    console.error('POST /login failed:', err.code || err.message);
    sendError(res, 500, 'SERVER_ERROR', 'Unable to log in right now. Please try again.');
  }
});

module.exports = router;
