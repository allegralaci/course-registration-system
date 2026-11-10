// auth.js - the shared login and role check for every page.
// Load it in the <head> of each page, then guard the page:
//   <script src="auth.js"></script>
//   <script>requirePage();</script>
//
// Which roles may open each page is listed once, in PAGE_ROLES below. The API
// checks the role again on every request, so hiding a page here is for the
// user's convenience, not for security.

// null means anyone, even when logged out. A page missing from this list
// needs a login, but any role may open it.
const PAGE_ROLES = {
    "index.html": null,
    "login.html": null,
    "course-search.html": ["student", "instructor", "administrator"],
    "course-details.html": ["student", "instructor", "administrator"],
    "student-registration.html": ["student"],
    "my-schedule.html": ["student"],
    "instructor-schedule.html": ["instructor"],
    "session-enrollment.html": ["instructor", "administrator"]
};

// Where each role lands after logging in, or after opening a page it may not see.
const HOME_PAGE = {
    student: "course-search.html",
    instructor: "instructor-schedule.html",
    administrator: "session-enrollment.html"
};

const USER_KEY = "currentUser";
const TOKEN_KEY = "authToken";
const FLASH_KEY = "flashMessage";

// ---------- Who is logged in ----------

// Reads the expiry time inside the token. The page cannot check the token's
// signature (only the server can), but it can tell when the token has expired.
function tokenExpired(token) {
    try {
        const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(part));
        return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
    } catch (error) {
        return true;
    }
}

// The logged-in user, or null. Fields:
//   role ("student", "instructor", or "administrator"), username,
//   first_name, last_name, student_id, student_number, instructor_id
function getCurrentUser() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const saved = sessionStorage.getItem(USER_KEY);

    if (!token || !saved || tokenExpired(token)) {
        if (token || saved) {
            logout();
        }
        return null;
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        logout();
        return null;
    }
}

function getRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

function getAuthToken() {
    return getCurrentUser() ? sessionStorage.getItem(TOKEN_KEY) : null;
}

// The name to show in the page, such as "Nathan Reinoehl" or "admin".
function displayName(user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return name || user.username;
}

function homePageFor(role) {
    return HOME_PAGE[role] || "index.html";
}

// ---------- Logging in and out ----------

async function attemptLogin(username, password) {
    if (username.trim() === "" || password.trim() === "") {
        return { ok: false, error: "Please enter your username and password." };
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim(), password: password })
        });

        const data = await response.json().catch(function () {
            return {};
        });

        if (!response.ok) {
            return {
                ok: false,
                error: (data.error && data.error.message) || "Login failed. Please try again."
            };
        }

        // Start clean so nothing from an earlier user is left behind.
        logout();

        // Remember the user and their role for this browser tab.
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(USER_KEY, JSON.stringify({
            role: data.role,
            username: data.username,
            first_name: data.first_name,
            last_name: data.last_name,
            student_id: data.student_id,
            student_number: data.student_number,
            instructor_id: data.instructor_id
        }));

        return { ok: true, user: getCurrentUser() };
    } catch (error) {
        return { ok: false, error: "Unable to connect to the server. Please try again." };
    }
}

function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    // Left by the Sprint 2 student-only login.
    sessionStorage.removeItem("loggedInStudent");
    sessionStorage.removeItem("loggedInStudentData");
}

// ---------- The page check ----------

function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
}

// May this role open this page? Used by requirePage and by the menu.
function canOpenPage(page, role) {
    if (!(page in PAGE_ROLES)) {
        return role !== null;
    }

    const roles = PAGE_ROLES[page];
    return roles === null || (role !== null && roles.includes(role));
}

// Call at the top of every protected page.
//   Not logged in -> sent to the login page, then brought back here after login.
//   Wrong role    -> sent to their own home page with a message.
// Returns true when the page may load.
function requirePage() {
    const page = currentPage();
    const user = getCurrentUser();

    if (canOpenPage(page, user ? user.role : null)) {
        return true;
    }

    if (!user) {
        location.replace("login.html?next=" + encodeURIComponent(page + location.search));
    } else {
        sessionStorage.setItem(FLASH_KEY, "You do not have access to that page.");
        location.replace(homePageFor(user.role));
    }

    return false;
}

// Where to go after logging in: the page the user was sent away from, if it is
// a page on this site that their role may open, or else their home page.
function pageAfterLogin(role) {
    const next = new URLSearchParams(location.search).get("next") || "";
    const safe = /^[\w-]+\.html(\?[^#]*)?$/.test(next);

    if (safe && canOpenPage(next.split("?")[0], role)) {
        return next;
    }

    return homePageFor(role);
}

// ---------- Calling the API ----------

// Calls the API with the user's token. Returns { ok, status, data }.
// If the token is missing or expired (401), logs the user out and sends them
// to the login page. A 403 is returned to the page so it can show data.error.message.
async function apiFetch(path, options) {
    const settings = Object.assign({}, options);
    settings.headers = Object.assign({}, settings.headers, {
        "Authorization": "Bearer " + getAuthToken()
    });

    if (settings.body && typeof settings.body !== "string") {
        settings.headers["Content-Type"] = "application/json";
        settings.body = JSON.stringify(settings.body);
    }

    const response = await fetch(path, settings);
    const data = await response.json().catch(function () {
        return {};
    });

    if (response.status === 401) {
        logout();
        requirePage();
        throw new Error("NOT_LOGGED_IN");
    }

    return { ok: response.ok, status: response.status, data: data };
}

// ---------- Used by the Sprint 2 student pages ----------
// Kept so student-registration.html, course-search.html, and
// course-details.html work without changes.

function requireLogin() {
    return requirePage();
}

function getLoggedInStudent() {
    const user = getCurrentUser();
    return user && user.role === "student" ? String(user.student_id) : null;
}

function getLoggedInStudentData() {
    const user = getCurrentUser();

    if (!user || user.role !== "student") {
        return null;
    }

    return {
        student_id: user.student_id,
        first_name: user.first_name,
        last_name: user.last_name
    };
}

// ---------- The menu ----------

document.addEventListener("DOMContentLoaded", function () {
    const user = getCurrentUser();
    const role = user ? user.role : null;

    // Hide links to pages this user may not open. Logged-out users still see
    // them, and are asked to log in when they click one.
    if (user) {
        document.querySelectorAll("nav a, .home-options a").forEach(function (link) {
            const page = (link.getAttribute("href") || "").split("?")[0];

            if (page.endsWith(".html") && !canOpenPage(page, role)) {
                link.hidden = true;
            }
        });
    }

    // Turn the Log In link into Log Out.
    const loginLink = document.querySelector('nav a[href="login.html"]');

    if (user && loginLink) {
        loginLink.textContent = "Log Out (" + displayName(user) + ")";
        loginLink.href = "#";

        loginLink.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
            location.href = "login.html";
        });
    }

    // Show a message saved by requirePage before it redirected here.
    const flash = sessionStorage.getItem(FLASH_KEY);
    const main = document.querySelector("main");

    if (flash && main) {
        sessionStorage.removeItem(FLASH_KEY);

        const message = document.createElement("div");
        message.className = "message error";
        message.style.display = "block";
        message.textContent = flash;
        main.insertBefore(message, main.firstChild);
    }
});
