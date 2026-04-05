MUST Website + Admin Dashboard
==============================

Stack used
- Backend: Node.js + Express
- Database: SQLite
- Sessions: express-session + connect-sqlite3
- Password hashing: bcryptjs
- Email sending: nodemailer

Why SQLite?
- It is the simplest real database for this project.
- No separate database server is needed.
- Everything stays in one local file inside `data/app.db`.
- It is easy to run, backup, and move with the project.

Features implemented
- User registration
- Account activation by email link
- Login / logout
- Contact Us form storage
- Admin dashboard content management
- Admin dashboard user management
- Admin dashboard contact message review

Important business rules
- Registration accepts only MUST emails in this format:
  `username@must.edu.eg`
- New users cannot login until they activate their account from the email link.
- Regular users can use the website only.
- The admin dashboard is for active users whose role is `admin` only.

Default admin account
- Email: `admin@must.edu.eg`
- Password: `MustAdmin2026!`

How to run
1. Open a terminal in the project folder.
2. Run `npm install` if dependencies are not installed yet.
3. Run `npm run dev`
4. Open the website at:
   `http://127.0.0.1:3000/website/index.html`
5. Open the dashboard at:
   `http://127.0.0.1:3000/admin-dashboard/admin-dashboard.html`

Email activation
- If SMTP variables are configured in your environment, emails will be sent normally.
- If SMTP is not configured yet, activation links are written to:
  `data/mail-log.txt`

Optional environment variables
- `PORT`
- `BASE_URL`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
