# 💅 Beauty Parlour Appointment System
### *A Full-Stack Beauty Parlour Booking & Real-Time Queue Management System*

[![Status](https://img.shields.io/badge/status-production--ready-success)](https://github.com/your-username/qa-appointment-system)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-ISC-orange.svg)](LICENSE)

A **production-ready MERN stack application** designed to streamline beauty parlour operations with:

- 📅 Smart appointment booking & slot management  
- 💳 Secure Razorpay payments & refunds  
- ⏱️ Real-time queue system using WebSockets  
- 📊 Admin analytics dashboard  

👉 Built to simulate a **real-world scalable SaaS product**

---

## 🌐 Live Demo

🚧 Deployment in progress (will be available soon)

👉 Meanwhile, run locally using setup guide below.

---

## 🚀 Key Highlights & Features

### 📅 Smart Appointment Booking
- Dynamic slot generation based on staff availability
- Conflict detection to prevent double-booking
- Service catalog with duration, pricing, and staff mapping

### 💳 Payments & Refunds
- Razorpay integration for secure payments
- Automated refunds with instant slot release
- Invoice generation for completed bookings

### ⏱️ Real-time Queue System
- Live queue board using Socket.IO
- Instant updates across dashboards
- Broadcast notifications for real-time events

### 📊 Admin & Staff Dashboards
- Revenue and booking analytics
- Role-based access control (User / Staff / Admin)
- Staff scheduling and service management
---

## 📸 Screenshots & Visuals

### 🏠 Landing Page
![Landing Page](docs/screenshots/landing.png)
*A modern, responsive landing page designed to showcase services and drive user engagement through clear call-to-actions.*

### 📅 Booking Flow
![Booking Page](docs/screenshots/booking.png)
*A seamless, step-by-step booking experience with real-time slot availability and instant confirmation.*

### 🛠️ Admin Analytics
![Admin Dashboard](docs/screenshots/admin-analytics.png)
*An analytics dashboard providing insights into revenue, appointments, and user growth through interactive visualizations*

### 🚦 Real-time Queue Board
![Queue System](docs/screenshots/queue.png)
*A real-time queue management system with token calling, live status updates, and tracking of active and upcoming appointments*

### 👨‍💼 Staff Dashboard
![Staff Dashboard](docs/screenshots/staff-dashboard.png)
*Staff can manage appointments, view schedules, and update status in real-time.*

### 👤 User Booking History
![User Dashboard](docs/screenshots/user-dashboard.png)
*Users can track bookings, history, and upcoming appointments.*

### 🎬 1-Minute Demo Video
![Full Booking Demo] - (https://drive.google.com/file/d/1yBQ0XyBk2IwEkQSTuf5JMKDSzCSZJ8pj/view?usp=drive_link)
*End-to-end booking flow including slot selection, payment, confirmation, and live queue system.*

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS (Utility-first design)
- **State**: React Context API (Auth & Global State)
- **Real-time**: Socket.IO Client
- **Charts**: Recharts (Data visualization)
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js & Express 5
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.IO (WebSockets)
- **Auth**: JWT (JSON Web Tokens) & Bcrypt.js
- **Payment**: Razorpay SDK
- **Storage**: Cloudinary (Image management)

---

## 🏗️ System Architecture

![Architecture Diagram](docs/architecture-diagram.png)

The system follows a decoupled **Client-Server Architecture** with a centralized API layer. The backend implements a controller-service-model pattern for scalability, while the frontend utilizes a service-based API layer to interact with the RESTful endpoints and WebSocket events.

---

## 📂 Project Structure

```bash
qa-appointment-system/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/            # Centralized API service layer
│   │   ├── components/     # Atomic UI components
│   │   ├── context/        # Auth & Global State Providers
│   │   ├── pages/          # Routed page components
│   │   └── hooks/          # Custom business logic hooks
│   └── .env.example        # Client environment template
│
├── server/                 # Express Backend (Node.js)
│   ├── src/
│   │   ├── controllers/    # Business logic handlers
│   │   ├── models/         # Mongoose Data Schemas
│   │   ├── routes/         # API Endpoint Definitions
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── socket/         # Real-time event handlers (SocketIO)
│   │   └── utils/          # Helpers (Cloudinary, token logic)
│   └── .env.example        # Server environment template
│
└── docs/                   # Architecture and Screenshots
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@beautyparlour.com` | `admin123` |
| **Staff** | `staffname@example.com` | `password123` |
| **User** | `user@gmail.com` | `password` |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20 or higher)
- MongoDB Atlas account (or local MongoDB)
- Razorpay & Cloudinary API Keys

### 2. Clone & Install
```bash
git clone https://github.com/kavyanerella65/beauty-parlour-appointment-system.git
cd qa-appointment-system
npm run install:all
```

### 3. Environment Configuration
Create `.env` files in both `client` and `server` directories following the respective `.env.example` templates.

**Server `.env` Highlights:**
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=name
RAZORPAY_KEY_ID=rzp_test_xxx
```

### 4. Run Development
```bash
# This concurrently starts both React and Express
npm run dev
```

---

## 📡 API Overview (Brief)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | `POST` | User registration & Authentication |
| `/api/services` | `GET/POST` | Catalog management |
| `/api/slots` | `GET` | Availability tracking |
| `/api/appointments` | `POST/PATCH` | Booking & Status management |
| `/api/payment` | `POST` | Razorpay order & verification |
| `/api/queue` | `GET/PUT` | Real-time queue control |

---

## 👤 User Roles

| Role | Capabilities |
|------|--------------|
| **Customer** | Browse services, book slots, pay securely, track queue position. |
| **Staff** | Manage personal schedule, update service status, view appointments. |
| **Admin** | Full system control, analytics access, financial exports, RBAC management. |

---

## 🚢 Deployment

- **Frontend**: Recommended deployment on Vercel or Netlify.
- **Backend**: Recommended deployment on Render or Railway.
- **Database**: MongoDB Atlas for cloud persistence.
- **Static Files**: Cloudinary handles all media storage.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License
Distributed under the ISC License. See `LICENSE` for more information.

---

## ⚠️ Security Notes
- **Environment Variables**: Never commit `.env` files to source control.
- **API Security**: Implemented Helmet for secure headers and Rate-Limiting to prevent brute-force attacks.
- **CORS**: Configured to allow only trusted origin requests in production.

---

## 🔮 Future Improvements
- [ ] **AI-Powered Recommendations**: Suggest services based on user history.
- [ ] **Native Mobile App**: React Native version for iOS and Android.
- [ ] **Multi-language Support (i18n)**: Expanding accessibility.
- [ ] **Advanced Scheduling**: Integrating with Google Calendar API.

---

## ⭐ Support
If you found this project helpful, consider giving it a star ⭐