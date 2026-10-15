# Login Tests

| Field           | Value                                               |
| --------------- | --------------------------------------------------- |
| User story      | User Story 1: Student Login                         |
| Page under test | `student-registration.html` (Student Login section) |
| Tester          | Benedict                                            |
| Result          | 10 of 10 passed                                     |

**Acceptance criterion:** Given that a student has valid login information, when the
student submits their login information, then the system allows the student to access
the course registration system.

**Test accounts:** `1001001` / `TestPass123`, `1001002` / `TestPass456`

**Precondition for every test:** `student-registration.html` is open in a browser and
no student is logged in (refresh the page between tests).

## Summary

| ID          | Test case                           | Status |
| ----------- | ----------------------------------- | ------ |
| TC-LOGIN-01 | Valid login                         | Pass   |
| TC-LOGIN-02 | Second valid account                | Pass   |
| TC-LOGIN-03 | Wrong password                      | Pass   |
| TC-LOGIN-04 | Unknown student ID                  | Pass   |
| TC-LOGIN-05 | Blank student ID                    | Pass   |
| TC-LOGIN-06 | Blank password                      | Pass   |
| TC-LOGIN-07 | Both fields blank                   | Pass   |
| TC-LOGIN-08 | Student ID with extra spaces        | Pass   |
| TC-LOGIN-09 | Password with wrong letter case     | Pass   |
| TC-LOGIN-10 | Student ID changed after logging in | Pass   |

## Test Cases

### TC-LOGIN-01: Valid login

- **Steps:** Enter Student ID `1001001` and password `TestPass123`. Click **Log In**.
- **Expected:** A green success message appears and the student is logged in.
- **Actual:** "Login successful. You can now register for sessions."
- **Status:** Pass

### TC-LOGIN-02: Second valid account

- **Steps:** Enter Student ID `1001002` and password `TestPass456`. Click **Log In**.
- **Expected:** A green success message appears and the student is logged in.
- **Actual:** "Login successful. You can now register for sessions."
- **Status:** Pass

### TC-LOGIN-03: Wrong password

- **Steps:** Enter Student ID `1001001` and password `wrongpass`. Click **Log In**.
- **Expected:** A red error message appears and the student is not logged in.
- **Actual:** "Incorrect password."
- **Status:** Pass

### TC-LOGIN-04: Unknown student ID

- **Steps:** Enter Student ID `9999999` and password `TestPass123`. Click **Log In**.
- **Expected:** A red error message appears and the student is not logged in.
- **Actual:** "Student ID not found."
- **Status:** Pass

### TC-LOGIN-05: Blank student ID

- **Steps:** Leave Student ID blank and enter password `TestPass123`. Click **Log In**.
- **Expected:** A red error message asks for both fields.
- **Actual:** "Please enter your Student ID and password."
- **Status:** Pass

### TC-LOGIN-06: Blank password

- **Steps:** Enter Student ID `1001001` and leave the password blank. Click **Log In**.
- **Expected:** A red error message asks for both fields.
- **Actual:** "Please enter your Student ID and password."
- **Status:** Pass

### TC-LOGIN-07: Both fields blank

- **Steps:** Leave both fields blank. Click **Log In**.
- **Expected:** A red error message asks for both fields.
- **Actual:** "Please enter your Student ID and password."
- **Status:** Pass

### TC-LOGIN-08: Student ID with extra spaces

- **Steps:** Enter Student ID `  1001001  ` (spaces before and after) and password
  `TestPass123`. Click **Log In**.
- **Expected:** The spaces are ignored and login succeeds.
- **Actual:** "Login successful. You can now register for sessions."
- **Status:** Pass

### TC-LOGIN-09: Password with wrong letter case

- **Steps:** Enter Student ID `1001001` and password `testpass123`. Click **Log In**.
- **Expected:** A red error message appears, because passwords are case-sensitive.
- **Actual:** "Incorrect password."
- **Status:** Pass

### TC-LOGIN-10: Student ID changed after logging in

- **Steps:** Log in as `1001001` / `TestPass123`. Change the Student ID field to `1001002`
  without logging in again. Click **Register** on any open session.
- **Expected:** Registration is blocked until the new ID logs in.
- **Actual:** "Please log in with valid credentials before registering."
- **Status:** Pass

## Notes

- The test account list still contains a placeholder account (Student ID `ID`, password
  `password`). It should be removed before the final review.
- `student-login.html` is a separate login page with no login logic yet. These tests cover
  the login on `student-registration.html`, which is the one connected to registration.
  The team should decide whether to connect or remove `student-login.html`.
- Trying to register without logging in at all is covered in the registration tests.
