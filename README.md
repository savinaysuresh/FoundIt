# 🔍 FoundIt — Campus Lost & Found Hub

**FoundIt** is a full-stack solution designed to bridge the gap between lost items and their owners on campus. Featuring an automated matching engine, real-time notifications via Socket.IO, and a robust admin dashboard, it simplifies the recovery process through intelligent automation.

---

## ✨ Features

* **Smart Matching:** Automatically pairs lost and found reports based on categories and descriptions.
* **Real-Time Alerts:** Instant notifications via Socket.IO when a potential match or claim is made.
* **Fuzzy Search:** Powerful client-side searching powered by **Fuse.js**.
* **Image Management:** Seamless photo uploads handled by **Cloudinary**.
* **Admin Control:** Comprehensive dashboard for managing users, claims, and resolving disputes.

---

## 🛠️ Tech Stack

### Frontend

* **Framework:** React (Vite)
* **Styling:** Tailwind CSS
* **State & Logic:** AuthContext, Axios, Fuse.js
* **Real-time:** Socket.io-client

### Backend

* **Runtime:** Node.js + Express
* **Database:** MongoDB + Mongoose
* **Real-time:** Socket.IO
* **File Handling:** Multer + Cloudinary

---

## 🚀 Quick Start

### 1. Backend Setup

1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Configure environment variables in a `.env` file (see [Environment Variables](https://www.google.com/search?q=%23environment-variables)).
4. Start the server: `npm run dev`
* *Entry point:* [`server/server.js`](https://www.google.com/search?q=server/server.js)



### 2. Frontend Setup

1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
* *Entry point:* [`client/src/main.jsx`](https://www.google.com/search?q=client/src/main.jsx)



---

## 🔑 Environment Variables

Your `.env` file in the `/server` directory should include:

| Key | Description |
| --- | --- |
| `MONGO_URI` | Connection string for MongoDB |
| `JWT_SECRET` | Secret key for secure authentication |
| `CLOUDINARY_URL` | Credentials for image hosting |
| `CLIENT_ORIGIN` | `http://localhost:5173` (for CORS/Sockets) |

---

## 📂 Project Structure & Key Links

### Backend Architecture

* **Logic Hub:** [`services/matcherService.js`](https://www.google.com/search?q=server/services/matcherService.js) — The core algorithm that links items.
* **Controllers:** * [Items](https://www.google.com/search?q=server/controllers/itemController.js) | [Claims](https://www.google.com/search?q=server/controllers/claimController.js) | [Auth](https://www.google.com/search?q=server/controllers/authController.js)
* **Models:** * [Item](https://www.google.com/search?q=server/models/Item.js) | [Match](https://www.google.com/search?q=server/models/Match.js) | [Notification](https://www.google.com/search?q=server/models/Notification.js) | [User](https://www.google.com/search?q=server/models/User.js)

### Frontend Highlights

* **Routing:** [`client/src/App.jsx`](https://www.google.com/search?q=client/src/App.jsx)
* **Core Pages:**
* [Home/Search](https://www.google.com/search?q=client/src/pages/Home.jsx) | [Report Item](https://www.google.com/search?q=client/src/pages/ReportLost.jsx) | [Admin Panel](https://www.google.com/search?q=client/src/pages/AdminDashboard.jsx)


* **API Utility:** [`client/src/utils/api.js`](https://www.google.com/search?q=client/src/utils/api.js) (Axios configuration)

---

## 📡 API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/items` | Fetch all items (supports fuzzy search) |
| `POST` | `/api/items` | Create a lost or found post |
| `POST` | `/api/claims/item/:id` | Submit a claim for a specific item |
| `GET` | `/api/matches/homepage` | Fetch matched pairs for the dashboard |
| `PUT` | `/api/notifications/read` | Clear user notifications |

---

## 💡 Troubleshooting

* **Image Uploads:** Ensure your Cloudinary environment variables are correctly formatted. If using local storage, ensure the `/uploads` folder is created.
* **Real-time Updates:** If notifications aren't appearing, verify that `CLIENT_ORIGIN` in the backend `.env` matches your frontend URL.
* **Search Issues:** Text search relies on MongoDB text indexes defined in the [Item Model](https://www.google.com/search?q=server/models/Item.js).