# 🎬 IMovies – Online Movie Ticket Booking System

A full-stack cinema ticket booking web application designed with a dark, premium aesthetic inspired by platforms like BookMyShow and AMC. Built for a **B.Tech Computer Science project** and **Skill Wallet submission**, featuring real-time visual seat selection, atomic concurrency protection against duplicate bookings, simulated payment workflows, dynamic QR-code tickets, and role-based access control.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement & Objectives](#-problem-statement--objectives)
3. [Key Features](#-key-features)
4. [Technology Stack](#-technology-stack)
5. [System Architecture](#-system-architecture)
6. [Database Schema & Data Models](#-database-schema--data-models)
7. [RESTful API Documentation](#-restful-api-documentation)
8. [Concurrency & Race Condition Handling](#-concurrency--race-condition-handling)
9. [Installation & Setup Guide](#-installation--setup-guide)
10. [Environment Variables](#-environment-variables)
11. [Running Tests](#-running-tests)
12. [Default Accounts & Demo Credentials](#-default-accounts--demo-credentials)
13. [Deployment Guide](#-deployment-guide)
14. [Limitations & Future Enhancements](#-limitations--future-enhancements)

---

## 🌟 Project Overview

**IMovies** provides a modern, responsive end-to-end cinema reservation workflow:
- **Browse & Filter**: Users explore "Now Showing" and "Coming Soon" movies by genre, language, and release date.
- **Cinemas & Showtimes**: Multiple auditoriums with varying formats (IMAX 3D, Dolby Atmos, 4DX) and dynamic pricing.
- **Interactive Visual Seating**: Visual cinema auditorium layout with tiered categories: **Regular**, **Premium**, and luxury **Recliner**.
- **Real-Time Seat Locking**: Server-side atomic validation preventing double bookings.
- **Simulated Payment & Tickets**: Demo checkout workflow generating a unique booking reference (`IMV-XXXXXX`), verified admission QR code, and printable boarding-pass ticket.
- **Customer Dashboard**: View upcoming vs. past bookings, print tickets, and cancel eligible bookings (with automatic seat inventory release).
- **Admin Portal**: Restricted control panel to monitor revenue, schedule showtimes, manage the movie catalog, and inspect all platform bookings.

---

## 🎯 Problem Statement & Objectives

### Problem Statement
Traditional cinema ticketing systems often suffer from race conditions where two simultaneous users attempt to reserve the same seat, leading to double-booked seats, inconsistent states, and client-side pricing manipulation.

### Objectives
1. **Architect a Robust Full-Stack Application**: Decoupled client (React 18 + Vite) and server (Express.js + MongoDB) following REST conventions.
2. **Prevent Double Booking at the Database Level**: Enforce atomic MongoDB queries so concurrent booking attempts for identical seats safely reject duplicates (`409 Conflict`).
3. **Zero Trust Pricing**: Derive and validate all ticket quantities and prices strictly on the server—never trust client-supplied totals.
4. **Security & Privacy**: Passwords hashed with bcryptjs (10 rounds), signed JWTs in HttpOnly cookies and Bearer tokens, rate limiting on auth endpoints, and strict RBAC authorization.

---

## 🚀 Key Features

### User Experience (Frontend)
- **Cinematic Dark Theme**: Deep black and navy tones (`#080A0F`), crisp typography, and red accents (`#E50914`).
- **Featured Hero Spotlight**: High-impact movie trailer integration and quick-booking actions.
- **Instant Search & Multi-Filter**: Real-time debounce search by title, cast, and director; filter chips for genre and language.
- **Auditorium Seat Layout**: Interactive visual cinema seat picker with row designations, category labels, tooltips, and real-time total calculator.
- **Boarding Pass Ticket**: Clean printable receipt with QR verification code and print-friendly styles.
- **Self-Service Cancellation**: One-click cancellation for eligible upcoming shows, instantly returning seats to the pool.

### Administration (Backend & Admin UI)
- **Role-Based Access Control**: Normal users cannot self-assign admin roles or invoke administrative endpoints.
- **Real-Time Analytics**: Live cards for total revenue, active screenings, registered users, and booking counts.
- **Catalog CRUD**: Add, edit, and deactivate movie titles with poster, backdrop, and YouTube trailer links.
- **Showtime Scheduler**: Conflict-detection engine preventing overlapping showtimes on the same screen.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React, Axios, QRCode.react |
| **Backend** | Node.js, Express.js (ES Modules), Mongoose ODM, JSON Web Tokens (JWT), bcryptjs |
| **Security** | Helmet, Express Rate Limit, Cookie-Parser, CORS Whitelisting |
| **Database** | MongoDB (Local / Atlas / MongoDB Memory Server for test & zero-config dev) |
| **Testing** | Node.js Native Test Runner (`node --test`), Supertest, MongoMemoryServer |

---

## 📐 System Architecture

```
[ Web Browser Client ]
        │  (Axios HTTP / Credentials)
        ▼
[ Express.js REST API (Port 5000) ]
        │
   ┌────┴─────────────────────────────┐
   │ Middleware Pipeline              │
   │  ├─ Helmet (Security Headers)    │
   │  ├─ CORS Whitelist               │
   │  ├─ Cookie Parser & JSON Body    │
   │  ├─ Express Rate Limiter         │
   │  └─ JWT Authentication / RBAC    │
   └────┬─────────────────────────────┘
        │
   ┌────┴─────────────────────────────┐
   │ Controllers & Services           │
   │  ├─ AuthController               │
   │  ├─ MovieController              │
   │  ├─ CinemaController             │
   │  ├─ ShowtimeController           │
   │  ├─ BookingController (Atomic)   │
   │  └─ AdminController              │
   └────┬─────────────────────────────┘
        │  (Mongoose ODM)
        ▼
[ MongoDB Database ] (Users, Movies, Cinemas, Showtimes, Bookings)
```

---

## 🗄️ Database Schema & Data Models

### 1. User (`users`)
- `name` (String, required, trim)
- `email` (String, unique, index, lowercase)
- `passwordHash` (String, bcrypt hash — never exposed via JSON)
- `role` (String, enum: `['user', 'admin']`, default: `'user'`)
- `timestamps`

### 2. Movie (`movies`)
- `title` (String, required, index)
- `description` (String, required)
- `genre` (Array of Strings, indexed)
- `duration` (Number, minutes)
- `language` (Array of Strings)
- `rating` (Number, 0.0 to 10.0)
- `certification` (Enum: `['U', 'UA', 'A', 'PG', 'PG-13', 'R']`)
- `posterUrl`, `backdropUrl`, `trailerUrl` (Strings)
- `cast` (Array of Strings), `director` (String)
- `releaseDate` (Date)
- `status` (Enum: `['now_showing', 'coming_soon']`)

### 3. Cinema (`cinemas`)
- `name` (String, required)
- `address`, `city` (Strings, indexed)
- `screenInfo` (`{ screenNumber: Number, screenType: String }`)
- `seatLayout` (`{ rows: [{ rowLabel, category, seats: [{ seatNumber, colIndex }] }], totalSeats: Number }`)

### 4. Showtime (`showtimes`)
- `movieId` (ObjectId, ref: 'Movie', indexed)
- `cinemaId` (ObjectId, ref: 'Cinema', indexed)
- `startTime` (Date, indexed), `endTime` (Date)
- `pricing` (`{ Regular: Number, Premium: Number, Recliner: Number }`)
- `status` (Enum: `['active', 'cancelled', 'completed']`)
- `bookedSeats` (`[{ seatNumber: String, bookingId: ObjectId, bookedAt: Date }]`)

### 5. Booking (`bookings`)
- `bookingReference` (String, unique, uppercase index, e.g. `IMV-7A8B9C`)
- `userId` (ObjectId, ref: 'User', indexed)
- `showtimeId` (ObjectId, ref: 'Showtime', indexed)
- `selectedSeats` (`[{ seatNumber, category, price }]`)
- `ticketQuantity` (Number)
- `totalAmount` (Number — calculated strictly on server)
- `paymentStatus` (Enum: `['pending', 'paid', 'failed', 'refunded']`)
- `bookingStatus` (Enum: `['confirmed', 'cancelled']`)
- `qrCodeDataUrl` (Data URI string)

---

## 🔒 Concurrency & Race Condition Handling

To guarantee that two users clicking "Pay" at the exact same millisecond cannot book the same seat:

```javascript
// Server: src/controllers/bookingController.js
const reservationUpdate = await Showtime.findOneAndUpdate(
  {
    _id: showtime._id,
    status: 'active',
    // CRITICAL: Ensures NONE of the requested seats exist in bookedSeats
    'bookedSeats.seatNumber': { $nin: seatNumbersToBook }
  },
  {
    $push: {
      bookedSeats: {
        $each: seatNumbersToBook.map(seatNumber => ({
          seatNumber,
          bookingId: tempBookingId,
          bookedAt: new Date()
        }))
      }
    }
  },
  { new: true }
);

if (!reservationUpdate) {
  // Atomic rejection: another user completed the reservation first
  return res.status(409).json({
    success: false,
    message: 'One or more selected seats were just booked by another user.'
  });
}
```

This design provides concurrency protection on both single MongoDB instances and replica sets without requiring multi-document distributed transaction overhead.

---

## 📡 RESTful API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Login with email and password | Public |
| `POST` | `/api/auth/logout` | Logout and clear cookie | Public |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | User |
| `PUT` | `/api/auth/profile` | Update user name / password | User |

### Movies (`/api/movies`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies` | List movies with search, filters, pagination | Public |
| `GET` | `/api/movies/:id` | Get movie details & upcoming showtimes | Public |
| `POST` | `/api/movies` | Create movie record | Admin |
| `PUT` | `/api/movies/:id` | Update movie details | Admin |
| `DELETE` | `/api/movies/:id` | Safe delete movie | Admin |

### Cinemas & Showtimes
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cinemas` | List all cinema locations | Public |
| `GET` | `/api/showtimes` | List active screenings | Public |
| `GET` | `/api/showtimes/:id/seats` | Get seat map & live booked seats | Public |
| `POST` | `/api/admin/showtimes` | Schedule a new showtime screening | Admin |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Book seats with atomic reservation | User |
| `GET` | `/api/bookings/my-bookings` | View user's upcoming and past tickets | User |
| `GET` | `/api/bookings/:id` | Get detailed ticket pass by ID | User (Owner/Admin) |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel booking & release seats | User (Owner/Admin) |

### Admin Analytics (`/api/admin`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Aggregated revenue and activity stats | Admin |
| `GET` | `/api/admin/bookings` | Searchable list of all user bookings | Admin |
| `GET` | `/api/admin/users` | All registered accounts & spend stats | Admin |
| `PATCH` | `/api/admin/bookings/:id` | Update booking or refund status | Admin |

---

## ⚡ Installation & Setup Guide

### Prerequisites
- **Node.js** v18+ (tested on v24)
- **npm** v9+
- **MongoDB** (Local instance, Atlas URI, or built-in in-memory fallback)

### 1. Clone or Open Project
```bash
cd imovies
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Seed Database
```bash
cd ../server
npm run seed
```

### 4. Start Development Servers
In Terminal 1 (Backend):
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

In Terminal 2 (Frontend):
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔑 Default Accounts & Demo Credentials

The database seed populates pre-configured demo accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@imovies.com` | `AdminPassword123!` | Full Admin Dashboard, Catalog Management, Showtimes |
| **Demo Customer** | `alex@imovies.com` | `DemoUser123!` | Seat Booking, Customer Profile, Cancellations |

> *Tip: The login page includes quick-fill buttons for both accounts.*

---

## 🧪 Running Automated Tests

A comprehensive automated test suite verifies authentication, admin guard rails, pricing derivation, QR generation, race-condition double booking prevention, and seat release:

```bash
cd server
npm test
```

Test Results:
```
✔ 1. Auth: User registration and password hashing
✔ 2. Auth: User login with valid credentials
✔ 3. Auth: Login fails with invalid password
✔ 4. Security: Normal user CANNOT access admin dashboard endpoint (403 Forbidden)
✔ 5. Admin Setup & Authorization
✔ 6. Setup test movie, cinema, and showtime
✔ 7. Booking: Successful seat reservation with pricing derivation and QR code
✔ 8. Concurrency / Double Booking Prevention: Attempting to book already-reserved seat A1 fails (409 Conflict)
✔ 9. Simultaneous Concurrent Requests: Race condition test for same seat B1
✔ 10. Cancellation & Seat Release: Cancel booking and verify seat is available again

✔ 10 tests passed
```

---

## 🌐 Deployment Guide

### Backend (Render, Railway, or Heroku)
1. Set Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/imovies?retryWrites=true&w=majority`
   - `JWT_SECRET=<strong-random-secret>`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
2. Start command: `node src/server.js`

### Frontend (Vercel, Netlify, or Cloudflare Pages)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Environment Variable:
   - `VITE_API_BASE_URL=https://your-backend-api.onrender.com/api`

---

## 🔮 Limitations & Future Enhancements
- **Production Payment Gateway**: Replace demo simulated payment with Razorpay or Stripe Webhooks.
- **Snacks & Concessions**: Add food and beverage pre-order add-ons during seat checkout.
- **Email Delivery**: Automated PDF ticket dispatch via SendGrid or Nodemailer.
- **Loyalty Points**: Cinema rewards wallet system for recurring moviegoers.
