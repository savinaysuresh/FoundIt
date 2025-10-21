// server/routes/adminRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { getDashboardStats } from '../controllers/adminController.js';

const router = express.Router();

// GET /api/admin/stats
// This route is protected by both 'auth' and 'admin' middleware
router.get('/stats', auth, admin, getDashboardStats);

// You will add other admin routes here (e.g., /users, /items)
// router.get('/users', auth, admin, getAllUsers);
// router.delete('/users/:id', auth, admin, deleteUser);

export default router;