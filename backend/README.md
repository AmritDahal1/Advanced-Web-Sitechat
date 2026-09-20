# SiteChat Backend (Express + SQLite)

## Setup
```
npm install
npm run seed    # creates sitechat.db and demo accounts (password: password123)
npm start       # runs on http://localhost:4000
```

## Demo accounts
- amrit.dahal@cleantasker.com (admin)
- subham.giri@cleantasker.com (user)
- madhab.poudel@cleantasker.com (admin)
- sujit.budhathoki@cleantasker.com (user)

## Endpoints
- POST /api/auth/register, /api/auth/login
- GET/POST/PUT/DELETE /api/sites, /api/sites/:id
- GET/POST /api/sites/:siteId/tasks, PUT/DELETE /api/tasks/:id, PUT /api/tasks/:id/toggle
- GET/POST /api/sites/:siteId/messages, PUT /api/messages/:id/react
- GET/PUT/DELETE /api/notifications
- GET /api/users
