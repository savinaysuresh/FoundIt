import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cloudinary from "cloudinary";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Periodic job (for rechecking unmatched items)
//import "./jobs/periodicMatcher.js";

// ------------------------------------------------------
// Load environment variables
// ------------------------------------------------------
dotenv.config();

// ------------------------------------------------------
// Initialize Express
// ------------------------------------------------------
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));

// ------------------------------------------------------
// Connect MongoDB
// ------------------------------------------------------
connectDB();

// ------------------------------------------------------
// Cloudinary Configuration
// ------------------------------------------------------
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("☁️ Cloudinary configured successfully");

// ------------------------------------------------------
// API Routes
// ------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ message: "FoundIt Backend is running ✅" });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);

// ------------------------------------------------------
// Global Error Handler
// ------------------------------------------------------
app.use(errorHandler);

// ------------------------------------------------------
// Create HTTP + WebSocket Server
// ------------------------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  path: process.env.SOCKET_PATH || "/ws",
});

// ------------------------------------------------------
// WebSocket Event Handling
// ------------------------------------------------------
let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Register a user (frontend should emit 'register-user' with userId)
  socket.on("register-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User registered: ${userId}`);
  });

  // Send a notification to a specific user
  socket.on("notify-user", ({ userId, message }) => {
    const targetSocket = onlineUsers.get(userId);
    if (targetSocket) {
      io.to(targetSocket).emit("notification", message);
      console.log(`📨 Sent notification to ${userId}`);
    }
  });

  // Broadcast a message to all connected users (for admin alerts, etc.)
  socket.on("broadcast", (message) => {
    io.emit("notification", message);
    console.log(`📢 Broadcast message: ${message}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// Make io accessible in routes/controllers
app.set("io", io);

// ------------------------------------------------------
// Start Server
// ------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FoundIt Server running on port ${PORT}`);
});
