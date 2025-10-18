import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Automatically attach token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
