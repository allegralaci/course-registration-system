// server.js - Express app: serves the web pages and the API.
require('dotenv').config();

const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Serve the web pages. Only the public/ folder is exposed, so server.js, .env,
// the SQL scripts, and package.json can never be downloaded from the site.
app.use(express.static(path.join(__dirname, 'public')));

// Setup check: is the server running, and can it reach the database?
// It never sends error details back, because they could reveal server settings.
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Database check failed:', err.code || err.message);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// API endpoints (see API_CONTRACT.md). Each one lives in its own file in routes/.
// Protected endpoints use the shared role check in middleware/auth.js.
app.use('/', require('./routes/auth'));
app.use('/courses', require('./routes/courses'));
app.use('/sessions', require('./routes/sessions'));
app.use('/students', require('./routes/students'));
app.use('/instructors', require('./routes/instructors'));

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log('Course registration system running on port ' + PORT);

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing from .env, so nobody can log in.');
  }

  // Report the database status at startup, but keep the pages up either way.
  db.query('SELECT 1')
    .then(() => console.log('Database connection OK'))
    .catch((err) => console.error('Database connection FAILED:', err.code || err.message));
});
