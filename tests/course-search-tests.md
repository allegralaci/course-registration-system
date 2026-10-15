# Course Search Tests

**Tester:** Laci  
**Date:** October 15, 2026  
**Test status:** All 6 tests passed

## Test 1: Display All Courses

- **Action:** Opened the course search page without entering any filters.
- **Expected result:** All 7 courses appear.
- **Actual result:** All 7 courses appeared.
- **Status:** PASS

## Test 2: Search by Department

- **Action:** Selected Business and clicked Search Courses.
- **Expected result:** Only BUS 301 - Business Analytics appears.
- **Actual result:** Only BUS 301 - Business Analytics appeared.
- **Status:** PASS

## Test 3: Search by Instructor

- **Action:** Entered Michael McGarry in the Instructor field and clicked Search Courses.
- **Expected result:** INFO 301 and INFO 320 appear.
- **Actual result:** INFO 301 and INFO 320 appeared.
- **Status:** PASS

## Test 4: Search by Course Number

- **Action:** Entered 301 in the Course Number field and clicked Search Courses.
- **Expected result:** INFO 301, CS 301, BUS 301, and ENGL 301 appear.
- **Actual result:** All four expected courses appeared.
- **Status:** PASS

## Test 5: Search with No Matching Results

- **Action:** Entered ZZZ999 in the Course Number field and clicked Search Courses.
- **Expected result:** The page shows 0 courses found and a No Courses Found message.
- **Actual result:** The page showed 0 courses found and the No Courses Found message.
- **Status:** PASS

## Test 6: Clear Search Filters

- **Action:** Clicked Clear after the no-results search.
- **Expected result:** All filters reset and all 7 courses appear again.
- **Actual result:** All filters reset and all 7 courses returned.
- **Status:** PASS

## Summary

All six course search tests passed during manual testing in the local browser. The tests checked the initial course list, department filtering, instructor filtering, course number filtering, searches with no matches, and clearing filters.

All six course search tests passed during manual testing in the local browser. The tests checked the initial course list, department filtering, instructor filtering, course number filtering, searches with no matches, and clearing filters.
