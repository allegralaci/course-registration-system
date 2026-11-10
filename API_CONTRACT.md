# Course Registration System: API Contract

Oct 27, 2026 · Ryan. Updated for Sprint 3 (task S4): one login for every role, the role and ownership rules, the student schedule, instructor sessions, and roster endpoints, and the prerequisite error.

## What an API contract is, and the rules every endpoint follows

An API contract is the written agreement between the web pages and the server: for each endpoint it fixes the URL, the inputs, the outputs, and the errors. The page builders and the API builders can then work at the same time and test against the same document. Here the pages are HTML and JavaScript, the API is Node.js with Express on EC2, and the database is MySQL on RDS (from the README).

Field names below are the column names in `course_registration_schema.sql`. A value the API works out instead of storing is marked **computed**.

- **Format:** requests and responses are JSON (`Content-Type: application/json`). Ids such as `student_id` are numbers, matching the `INT` columns.
- **Paths:** exactly as written in the backlog and the sprint plan, with no prefix.
- **Login:** `POST /login` is the one login for students, instructors, and administrators. It returns a `token` that holds the user's role. Every endpoint marked with a role below needs `Authorization: Bearer <token>`.
- **Roles:** the API checks the role on every request, using the shared `requireRole` in `middleware/auth.js`. Hiding a page from a role is only a convenience. The API is what keeps data safe.
- **Ownership:** a student may only use `/students/{id}/...` with their own `student_id`, and an instructor only `/instructors/{id}/...` with their own `instructor_id` (`requireOwnId` in `middleware/auth.js`). Anything else returns `403`.
- **Rules live in the API, not the page:** the API never lets a session go over `max_enrollment`, never creates a duplicate registration, and never registers a student who is missing a prerequisite. These checks and the new `Enrollment` row happen in one database transaction, so two students cannot take the last seat at once.
- **Errors** always use this shape, and `message` is the text the page shows:

```json
{ "error": { "code": "SESSION_FULL", "message": "MKTG 302, Section 001 is full." } }
```

| Status | Meaning |
| --- | --- |
| 200 | Read succeeded |
| 201 | A registration was created |
| 400 | Missing or invalid input |
| 401 | Not logged in, the token is missing or expired, or login failed |
| 403 | Logged in, but this role or this user may not do it (another student's data, a roster you do not teach) |
| 404 | The course or session does not exist |
| 409 | A rule blocked it: session full, already registered, prerequisite not met |

## Roles and access

Every account has one role, stored in `Account.role`: `student`, `instructor`, or `administrator`.

| Endpoint | Who may call it | Extra rule |
| --- | --- | --- |
| `POST /login` | Anyone | None |
| `GET /courses`, `GET /courses/{id}` | Anyone, no token needed | None |
| `GET /sessions/available` | `student` | None |
| `POST /sessions/{id}/register` | `student` | Registers the student in the token, never one named in the request |
| `GET /students/{id}/enrollments` | `student` | `{id}` must be the caller's own `student_id` |
| `GET /instructors/{id}/sessions` | `instructor` | `{id}` must be the caller's own `instructor_id` |
| `GET /sessions/{id}/roster` | `instructor`, `administrator` | An instructor must be the session's assigned instructor |
| `POST /sessions`, `PUT /sessions/{id}` (future release) | `administrator` | None |

The two checks every protected endpoint uses:

| Check | Error | When |
| --- | --- | --- |
| Logged in | `401 NOT_LOGGED_IN`, "Please log in to continue." | No token, or an expired or invalid one |
| Right role | `403 FORBIDDEN`, "You do not have access to this." | Valid token, but a role the endpoint does not allow |
| Own records | `403 FORBIDDEN`, "You can only view your own records." | `{id}` in the path is not the caller's own id |

**For endpoint builders.** Add the checks in the route, before the handler:

```js
const { requireRole, requireOwnId } = require('../middleware/auth');

router.get('/:id/enrollments', requireRole('student'), requireOwnId('student_id'), handler);
router.get('/:id/roster', requireRole('instructor', 'administrator'), handler);
```

Inside the handler, `req.user` holds `{ account_id, role, student_id, instructor_id }` from the token. `student_id` is set only for students and `instructor_id` only for instructors. Always take the user from `req.user`, never from the request body or query.

**For page builders.** `public/auth.js` keeps the same rules for pages. Its `PAGE_ROLES` list says which roles may open each page. Call `requirePage()` in the page's `<head>` after loading `auth.js`, and use `apiFetch(path)` to call the API with the user's token. `getCurrentUser()` returns the logged-in user, including `role`, `student_id`, and `instructor_id`.

## Database tables and API fields

The schema has eight tables. Every field the API sends or accepts uses these column names unchanged.

**Student**

| Column | Type | Notes |
| --- | --- | --- |
| `student_id` | INT | Primary key. The id used in API paths, such as `/students/1/enrollments`. |
| `student_number` | VARCHAR(20) | The number a student knows, for example `1001001`. Unique. |
| `first_name` | VARCHAR(50) | |
| `last_name` | VARCHAR(50) | |

**Instructor**

| Column | Type | Notes |
| --- | --- | --- |
| `instructor_id` | INT | Primary key, auto-generated |
| `first_name` | VARCHAR(50) | |
| `last_name` | VARCHAR(50) | |

**Account** (every login)

| Column | Type | Notes |
| --- | --- | --- |
| `account_id` | INT | Primary key, auto-generated |
| `username` | VARCHAR(50) | Unique. First initial plus last name, lowercase, for example `nreinoehl`. |
| `password_hash` | VARCHAR(255) | bcrypt hash, checked at login and never returned by the API |
| `role` | ENUM | `student`, `instructor`, or `administrator` |
| `student_id` | INT | Set only for a student account. Refers to `Student.student_id`. |
| `instructor_id` | INT | Set only for an instructor account. Refers to `Instructor.instructor_id`. |

**Course**

| Column | Type | Notes |
| --- | --- | --- |
| `course_id` | INT | Primary key, auto-generated |
| `department` | VARCHAR(100) | For example `Information Systems` |
| `number` | VARCHAR(20) | The full course code, for example `INFO 465` |
| `name` | VARCHAR(100) | |
| `credits` | INT | |

**Session** (one section of a course)

| Column | Type | Notes |
| --- | --- | --- |
| `session_id` | INT | Primary key, auto-generated |
| `course_id` | INT | Refers to `Course.course_id` |
| `instructor_id` | INT | The assigned instructor. Refers to `Instructor.instructor_id`. |
| `section` | VARCHAR(20) | For example `001` |
| `days` | VARCHAR(50) | For example `MW` |
| `time` | VARCHAR(50) | One text value, for example `09:00 AM - 10:15 AM` |
| `location` | VARCHAR(100) | For example `Building A Room 101` |
| `max_enrollment` | INT | Required |

**Enrollment** (a student registered in a session)

| Column | Type | Notes |
| --- | --- | --- |
| `enrollment_id` | INT | Primary key, auto-generated |
| `student_id` | INT | Refers to `Student.student_id` |
| `session_id` | INT | Refers to `Session.session_id` |
| `status` | VARCHAR(30) | `Enrolled` |

The pair (`student_id`, `session_id`) is unique, so the database itself blocks a duplicate registration.

**Prerequisite** (a course that must be completed first)

| Column | Type | Notes |
| --- | --- | --- |
| `course_id` | INT | The course that has the requirement. Part of the primary key. |
| `prerequisite_course_id` | INT | The course that must be done first. Part of the primary key. |

**CompletedCourse** (courses a student has finished)

| Column | Type | Notes |
| --- | --- | --- |
| `student_id` | INT | Part of the primary key. Refers to `Student.student_id`. |
| `course_id` | INT | Part of the primary key. Refers to `Course.course_id`. |

A prerequisite counts as met only when a `CompletedCourse` row exists for it. Being enrolled in the prerequisite this term does not count.

**Values the API computes** (no column stores them)

| Field | How it is worked out |
| --- | --- |
| `enrolled_count` | Number of `Enrollment` rows for the session whose `status` is `Enrolled`. Open seats = `max_enrollment` minus `enrolled_count`. |
| `seats_left` | `max_enrollment` minus `enrolled_count`, never below 0. Only in `GET /courses/{id}`. |
| `prerequisites` | The `Prerequisite` rows for a course, each returned as `{ "course_id", "number", "name" }` of the required course. |
| `missing` | In a `PREREQUISITE_MISSING` error: the prerequisites the student has no `CompletedCourse` row for, in the same shape as `prerequisites`. |
| `instructor` | The session's `Instructor` row, returned as `{ "instructor_id", "first_name", "last_name" }`. |
| `course` | The session's `Course` row, returned as `{ "course_id", "department", "number", "name", "credits" }`. |

**Names the API adds around the data** (not columns, and not worked out from them)

| Name | Where it appears | Meaning |
| --- | --- | --- |
| `password` | `POST /login` request only | The password the user typed. It is compared with `Account.password_hash`. |
| `token` | `POST /login` response | Proof of login, sent back in the `Authorization` header. It holds `account_id`, `role`, `student_id`, and `instructor_id`, and expires after 2 hours. Not stored in any table. |
| `count` | `GET /courses` | How many courses matched. |
| `courses`, `sessions`, `students`, `enrollments` | List responses | The list of matching `Course`, `Session`, `Student`, or `Enrollment` rows. In a roster, each item in `students` is the `Student` columns plus the `Enrollment.status`. |
| `enrollment`, `session` | `POST /sessions/{id}/register` 201 response | The new `Enrollment` row, and the session's `session_id`, `max_enrollment`, and updated `enrolled_count`. |
| `error` with `code` and `message` | Every error response | See the error rules at the top. |

## Login

### POST /login

Logs in a student, an instructor, or an administrator. A user counts as logged in only when both the username and the password check pass. Leading and trailing spaces in the username are ignored. Passwords are case-sensitive.

**Request body**

```json
{ "username": "nreinoehl", "password": "<password>" }
```

**200 response.** Fields that do not apply to the role are `null`. An administrator has no `first_name` or `last_name`, so pages show the `username` instead.

```json
{
  "account_id": 1,
  "username": "nreinoehl",
  "role": "student",
  "first_name": "Nathan",
  "last_name": "Reinoehl",
  "student_id": 1,
  "student_number": "1001001",
  "instructor_id": null,
  "token": "<opaque string>"
}
```

An instructor gets `"role": "instructor"`, their `instructor_id`, and `null` for `student_id` and `student_number`.

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 400 | `MISSING_FIELDS` | Please enter your username and password. |
| 401 | `USER_NOT_FOUND` | Username not found. |
| 401 | `INCORRECT_PASSWORD` | Incorrect password. |

This replaces the Sprint 2 `POST /students/login` and the planned `POST /instructors/login`. Students log in with their username, such as `nreinoehl`, not a student number.

## Student endpoints

The examples use the rows in `course_registration_data.sql`.

### GET /courses

Searches the course catalog. Every query parameter is optional, and they combine with AND. With none, it returns every course. Each course carries its sessions, because the instructor and the maximum enrollment are stored on `Session`. No token is needed.

| Query parameter | Matches |
| --- | --- |
| `department` | Exact match on `Course.department` |
| `number` | Case-insensitive contains on `Course.number`, for example `370` or `info` |
| `instructor` | Case-insensitive contains on the `first_name` or `last_name` of the instructor of any of the course's sessions |

**200 response.** No matches is still `200` with an empty list. Example: `GET /courses?number=370`

```json
{
  "count": 1,
  "courses": [
    {
      "course_id": 2,
      "department": "Information Systems",
      "number": "INFO 370",
      "name": "Database Systems",
      "credits": 3,
      "prerequisites": [
        { "course_id": 3, "number": "INFO 325", "name": "Systems Analysis" }
      ],
      "sessions": [
        {
          "session_id": 2,
          "section": "001",
          "days": "TR",
          "time": "10:30 AM - 11:45 AM",
          "location": "Building A Room 101",
          "max_enrollment": 30,
          "enrolled_count": 3,
          "instructor": { "instructor_id": 2, "first_name": "Michael", "last_name": "Brown" }
        }
      ]
    }
  ]
}
```

A course with no sessions returns `"sessions": []`.

### GET /courses/{id}

Returns one course. `{id}` is the `course_id`. The shape matches one item of `GET /courses`, and each session also has `seats_left`. No token is needed.

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 400 | `INVALID_ID` | Invalid course ID. |
| 404 | `NOT_FOUND` | Course not found. |

### GET /sessions/available

**Role:** `student`. Lists the sessions open for registration, each with its course and instructor so the page can show a full card. A full session is still listed so the page can show it with a disabled button.

| Query parameter | Matches |
| --- | --- |
| `course_id` | Exact match on `Session.course_id`. Used when a student arrives from the course details page. |

**200 response**

```json
{
  "sessions": [
    {
      "session_id": 3,
      "course_id": 3,
      "instructor_id": 3,
      "section": "001",
      "days": "MW",
      "time": "01:00 PM - 02:15 PM",
      "location": "Hybrid",
      "max_enrollment": 20,
      "enrolled_count": 2,
      "course": { "course_id": 3, "department": "Information Systems", "number": "INFO 325", "name": "Systems Analysis", "credits": 3 },
      "instructor": { "instructor_id": 3, "first_name": "David", "last_name": "Wilson" }
    }
  ]
}
```

Errors: `401 NOT_LOGGED_IN` and `403 FORBIDDEN`, as in Roles and access.

### POST /sessions/{id}/register

**Role:** `student`. Registers the logged-in student for the session in the path. `{id}` is the `session_id`. The student comes from the token, so the body is empty.

The API runs its checks in this order and stops at the first one that fails:

1. Logged in as a student (`401`, `403`)
2. The session exists (`404 SESSION_NOT_FOUND`)
3. Not already registered for any section of this course (`409 ALREADY_REGISTERED`)
4. Every prerequisite completed (`409 PREREQUISITE_MISSING`)
5. A seat is open (`409 SESSION_FULL`)

Checks 2 to 5 and the new `Enrollment` row happen in one transaction. A refused registration changes nothing: no `Enrollment` row is created and `enrolled_count` stays as it was.

**201 response.** Example: `POST /sessions/3/register` as `jmiller` (student 2)

```json
{
  "message": "Successfully registered for INFO 325, Section 001.",
  "enrollment": { "enrollment_id": 14, "student_id": 2, "session_id": 3, "status": "Enrolled" },
  "session": { "session_id": 3, "max_enrollment": 20, "enrolled_count": 3 }
}
```

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | Please log in to continue. |
| 403 | `FORBIDDEN` | You do not have access to this. |
| 404 | `SESSION_NOT_FOUND` | Session not found. |
| 409 | `ALREADY_REGISTERED` | You are already registered for INFO 325. |
| 409 | `PREREQUISITE_MISSING` | You cannot register for INFO 370 until you complete INFO 325. |
| 409 | `SESSION_FULL` | MKTG 302, Section 001 is full. |

**The prerequisite error.** `PREREQUISITE_MISSING` is the only error with an extra field: `missing` lists every prerequisite the student has not completed, so the page can show each one. Example: `POST /sessions/2/register` (INFO 370) as `jmiller`, who has not completed INFO 325:

```json
{
  "error": {
    "code": "PREREQUISITE_MISSING",
    "message": "You cannot register for INFO 370 until you complete INFO 325.",
    "missing": [
      { "course_id": 3, "number": "INFO 325", "name": "Systems Analysis" }
    ]
  }
}
```

- `missing` is never empty, and it is sorted by course `number`.
- When more than one is missing, the message joins the course numbers with commas and "and": "You cannot register for INFO 465 until you complete INFO 325 and INFO 370."
- A course with no `Prerequisite` rows always passes this check.
- In the test data, `dwhite` (student 5) has completed INFO 325, so registering for INFO 370 passes the check, and `ascott` (student 10) has completed INFO 325 and INFO 370, so INFO 465 passes.

### GET /students/{id}/enrollments

**Role:** `student`, own records only. Returns the sessions the student is registered in. `{id}` is the `student_id`, which the page takes from `getCurrentUser().student_id`. Sorted by course `number`.

**200 response.** Example: `GET /students/1/enrollments` as `nreinoehl`

```json
{
  "student_id": 1,
  "enrollments": [
    {
      "enrollment_id": 1,
      "status": "Enrolled",
      "session": {
        "session_id": 1,
        "section": "001",
        "days": "MW",
        "time": "09:00 AM - 10:15 AM",
        "location": "Online",
        "max_enrollment": 25,
        "enrolled_count": 3,
        "course": { "course_id": 1, "department": "Information Systems", "number": "INFO 465", "name": "Cloud Computing", "credits": 3 },
        "instructor": { "instructor_id": 1, "first_name": "Sarah", "last_name": "Johnson" }
      }
    }
  ]
}
```

A student with no registrations gets `200` with `"enrollments": []`.

| Status | `error.code` | When |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | No valid token |
| 403 | `FORBIDDEN` | The caller is not a student, or `{id}` is a different student |

## Instructor and administrator endpoints

### GET /instructors/{id}/sessions

**Role:** `instructor`, own sessions only. Returns every session assigned to the logged-in instructor, meaning the `Session` rows whose `instructor_id` matches, and only theirs. `{id}` is the `instructor_id`, which the page takes from `getCurrentUser().instructor_id`. Sorted by course `number`, then `section`. The fields cover the Assigned Sessions table: Course, Section, Days, Time, Location.

This path replaces `GET /instructors/{id}/schedule` from the Sprint 2 draft, to match task 9.1 in the Sprint 3 plan.

**200 response.** Example: `GET /instructors/1/sessions` as `sjohnson`

```json
{
  "instructor_id": 1,
  "sessions": [
    {
      "session_id": 1,
      "section": "001",
      "days": "MW",
      "time": "09:00 AM - 10:15 AM",
      "location": "Online",
      "max_enrollment": 25,
      "enrolled_count": 3,
      "course": { "course_id": 1, "department": "Information Systems", "number": "INFO 465", "name": "Cloud Computing", "credits": 3 }
    }
  ]
}
```

An instructor with no assigned sessions gets `200` with `"sessions": []`.

| Status | `error.code` | When |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | No valid token |
| 403 | `FORBIDDEN` | The caller is not an instructor, or `{id}` is a different instructor |

### GET /sessions/{id}/roster

**Role:** `instructor` (assigned to this session) or `administrator`. Returns the students in one session. `{id}` is the `session_id`. The columns match the roster table (Student ID, Name, Status), plus the enrolled count against the maximum. Students are sorted by `last_name`, then `first_name`. Each student shows `student_number`, the ID a person recognizes.

**200 response.** Example: `GET /sessions/1/roster` as `sjohnson` or `admin`

```json
{
  "session_id": 1,
  "section": "001",
  "days": "MW",
  "time": "09:00 AM - 10:15 AM",
  "location": "Online",
  "course": { "course_id": 1, "number": "INFO 465", "name": "Cloud Computing" },
  "enrolled_count": 3,
  "max_enrollment": 25,
  "students": [
    { "student_id": 7, "student_number": "1001007", "first_name": "Olivia", "last_name": "Green", "status": "Enrolled" },
    { "student_id": 2, "student_number": "1001002", "first_name": "John", "last_name": "Miller", "status": "Enrolled" },
    { "student_id": 1, "student_number": "1001001", "first_name": "Nathan", "last_name": "Reinoehl", "status": "Enrolled" }
  ]
}
```

A session with no students gets `200` with `"students": []` and `"enrolled_count": 0`.

The access check runs in this order:

1. `requireRole('instructor', 'administrator')` blocks students and logged-out users.
2. The session must exist, or `404 SESSION_NOT_FOUND`.
3. An administrator passes. An instructor passes only if `Session.instructor_id` equals `req.user.instructor_id`. Otherwise `403 FORBIDDEN`.

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | Please log in to continue. |
| 403 | `FORBIDDEN` | You do not have access to this. (a student) |
| 403 | `FORBIDDEN` | You can only view rosters for sessions you teach. (another instructor) |
| 404 | `SESSION_NOT_FOUND` | Session not found. |

## Future release endpoints (Story 8)

These are planned for the future release and not built in Sprint 3.

| Endpoint | What it does |
| --- | --- |
| `POST /sessions` | **Role:** `administrator`. Creates a session. Body: `course_id`, `instructor_id`, `section`, `days`, `time`, `location`, `max_enrollment`. Returns `201` with the new session, including its `session_id`. `404 COURSE_NOT_FOUND` or `404 INSTRUCTOR_NOT_FOUND` if either id is unknown. |
| `PUT /sessions/{id}` | **Role:** `administrator`. `{id}` is the `session_id`. Updates any of the same fields. Returns `200` with the updated session. Lowering `max_enrollment` below the current `enrolled_count` returns `409 BELOW_CURRENT_ENROLLMENT`. |

Stories 5, 10, and 11 need no page-facing endpoint. The nightly catalog update, the daily enrollment report, and the confirmation email are background jobs. The catalog is read-only inside this system, so there is no `POST` or `PUT` for `/courses`.

## Gaps between the schema and what the app needs

- [x] **No administrator.** Fixed: `Account.role` includes `administrator`, and the test data has an `admin` account.
- [x] **No way to know a course was completed.** Fixed: the `CompletedCourse` table.
- [x] **Duplicate registrations are not blocked by the database.** Fixed: `Enrollment` has a unique rule on `student_id` and `session_id`.
- [ ] **Modality has no column.** The search and details pages show In-Person, Hybrid, or Online, but the schema has no field for it. The data script puts `Online` and `Hybrid` in `Session.location`. Add a `modality` column to `Session`, or drop it from the pages.
- [ ] **Waitlist.** Registration refuses a full session, so nothing creates a `Waitlisted` enrollment. The sample roster page still shows one. Remove it when the roster page is built (task 12.3).
- [ ] **Old test cases.** `tests/login-tests.md` still describes the Sprint 1 login with student numbers. It needs new cases for `POST /login` with usernames and for each role.
