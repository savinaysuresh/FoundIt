# FoundIt — Server: Detailed Documentation and Comments

This document explains the server-side code (c:\FoundIt\server) in detail. It is intentionally verbose to help new developers understand syntax, flow, and responsibilities of each module without changing any source code.

---

## High-level overview

- The server is an Express.js application (server.js) using middleware, routes, controllers, and Mongoose models.
- config/ contains configuration helpers (DB connection, Cloudinary).
- controllers/ implement business logic for each resource (auth, items, claims, matches, notifications, admin).
- routes/ define endpoints and bind them to controllers.
- middleware/ includes auth checks, file upload handling, error handling, and role-based access.
- models/ contain Mongoose schema definitions for User, Item, Claim, Match, Notification.
- services/ contains helper logic (matcherService.js).
- uploads/ likely stores local file uploads (depending on multer config).

---

## server.js (app entry-point)

Purpose:
- Create an Express app, apply global middleware, mount routes, handle errors, and start the HTTP server.

Key constructs:
- `require('dotenv').config()` loads `.env` values into `process.env`.
- `express.json()` for parsing JSON request bodies.
- `app.use('/api/xyz', someRoutes)` mounts routers.
- Error handler middleware (custom) is placed after routes to catch thrown errors.

Common patterns:
- Use async/await for DB connection; ensure top-level unhandled rejections/logging are handled.
- Separate concerns: controllers do logic, routes only map endpoints to controller functions.

---

## config/db.js

Purpose:
- Connects to MongoDB using Mongoose.

Important details:
- Exports an async function `connectDB()` which uses `mongoose.connect(connectionString, options)`.
- Should handle connection errors and either retry or exit gracefully.
- Use `useNewUrlParser`, `useUnifiedTopology` options to silence deprecation warnings (if present).

---

## config/cloudinary.js

Purpose:
- Initialize Cloudinary client using credentials from `.env` (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
- Exports configured cloudinary instance or helper functions for uploading/deleting images.
- Cloudinary returns secure URLs and public IDs useful for later deletion.

Security note:
- Keep API keys in `.env`, never commit them. Use restricted API keys where possible.

---

## models/

General points:
- Schemas define field types, indexes, relationships, enums, and default values.
- Mongoose `virtuals` and `populate()` allow referencing other collections (e.g., Item.owner references User).
- Use `timestamps: true` on schemas to get createdAt/updatedAt automatically.

Important models:

- User.js
  - Fields: name, email, password (hashed), role (enum: user/admin?), avatar url, etc.
  - Methods: instance methods for password comparison (bcrypt), pre-save middleware to hash password.

- Item.js
  - Represents a lost or found item.
  - Important fields: title, description, images array, location details, isFound/isLost flags, owner reference, status.
  - Indexing on location or text fields may be used for faster search.

- Claim.js
  - Represents a claim by a user on an Item.
  - Fields: item (ref), claimant (ref), message, status (pending/accepted/rejected).

- Match.js
  - Stores matches between reported lost and reported found items.
  - Fields: itemLost (ref), itemFound (ref), score, matchedAt.

- Notification.js
  - Stores notifications for users about matches, claim updates, admin messages.
  - Fields: user (ref), type, payload, read boolean, createdAt.

---

## controllers/

Pattern:
- Each controller exports async functions mapped to route handlers (Express).
- Controller functions receive (req, res, next). Use try/catch and call `next(err)` or pass errors to error middleware.

Examples:
- authController.js
  - register: validate input, create User, hash password, generate JWT, return sanitized user object (omit hashed password).
  - login: find user by email, compare password using bcrypt, issue JWT via `res.cookie` or response body.

- itemController.js
  - createItem: validate inputs, handle file uploads (Cloudinary or local), save item with owner reference.
  - getItems: supports query params (search, pagination). Use `limit`, `skip`, and optionally text search indexes.
  - getItemById: populate owner and related claims.

- claimController.js
  - createClaim: ensure claimant is authenticated, prevent duplicate claims, notify item owner.

- matchController.js
  - triggerMatch: call matcherService to compute matches between new item and existing items, create Match documents.

- notificationController.js
  - listNotifications: paginate, mark as read, delete.

Admin controller:
- Secured by admin middleware. Admin endpoints can list all users/items/claims and perform moderation actions (suspend user, delete item, etc).

---

## middleware/

- auth.js
  - Checks for JWT in headers or cookies, verifies signature, attaches user info to `req.user`.
  - Returns 401 Unauthorized if token missing/invalid.

- admin.js
  - Requires `req.user` and checks `req.user.role === 'admin'`. Responds with 403 if not authorized.

- multer.js / uploadMiddleware.js
  - Configure multer storage engine. If using Cloudinary, the server may accept uploads and immediately forward them to Cloudinary.
  - Typical pattern: store files in memory (buffer) and upload to Cloudinary via stream or use local storage and then upload.

- errorHandler.js
  - Express error-handling middleware signature: (err, req, res, next).
  - Determines status code, logs error, sends minimal error details in production and more verbose in development.

---

## services/matcherService.js

Purpose:
- Core matching algorithm that compares new items (lost/found) to existing items to find possible matches.

Common approach:
- Text-based similarity on title/description (TF-IDF, cosine similarity, or simple token overlap).
- Location proximity check (e.g., Haversine distance on lat/long or city/region match).
- Image similarity using perceptual hashing or Cloudinary's auto-tagging (if integrated).
- Weighted scoring: combine text score, location score, image score to compute final score, then persist matches above a threshold.

Implementation notes:
- Keep matcher stateless and testable: accept item and candidate list, return scored matches.
- Use batching and indexing for performance on large datasets.

---

## routes/

- Each file defines an Express Router, e.g.:
  - router.post('/', authMiddleware, controller.createItem)
  - router.get('/:id', controller.getItem)
- Keep routes thin. Validate inputs (use express-validator or Joi) before invoking controllers.

---

## uploads/

- If multer uses local disk, uploads/ stores files. If Cloudinary is used, this folder might be unused or temporary.
- Ensure it's in .gitignore.

---

## Environmental variables (.env)

Common variables required:
- PORT
- MONGO_URI
- JWT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_FOLDER (optional)
- FRONTEND_URL (CORS)

---

## Tips when exploring code

- Start at server.js to see middleware and route mounts.
- Follow a request lifecycle: route -> auth middleware -> controller -> services/models -> response.
- Use `console.log` or debug in VSCode to inspect `req` objects and DB query results.
- To understand Mongoose population, search `.populate(` usage in controllers.

---

## API Overview (example endpoints)

- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Items: POST /api/items, GET /api/items, GET /api/items/:id
- Claims: POST /api/claims, GET /api/claims/user
- Matches: GET /api/matches, POST /api/matches/trigger
- Notifications: GET /api/notifications, POST /api/notifications/mark-read
- Admin: GET /api/admin/users, DELETE /api/admin/items/:id

(Refer to routes/ files for exact route paths and middleware used.)

---

If you want, I can also generate per-file annotated comments (line-by-line) in separate editable markdown files for specific server files you care about (e.g., itemController.js or matcherService.js). Tell me which files to document next.