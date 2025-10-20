import axios from "axios";

// Base API config — change port if needed
const API = axios.create({
  baseURL: "http://localhost:5000/api", // your backend URL
  withCredentials: true, // if you use cookies / JWT
});

// For protected routes, attach token (if you have JWT auth)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
