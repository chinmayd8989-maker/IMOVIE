import Movie from '../models/Movie.js';
import Showtime from '../models/Showtime.js';

export const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      sortBy = 'releaseDate',
      order = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Status filter
    if (status && ['now_showing', 'coming_soon'].includes(status)) {
      query.status = status;
    }

    // Genre filter
    if (genre && genre !== 'All') {
      query.genre = { $in: [new RegExp(genre, 'i')] };
    }

    // Language filter
    if (language && language !== 'All') {
      query.language = { $in: [new RegExp(language, 'i')] };
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { director: searchRegex },
        { cast: { $in: [searchRegex] } },
      ];
    }

    // Sort order
    const sortOptions = {};
    const sortFields = ['title', 'releaseDate', 'rating', 'duration'];
    const validSort = sortFields.includes(sortBy) ? sortBy : 'releaseDate';
    sortOptions[validSort] = order === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Movie.countDocuments(query),
    ]);

    // Distinct genres and languages for frontend filter options
    const [allGenres, allLanguages] = await Promise.all([
      Movie.distinct('genre'),
      Movie.distinct('language'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        movies,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        filters: {
          genres: allGenres.sort(),
          languages: allLanguages.sort(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Fetch upcoming showtimes for this movie
    const now = new Date();
    const showtimes = await Showtime.find({
      movieId: movie._id,
      status: 'active',
      startTime: { $gte: now },
    })
      .populate('cinemaId', 'name address city screenInfo')
      .sort({ startTime: 1 });

    // Group showtimes by cinema
    const cinemaMap = new Map();
    showtimes.forEach((st) => {
      if (!st.cinemaId) return;
      const cinemaId = st.cinemaId._id.toString();
      if (!cinemaMap.has(cinemaId)) {
        cinemaMap.set(cinemaId, {
          cinema: st.cinemaId,
          showtimes: [],
        });
      }
      cinemaMap.get(cinemaId).showtimes.push({
        _id: st._id,
        startTime: st.startTime,
        endTime: st.endTime,
        pricing: st.pricing,
        availableSeatsCount: Math.max(
          0,
          (st.cinemaId.seatLayout?.totalSeats || 60) - (st.bookedSeats?.length || 0)
        ),
      });
    });

    res.status(200).json({
      success: true,
      data: {
        movie,
        cinemasWithShowtimes: Array.from(cinemaMap.values()),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: { movie },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: { movie },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Check if there are active future showtimes with bookings
    const activeShowtimes = await Showtime.find({
      movieId: movie._id,
      status: 'active',
      startTime: { $gte: new Date() },
      'bookedSeats.0': { $exists: true },
    });

    if (activeShowtimes.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete movie with active upcoming showtimes that have confirmed seat bookings. Deactivate or reschedule first.',
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
