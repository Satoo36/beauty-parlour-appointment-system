# QA Appointment System Architecture

This document provides a professional overview of the system architecture, design patterns, and technical stack used in the QA Appointment System.

## 1. System Overview
The QA Appointment System is a full-stack web application designed for beauty parlour management. It facilitates automated slot generation, real-time queue management, secure payments, and role-based administration.

## 2. Technical Stack
### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (Utility-first CSS)
- **State Management**: React Context API (AuthContext)
- **Real-time**: Socket.io-client
- **API Communication**: Axios (with centralized service layer)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io (Events for queue updates and notifications)
- **Security**: JWT (JSON Web Tokens), Bcrypt.js, Helmet, Express-Rate-Limit

### Cloud Services
- **Image Hosting**: Cloudinary (Service and Staff images)
- **Payment Gateway**: Razorpay (Orders and Payment verification)

## 3. Core Architecture & Design Patterns
The project follows a decoupled **Client-Server Architecture**.

### Backend (MVC Pattern-inspired)
- **Routes**: Define the API endpoints.
- **Controllers**: Contain the business logic for each resource (Auth, Appointments, Slots, etc.).
- **Models**: Defines Mongoose schemas for data persistence.
- **Utils**: Dedicated logic for complex operations (Slot generation, Queue management).
- **Middleware**: Handles cross-cutting concerns (Authentication, Error handling).

### Frontend (Component-based)
- **Pages**: Top-level route components.
- **Components**: Reusable UI units (Buttons, Modals, Cards).
- **Hooks**: Custom logic for Socket.io and shared state.
- **Context API**: Centralized management of authentication and user sessions.

## 4. Key Systems
### Slot Generation Logic
A sophisticated algorithm (`slotGenerator.js`) dynamically calculates available time slots based on:
- Staff working hours per day.
- Existing appointments (conflict detection).
- Service duration and buffer times.

### Real-time Queue Management
Utilizes Socket.io to provide instant updates:
- Real-time queue position tracking for users.
- Instant notifications for staff when a new appointment is booked.
- Live status changes for active services.

### Payment Flow
A secure two-step verification process:
1. Backend creates a Razorpay order.
2. Frontend processes the payment and sends the signature to the backend for cryptographic verification before confirming the appointment.

## 5. Folder Structure
- `client/`: React application (SPA)
- `server/`: Express API server
- `docs/`: System documentation (including this file)

## 6. Production Features
- **Security**: Implemented Helmet for security headers and Rate-Limiting for API protection.
- **Performance**: Response compression (gzip) and optimized static file serving.
- **Environment Management**: Centralized `.env` configuration for secrets and API URLs.

---
