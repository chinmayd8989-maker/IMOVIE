import express from 'express';
import {
  getDashboardStats,
  getAllBookings,
  getAllUsers,
  updateBookingStatus,
} from '../controllers/adminController.js';
import { createCinema } from '../controllers/cinemaController.js';
import { createShowtime } from '../controllers/showtimeController.js';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Enforce both authentication and admin authorization for all /api/admin routes
router.use(authenticateUser, authorizeAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);
router.patch('/bookings/:id', updateBookingStatus);
router.post('/cinemas', createCinema);
router.post('/showtimes', createShowtime);

export default router;
