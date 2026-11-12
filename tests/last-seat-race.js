// tests/last-seat-race.js - Task W2: when many students register for the last
// seat at the same time, only one succeeds.
//
// Each round opens exactly one seat in the test session, then has every eligible
// test student register at once. It changes only that session and the enrollments
// it creates, and puts both back when it finishes.
//
// Run from the repository folder while the app is running:
//   node tests/last-seat-race.js
// Optional: BASE_URL, SESSION_ID (default 6), ROUNDS (default 5)
require('dotenv').config();

const db = require('../db');

const BASE_URL = process.env.BASE_URL || 'http://localhost:' + (Number(process.env.PORT) || 3000);
const SESSION_ID = Number(process.env.SESSION_ID) || 6;
const ROUNDS = Number(process.env.ROUNDS) || 5;

// Test logins from course_registration_data.sql.
const STUDENTS = [
  ['nreinoehl', 'TestPass123'], ['jmiller', 'TestPass456'], ['ecarter', 'Pass1003'],
  ['jlee', 'Pass1004'], ['dwhite', 'Pass1005'], ['smartin', 'Pass1006'],
  ['ogreen', 'Pass1007'], ['jharris', 'Pass1008'], ['eyoung', 'Pass1009'], ['ascott', 'Pass1010']
];

async function login(username, password) {
  const res = await fetch(BASE_URL + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.status !== 200) {
    throw new Error('Login failed for ' + username + ' (HTTP ' + res.status + ')');
  }
  return res.json();
}

async function register(token) {
  const res = await fetch(BASE_URL + '/sessions/' + SESSION_ID + '/register', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token }
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, code: body.error ? body.error.code : null };
}

async function enrolledCount() {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS n FROM Enrollment WHERE session_id = ? AND status = 'Enrolled'`,
    [SESSION_ID]
  );
  return Number(rows[0].n);
}

async function main() {
  const [sessions] = await db.query(
    'SELECT session_id, course_id, max_enrollment FROM Session WHERE session_id = ?',
    [SESSION_ID]
  );
  if (sessions.length === 0) {
    throw new Error('Session ' + SESSION_ID + ' does not exist.');
  }
  const { course_id: courseId, max_enrollment: originalMax } = sessions[0];

  // Students already in this course would get ALREADY_REGISTERED, so leave them out.
  const [taken] = await db.query(
    `SELECT DISTINCT e.student_id FROM Enrollment e
     JOIN Session s ON s.session_id = e.session_id
     WHERE s.course_id = ?`,
    [courseId]
  );
  const takenIds = new Set(taken.map((row) => row.student_id));

  const racers = [];
  for (const [username, password] of STUDENTS) {
    const user = await login(username, password);
    if (!takenIds.has(user.student_id)) {
      racers.push(user);
    }
  }
  if (racers.length < 2) {
    throw new Error('Need at least 2 students not already in this course; found ' + racers.length + '.');
  }

  console.log('Testing ' + BASE_URL + ', session ' + SESSION_ID + ', ' +
    racers.length + ' students per race, ' + ROUNDS + ' rounds.\n');

  const created = [];
  let failures = 0;

  try {
    for (let round = 1; round <= ROUNDS; round++) {
      const before = await enrolledCount();
      await db.query('UPDATE Session SET max_enrollment = ? WHERE session_id = ?',
        [before + 1, SESSION_ID]);

      const results = await Promise.all(racers.map((user) => register(user.token)));

      const winners = racers.filter((user, i) => results[i].status === 201);
      const full = results.filter((r) => r.status === 409 && r.code === 'SESSION_FULL').length;
      const other = results.filter((r) => r.status !== 201 &&
        !(r.status === 409 && r.code === 'SESSION_FULL'));
      const after = await enrolledCount();

      winners.forEach((user) => created.push(user.student_id));

      const ok = winners.length === 1 && other.length === 0 && after === before + 1;
      if (!ok) {
        failures++;
      }

      console.log('Round ' + round + ': ' + (ok ? 'PASS' : 'FAIL') +
        '  seats open: 1, succeeded: ' + winners.length + ', SESSION_FULL: ' + full +
        (other.length ? ', unexpected: ' + JSON.stringify(other) : '') +
        ', enrolled ' + before + ' -> ' + after + ' (max ' + (before + 1) + ')');

      // Winners are now registered, so they sit out the next round.
      const winnerIds = new Set(winners.map((user) => user.student_id));
      for (let i = racers.length - 1; i >= 0; i--) {
        if (winnerIds.has(racers[i].student_id)) {
          racers.splice(i, 1);
        }
      }
      if (racers.length < 2) {
        console.log('Fewer than 2 students left to race; stopping early.');
        break;
      }
    }
  } finally {
    if (created.length > 0) {
      await db.query('DELETE FROM Enrollment WHERE session_id = ? AND student_id IN (?)',
        [SESSION_ID, created]);
    }
    await db.query('UPDATE Session SET max_enrollment = ? WHERE session_id = ?',
      [originalMax, SESSION_ID]);
    console.log('\nCleaned up: removed ' + created.length + ' test enrollment(s), ' +
      'max_enrollment restored to ' + originalMax + '.');
  }

  console.log(failures === 0
    ? 'RESULT: PASS. Only one student got the last seat in every round.'
    : 'RESULT: FAIL in ' + failures + ' round(s).');
  return failures === 0;
}

main()
  .then((passed) => process.exit(passed ? 0 : 1))
  .catch((err) => {
    console.error('Test could not run:', err.message);
    process.exit(1);
  });
