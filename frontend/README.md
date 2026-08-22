# Civic Issue Tracker — Frontend

React + Vite frontend for the existing Civic Issue Tracker backend
(Node/Express + PostgreSQL via Supabase). This folder is completely
independent of the backend — it only talks to it over HTTP.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # already created, points at http://localhost:5000
npm run dev
```

The app runs at `http://localhost:5173` and expects your backend to be
running at the URL in `VITE_API_URL` (default `http://localhost:5000`).

## What's here

```
src/
  components/   Navbar, IssueCard, IssueFilters, StatusBadge, LoadingSpinner,
                EmptyState, ConfirmDialog, ProtectedRoute, Toast
  pages/        Home, Login, Register, Dashboard, ReportIssue,
                IssueDetails, AdminDashboard
  services/     api.js — the only place fetch() is called
  context/      AuthContext.jsx — token + user, stored in localStorage
  utils/        auth.js — localStorage read/write helpers
  styles/       global.css — design tokens and all styling (no CSS framework)
```

## API contract used

All calls match the backend spec exactly — no invented endpoints or fields:

- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/issues` — supports `?status=&category=&search=`
- `GET /api/issues/:id`
- `POST /api/issues` (auth) — `{ title, description, category, photo_url, latitude, longitude, address }`
- `PUT /api/issues/:id` (admin) — `{ status, admin_comment }`
- `DELETE /api/issues/:id` (admin)

Every authenticated request sends `Authorization: Bearer <token>`.
A `401` response clears the session and redirects to `/login`.
A `403` response shows a permission message without logging the user out.

## Notes

- No mock or placeholder data anywhere — every page shows a loading spinner
  until the real API responds, and an empty/error state if it doesn't.
- Route protection (`ProtectedRoute`) is for UX only. The backend remains
  the real authority on every request, exactly as instructed.
- Deploying later: set `VITE_API_URL` to your deployed backend URL in
  production and nothing else needs to change.
