// Shared course data
const testCourses = [
    {
        code: "INFO 301",
        department: "Information Systems",
        number: "301",
        name: "Database Management Systems",
        instructor: "Michael McGarry",
        credits: 3,
        prerequisites: "INFO 201",
        modality: "In-Person",
        maximumEnrollment: 30,
        sessions: []
    },
    {
        code: "INFO 320",
        department: "Information Systems",
        number: "320",
        name: "Systems Analysis and Design",
        instructor: "Michael McGarry",
        credits: 3,
        prerequisites: "INFO 201",
        modality: "Hybrid",
        maximumEnrollment: 25,
        sessions: []
    },
    {
        code: "CS 301",
        department: "Computer Science",
        number: "301",
        name: "Web Application Development",
        instructor: "Mark Zuckerberg",
        credits: 3,
        prerequisites: "CS 201",
        modality: "In-Person",
        maximumEnrollment: 35,
        sessions: []
    },
    {
        code: "CS 350",
        department: "Computer Science",
        number: "350",
        name: "Data Structures",
        instructor: "Alan Turing",
        credits: 3,
        prerequisites: "CS 250",
        modality: "In-Person",
        maximumEnrollment: 30,
        sessions: []
    },
    {
        code: "BUS 301",
        department: "Business",
        number: "301",
        name: "Business Analytics",
        instructor: "Bill Gates",
        credits: 3,
        prerequisites: "BUS 200",
        modality: "Hybrid",
        maximumEnrollment: 40,
        sessions: []
    },
    {
        code: "MATH 200",
        department: "Mathematics",
        number: "200",
        name: "Calculus II",
        instructor: "Stephen Hawkings",
        credits: 4,
        prerequisites: "MATH 100",
        modality: "In-Person",
        maximumEnrollment: 35,
        sessions: []
    },
    {
        code: "ENGL 301",
        department: "English",
        number: "301",
        name: "Advanced Composition",
        instructor: "William Shakespear",
        credits: 3,
        prerequisites: "ENGL 200",
        modality: "Online",
        maximumEnrollment: 25,
        sessions: []
    }
];

// Shared session data
const sessions = [
    {
        id: "INFO320-002",
        courseCode: "INFO 320",
        section: "002",
        days: "TR",
        startTime: "1:00 PM",
        endTime: "2:15 PM",
        location: "Business Building 305",
        currentEnrollment: 24,
        maximumEnrollment: 25,
        initiallyEnrolled: false
    },
    {
        id: "CS301-001",
        courseCode: "CS 301",
        section: "001",
        days: "MW",
        startTime: "2:00 PM",
        endTime: "3:15 PM",
        location: "Science Building 105",
        currentEnrollment: 30,
        maximumEnrollment: 35,
        initiallyEnrolled: false
    },
    {
        id: "BUS301-001",
        courseCode: "BUS 301",
        section: "001",
        days: "TR",
        startTime: "9:30 AM",
        endTime: "10:45 AM",
        location: "Business Building 120",
        currentEnrollment: 40,
        maximumEnrollment: 40,
        initiallyEnrolled: false
    }
];

// Link each session to its corresponding course.
sessions.forEach(function(session) {
    const course = testCourses.find(function(course) {
        return course.code === session.courseCode;
    });

    if (course) {
        course.sessions.push(session);
    }
});

// Shared student test accounts
const studentAccounts = [
    {
        studentId: "1001001",
        password: "TestPass123"
    },
    {
        studentId: "1001002",
        password: "TestPass456"
    },
    {
        studentId: "1001003",
        password: "TestPass789"
    }
];
