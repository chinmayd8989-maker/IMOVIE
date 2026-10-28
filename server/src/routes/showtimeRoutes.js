import express from 'express';
import {
  getShowtimes,
  getShowtimeSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from '../controllers/showtimeController.js';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getShowtimes);
router.get('/:id/seats', getShowtimeSeats);

// Admin-only endpoints
router.post('/', authenticateUser, authorizeAdmin, createShowtime);
router.put('/:id', authenticateUser, authorizeAdmin, updateShowtime);
router.delete('/:id', authenticateUser, authorizeAdmin, deleteShowtime);

export default router;
