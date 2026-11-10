// middleware/auth.js - the shared login and role check for every protected endpoint.
// See "Roles and access" in API_CONTRACT.md.
//
// Usage in a route file:
//   const { requireRole, requireOwnId } = require('../middleware/auth');
//   router.get('/:id/enrollments', requireRole('student'), requireOwnId('student_id'), handler);
//   router.get('/:id/roster', requireRole('instructor', 'administrator'), handler);
//
// After requireRole runs, the handler can read req.user:
//   { account_id, role, student_id, instructor_id }
// student_id is set only for students, and instructor_id only for instructors.
const jwt = require('jsonwebtoken');

const ROLES = ['student', 'instructor', 'administrator'];

function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

// Lets a request through only if it carries a valid login token for one of
// the given roles.
//   No token, or an expired or fake one -> 401 NOT_LOGGED_IN
//   Valid token, but the wrong role     -> 403 FORBIDDEN
function requireRole(...allowedRoles) {
  const unknown = allowedRoles.filter((role) => !ROLES.includes(role));
  if (allowedRoles.length === 0 || unknown.length > 0) {
    // A typo here would silently lock everyone out, so fail when the server starts.
    throw new Error('requireRole needs one or more of: ' + ROLES.join(', '));
  }

  return function checkRole(req, res, next) {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured.');
      return sendError(res, 500, 'SERVER_ERROR', 'Please try again later.');
    }

    const header = req.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Missing, expired, and fake tokens all get the same answer.
      return sendError(res, 401, 'NOT_LOGGED_IN', 'Please log in to continue.');
    }

    if (!ROLES.includes(payload.role)) {
      // Tokens made before role-based login have no usable role.
      return sendError(res, 401, 'NOT_LOGGED_IN', 'Please log in to continue.');
    }

    if (!allowedRoles.includes(payload.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have access to this.');
    }

    req.user = {
      account_id: payload.account_id,
      role: payload.role,
      student_id: payload.role === 'student' ? payload.student_id : null,
      instructor_id: payload.role === 'instructor' ? payload.instructor_id : null
    };

    // Kept so the Sprint 2 registration code works unchanged.
    req.student_id = req.user.student_id;

    next();
  };
}

// For paths like /students/:id/... and /instructors/:id/...: the {id} in the
// path must be the logged-in user's own id. Use it after requireRole.
//   field is 'student_id' or 'instructor_id'.
// Administrators pass, but only on routes whose requireRole also allows them.
function requireOwnId(field) {
  if (field !== 'student_id' && field !== 'instructor_id') {
    throw new Error("requireOwnId needs 'student_id' or 'instructor_id'");
  }

  return function checkOwnId(req, res, next) {
    if (req.user.role === 'administrator') {
      return next();
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0 || id !== req.user[field]) {
      return sendError(res, 403, 'FORBIDDEN', 'You can only view your own records.');
    }

    next();
  };
}

module.exports = { requireRole, requireOwnId, ROLES };
