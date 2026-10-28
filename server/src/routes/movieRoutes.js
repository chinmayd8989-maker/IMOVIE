import express from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController.js';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMovies);
router.get('/:id', getMovieById);

// Admin-only endpoints
router.post('/', authenticateUser, authorizeAdmin, createMovie);
router.put('/:id', authenticateUser, authorizeAdmin, updateMovie);
router.delete('/:id', authenticateUser, authorizeAdmin, deleteMovie);

export default router;
