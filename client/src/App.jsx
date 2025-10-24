/*
Annotated copy of: c:\FoundIt\client\src\App.jsx

This is a documentation-only, line-by-line annotated version of App.jsx.
Do NOT paste these comments back into the source file; this file explains
each import, JSX piece, route, and the protected-route pattern used by the app.
*/

import React from "react"; // Import React. Modern toolchains may not require this for JSX, but it's safe and explicit.
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
// Import React Router v6 components:
// - BrowserRouter (aliased as Router): top-level router that uses the HTML5 history API.
// - Routes: replaces Switch from older versions; used to declare route list.
// - Route: declares a single route with a path and element to render.

import Home from "./pages/Home";               // Home page component (public)
import Login from "./pages/Login";             // Login page component (public)
import Register from "./pages/Register";       // Register page component (public)
import ReportLost from "./pages/ReportLost";   // Page to report a lost item (protected)
import ReportFound from "./pages/ReportFound"; // Page to report a found item (protected)
import ItemDetails from "./pages/ItemDetails"; // Item details page (protected)
import MyPosts from "./pages/MyPosts";         // User's posts (protected)
import MyClaims from "./pages/MyClaims";       // User's claims (protected)
import AdminDashboard from "./pages/AdminDashboard"; // Admin-only page (protected + adminOnly)
import ProtectedRoute from "./components/ProtectedRoute"; 
// ProtectedRoute is a wrapper component that enforces authentication (and optionally admin role).
// In Route elements, it's used to wrap pages that require login.

import ItemsMatched from "./pages/ItemsMatched"; // ✅ Additional page: shows items matched to a query
// This import was added so the route below can render the ItemsMatched page.

// The App component uses an implicit return of JSX (arrow function returning parentheses).
const App = () => (
  // Router wraps the entire app to provide routing context to child components.
  <Router>
    {/* Routes contains Route children; only the first matching route's element will render. */}
    <Routes>

      {/* --- Public routes (no authentication required) --- */}
      <Route path="/" element={<Home />} />          // Root path renders Home component
      <Route path="/login" element={<Login />} />   // Login form
      <Route path="/register" element={<Register />} /> // Registration form
      <Route path="/items-matched" element={<ItemsMatched />} /> {/* ✅ Added: public route for items matched */}

      {/* --- Protected routes (require authentication) --- */}
      {/* Each protected route uses the ProtectedRoute component as a wrapper.
          ProtectedRoute should read auth state (e.g., from context) and:
            - render children if authenticated (and has admin role if adminOnly)
            - otherwise redirect to /login or show unauthorized message
      */}

      <Route
        path="/report-lost"
        element={
          // Element prop accepts a React node; here we pass a ProtectedRoute that wraps ReportLost.
          <ProtectedRoute>
            <ReportLost />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report-found"
        element={
          <ProtectedRoute>
            <ReportFound />
          </ProtectedRoute>
        }
      />
     
      {/* --- NOTE: previously a routing mismatch caused broken links to ItemDetails.
                  The path below uses a URL parameter `:id` so links like `/item/123` match. --- */}
      <Route
        path="/item/:id" 
        element={
          <ProtectedRoute>
            <ItemDetails />
          </ProtectedRoute>
        }
      />
      // The `:id` is a dynamic segment; inside ItemDetails you can read it with
      // useParams() from react-router-dom: const { id } = useParams();

      <Route
        path="/my-posts"
        element={
          <ProtectedRoute>
            <MyPosts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-claims"
        element={
          <ProtectedRoute>
            <MyClaims />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          // Passing adminOnly prop to ProtectedRoute signals it must also check the user's role.
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
    </Routes>
  </Router>
);

// Default export allows other modules to import App with: import App from "./App";
export default App;