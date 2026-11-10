# Course Registration System

A web-based course registration system for INFO 465 (VCU, Fall 2026). Students can log in, search the course catalog, view course details, and register for open sessions. The system keeps enrollment accurate and never lets a session go over capacity.

## Team

- Benedict Kim
- Ryan Brown
- Nathan Reinoehl
- Laci Allegra

## How the System Works

- Website: HTML, CSS, and JavaScript pages, served by the Express app.
- API: Node.js and Express (REST), running on Amazon EC2 with Amazon Linux 2023.
- Database: MySQL on Amazon RDS, in a private subnet that only the app server can reach.

The browser sends requests to the API. The API applies the rules, such as seat limits and no duplicate registrations, reads and writes the database, and sends the results back to the page.

## Database Scripts

- `course_registration_schema.sql` creates the database and its tables.
- `course_registration_data.sql` loads the test data.

Run the schema script first, then the data script.

## Local Setup

This runs the whole system on your own computer: the website, the API, and a local copy of the database. The real database on AWS sits in a private subnet that only the app server can reach, so your computer cannot connect to it. Use a local MySQL instead.

### What You Need

- **Git** from git-scm.com. Check it with `git --version`.
- **Node.js 18 or newer** (the LTS version) from nodejs.org. Check it with `node -v`.
- **MySQL Server 8.0 or newer.** Newer version numbers are fine. Remember the root password you choose while installing.
  - **Windows:** download **MySQL Installer** from dev.mysql.com/downloads/installer/. Choose **Server only**, keep the default settings, and skip the sample databases if it offers them.
  - **Mac with Homebrew:** run `brew install mysql` and then `brew services start mysql`. Homebrew sets no root password, so just press Enter when MySQL asks for one.

### 1. Get the Code

Run these in a terminal. Use the address from the green **Code** button on the repository's GitHub page.

```
git clone <repository address>
cd <the folder it created>
```

Run every remaining command from inside that folder.

### 2. Install the Dependencies

```
npm install
```

Run it in the same folder you start the app from, because each copy of the project needs its own. Run it again after any `git pull` that changes `package.json`.

### 3. Create the Local Database

Start the MySQL client from the repository folder and sign in as root:

```
mysql -u root -p
```

On Windows, Command Prompt usually cannot find `mysql`, because the installer does not add it to your path. Use the full path instead, still from the repository folder. Open `C:\Program Files\MySQL` to see your folder name, and replace `MySQL Server 8.0` below if yours is different:

```
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

When you type the password, nothing shows on screen. That is normal.

At the `mysql>` prompt, run the two scripts in this order, then create a login for the app:

```
source course_registration_schema.sql;
source course_registration_data.sql;
CREATE USER 'course_app'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON course_registration.* TO 'course_app'@'localhost';
```

Replace `choose-a-password` with a password of your own, and remember it for step 4. Use only letters and numbers, because characters such as `#` can break the `.env` file. Then check the data loaded:

```
SELECT COUNT(*) FROM Student;
```

It should show `10`. Type `exit` to leave the MySQL client.

### 4. Create Your .env File

The `.env` file holds your private database settings. Git ignores it, so it never goes to GitHub.

Copy the example file (on Windows Command Prompt, use `copy` instead of `cp`):

```
cp .env.example .env
```

Open `.env` in any text editor and fill it in:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=course_app
DB_PASSWORD=the password you chose in step 3
DB_NAME=course_registration
PORT=3000
JWT_SECRET=a long random value
```

`JWT_SECRET` signs login tokens, and nobody can log in without it. Make one with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start the App

```
npm start
```

The terminal should print `Course registration system running on port 3000` followed by `Database connection OK`. Then check it in your browser:

- `http://localhost:3000` shows the home page.
- `http://localhost:3000/health` shows `{"status":"ok","database":"connected"}`.

Only the `Database connection OK` line and the `/health` page prove the database is connected.

Press Ctrl+C in the terminal to stop the app.

### Test Accounts

Everyone logs in on `login.html` with a username and password. These are fake accounts for testing only.

| Role | Usernames | Password |
| --- | --- | --- |
| Student | `nreinoehl` | `TestPass123` |
| Student | `jmiller` | `TestPass456` |
| Student | `ecarter`, `jlee`, `dwhite`, `smartin`, `ogreen`, `jharris`, `eyoung`, `ascott` | `Pass1003` to `Pass1010`, in that order |
| Instructor | `sjohnson`, `mbrown`, `dwilson`, `edavis`, `jsmith`, `mmcgarry` | `TestPass123` |
| Administrator | `admin` | `AdminPass123` |

After logging in, each role lands on its own page and the menu shows only the pages that role may open. Students go to Course Search, instructors to Instructor Schedule, and the administrator to Session Enrollment. The list of which roles may open each page is `PAGE_ROLES` in `public/auth.js`.

### Start the Database Over

If the test data gets messy or a script fails halfway, rebuild it. The scripts cannot run twice on their own, so delete the database first:

```
mysql -u root -p
DROP DATABASE course_registration;
source course_registration_schema.sql;
source course_registration_data.sql;
```

The `course_app` login keeps its access, so `.env` does not need to change.

### Troubleshooting

| What you see | What to do |
| --- | --- |
| `mysql` is not recognized | Windows does not know where MySQL is. Use the full path to `mysql.exe` shown in step 3. You can also open "MySQL Command Line Client" from the Start menu, and give `source` the full path with forward slashes, such as `source C:/Users/you/course-registration-system/course_registration_schema.sql;`. |
| `Missing database settings: ...` | `.env` is missing, or it is not in the repository folder. Redo step 4. |
| `Cannot find module '...'` (any name) | Run `npm install` in the same folder you start the app from. Each copy of the project needs its own. |
| `EADDRINUSE` | Port 3000 is already in use. Set `PORT=3001` in `.env` and use that port in the browser. |
| `ER_ACCESS_DENIED_ERROR` | The username or password in `.env` does not match the login from step 3. |
| `ER_BAD_DB_ERROR` | The database does not exist yet. Run the two scripts in step 3. |
| `ECONNREFUSED` | MySQL is not running, or `DB_HOST` or `DB_PORT` is wrong. Start MySQL and check `.env`. |
| `Cannot GET /` in the browser | The pages are not in the `public` folder. Check that you are on the latest `main`. |

Never commit your `.env` file or any password. This repository is public.

## How We Work

### Branches

- `main` always works. It is the only branch deployed to AWS, and nobody commits to it directly.
- Every task gets its own branch, named after its task ID in the current sprint plan, in lowercase with hyphens. Examples: `t1-7-api-project`, `2-2-search-page`.
- Before starting a task, get the latest `main` and create your branch from it.

### Commits

- Keep commits small, and start each message with the task ID. Example: `T1.7: Add database connection`.

### Pull Requests

- When a task is finished, open a pull request into `main`. Title it with the task ID and name, such as `T1.7: Set up API project`.
- In the description, say what changed and how to test it.
- One teammate must review and approve before merging. The reviewer checks that the code runs and that it completes the task.
- After approval, the author merges and deletes the branch.
- If `main` changed while you worked, bring the latest `main` into your branch and fix any conflicts before merging.

### Never Commit

- Passwords, the database endpoint, `.env` files, or `.pem` key files. This repository is public.
- The `node_modules` folder.

### Deployment

- Only `main` is deployed. Benedict pulls it onto the AWS server during team AWS sessions.

### Quick Reference (VS Code)

**1. Start a task**

- Click the branch name in the bottom-left corner of VS Code and choose `main`.
- Open Source Control (the branch icon on the left) and click **Sync Changes** to get the latest version.
- Click the branch name in the bottom-left again, choose **Create new branch**, and name it after your task, like `t1-7-api-project`.
- The bottom-left now shows your branch name. Always check it before you start working.

**2. Save your work**

- In Source Control, type a short message starting with your task ID, like `T1.7: Add database connection`.
- Click **Commit**. If it asks to stage all changes, click **Yes**.

**3. Upload your work**

- Click **Publish Branch** the first time, or **Sync Changes** after that.

**4. Finish the task**

- Open the repository on GitHub and click **Compare & pull request** on the yellow banner.
- Give it your task ID and name as the title, then click **Create pull request**.
- Ask a teammate to review it. After they approve, click **Merge**.
