# FoundIt — Project Overview

FoundIt is a two-part web application for reporting and matching lost & found items on a campus:

- A Node.js + Express backend (server/) that stores items, claims, matches and notifications in MongoDB.
- A React + Vite frontend (client/) that provides posting, searching, claiming, notifications, and an admin dashboard.

---

## Tech stack
- Backend: Node.js, Express, Mongoose, Socket.IO, Cloudinary, Multer
- Frontend: React, Vite, Tailwind CSS, Fuse.js (client-side fuzzy), Axios, socket.io-client
- Database: MongoDB (local or Atlas)

---

## Quick start

1. server
   - Copy `.env` values in [server/.env](server/.env).
   - Install & run:
     ```sh
     cd server
     npm install
     npm run dev
     ```
   - Entry: [`server/server.js`](server/server.js)

2. client
   - Edit `CLIENT_ORIGIN` in server `.env` if needed (default: `http://localhost:5173`).
   - Install & run:
     ```sh
     cd client
     npm install
     npm run dev
     ```
   - Entry: [`client/index.html`](client/index.html) -> [`client/src/main.jsx`](client/src/main.jsx)

---

## Environment variables
See: [`server/.env`](server/.env)
Important: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `CLIENT_ORIGIN`, `SOCKET_PATH`.

---

## Backend — key responsibilities & links

- Main server: [`server/server.js`](server/server.js)
- DB connection: [`server/config/db.js`](server/config/db.js)
- Cloudinary config: [`server/config/cloudinary.js`](server/config/cloudinary.js)
- Models:
  - [`models.Item`](server/models/Item.js)
  - [`models.Match`](server/models/Match.js)
  - [`models.Notification`](server/models/Notification.js)
  - [`models.Claim`](server/models/Claim.js)
  - [`models.User`](server/models/User.js)
- Core services:
  - Matching engine: [`services.matcherService.runForItem`](server/services/matcherService.js)
- Controllers (API logic):
  - Items: [`itemController.createItem`](server/controllers/itemController.js), [`itemController.getItems`](server/controllers/itemController.js), [`itemController.getItemById`](server/controllers/itemController.js), [`itemController.updateItem`](server/controllers/itemController.js), [`itemController.deleteItem`](server/controllers/itemController.js), [`itemController.resolveItem`](server/controllers/itemController.js), [`itemController.getMatchesForItem`](server/controllers/itemController.js)
  - Matches: [`matchController.getHomepageMatches`](server/controllers/matchController.js), [`matchController.getMyMatches`](server/controllers/matchController.js), [`matchController.getAllMatches`](server/controllers/matchController.js), [`matchController.rerunMatchForItem`](server/controllers/matchController.js)
  - Claims: [`claimController.createClaim`](server/controllers/claimController.js), [`claimController.updateClaimStatus`](server/controllers/claimController.js), [`claimController.getClaimsForItem`](server/controllers/claimController.js), [`claimController.getMyClaims`](server/controllers/claimController.js)
  - Notifications: [`notificationController.getMyNotifications`](server/controllers/notificationController.js), [`notificationController.markNotificationsRead`](server/controllers/notificationController.js)
  - Auth: [`authController.register`](server/controllers/authController.js), [`authController.login`](server/controllers/authController.js), [`authController.getMe`](server/controllers/authController.js)
- Routes wiring:
  - [`routes/itemRoutes.js`](server/routes/itemRoutes.js)
  - [`routes/matchRoutes.js`](server/routes/matchRoutes.js)
  - [`routes/claimRoutes.js`](server/routes/claimRoutes.js)
  - [`routes/notificationRoutes.js`](server/routes/notificationRoutes.js)
  - [`routes/authRoutes.js`](server/routes/authRoutes.js)
  - [`routes/adminRoutes.js`](server/routes/adminRoutes.js)
- Middleware:
  - Auth: [`middleware/auth.js`](server/middleware/auth.js)
  - Admin guard: [`middleware/admin.js`](server/middleware/admin.js)
  - Uploads: [`middleware/uploadMiddleware.js`](server/middleware/uploadMiddleware.js)
  - Error handler: [`middleware/errorHandler.js`](server/middleware/errorHandler.js)

Notes:
- Matches are created by [`services.matcherService.runForItem`](server/services/matcherService.js) when items are created/updated.
- Notifications are persisted in [`models.Notification`](server/models/Notification.js) and emitted via Socket.IO from [`server/server.js`](server/server.js).

---

## Frontend — key responsibilities & links

- App entry: [`client/src/main.jsx`](client/src/main.jsx) → [`client/src/App.jsx`](client/src/App.jsx)
- API wrapper: [`client/src/utils/api.js`](client/src/utils/api.js)
- Auth context: [`client/src/context/AuthContext.jsx`](client/src/context/AuthContext.jsx)
- Pages:
  - Home (search + homepage matches): [`client/src/pages/Home.jsx`](client/src/pages/Home.jsx)
  - Item details & claims: [`client/src/pages/ItemDetails.jsx`](client/src/pages/ItemDetails.jsx)
  - My posts: [`client/src/pages/MyPosts.jsx`](client/src/pages/MyPosts.jsx)
  - My claims: [`client/src/pages/MyClaims.jsx`](client/src/pages/MyClaims.jsx)
  - Admin dashboard: [`client/src/pages/AdminDashboard.jsx`](client/src/pages/AdminDashboard.jsx)
  - Report forms: [`client/src/pages/ReportLost.jsx`](client/src/pages/ReportLost.jsx), [`client/src/pages/ReportFound.jsx`](client/src/pages/ReportFound.jsx)
- Components:
  - Header / Navbar: [`client/src/components/Header.jsx`](client/src/components/Header.jsx), [`client/src/components/Navbar.jsx`](client/src/components/Navbar.jsx)
  - Item card: [`client/src/components/ItemCard.jsx`](client/src/components/ItemCard.jsx)
  - Protected route: [`client/src/components/ProtectedRoute.jsx`](client/src/components/ProtectedRoute.jsx)
  - Notification bell + Socket: [`client/src/components/NotificationBell.jsx`](client/src/components/NotificationBell.jsx)
- Client dev server & proxy: [`client/vite.config.js`](client/vite.config.js)

Notes:
- Frontend uses token stored in localStorage and the Axios instance in [`client/src/utils/api.js`](client/src/utils/api.js) attaches the Authorization header.
- Real-time notifications are handled by Socket.IO client in [`client/src/components/NotificationBell.jsx`](client/src/components/NotificationBell.jsx).

---

## API highlights (examples)
- POST /api/auth/register → [`authController.register`](server/controllers/authController.js)
- POST /api/auth/login → [`authController.login`](server/controllers/authController.js)
- GET /api/items → [`itemController.getItems`](server/controllers/itemController.js)
- POST /api/items → [`itemController.createItem`](server/controllers/itemController.js)
- GET /api/items/:id → [`itemController.getItemById`](server/controllers/itemController.js)
- POST /api/claims/item/:itemId → [`claimController.createClaim`](server/controllers/claimController.js)
- GET /api/notifications → [`notificationController.getMyNotifications`](server/controllers/notificationController.js)
- PUT /api/notifications/read → [`notificationController.markNotificationsRead`](server/controllers/notificationController.js)
- GET /api/matches/homepage → [`matchController.getHomepageMatches`](server/controllers/matchController.js)

Refer to the route files for exact paths:
- [`server/routes/itemRoutes.js`](server/routes/itemRoutes.js)
- [`server/routes/claimRoutes.js`](server/routes/claimRoutes.js)
- [`server/routes/notificationRoutes.js`](server/routes/notificationRoutes.js)
- [`server/routes/matchRoutes.js`](server/routes/matchRoutes.js)
- [`server/routes/authRoutes.js`](server/routes/authRoutes.js)

---

## Useful notes & troubleshooting
- If Cloudinary uploads fail, check [`server/config/cloudinary.js`](server/config/cloudinary.js) and env vars.
- For local file uploads ensure `uploads/` exists (created by [`middleware/uploadMiddleware.js`](server/middleware/uploadMiddleware.js)).
- Text search uses MongoDB text index defined in [`server/models/Item.js`](server/models/Item.js).
- Matcher is async and may create duplicate-match errors handled in [`services/matcherService.js`](server/services/matcherService.js).

---

If you want, I can:
- add more detailed API docs (endpoints + request/response examples),
- add Postman collection or OpenAPI spec,
- or create developer runbook scripts.
