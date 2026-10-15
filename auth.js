function attemptLogin(studentID, password) {
    logout();

    if (studentID === "" || password === "") {
        return { ok: false, error: "Please enter your Student ID and password." };
    }

    const student = studentAccounts.find(function (account) {
        return account.studentId === studentID;
    });

    if (!student) {
        return { ok: false, error: "Student ID not found." };
    }

    if (student.password !== password) {
        return { ok: false, error: "Incorrect password." };
    }

    sessionStorage.setItem("loggedInStudent", student.studentId);
    return { ok: true };
}

function getLoggedInStudent() {
    return sessionStorage.getItem("loggedInStudent");
}

function logout() {
    sessionStorage.removeItem("loggedInStudent");
}

function requireLogin() {
    if (getLoggedInStudent()) { return true; }
    const page = location.pathname.split("/").pop() || "index.html";
    location.replace("student-login.html?next=" + encodeURIComponent(page + location.search));
    return false;
}

document.addEventListener("DOMContentLoaded", function () {
    const id = getLoggedInStudent();
    const link = document.querySelector('nav a[href="student-login.html"]');

    if (id && link) {
        link.textContent = "Log Out (" + id + ")";
        link.href = "#";
        link.addEventListener("click", function (e) {
            e.preventDefault();
            logout();
            location.href = "student-login.html";
        });
    }
});