MediWise - Full Stack Healthcare Platform

Overview
MediWise is a full-stack healthcare management platform with an Admin panel, Doctor and Patient portals. It provides appointment scheduling, payments and fee split, user and department management, jobs/applications, chats, prescriptions, and more.

This repository contains:
- Backend: Node.js/Express with Sequelize (SQL database)
- Frontend: Next.js/React (App Router)
- Shared: Axios-based API client, authentication, guards, and UI components

Key Features
- Consistent Admin UI with AdminHeader and AdminSidebar
- Standardized modal design across the entire project (semi-transparent overlay; background stays visible)
- Payments linked to completed appointments, with fee split and salary payouts
- Patient management with “View Details” and “Edit Patient” fixed via /admin/users/:id
- Doctors filtered by Department on both public and patient pages via URL query param
- Compact, “normal” Admin Dashboard focusing on essential data (no flashy modern UI)
- Authenticated routes and role-based authorization (admin/doctor/patient)
- Jobs and Applications, Ads/Blogs approvals, Departments, Products & Stock

Tech Stack
- Frontend: Next.js (App Router), React, TypeScript (where applicable), TailwindCSS
- Backend: Node.js, Express, Sequelize, JWT Auth
- Database: Any SQL supported by Sequelize (e.g., PostgreSQL/MySQL/SQLite) per your environment
- HTTP: axios for all HTTP requests
- Dev Experience: nodemon, concurrently

Project Structure
frontend/
  app/
    admin/
      dashboard/               Admin dashboard (uses DashboardContent)
      payments/                Payment management
      patients/                Patient management (View/Edit)
      doctors/                 Doctors management
      appointments/            Appointments management
      departments/             Departments CRUD
      jobs/                    Jobs CRUD
      applications/            Applications review
      products/                Products & stock
      blogs/, ads/, ...        Other admin sections
    doctors/                   Public doctors listing (supports department filter)
    patient/                   Patient portal (e.g., doctors, appointments)
    doctor/                    Doctor portal (appointments, blogs, prescriptions)
  components/                  AdminHeader, AdminSidebar, shared UI
  lib/api.ts                   Axios instance
  globals.css                  Global styles
backend/
  controllers/                 Express controllers
    adminController.js         Dashboard stats, getUserById, etc.
    appointmentController.js   Appointment lifecycle; triggers processFeeSplit on complete
    paymentController.js       Payments list, salaries, fee split, stats
  models/                      Sequelize models
  routes/                      Express routes
    adminRoutes.js             Admin endpoints (includes /users/:id)
  server.js                    Express bootstrap, middleware, auth

Prerequisites
- Node.js 18+
- npm or yarn
- SQL database (e.g., PostgreSQL/MySQL/SQLite); update Sequelize config accordingly

Environment Variables
Create two .env files (one per app) based on the examples below.

Backend (.env in backend/)
PORT=5000
DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB_NAME
JWT_SECRET=your_jwt_secret
NODE_ENV=development

Frontend (.env.local in frontend/)
NEXT_PUBLIC_API_URL=http://localhost:5000

Installation
1) Clone and install

git clone <repo-url> mediwise
cd mediwise

# install backend
cd backend
npm install

# install frontend
cd ../frontend
npm install

2) Database
- Configure DATABASE_URL in backend/.env (or Sequelize config)
- Run migrations/seed if you maintain them (not included here by default)

3) Development
From the project root, use the concurrent command (memory: “npm run server_client” starts both):

npm run server_client

This will start:
- Backend at http://localhost:5000
- Frontend at http://localhost:3000

Alternatively, run separately:

# Terminal A
cd backend
npm run dev   # nodemon server

# Terminal B
cd frontend
npm run dev   # next dev

Core Scripts
Frontend (in frontend/):
- npm run dev: Start Next.js dev server
- npm run build: Build
- npm run start: Start production server

Backend (in backend/):
- npm run dev: Start Express dev server with nodemon
- npm run start: Start production server

Authentication & Authorization
- JWT-based auth; user roles enforced by middleware (authenticate + authorize)
- Admin-only endpoints under /admin/*
- Protect pages on the frontend via useAuth and route guard redirects

Important Flows
1) Appointment Completion → Payment Update
- In backend/controllers/appointmentController.js, when an appointment is marked completed, processFeeSplit from paymentController.js is called to generate payment records (company and doctor shares). These show up in Admin → Payments.

2) Admin Users “View/Edit”
- Implemented /admin/users/:id in adminController.js and exposed in adminRoutes.js.
- Frontend calls this endpoint from Admin → Patients page for details/edit.

3) Doctors by Department
- Public Doctors page and Patient Doctors page read the department query param (?department=<id>) and pass it to the backend when fetching doctors. The UI shows the applied filter and supports clear.

4) Admin Dashboard
- Simplified, compact dashboard (no modern gradients/animations) showing essential stats, recent items, quick actions, and payment summary.

5) Standardized Modal Design (Global)
- All popups use a unified structure:
  - Overlay: fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 (background is visible)
  - Modal: bg-white rounded-lg shadow-xl max-w-* w-full max-h-[90vh] overflow-* 
  - Header: px-6 py-4 border-b border-gray-200 flex items-center justify-between
  - Close: p-1 hover:bg-gray-100 rounded with FiX icon

Axios API Client
- All HTTP requests use axios (see frontend/lib/api.ts). Adjust NEXT_PUBLIC_API_URL as needed.

Coding Standards
- ES Modules (import/export)
- Functional React components
- Descriptive variable names; minimal non-essential comments
- TailwindCSS utility classes for styles

Troubleshooting
- Frontend can’t reach backend: verify NEXT_PUBLIC_API_URL and CORS settings
- Type errors on AdminSidebar props: Ensure you don’t pass unexpected props (user/logout) if the component doesn’t accept them
- “Unterminated regexp literal” in JSX: Always close conditional JSX properly (no stray fragments like </>)
- Port conflicts: change PORT in backend/.env or Next.js port with `-p` flag

Common Endpoints (Admin)
- GET /admin/dashboard         Dashboard stats
- GET /admin/users/:id         Fetch single user (for View/Edit)
- GET /payments                List payments (includes appointment, doctor, patient info)
- POST /payments/salary        Pay salary to doctor/staff
- Other resources: doctors, appointments, departments, jobs, ads, blogs, etc.

Production Notes
- Build frontend: cd frontend && npm run build
- Start backend and serve frontend behind a reverse proxy (e.g., Nginx)
- Configure a robust DB (PostgreSQL/MySQL) and secure JWT secrets

Contributing
- Create feature branches, submit PRs with concise descriptions
- Keep UI consistent with the standardized modal and AdminHeader patterns

License
Proprietary. All rights reserved (update as needed).


"# MediWise" 

