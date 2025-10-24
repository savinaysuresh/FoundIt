/*
ANNOTATED: c:\FoundIt\server\server.js

Purpose:
- This file is the Express + HTTP + Socket.IO entrypoint for the backend.
- It wires up middleware, routes, DB, Cloudinary, error handling and realtime sockets.
- The comments below explain each line/section and provide guidance for adding features.

NOTES:
- This is documentation only. Do not copy these comments into the runtime file.
- Use this doc to understand flow, extend features, or integrate realtime notifications.
*/

import express from "express";                        // Express framework: routing, middleware, request/response handling
import http from "http";                              // Node's HTTP module used to create a server that Socket.IO can attach to
import { Server } from "socket.io";                   // Socket.IO server class for realtime WebSocket + fallback transports
import dotenv from "dotenv";                          // Loads .env variables into process.env
import cors from "cors";                              // CORS middleware to control cross-origin requests
import morgan from "morgan";                          // HTTP request logger middleware for development/debugging
import cloudinary from "cloudinary";                  // Cloudinary SDK to manage image uploads if used in upload flow
import connectDB from "./config/db.js";               // Custom module: sets up Mongoose connection to MongoDB
import errorHandler from "./middleware/errorHandler.js"; // Global error-handling middleware used after routes

// Routes - each file exports an Express Router that groups related endpoints.
// Keep routes thin: validation -> auth middleware -> controller function.
import authRoutes from "./routes/authRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";       // All item endpoints (search, create, read, update, delete)
import adminRoutes from './routes/adminRoutes.js';     // Admin-only endpoints (protected by admin middleware)

// ------------------------------------------------------
// Load environment variables
// ------------------------------------------------------
// dotenv reads .env file and injects values into process.env.
// Typical env variables used later: PORT, CLIENT_ORIGIN, CLOUDINARY_* , SOCKET_PATH
dotenv.config();

// ------------------------------------------------------
// Initialize Express application
// ------------------------------------------------------
const app = express(); // Create the Express app instance

// ------------------------------------------------------
// Global middleware configuration
// ------------------------------------------------------
// express.json parses JSON payloads and places them on req.body.
// The limit setting increases the allowed payload size for large objects/images (beware large memory usage).
app.use(express.json({ limit: "10mb" }));

// express.urlencoded parses URL-encoded bodies (from HTML form posts).
app.use(express.urlencoded({ extended: true }));

// CORS controls which origins can access the API. Credentials: true allows cookies/auth when origins match.
// process.env.CLIENT_ORIGIN should be set to the front-end origin (e.g., http://localhost:5173).
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// morgan logs incoming HTTP requests to the console in 'dev' format (useful in development).
app.use(morgan("dev"));

// ------------------------------------------------------
// Connect to MongoDB
// ------------------------------------------------------
// connectDB() should establish Mongoose connection, handle connection errors and optionally retry.
// Keep DB connection logic isolated (config/db.js) for testability and reuse.
connectDB();

// ------------------------------------------------------
// Cloudinary Configuration
// ------------------------------------------------------
// Configure cloudinary.v2 with credentials from environment variables.
// These credentials are sensitive — keep them out of source control and only in secure env storage.
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("☁️ Cloudinary configured successfully");

// ------------------------------------------------------
// API Routes - attach routers to specific base paths
// ------------------------------------------------------
// Health check root route
app.get("/", (req, res) => {
  // Simple JSON response to confirm server is running
  res.json({ message: "FoundIt Backend is running ✅" });
});

// Mount routers. Each router handles its own sub-paths (e.g., itemRoutes handles /api/items/*)
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);           // Fuzzy search + CRUD + grouping endpoints belong here
app.use("/api/claims", claimRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/admin', adminRoutes);

// ------------------------------------------------------
// Global Error Handler
// ------------------------------------------------------
// This custom error handler should be defined with signature (err, req, res, next)
// and must be placed after routes so it can catch synchronous and asynchronous errors passed via next(err).
app.use(errorHandler);

// ------------------------------------------------------
// Create HTTP server and attach Socket.IO (WebSocket) server
// ------------------------------------------------------
// Create a standard Node HTTP server from the Express app. Socket.IO attaches to this server.
const server = http.createServer(app);

// Initialize Socket.IO server instance.
// Options:
// - cors: allow sockets only from CLIENT_ORIGIN
// - path: custom path (useful when proxied or when avoiding default /socket.io path)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  path: process.env.SOCKET_PATH || "/ws",
});

// ------------------------------------------------------
// WebSocket Event Handling & Online Users Tracking
// ------------------------------------------------------
/*
Design choices explained:
- onlineUsers: Map<userId, socketId>
  - Keeps track of which connected socket belongs to which authenticated user.
  - Allows server to emit to a specific user when a match/notification arrives.
  - This approach works for single-process deployments. For multi-process (cluster/PM2 or multi-host),
    use a shared adapter (e.g., socket.io-redis) to map socket ids across processes.

- Security:
  - Client should authenticate socket connection (e.g., send JWT on connection or send register-user after connecting).
  - Never trust client-supplied userId unless you validate/verify it (e.g., by verifying token server-side).
*/
let onlineUsers = new Map(); // in-memory map of online users; key: userId, value: socketId

io.on("connection", (socket) => {
  // A new real-time connection has been established.
  console.log("🔌 User connected:", socket.id);

  // Register a user: client emits 'register-user' with its userId after authenticating.
  // This stores the mapping userId -> socket.id for targeted emits.
  socket.on("register-user", (userId) => {
    // Note: in production validate the userId against a verified token to prevent impersonation
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User registered: ${userId}`);
  });

  // notify-user: allows authorized parts of the client to ask server to push a notification to another user
  // Payload: { userId, message }
  socket.on("notify-user", ({ userId, message }) => {
    const targetSocket = onlineUsers.get(userId);
    if (targetSocket) {
      // Emit an event to the specific socket id
      io.to(targetSocket).emit("notification", message);
      console.log(`📨 Sent notification to ${userId}`);
    } else {
      // User is offline — persistence (e.g., write Notification document to DB) is recommended so the user sees it later.
      console.log(`⚠️ User ${userId} not online — consider persisting the notification`);
    }
  });

  // Broadcast: emit to all connected clients (use sparingly — likely admin feature)
  socket.on("broadcast", (message) => {
    io.emit("notification", message);
    console.log(`📢 Broadcast message: ${message}`);
  });

  // When a client disconnects, remove them from onlineUsers map if present.
  socket.on("disconnect", () => {
    // Find and delete the entry where the socket id matches
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// ------------------------------------------------------
// Make io and onlineUsers available to application code (controllers, services)
// ------------------------------------------------------
// Using app.set/get is a simple way to share the socket instance and onlineUsers map across modules.
// Example usage in a controller: const io = req.app.get("io"); io.to(socketId).emit(...)
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// ------------------------------------------------------
// Start HTTP + Socket.IO server
// ------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FoundIt Server running on port ${PORT}`);
});

/* -------------------------------------------------------------------------
Guidance for developers: how to extend and integrate with this server
--------------------------------------------------------------------------

1) Adding a new REST endpoint:
   - Create a controller in server/controllers (keep controllers async, use try/catch).
   - Add route file or extend existing router in server/routes.
   - Mount route in server.js via app.use("/api/new", newRoutes).

2) Emitting socket events from controllers/services:
   - Access io in any request handler: const io = req.app.get("io");
   - Access onlineUsers: const onlineUsers = req.app.get("onlineUsers");
   - To send to a specific userId:
       const socketId = onlineUsers.get(String(userId));
       if (socketId) io.to(socketId).emit("notification", payload);
   - Always persist notifications in DB (Notification model). Do not rely solely on socket delivery.

3) Authentication for sockets:
   - Current pattern expects client to emit "register-user" after connecting.
   - For stronger security, require JWT on connection (socket.handshake.auth.token) and verify it server-side in io.use middleware:
       io.use(async (socket, next) => {
         const token = socket.handshake.auth?.token;
         // verify token, attach user info to socket.request.user
       });

4) Scaling sockets across multiple server instances:
   - For multi-process/multi-host deployments, Socket.IO's in-memory store won't work.
   - Use an adapter e.g., redis-adapter:
       import { createAdapter } from "@socket.io/redis-adapter";
       const pubClient = createClient({ url: process.env.REDIS_URL });
       const subClient = pubClient.duplicate();
       await Promise.all([pubClient.connect(), subClient.connect()]);
       io.adapter(createAdapter(pubClient, subClient));
   - With a shared adapter, online-users mapping must be persisted centrally (e.g., Redis) or use built-in adapter mechanisms.

5) Security & operational notes:
   - Keep secrets out of repo (.env). Use CI/CD secrets for production.
   - Limit express.json body size to avoid DoS via huge payloads.
   - Add rate-limiting for public endpoints (express-rate-limit).
   - Validate input on all endpoints (e.g., express-validator or Joi).
   - Ensure CORS origin is only your trusted frontend(s) in production.

6) Testing & local development:
   - Run the server: (Windows)
       cd c:\FoundIt\server
       npm install
       set MONGO_URI=yourMongoUri
       set CLIENT_ORIGIN=http://localhost:5173
       npm run dev
   - When testing socket flows, connect from client and ensure the client emits "register-user" once authenticated.

7) Example: Notify controller usage
   - Suppose when matcher creates a Match you want to notify item owner:
     - Save Notification document to DB (Notification model)
     - Then:
         const io = req.app.get("io");
         const onlineUsers = req.app.get("onlineUsers");
         const socketId = onlineUsers.get(String(ownerId));
         if (socketId) io.to(socketId).emit("notification", { ...notifPayload });

-------------------------------------------------------------------------- */