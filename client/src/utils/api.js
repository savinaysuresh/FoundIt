// ...existing code...
/*
Detailed, line-by-line commentary for: c:\FoundIt\client\src\utils\api.js

This is a documentation-only file. Do NOT paste these comments back into the source file.
Use this file to understand syntax, flow, axios usage, error handling, and recommended integration patterns.
*/

/* ---------- Module imports ---------- */
// Import the axios HTTP client library. axios returns promises and is commonly used for REST API requests.
import axios from "axios";

/* ---------- Axios instance creation ---------- */
/**
 * Create the base Axios instance for the application.
 * - baseURL: set to "/api" so client code can use relative paths (works with Vite proxy or server reverse proxy).
 * - withCredentials: true ensures cookies (e.g., httpOnly sessions) are sent with cross-site requests when allowed.
 *
 * Why use a single instance:
 * - Centralizes HTTP config (base URL, credentials, headers).
 * - Allows attaching interceptors in one place to automatically add auth tokens or handle errors.
 */
const API = axios.create({
  baseURL: "/api", // Using a relative base path is convenient for local development with a proxy.
  withCredentials: true, // Include cookies on cross-origin requests if server sets them.
});

/* ---------- Request interceptor ---------- */
/**
 * Interceptors can inspect/modify each request before it is sent.
 * Here we add an interceptor to attach an Authorization header when a token exists in localStorage.
 *
 * Notes about the interceptor:
 * - axios.interceptors.request.use accepts a function that receives the request config and must return it (or a promise resolving to it).
 * - If you throw an error inside the interceptor, the request will be rejected before being sent.
 * - Accessing localStorage synchronously is fine here because interceptors are synchronous in this usage.
 */
API.interceptors.request.use((req) => {
  // Read token from localStorage. This key must match where your Auth flow stores the token.
  const token = localStorage.getItem("token");

  // If token exists, set the Authorization header using Bearer scheme (common for JWTs).
  // Note: header names are case-insensitive, but axios uses 'headers' object.
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // Return the (possibly modified) request config to continue the request.
  return req;
});

/* ---------- Auth endpoints ---------- */
/**
 * Wrapper functions that call API endpoints.
 * Each function returns the axios promise (or the resolved data) so callers can await the result.
 *
 * Pattern:
 * - Export named functions for each API action.
 * - Keep error handling near caller unless consistent transformation is needed here.
 */

// POST /api/auth/login
export const login = (formData) => API.post('/auth/login', formData);

// POST /api/auth/register
export const register = (formData) => API.post('/auth/register', formData);

/* ---------- Item-related endpoints ---------- */
/**
 * createItem expects FormData (multipart/form-data) since items include images/files.
 * We set Content-Type to multipart/form-data for the request so axios will include proper boundary.
 * The function returns the parsed response data.
 */
export const createItem = async (itemData) => {
  try {
    const { data } = await API.post('/items', itemData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    // Throw a normalized error payload so caller can handle it in catch blocks.
    // error.response may be undefined on network failures, guard accordingly.
    throw error.response.data;
  }
};

/**
 * getItemById - GET /api/items/:id
 * - Wraps the axios call and returns the response data to the caller.
 * - Uses try/catch to rethrow backend-provided error payload for UI handling.
 */
export const getItemById = async (id) => {
  try {
    const { data } = await API.get(`/items/${id}`);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * getItems - GET /api/items?...
 * - Accepts optional params object used to build query string.
 * - Applies sensible default query params to avoid huge payloads by default.
 * - Returns the response data (which the backend should structure as { items: [...] }).
 *
 * Implementation notes:
 * - URLSearchParams is used to build a query string from an object. Values are converted to strings.
 * - Default params are merged with user-provided params; user params take precedence.
 * - Errors are converted to a normalized Error to allow components to do `catch (err) { setError(err.message) }`.
 */
export const getItems = async (params = {}) => {
  try {
    // Default query params to limit and only return unresolved items (string values expected).
    const defaultParams = { isResolved: 'false', limit: 500 };
    const queryParams = new URLSearchParams({...defaultParams, ...params}).toString();

    // Make the GET request to /api/items?...
    const { data } = await API.get(`/items?${queryParams}`);

    // Return whatever the backend sent. Caller expects `data` to contain items (or a shape documented in the API).
    return data;
  } catch (error) {
    // Log for developer debugging and throw a normalized error to the caller.
    console.error("Error fetching items:", error);
    // Use optional chaining because error.response may be undefined on network failure.
    throw error.response?.data || new Error("Failed to fetch items");
  }
};

/* ---------- My posts / item management ---------- */
/**
 * These functions are thin wrappers around REST endpoints used to manage items.
 * - getMyPosts: returns items posted by authenticated user (server should check token and return appropriate data).
 * - deleteItem: delete an item by id.
 * - resolveItem: mark an item as resolved (custom endpoint POST /items/:id/resolve).
 * - updateItem: PUT to update item fields.
 *
 * These are synchronous one-liners returning axios promises (callers should await).
 */
export const getMyPosts = () => API.get('/items/my-posts');
export const deleteItem = (id) => API.delete(`/items/${id}`);
export const resolveItem = (id) => API.post(`/items/${id}/resolve`);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);

/* ---------- Search & match endpoints ---------- */
/**
 * searchItems - calls backend search endpoint and returns item list.
 * - Backend assumed to respond with { items: [...] } for consistency.
 * - Returns an array or throws so UI can show errors.
 */
export const searchItems = async (query) => {
  try {
    const { data } = await API.get(`/items/search?query=${query}`);
    // Defensive: return an empty array if the backend returns no items field.
    return data.items || [];
  } catch (error) {
    console.error("Error searching items:", error);
    throw error;
  }
};

/**
 * getHomepageMatches - fetch high-priority matches for the current user's homepage.
 * - Backend endpoint: GET /api/matches/homepage (requires auth)
 */
export const getHomepageMatches = async () => {
  try {
    const { data } = await API.get('/matches/homepage');
    return data;
  } catch (error){
    console.error("Error fetching homepage matches:", error);
    throw error;
  }
};

/* ---------- Claim endpoints ---------- */
/**
 * createClaim - create a claim for an item.
 * - The backend route used here is POST /claims/item/:itemId
 * - claimData should include itemId and optionally other fields (message, contact info).
 *
 * Note: The function extracts itemId and sends remaining fields as the request body.
 * This wraps server responses and throws server-provided error payloads for UI usage.
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

/**
 * getClaimsForItem - GET /claims/for-item/:itemId
 * - Retrieves all claims for a specific item (owner or admin usage).
 */
export const getClaimsForItem = async (itemId) => {
  try {
    const { data } = await API.get(`/claims/for-item/${itemId}`);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * updateClaimStatus - PUT /claims/:claimId/status
 * - Used by item owners or admins to accept/reject a claim.
 * - Sends { status } in the body.
 */
export const updateClaimStatus = async (claimId, status) => {
  try {
    const { data } = await API.put(`/claims/${claimId}/status`, { status });
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * deleteMyClaim - DELETE /claims/:claimId
 * - Deletes a claim created by the current user.
 */
export const deleteMyClaim = async (claimId) => {
  try {
    const { data } = await API.delete(`/claims/${claimId}`);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

/**
 * getMyClaims - convenience wrapper to fetch claims created by current user.
 */
export const getMyClaims = () => API.get('/claims/my');

/* ---------- Notification endpoints ---------- */
/**
 * getMyNotifications - GET /notifications
 * - Returns the authenticated user's notifications (unread and read).
 */
export const getMyNotifications = async () => {
  try {
    const { data } = await API.get('/notifications');
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error.response.data;
  }
};

/**
 * markNotificationsRead - PUT /notifications/read
 * - Marks notifications as read for the current user.
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

/* ---------- Admin endpoints ---------- */
/**
 * getAdminStats - GET /admin/stats
 * - Example admin function to fetch aggregated stats. Access should be protected server-side.
 */
export const getAdminStats = async () => {
  try {
    const { data } = await API.get('/admin/stats');
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

/* ---------- Default export ---------- */
/**
 * Export the configured axios instance as default in case callers need lower-level access
 * (e.g., to set additional interceptors, cancel tokens, or to make non-wrapped requests).
 */
export default API;
// ...existing code...