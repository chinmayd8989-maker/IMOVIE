import express from 'express';
import {
  getCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
  deleteCinema,
} from '../controllers/cinemaController.js';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCinemas);
router.get('/:id', getCinemaById);

// Admin-only endpoints
router.post('/', authenticateUser, authorizeAdmin, createCinema);
router.put('/:id', authenticateUser, authorizeAdmin, updateCinema);
router.delete('/:id', authenticateUser, authorizeAdmin, deleteCinema);

export default router;
