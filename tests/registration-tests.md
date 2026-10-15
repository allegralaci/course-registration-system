# Registration Tests

- **User story:** User Story 3: Register for an Available Session
- **Page under test:** `student-registration.html`
- **Tester:** Benedict
- **Result:** 8 of 9 passed, 1 failed

**Acceptance criterion:** Given that a student selects a session that is open for
registration, when the student registers for the session, then the system checks whether
there is an available seat and records the registration if space is available. If the
session is full, the system does not complete the registration.

**Test accounts:** `1001001` / `TestPass123`, `1001002` / `TestPass456`

**Starting session data (from `course-data.js`):**

| Session     | Course   | Enrollment | Open seats |
|-------------|----------|------------|------------|
| INFO320-002 | INFO 320 | 24 / 25    | 1          |
| CS301-001   | CS 301   | 30 / 35    | 5          |
| BUS301-001  | BUS 301  | 40 / 40    | 0 (full)   |

**Precondition for every test:** `student-registration.html` is freshly opened in a
browser (refresh the page between tests). Steps marked **Console** are typed into the
browser's developer console (F12) to test the system's checks directly, for cases the
page's buttons do not allow.

## Summary

| ID        | Test case                                         | Status |
|-----------|---------------------------------------------------|--------|
| TC-REG-01 | Register for a session with an open seat          | Pass   |
| TC-REG-02 | Register button is disabled for a full session    | Pass   |
| TC-REG-03 | Seat check rejects a full session                 | Pass   |
| TC-REG-04 | Duplicate registration is rejected                | Pass   |
| TC-REG-05 | Register without logging in                       | Pass   |
| TC-REG-06 | Register after a failed login                     | Pass   |
| TC-REG-07 | Register for two different sessions               | Pass   |
| TC-REG-08 | Enrolled sessions belong to the logged-in student | Fail   |
| TC-REG-09 | Register for a session that does not exist        | Pass   |

## Test Cases

### TC-REG-01: Register for a session with an open seat

- **Steps:** Log in as `1001001` / `TestPass123`. Click **Register** on INFO 320,
  Section 002.
- **Expected:** A success message appears, enrollment goes from 24 / 25 to 25 / 25, and
  the session moves to "Currently Enrolled Sessions."
- **Actual:** "Successfully registered for INFO 320, Section 002." Enrollment shows
  25 / 25 and the session is listed under Currently Enrolled Sessions.
- **Status:** Pass

### TC-REG-02: Register button is disabled for a full session

- **Steps:** Log in as `1001001` / `TestPass123`. Find BUS 301, Section 001.
- **Expected:** The button reads "Session Full" and cannot be clicked.
- **Actual:** The button reads "Session Full" and is disabled. Enrollment stays 40 / 40.
- **Status:** Pass

### TC-REG-03: Seat check rejects a full session

- **Steps:** Log in as `1001001` / `TestPass123`. **Console:**
  `registerForCourse("BUS301-001")`
- **Expected:** The registration is refused with a "full" message, even though the
  button was bypassed.
- **Actual:** "BUS 301, Section 001 is full." No registration is recorded.
- **Status:** Pass

### TC-REG-04: Duplicate registration is rejected

- **Steps:** Log in as `1001001` / `TestPass123`. Register for INFO 320, Section 002.
  **Console:** `registerForCourse("INFO320-002")`
- **Expected:** The enrolled session shows no Register button, and a second registration
  is refused.
- **Actual:** The enrolled card shows "Status: Enrolled" with no button. The console call
  shows "You are already registered for this session."
- **Status:** Pass

### TC-REG-05: Register without logging in

- **Steps:** Without logging in, click **Register** on CS 301, Section 001.
- **Expected:** An error asks the student to log in, and nothing is recorded.
- **Actual:** "Please log in with valid credentials before registering." Enrollment stays
  30 / 35 and no sessions are listed as enrolled.
- **Status:** Pass

### TC-REG-06: Register after a failed login

- **Steps:** Log in as `1001001` with password `wrongpass`. Click **Register** on CS 301,
  Section 001.
- **Expected:** An error asks the student to log in, and nothing is recorded.
- **Actual:** "Please log in with valid credentials before registering."
- **Status:** Pass

### TC-REG-07: Register for two different sessions

- **Steps:** Log in as `1001001` / `TestPass123`. Click **Register** on INFO 320,
  Section 002, then on CS 301, Section 001.
- **Expected:** Both registrations succeed and both sessions are listed as enrolled.
- **Actual:** "Successfully registered for CS 301, Section 001." Both sessions are listed
  under Currently Enrolled Sessions, and CS 301 enrollment shows 31 / 35.
- **Status:** Pass

### TC-REG-08: Enrolled sessions belong to the logged-in student

- **Steps:** Log in as `1001001` / `TestPass123` and register for INFO 320, Section 002.
  Without refreshing, log in as `1001002` / `TestPass456`.
- **Expected:** Student 1001002 has no enrolled sessions. INFO 320 appears as a full
  session that 1001002 cannot register for.
- **Actual:** INFO 320 is still listed under Currently Enrolled Sessions while 1001002 is
  logged in. Enrolled sessions are shared by everyone who logs in on the page instead of
  being recorded per student.
- **Status:** Fail

### TC-REG-09: Register for a session that does not exist

- **Steps:** Log in as `1001001` / `TestPass123`. **Console:**
  `registerForCourse("FAKE-999")`
- **Expected:** An error appears and nothing is recorded.
- **Actual:** "Session not found."
- **Status:** Pass

## Defects

- **TC-REG-08:** Registrations are not tied to a student ID, so the enrolled list shows
  the same sessions to every student who logs in. This belongs with the "Record the
  student's registration" task.

## Notes

- Registrations are stored only while the page is open and are lost on refresh. Keeping
  them after a refresh is still an open part of "Record the student's registration."
