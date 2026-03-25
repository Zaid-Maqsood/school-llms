# School Management System

A production-ready V1 school portal for a school in Georgia, USA.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js, Express                    |
| Database   | PostgreSQL                          |
| Auth       | JWT (httpOnly cookie + Authorization header) |
| File Store | Local filesystem (uploads/)         |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

---

## Quick Setup

### 1. Clone & install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE school_ms;"
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_ms
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

JWT_SECRET=replace_with_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=7d

PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
```

### 4. Run migrations and seed data

```bash
cd backend
npm run migrate    # Creates all tables and indexes
npm run seed       # Populates demo data
```

### 5. Start the backend

```bash
cd backend
npm run dev
# API running at http://localhost:4000
```

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

---

## Demo Login Credentials

| Role       | Email                              | Password     |
|------------|------------------------------------|--------------|
| Admin      | admin@schoolms.com                 | Admin@123    |
| Teacher 1  | james.turner@schoolms.com          | Teacher@123  |
| Teacher 2  | maria.lopez@schoolms.com           | Teacher@123  |
| Parent 1   | robert.johnson@schoolms.com        | Parent@123   |
| Parent 2   | linda.chen@schoolms.com            | Parent@123   |

---

## Seeded Demo Data

- **5 students**: Ethan Johnson (Grade 3), Mia Chen (Grade 4), Lucas Williams (Grade 3), Ava Martinez (Grade 4), Noah Brown (Grade 2)
- **5 subjects**: Math, Reading, Writing, Science, Behavior & Social Skills
- **4 evaluation templates** with 11 questions each (Math, Reading, Writing, Behavior)
- **~50+ evaluations** spanning the past 3 weeks for demo parents to see summaries
- **24 teacher hour records** across both teachers

**Relationships:**
- James Turner → teaches Ethan, Lucas, Noah
- Maria Lopez → teaches Mia, Ava
- Robert Johnson (Parent 1) → Ethan Johnson + Lucas Williams
- Linda Chen (Parent 2) → Mia Chen

---

## Project Structure

```
school-ms/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # PostgreSQL pool
│   │   ├── db/
│   │   │   ├── schema.sql             # Full database schema
│   │   │   ├── migrate.js             # Run schema
│   │   │   └── seed.js                # Demo data
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT authentication
│   │   │   ├── roles.js               # Role-based access
│   │   │   └── upload.js              # Multer file upload
│   │   ├── routes/
│   │   │   ├── auth.js                # POST /api/auth/login, /logout, GET /me
│   │   │   ├── admin/
│   │   │   │   ├── users.js           # User CRUD
│   │   │   │   ├── students.js        # Student CRUD + assignments
│   │   │   │   ├── subjects.js        # Subject CRUD
│   │   │   │   ├── templates.js       # Template + question CRUD
│   │   │   │   ├── teacherHours.js    # Hours CRUD + CSV export
│   │   │   │   └── evaluations.js     # Admin view all + stats
│   │   │   ├── teacher/
│   │   │   │   ├── students.js        # Teacher's assigned students
│   │   │   │   └── evaluations.js     # Eval submission + history
│   │   │   ├── parent/
│   │   │   │   └── children.js        # Parent's children + summaries
│   │   │   └── shared.js              # Uploads, subjects, stats
│   │   ├── services/
│   │   │   ├── summaryService.js      # Rule-based report generation
│   │   │   ├── payrollExportService.js # CSV export for Google Sheets
│   │   │   └── storageService.js      # File storage abstraction
│   │   ├── utils/
│   │   │   └── response.js            # HTTP response helpers
│   │   ├── app.js                     # Express app setup
│   │   └── server.js                  # Server entry point
│   ├── uploads/                       # Local file storage (gitignored)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                       # Axios API layer
    │   │   ├── index.js               # Base client + interceptors
    │   │   ├── auth.js
    │   │   ├── admin.js
    │   │   ├── teacher.js
    │   │   └── parent.js
    │   ├── contexts/
    │   │   └── AuthContext.jsx        # Auth state + login/logout
    │   ├── components/
    │   │   ├── Layout.jsx             # App shell with sidebar nav
    │   │   ├── ProtectedRoute.jsx     # Route guards
    │   │   ├── Modal.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── EmptyState.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── admin/                 # Dashboard, Users, Students, Subjects,
    │   │   │                          # Templates, TeacherHours, Exports, Evaluations
    │   │   ├── teacher/               # Dashboard, Students, StudentDetail,
    │   │   │                          # NewEvaluation, EvaluationHistory
    │   │   └── parent/                # Dashboard, Children, ChildEvaluations, ChildSummary
    │   ├── App.jsx                    # Router + role-based routing
    │   └── index.css                  # Tailwind + component classes
    ├── .env.example
    └── package.json
```

---

## Key Features

### Admin Portal
- Full user management (create/edit/deactivate teachers and parents)
- Student management with teacher and parent assignment
- Subject and evaluation template management (10–15 configurable questions)
- Teacher work hours logging with CRUD
- CSV export compatible with Google Sheets import
- Export history log
- View all evaluations across all students

### Teacher Portal
- View assigned students only
- Submit daily evaluations with dynamic question rendering by subject
- Answer types: rating 1–5, yes/no, short text, single select
- Photo and video attachment upload (JPG, PNG, WebP, MP4, MOV, WebM)
- Evaluation history with filters by student, subject, date

### Parent Portal
- View only their own children
- Evaluation report history with full detail view
- Weekly / monthly / custom range summaries
- Subject-level tabs with:
  - Average score with visual bar
  - Trend indicator (improving / stable / needs attention)
  - Strengths and struggles aggregated from teacher notes
  - AI-free generated narrative summary
  - Recent teacher notes
- Access to child's media attachments

---

## Business Rules Enforced

1. Teachers can only evaluate students assigned to them
2. Parents can only see their own children's data
3. Inactive users cannot log in
4. Inactive students cannot be evaluated
5. Teacher hours can only be managed by admin
6. Subject must have an active template before evaluation
7. All file access is permission-checked
8. CSV export is Google Sheets compatible (UTF-8, comma-separated)

---

## Google Sheets Export

The teacher hours CSV export produces columns:
```
Teacher Full Name, Teacher Email, Date, Hours Worked, Notes, Created At, Updated At
```

**To import into Google Sheets:**
1. Open Google Sheets
2. File → Import
3. Upload the downloaded CSV
4. Separator type: Comma
5. Click Import

The `payrollExportService.js` includes a placeholder comment for adding direct Sheets API integration in future.

---

## Architecture Notes

### Summary Generation
The `summaryService.js` uses rule-based aggregation:
- Averages rating answers per subject per period
- Detects trend by comparing first vs second half of period
- Collects strengths/struggles from teacher-entered text
- Builds a readable narrative paragraph from structured data — no AI required

### File Storage Abstraction
`storageService.js` wraps local filesystem access. To add S3:
1. Install `@aws-sdk/client-s3`
2. Add `STORAGE_PROVIDER=s3` and AWS env vars to `.env`
3. Implement `getFileStream` and `deleteFile` using the S3 SDK

### Auth Flow
1. User logs in → server returns JWT in both response body and httpOnly cookie
2. Frontend stores token in `localStorage` as fallback
3. All API requests attach the token via cookie (primary) or `Authorization` header (fallback)
4. On 401, the Axios interceptor redirects to `/login`

---

## Troubleshooting

**Database connection error:**
```
Error: password authentication failed for user "postgres"
```
→ Check `DB_USER`, `DB_PASSWORD` in `backend/.env`

**Migration fails:**
```
Error: column "..." already exists
```
→ The schema uses `IF NOT EXISTS` — safe to re-run. If persistent, drop and recreate: `psql -U postgres -c "DROP DATABASE school_ms; CREATE DATABASE school_ms;"`

**Frontend shows blank page:**
→ Make sure backend is running on port 4000 and frontend on port 5173. The Vite proxy handles `/api` calls.

**File upload not working:**
→ Ensure `backend/uploads/` directory exists and is writable.
