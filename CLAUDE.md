# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A school management portal for a school in Georgia with role-based access (Admin, Teacher, Parent). Full-stack monorepo: React 18 + Vite frontend, Node.js + Express backend, PostgreSQL database.

## Commands

### Backend (`/backend`)
```bash
npm run dev        # Development server with nodemon (port 4000)
npm start          # Production server
npm run migrate    # Initialize database schema
npm run seed       # Populate demo data
npm run setup      # migrate + seed together
```

### Frontend (`/frontend`)
```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build
npm run preview    # Preview production build
```

### Database Setup (first time)
```bash
cd backend && npm run setup
```

No test suite exists in this project.

## Architecture

### Auth Flow
- JWT stored in **httpOnly cookies** (primary) with `localStorage` as fallback
- Backend: `src/middleware/auth.js` verifies token, checks user active status, attaches `req.user`
- Frontend: Axios interceptor in `src/api/index.js` attaches token from localStorage; 401 redirects to `/login`
- Role enforcement: `src/middleware/roles.js` — `requireRole(...roles)` middleware factory

### Backend Route Structure
Routes in `backend/src/app.js` are organized by role:
- Public: `/api/auth` — login, logout, me
- Shared (authenticated): `/api` — uploads, subjects, stats
- Admin only: `/api/admin/*` — users, students, subjects, templates, teacher hours, evaluations
- Teacher only: `/api/teacher/*` — assigned students, evaluations
- Parent only: `/api/parent/*` — own children and their evaluations

### Frontend Routing
`frontend/src/App.jsx` uses React Router v6 with a `ProtectedRoute` component that checks `user.role`. Each role has its own page tree under `src/pages/{admin,teacher,parent}/`.

### Database
PostgreSQL with UUID primary keys. Key relationships:
- `student_teachers` and `student_parents` are explicit M:N join tables — teachers and parents only see their assigned students
- `evaluations` has a unique constraint on `(student_id, teacher_id, subject_id, date)`
- `evaluation_answers` stores polymorphic responses (rating, yes_no, text, select) per question

### Summary Generation
`backend/src/services/summaryService.js` generates rule-based (no AI) narrative summaries from evaluation data. Calculates averages, trends, and behavior ratios; supports weekly/monthly/custom date ranges.

### File Storage
`backend/src/services/storageService.js` abstracts local filesystem storage with placeholder S3 migration points. Uploads stored in `backend/uploads/`.

## Environment

Backend `.env` defaults:
- DB: `localhost:5432`, database `school_ms`, user/pass `postgres/postgres`
- JWT secret: `JWT_SECRET` (change in production)
- `PORT=4000`, `CORS_ORIGIN=http://localhost:5173`

Frontend: Vite proxies `/api` requests to `http://localhost:4000` in dev — no `VITE_API_URL` needed for local dev.

## Demo Credentials
- Admin: `admin@schoolms.com` / `Admin@123`
- Teacher 1: `james.turner@schoolms.com` / `Teacher@123`
- Teacher 2: `maria.lopez@schoolms.com` / `Teacher@123`
- Parent 1: `robert.johnson@schoolms.com` / `Parent@123`
- Parent 2: `linda.chen@schoolms.com` / `Parent@123`
