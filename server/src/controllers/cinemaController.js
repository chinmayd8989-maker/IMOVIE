import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';

export const getCinemas = async (req, res, next) => {
  try {
    const { city } = req.query;
    const query = {};
    if (city && city !== 'All') {
      query.city = new RegExp(city, 'i');
    }

    const cinemas = await Cinema.find(query).sort({ city: 1, name: 1 });
    const cities = await Cinema.distinct('city');

    res.status(200).json({
      success: true,
      data: {
        cinemas,
        cities: cities.sort(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCinemaById = async (req, res, next) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { cinema },
    });
  } catch (error) {
    next(error);
  }
};

export const createCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Cinema created successfully',
      data: { cinema },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Cinema updated successfully',
      data: { cinema },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }

    const upcomingShowtimes = await Showtime.countDocuments({
      cinemaId: cinema._id,
      startTime: { $gte: new Date() },
    });

    if (upcomingShowtimes > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete cinema with active scheduled showtimes.',
      });
    }

    await Cinema.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Cinema deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
