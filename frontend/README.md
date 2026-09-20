# SiteChat — Frontend (CleanTasker)

SiteChat is a real-time, site-based chat, task and notification platform built for **CleanTasker**, a cleaning-services operator that manages multiple job sites and field crews. This repository contains the **frontend application** submitted for **ICT930 – Advanced Web Application Development, Assessment 2: Frontend Design Overview** (MIT ACT / Crennotech group project).

> Team: Amrit Dahal (CIHE240044) · Subham Giri (CIHE250991) · Madhab Poudel (CIHE250768) · Sujit Budhathoki (CIHE260001)

## Project Overview

SiteChat replaces the fragmented phone calls, generic chat apps and paper checklists cleaning teams typically rely on with a single place that ties communication and task tracking to the physical site being serviced. The app opens on a public homepage introducing the product before requiring sign-in; authenticated users reach a dashboard, a searchable/filterable site list, and a per-site workspace with chat, tasks, and a photo gallery. This repository contains the frontend only — a mock API layer stands in for the Firebase/Firestore backend planned for a later phase of the project.

## Technology Stack

- **React 18** — functional components and hooks
- **Vite** — dev server and production build
- **React Router DOM v6** — client-side routing, including protected routes
- **Context API + useReducer** — shared app state (auth user, theme, notifications, toasts)
- **Plain CSS with CSS custom properties** — theming (light/dark), no external UI library
- **Mock data layer** (`src/api.js` + JSON files) — simulates an async backend with artificial latency, loading and error states

## Installation

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```

## Demo Login

Any of the mock users below will work (all share the same password):

| Email | Password | Role |
|---|---|---|
| amrit.dahal@cleantasker.com | password123 | Site Supervisor |
| subham.giri@cleantasker.com | password123 | Field Cleaner |
| madhab.poudel@cleantasker.com | password123 | Operations Manager |
| sujit.budhathoki@cleantasker.com | password123 | Field Cleaner |

## Key Features

- **Public homepage** — introduces SiteChat and CleanTasker before requiring sign-in, with an "Employee Login" entry point
- **Authentication** — mock login/logout behind a protected route wrapper (`ProtectedRoute.jsx`); the session and theme choice persist across a refresh via `sessionStorage`
- **Dashboard** — key stats (total/active sites, open tasks, unread messages), recent sites and recent notifications
- **Sites** — searchable, filterable list of sites with status badges, cover photos and unread counts; create-site form with validation (mock CRUD)
- **Site Detail — Chat** — a cover banner and always-visible sidebar (status, open tasks, team roster); messages are grouped by sender and day like a real chat app; photo attachments with a full-size lightbox (Previous/Next); like/react to any message
- **Site Detail — Tasks** — add, complete and delete tasks, each with a priority (High/Medium/Low) and an optional assignee; filter by Open/Done/All. The "open tasks" count shown across the whole app (Dashboard, Sites list, site sidebar) is derived live from this task data, so it can never drift out of sync
- **Site Detail — Photos** — gallery view of every photo shared in a site's chat, opening into the same lightbox
- **Notifications** — filter unread only, mark one or all as read
- **Profile & Settings** — light/dark theme toggle and other preferences
- **Responsive design** — desktop, tablet and mobile layouts
- **Accessibility** — semantic HTML, ARIA labels/roles on interactive elements (tabs, dialogs, alerts), keyboard-dismissible modals, visible focus states

## Design Decisions

- **Flat file layout** — rather than deep nested folders, every component and page lives directly under `src/`. Page components (`Home`, `Login`, `Dashboard`, `Sites`, `SiteDetail`, `Notifications`, `Profile`) each own their own data and logic; small reusable UI primitives (`Modal`, `Badge`, `Toast`, `LoadingSpinner`, `ErrorMessage`, `Logo`) are grouped together in `UI.jsx`; `Layout`, `Navbar`, `Sidebar` and `ProtectedRoute` form the authenticated app shell.
- **State** — local component state via `useState`; shared/global state via a single `AppContext` + `useReducer`, avoiding prop-drilling without a heavier library like Redux.
- **Data layer** — every "network" call goes through `api.js`, which exposes async functions with realistic latency and thrown validation errors, matching the shape real API/Firestore calls would take. `useFetch` is a small custom hook standardising loading/error/data state for every screen. This keeps the eventual swap to a real backend isolated to one file.
- **`tasksOpen` is derived, not stored** — task counts shown throughout the app are computed live from the task list on every fetch, so they can't drift out of sync with the tasks a user actually adds or completes.

## Project Structure

```
src/
  App.jsx              Route definitions
  Layout.jsx            App shell (sidebar + navbar + outlet)
  Navbar.jsx, Sidebar.jsx
  ProtectedRoute.jsx    Auth gate for /dashboard/*
  AppContext.jsx        Global state (user, theme, notifications, toast)
  useFetch.js            Generic async data-loading hook
  api.js                Mock backend (sites, messages, tasks, notifications, users)
  helpers.js             Small shared helpers (site cover images)
  UI.jsx                 Shared UI primitives (Logo, LoadingSpinner, ErrorMessage, Badge, Toast, Modal)
  Home.jsx, Login.jsx, Dashboard.jsx, Sites.jsx, SiteDetail.jsx,
  Notifications.jsx, Profile.jsx, NotFound.jsx
  mock*.json             Mock data (users, sites, messages, tasks, notifications)
```

## Known Limitations / Next Steps

- Backend is fully mocked and held in memory — refreshing the page resets any messages, tasks or sites added during the session. A later phase will wire this up to a real backend (e.g. Firebase Firestore).
- There is no global search across sites/messages yet — a natural next addition.
- Tasks can be filtered by status (Open/Done/All) but not yet by assignee.
- No live presence or typing indicators — these would need a real backend/websocket connection to reflect genuine activity rather than being faked, so they're left for the real-backend phase.
