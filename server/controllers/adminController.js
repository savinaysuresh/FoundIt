// server/controllers/adminController.js
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';

/**
 * GET /api/admin/stats
 * Gathers all necessary data for the admin dashboard in one efficient query.
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Run all counts in parallel for efficiency
    const [
      totalUsers,
      totalItems,
      pendingClaims,
      resolvedItems,
      recentItems,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Claim.countDocuments({ status: 'pending' }),
      Item.countDocuments({ isResolved: true }),
      
      // Get 5 most recent items
      Item.find()
        .sort({ datePosted: -1 })
        .limit(5)
        .populate('postedBy', 'name'), // Get the poster's name
        
      // Get 5 most recent users
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt') // Select only needed fields
    ]);

    // Send all data in one response
    res.json({
      stats: {
        totalUsers,
        totalItems,
        pendingClaims,
        resolvedItems
      },
      recentItems,
      recentUsers
    });

  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// You will add other admin functions here
// export const getAllUsers = async (req, res) => { ... }
// export const deleteUser = async (req, res) => { ... }