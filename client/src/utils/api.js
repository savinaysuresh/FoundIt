// client/src/utils/api.js
import axios from "axios";

/**
 * Create the base Axios instance.
 * This assumes you are using a proxy in your vite.config.js or package.json
 * (e.g., server: { proxy: { '/api': 'http://localhost:5000' } })
 */
const API = axios.create({
  baseURL: "/api", // Use the relative path for the proxy
  withCredentials: true,
});

/**
 * Interceptor to automatically attach the auth token to every
 * request if it exists in localStorage.
 */
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- Auth Functions ---

export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);

// --- Item Functions ---

/**
 * Creates a new item (Lost or Found).
 * itemData is expected to be FormData.
 */
export const createItem = async (itemData) => {
  try {
    const { data } = await API.post('/items', itemData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  } catch (error) {
    throw error.response.data; // Throw the actual error message from the backend
  }
};

/**
 * Fetches details for a single item by its ID.
 */
export const getItemById = async (id) => {
  try {
    const { data } = await API.get(`/items/${id}`);
    return data; // This should return { item, matches } from your controller
  } catch (error) {
    throw error.response.data;
  }
};

// --- MyPosts / Item Management Functions ---

/**
 * Fetches only the logged-in user's posts
 */
export const getMyPosts = () => API.get('/items/my-posts');

/**
 * Deletes a post
 */
export const deleteItem = (id) => API.delete(`/items/${id}`);

/**
 * Resolves a post
 */
export const resolveItem = (id) => API.post(`/items/${id}/resolve`);

/**
 * Updates a post
 */
export const updateItem = (id, data) => API.put(`/items/${id}`, data);

// --- Search & Match Functions ---

/**
 * Searches for items based on a query string.
 * @param {string} query - The search term.
 */
export const searchItems = async (query) => {
  try {
    // This calls the GET /api/items/search?query=... route on your backend
    const { data } = await API.get(`/items/search?query=${query}`);
    return data.items || []; // Ensure it always returns an array
  } catch (error) {
    console.error("Error searching items:", error);
    throw error;
  }
};

/**
 * Fetches high-priority homepage matches for the logged-in user.
 */
export const getHomepageMatches = async () => {
  try {
    // This calls the GET /api/matches/homepage route on your backend
    const { data } = await API.get('/matches/homepage');
    return data;
  } catch (error){
    console.error("Error fetching homepage matches:", error);
    throw error;
  }
};

// --- Claim Functions ---

/**
 * Creates a claim on an item.
 * claimData should be an object: { itemId, message }
 */
export const createClaim = async (claimData) => {
  try {
    const { itemId, ...body } = claimData;
    const { data } = await API.post(`/claims/item/${itemId}`, body);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getClaimsForItem = async (itemId) => {
  try {
    const { data } = await API.get(`/claims/for-item/${itemId}`);
    return data; // This will be an array of claims
  } catch (error) {
    throw error.response.data;
  }
};

// --- (NEW) NOTIFICATION FUNCTIONS ---
// These were missing, causing the error.

/**
 * Get all notifications for the logged-in user
 */
export const getMyNotifications = async () => {
  try {
    const { data } = await API.get('/notifications');
    return data; // This should return { notifications, unreadCount }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error.response.data;
  }
};

/**
 * Mark all notifications as read
 */
export const markNotificationsRead = async () => {
  try {
    const { data } = await API.put('/notifications/read');
    return data;
  } catch (error) {
    console.error('Error marking notifications read:', error);
    throw error.response.data;
  }
};

// Export the base instance as the default
export default API;