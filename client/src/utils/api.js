// client/src/utils/api.js
import axios from "axios";

/**
 * Create the base Axios instance.
 * Assumes a proxy is set up in vite.config.js or package.json
 */
const API = axios.create({
  baseURL: "/api", // Use the relative path for the proxy
  withCredentials: true,
});

/**
 * Interceptor to automatically attach the auth token.
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
export const createItem = async (itemData) => {
  try {
    const { data } = await API.post('/items', itemData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    throw error.response.data;
  }
};
export const getItemById = async (id) => {
  try {
    const { data } = await API.get(`/items/${id}`);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

// --- MyPosts / Item Management Functions ---
export const getMyPosts = () => API.get('/items/my-posts');
export const deleteItem = (id) => API.delete(`/items/${id}`);
export const resolveItem = (id) => API.post(`/items/${id}/resolve`);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);

// --- Search & Match Functions ---
export const searchItems = async (query) => {
  try {
    const { data } = await API.get(`/items/search?query=${query}`);
    return data.items || [];
  } catch (error) {
    console.error("Error searching items:", error);
    throw error;
  }
};
export const getHomepageMatches = async () => {
  try {
    const { data } = await API.get('/matches/homepage');
    return data;
  } catch (error){
    console.error("Error fetching homepage matches:", error);
    throw error;
  }
};

// --- Claim Functions ---
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
    return data;
  } catch (error) {
    throw error.response.data;
  }
};
export const updateClaimStatus = async (claimId, status) => {
  try {
    const { data } = await API.put(`/claims/${claimId}/status`, { status });
    return data;
  } catch (error) {
    throw error.response.data;
  }
};
export const deleteMyClaim = async (claimId) => {
  try {
    const { data } = await API.delete(`/claims/${claimId}`);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};
/**
 * Fetches the claims made BY the current user.
 */
export const getMyClaims = () => API.get('/claims/my');

// --- NOTIFICATION FUNCTIONS ---
export const getMyNotifications = async () => {
  try {
    const { data } = await API.get('/notifications');
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error.response.data;
  }
};
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