import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the proxy configuration
    proxy: {
      // String shorthand:
      // '/api': 'http://localhost:5000'

      // With options:
      "/api": {
        target: "http://localhost:5000", // Your backend server
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false, // If you're using http (not https)
      },
      // You can also proxy websockets
      "/ws": {
        target: "ws://localhost:5000",
        ws: true,
      },
    },
  },
});