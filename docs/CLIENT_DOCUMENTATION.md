# FoundIt — Client: Detailed Documentation and Comments

This document explains the client-side React app (c:\FoundIt\client). It covers structure, component responsibilities, hooks, context, routing, and API usage.

---

## High-level overview

- Built with Vite + React.
- src/main.jsx mounts the app and provides context providers (AuthContext).
- src/App.jsx defines routes and global layout components (Header, Navbar).
- Pages are in src/pages/ and correspond to routes (Home, Login, Register, ReportFound, ReportLost, ItemDetails, MyPosts, MyClaims, AdminDashboard).
- Components in src/components/ are reusable UI pieces (ItemCard, NotificationBell, ProtectedRoute).
- utils/api.js centralizes HTTP calls (axios/fetch) and attaches auth token when present.
- context/AuthContext.jsx implements authentication state management and exposes login/logout helpers.

---

## Important files and responsibilities

- src/main.jsx
  - React entry file. Renders <App /> inside root element. Wrap with BrowserRouter (if used) and AuthContextProvider.

- src/App.jsx
  - Declares routes (React Router).
  - Example use: <Route path="/report-lost" element={<ProtectedRoute><ReportLost /></ProtectedRoute>} />
  - Uses ProtectedRoute to guard authenticated-only routes.

- src/context/AuthContext.jsx
  - Provides `user`, `token`, `login`, `logout`, `register`.
  - Persists token in localStorage (or cookie) and restores on load.
  - When token changes, set default Authorization header in utils/api.

- src/utils/api.js
  - Axios instance configured with baseURL (from environment).
  - Interceptors handle 401 -> redirect to login, attach Authorization header.

- src/components/ProtectedRoute.jsx
  - Renders children if authenticated, otherwise redirects to /login.
  - Can accept `adminOnly` prop and check user.role.

- src/components/ItemCard.jsx
  - Displays item summary: title, thumbnail, status, date, link to details.
  - Uses props for data and callbacks (onClaim, onReportFound).

- src/pages/ReportLost.jsx and ReportFound.jsx
  - Forms for creating items. Handle file input for images, use debounce for search or suggestions, call API to upload files (maybe to /api/upload or Cloudinary).
  - Validate required fields client-side before sending.

- src/pages/ItemDetails.jsx
  - Displays full item data. Shows owner info, images, location, claims.
  - Allows authenticated users to create a claim (calls /api/claims).

- src/components/NotificationBell.jsx
  - Fetches unread notification count, shows dropdown of recent notifications, allows marking as read.

---

## Common UI & Data Flow Patterns

- Controlled form components: use useState for inputs, update onChange.
- Fetching data: use useEffect to call API on mount and cleanup with abort controllers if needed.
- Debounce utility (src/utils/useDebounce.js) helps limit API calls when typing search text.

---

## Running & Developing (Windows-specific commands)

Open two terminals (one for server, one for client).

Install dependencies:
- Server:
  - cd c:\FoundIt\server
  - npm install
- Client:
  - cd c:\FoundIt\client
  - npm install

Start dev servers:
- Server (default): in server folder
  - npm run dev
  - or: set environment variable and then run:
    - set MONGO_URI=your_mongo_uri
    - set JWT_SECRET=your_jwt_secret
    - npm run dev
- Client:
  - npm run dev
  - Open http://localhost:5173 (Vite default) or as printed by Vite.

Build for production:
- Client: npm run build (creates dist/)
- Server: ensure NODE_ENV=production and use process manager (pm2) or host like Azure/AWS.

---

## Debugging tips

- Inspect network calls in browser devtools to confirm endpoints and payload formats.
- Use console.log in components and network layer to trace props/state changes.
- Use React DevTools to inspect component tree and context values.

---

If you want per-file, line-by-line annotated comments for particular client files (e.g., AuthContext.jsx or ItemCard.jsx), tell me which file(s) and I'll produce a thorough annotated markdown explanation for them.