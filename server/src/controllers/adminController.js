import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Showtime from '../models/Showtime.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMovies,
      nowShowingMovies,
      comingSoonMovies,
      totalCinemas,
      totalShowtimes,
      totalBookings,
      recentBookings,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Movie.countDocuments(),
      Movie.countDocuments({ status: 'now_showing' }),
      Movie.countDocuments({ status: 'coming_soon' }),
      Cinema.countDocuments(),
      Showtime.countDocuments({ startTime: { $gte: new Date() } }),
      Booking.countDocuments(),
      Booking.find()
        .populate('userId', 'name email')
        .populate({
          path: 'showtimeId',
          populate: [
            { path: 'movieId', select: 'title' },
            { path: 'cinemaId', select: 'name city' },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(6),
      Booking.aggregate([
        { $match: { bookingStatus: 'confirmed', paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalMovies,
          nowShowingMovies,
          comingSoonMovies,
          totalCinemas,
          upcomingShowtimes: totalShowtimes,
          totalBookings,
          totalRevenue,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.bookingStatus = status;
    }

    if (search && search.trim()) {
      query.bookingReference = new RegExp(search.trim(), 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('userId', 'name email')
        .populate({
          path: 'showtimeId',
          populate: [
            { path: 'movieId', select: 'title posterUrl duration' },
            { path: 'cinemaId', select: 'name city' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

    // Aggregate booking counts per user
    const bookingCounts = await Booking.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
    ]);

    const countMap = new Map();
    bookingCounts.forEach((b) => {
      countMap.set(b._id.toString(), { count: b.count, totalSpent: b.totalSpent });
    });

    const enrichedUsers = users.map((u) => {
      const stats = countMap.get(u._id.toString()) || { count: 0, totalSpent: 0 };
      return {
        ...u.toObject(),
        bookingCount: stats.count,
        totalSpent: stats.totalSpent,
      };
    });

    res.status(200).json({
      success: true,
      data: { users: enrichedUsers },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { bookingStatus, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
