import Showtime from '../models/Showtime.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';

export const getShowtimes = async (req, res, next) => {
  try {
    const { movieId, cinemaId, date } = req.query;
    const query = { status: 'active' };

    if (movieId) query.movieId = movieId;
    if (cinemaId) query.cinemaId = cinemaId;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // By default show from current time onwards
      query.startTime = { $gte: new Date() };
    }

    const showtimes = await Showtime.find(query)
      .populate('movieId', 'title posterUrl duration certification language genre rating')
      .populate('cinemaId', 'name address city screenInfo')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: { showtimes },
    });
  } catch (error) {
    next(error);
  }
};

export const getShowtimeSeats = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movieId', 'title duration certification language posterUrl')
      .populate('cinemaId');

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    const cinema = showtime.cinemaId;
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema information unavailable for this showtime',
      });
    }

    const bookedSeatNumbers = (showtime.bookedSeats || []).map((s) => s.seatNumber);

    res.status(200).json({
      success: true,
      data: {
        showtimeId: showtime._id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        pricing: showtime.pricing,
        status: showtime.status,
        movie: showtime.movieId,
        cinema: {
          _id: cinema._id,
          name: cinema.name,
          address: cinema.address,
          city: cinema.city,
          screenInfo: cinema.screenInfo,
          seatLayout: cinema.seatLayout,
        },
        bookedSeats: bookedSeatNumbers,
        totalSeats: cinema.seatLayout?.totalSeats || 60,
        availableSeatsCount: Math.max(
          0,
          (cinema.seatLayout?.totalSeats || 60) - bookedSeatNumbers.length
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createShowtime = async (req, res, next) => {
  try {
    const { movieId, cinemaId, startTime, endTime, pricing } = req.body;

    if (!movieId || !cinemaId || !startTime || !endTime || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Movie, cinema, start time, end time, and pricing are required',
      });
    }

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);

    if (parsedStart < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Showtime start time must be in the future',
      });
    }

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    // Check for cinema scheduling overlap
    const conflict = await Showtime.findOne({
      cinemaId,
      status: 'active',
      $or: [
        { startTime: { $lt: parsedEnd, $gte: parsedStart } },
        { endTime: { $gt: parsedStart, $lte: parsedEnd } },
        { startTime: { $lte: parsedStart }, endTime: { $gte: parsedEnd } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Scheduling conflict: another showtime exists at this cinema screen for this time slot.',
      });
    }

    const showtime = await Showtime.create({
      movieId,
      cinemaId,
      startTime: parsedStart,
      endTime: parsedEnd,
      pricing,
    });

    res.status(201).json({
      success: true,
      message: 'Showtime scheduled successfully',
      data: { showtime },
    });
  } catch (error) {
    next(error);
  }
};

export const updateShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Showtime updated successfully',
      data: { showtime },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    if (showtime.bookedSeats && showtime.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete showtime with existing confirmed bookings. Cancel the showtime or refund bookings first.',
      });
    }

    await Showtime.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Showtime removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
