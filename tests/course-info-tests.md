# Course Information Tests

- **User story:** User Story 4: View Course Details
- **Pages under test:** `course-details.html`, `course-search.html`
- **Tester:** Benedict
- **Result:** 9 of 10 passed, 1 failed

**Acceptance criterion:** The system should display the course name, course number,
number of credits, prerequisites of the course, max enrollment, and the student can view
course details before registering.

**Sprint 1 measurable outcome:** Course information shown to students (credits,
professor, time, enrollment size) matches the database in every search.

**Source of truth:** `course-data.js`. Every value the pages show is compared against it.

**Precondition for every test:** No student needs to be logged in. Open the page fresh in
a browser.

## Summary

| ID         | Test case                                              | Status |
|------------|--------------------------------------------------------|--------|
| TC-INFO-01 | Details page shows the required course fields          | Pass   |
| TC-INFO-02 | Max enrollment is shown for a course with a session    | Pass   |
| TC-INFO-03 | Max enrollment is shown for a course with no session   | Fail   |
| TC-INFO-04 | Session days, times, and location are shown            | Pass   |
| TC-INFO-05 | Available seats are calculated correctly               | Pass   |
| TC-INFO-06 | Details page matches the data for all 7 courses        | Pass   |
| TC-INFO-07 | Search results match the data for all 7 courses        | Pass   |
| TC-INFO-08 | A search result opens the details of that course       | Pass   |
| TC-INFO-09 | Course details can be viewed without logging in        | Pass   |
| TC-INFO-10 | Continue to Registration keeps the chosen course       | Pass   |

## Test Cases

### TC-INFO-01: Details page shows the required course fields

- **Steps:** Open `course-details.html` and choose **CS 301 - Web Application
  Development**.
- **Expected:** Course name, course number, credits, professor, and prerequisites are
  all shown.
- **Actual:** Web Application Development, CS 301, 3 credits, Mark Zuckerberg, CS 201.
- **Status:** Pass

### TC-INFO-02: Max enrollment is shown for a course with a session

- **Steps:** Open `course-details.html` and choose **CS 301**.
- **Expected:** Maximum Enrollment shows 35.
- **Actual:** Section 001 shows "Maximum Enrollment: 35".
- **Status:** Pass

### TC-INFO-03: Max enrollment is shown for a course with no session

- **Steps:** Open `course-details.html` and choose **INFO 301 - Database Management
  Systems**.
- **Expected:** Maximum Enrollment shows 30, the course's value in `course-data.js`.
- **Actual:** Max enrollment is not shown anywhere. The page only says "No session details
  are currently available for this course." The same happens for CS 350, MATH 200, and
  ENGL 301.
- **Status:** Fail

### TC-INFO-04: Session days, times, and location are shown

- **Steps:** Open `course-details.html` and choose **CS 301**.
- **Expected:** Meeting days MW, 2:00 PM to 3:15 PM, Science Building 105.
- **Actual:** "Meeting Days: MW", "Start Time: 2:00 PM", "End Time: 3:15 PM",
  "Location: Science Building 105".
- **Status:** Pass

### TC-INFO-05: Available seats are calculated correctly

- **Steps:** Open `course-details.html`. Choose **CS 301**, then **BUS 301**.
- **Expected:** CS 301 shows 5 available seats (30 of 35 enrolled). BUS 301 shows 0
  (40 of 40 enrolled).
- **Actual:** CS 301 shows "Available Seats: 5". BUS 301 shows "Available Seats: 0".
- **Status:** Pass

### TC-INFO-06: Details page matches the data for all 7 courses

- **Steps:** Open `course-details.html` and choose each of the 7 courses in turn. Compare
  name, number, credits, professor, prerequisites, and modality with `course-data.js`.
- **Expected:** Every value matches.
- **Actual:** All 42 values (6 fields for each of 7 courses) match.
- **Status:** Pass

### TC-INFO-07: Search results match the data for all 7 courses

- **Steps:** Open `course-search.html` with no filters. Compare each result card's
  department, instructor, credit hours, prerequisites, modality, and maximum enrollment
  with `course-data.js`.
- **Expected:** Every value matches.
- **Actual:** All 42 values (6 fields for each of 7 courses) match.
- **Status:** Pass

### TC-INFO-08: A search result opens the details of that course

- **Steps:** Open `course-search.html`. On the CS 301 result, click **Register for
  Session**.
- **Expected:** `course-details.html` opens with CS 301 selected.
- **Actual:** The page opens at `course-details.html?course=CS%20301` with CS 301
  selected and its details shown.
- **Status:** Pass

### TC-INFO-09: Course details can be viewed without logging in

- **Steps:** Without logging in, open `course-details.html`.
- **Expected:** Course details are shown, so a student can review a course before
  registering.
- **Actual:** The page shows course details with no login required.
- **Status:** Pass

### TC-INFO-10: Continue to Registration keeps the chosen course

- **Steps:** Open `course-details.html` and choose **CS 301**. Click **Continue to
  Registration**.
- **Expected:** The registration page opens for CS 301.
- **Actual:** The link opens `student-registration.html?course=CS%20301`.
- **Status:** Pass

## Defects

- **TC-INFO-03:** `course-details.html` only shows max enrollment inside a session, so
  courses with no sessions (INFO 301, CS 350, MATH 200, ENGL 301) never show it. The
  acceptance criterion requires max enrollment for every course. Showing the course's
  `maximumEnrollment` in the Course Information section would fix it.

## Notes

- The button on each search result still reads **Register for Session**, but it now opens
  the course details page. A label such as **View Details** would match what it does.
- Opening `course-details.html` with a course code that does not exist (for example
  `?course=FAKE`) shows INFO 301 without any message.
