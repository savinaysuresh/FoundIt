import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import socketService from "./services/socketService.js";
import errorHandler from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Periodic job (for rechecking unmatched items)
import "./jobs/periodicMatcher.js";

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
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(morgan("dev"));

// ------------------------------------------------------
// Connect MongoDB
// ------------------------------------------------------
connectDB();

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
});

// Attach socket service (handles connections, auth, notifications)
socketService.attach(io);

// ------------------------------------------------------
// Start Server
// ------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FoundIt Server running on port ${PORT}`);
});
