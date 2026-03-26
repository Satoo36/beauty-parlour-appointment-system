# 💅 QA Appointment System
### *The Ultimate Beauty Parlour Management & Real-time Booking Solution*

[![Build Status](https://img.shields.io/badge/status-production--ready-success)](https://github.com/your-username/qa-appointment-system)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-ISC-orange.svg)](LICENSE)

**QA Appointment System** is a robust, production-grade MERN stack application designed to streamline beauty parlour operations. From automated slot generation to real-time queue tracking and secure payment processing, this system provides a seamless experience for clients, staff, and administrators.

---

## 🌐 Live Demo
- **Frontend**: [Coming Soon](https://qa-appointment-client.vercel.app)
- **Backend API**: [Coming Soon](https://qa-appointment-server.render.com)

---

## 🚀 Key Highlights & Features

### 📅 Smart Appointment Booking
- **Dynamic Slot Generation**: Automated time-slot calculation based on staff availability and service duration.
- **Conflict Detection**: Prevents double-booking and manages buffer times between appointments.
- **Service Catalog**: Categorized services with duration, pricing, and staff assignment.

### 💳 Integrated Payments & Refunds
- **Razorpay Integration**: Secure checkout with automatic order creation and payment verification.
- **Automated Refunds**: Instant slot release and status updates upon cancellation/refund.
- **Invoice Generation**: Auto-generated transaction details for every completed booking.

### ⏱️ Real-time Queue System (WebSockets)
- **Live Queue Board**: Real-time position tracking for waiting customers using Socket.IO.
- **Instant Sync**: Dashboards update instantly when appointments are called or completed.
- **Broadcast Notifications**: Global alerts for system-wide updates.

### 📊 Advanced Admin & Staff Dashboards
- **Business Intelligence**: Visual analytics for revenue trends, booking outcomes, and staff performance.
- **Role-Based Access Control (RBAC)**: Secure access for Users, Staff, and Administrators.
- **Staff Scheduling**: Granular control over working hours and service specializations.

---

## 📸 Screenshots & Visuals

### 🏠 Landing Page
![Landing Page](docs/screenshots/landing.png)
*A premium, responsive landing page featuring service highlights and call-to-actions.*

### 📅 Booking Flow
![Booking Page](docs/screenshots/booking.png)
*Clean, step-by-step booking process with real-time slot selection.*

### 🛠️ Admin Analytics
![Admin Dashboard](docs/screenshots/admin-analytics.png)
*Comprehensive data visualization of revenue, appointments, and user growth.*

### 🚦 Real-time Queue Board
![Queue System](docs/screenshots/queue.png)
*Live tracking of active and upcoming appointments.*

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
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
│   │   └── utils/          # Slot generators, Cloudinary, etc.
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
| **User** | `user@example.com` | `password123` |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20 or higher)
- MongoDB Atlas account (or local MongoDB)
- Razorpay & Cloudinary API Keys

### 2. Clone & Install
```bash
git clone https://github.com/your-username/qa-appointment-system.git
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
If you like this project, please give it a star! It helps more people discover it.

---
*Developed with ❤️ by [Your Name]*
