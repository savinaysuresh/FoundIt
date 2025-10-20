// client/src/utils/api.js
import axios from "axios";

// Base API config — this assumes you are using a proxy in vite.config.js
// (e.g., server: { proxy: { '/api': 'http://localhost:5000' } })
const API = axios.create({
  baseURL: "/api", // Use relative path for the proxy
  withCredentials: true,
});

// For protected routes, attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- NEW FUNCTIONS FOR YOUR FRONTEND TO USE ---

// Fetches only the logged-in user's posts
export const getMyPosts = () => API.get('/items/my-posts');

// Deletes a post
export const deleteItem = (id) => API.delete(`/items/${id}`);

// Resolves a post
export const resolveItem = (id) => API.post(`/items/${id}/resolve`);

// Updates a post
export const updateItem = (id, data) => API.put(`/items/${id}`, data);


// You can add all your other API calls here too:
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
// etc.


export default API;
