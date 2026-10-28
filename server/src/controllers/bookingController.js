import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import Cinema from '../models/Cinema.js';
import { generateQRCode } from '../utils/qr.js';

// Helper to generate a clean, readable reference code like IMV-4K9P2X
const generateBookingRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IMV-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { showtimeId, seats } = req.body;

    if (!showtimeId) {
      return res.status(400).json({
        success: false,
        message: 'Showtime ID is required',
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one seat to book',
      });
    }

    if (seats.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'You can book a maximum of 10 seats per transaction',
      });
    }

    // 1. Fetch showtime with populated cinema
    const showtime = await Showtime.findById(showtimeId)
      .populate('cinemaId')
      .populate('movieId', 'title posterUrl duration language certification');

    if (!showtime || showtime.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'The requested showtime is unavailable or no longer active',
      });
    }

    // Check if showtime has already passed
    if (new Date(showtime.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book tickets for a showtime that has already started or passed',
      });
    }

    const cinema = showtime.cinemaId;
    if (!cinema) {
      return res.status(500).json({
        success: false,
        message: 'Cinema configuration not found for this showtime',
      });
    }

    // 2. Validate seat existence in cinema layout and derive pricing on backend
    const seatMap = new Map();
    for (const row of cinema.seatLayout.rows) {
      for (const seat of row.seats) {
        if (!seat.isWalkway) {
          seatMap.set(seat.seatNumber, {
            seatNumber: seat.seatNumber,
            category: row.category,
            price: showtime.pricing[row.category] || 200,
          });
        }
      }
    }

    const seatNumbersToBook = [];
    const validatedSeats = [];
    let calculatedTotal = 0;

    for (const item of seats) {
      const seatNum = (typeof item === 'string' ? item : item.seatNumber).trim().toUpperCase();
      if (!seatMap.has(seatNum)) {
        return res.status(400).json({
          success: false,
          message: `Seat "${seatNum}" is not a valid seat in this auditorium`,
        });
      }

      if (seatNumbersToBook.includes(seatNum)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate seat selection: ${seatNum}`,
        });
      }

      const seatDetails = seatMap.get(seatNum);
      seatNumbersToBook.push(seatNum);
      validatedSeats.push(seatDetails);
      calculatedTotal += seatDetails.price;
    }

    // 3. Atomically reserve seats on Showtime to prevent race conditions
    // Generates temporary booking ID for tracking
    const tempBookingId = new mongoose.Types.ObjectId();

    const reservationUpdate = await Showtime.findOneAndUpdate(
      {
        _id: showtime._id,
        status: 'active',
        'bookedSeats.seatNumber': { $nin: seatNumbersToBook },
      },
      {
        $push: {
          bookedSeats: {
            $each: seatNumbersToBook.map((seatNumber) => ({
              seatNumber,
              bookingId: tempBookingId,
              bookedAt: new Date(),
            })),
          },
        },
      },
      { new: true }
    );

    if (!reservationUpdate) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats were just booked by another user. Please choose alternative seats.',
      });
    }

    // 4. Generate unique booking reference and QR code
    let bookingReference = generateBookingRef();
    let collisionCheck = await Booking.findOne({ bookingReference });
    while (collisionCheck) {
      bookingReference = generateBookingRef();
      collisionCheck = await Booking.findOne({ bookingReference });
    }

    const qrPayload = {
      ref: bookingReference,
      movie: showtime.movieId.title,
      cinema: cinema.name,
      seats: seatNumbersToBook.join(', '),
      showtime: showtime.startTime,
      verifyUrl: `https://imovies.app/verify/${bookingReference}`,
    };

    const qrCodeDataUrl = await generateQRCode(qrPayload);

    // 5. Create final confirmed Booking document
    const booking = await Booking.create({
      _id: tempBookingId,
      bookingReference,
      userId,
      showtimeId: showtime._id,
      selectedSeats: validatedSeats,
      ticketQuantity: validatedSeats.length,
      totalAmount: calculatedTotal,
      paymentStatus: 'paid', // Simulated demo payment
      paymentDetails: {
        transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        paymentMethod: 'Demo Secure Checkout',
        paidAt: new Date(),
      },
      bookingStatus: 'confirmed',
      qrCodeDataUrl,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration certification language' },
          { path: 'cinemaId', select: 'name address city screenInfo' },
        ],
      });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: {
        booking: populatedBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration certification language genre' },
          { path: 'cinemaId', select: 'name address city screenInfo' },
        ],
      })
      .sort({ createdAt: -1 });

    const now = new Date();
    const upcoming = [];
    const past = [];

    bookings.forEach((b) => {
      const showStartTime = b.showtimeId?.startTime ? new Date(b.showtimeId.startTime) : null;
      if (b.bookingStatus === 'confirmed' && showStartTime && showStartTime > now) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        bookings,
        upcoming,
        past,
        total: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration certification language genre backdropUrl' },
          { path: 'cinemaId', select: 'name address city screenInfo' },
        ],
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership or admin check
    const isOwner = booking.userId?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this booking.',
      });
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('showtimeId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Authorization check
    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled',
      });
    }

    // Check cancellation eligibility
    const showtime = booking.showtimeId;
    if (!showtime) {
      return res.status(400).json({
        success: false,
        message: 'Associated showtime could not be found',
      });
    }

    const showStart = new Date(showtime.startTime);
    const now = new Date();

    // Cancellation policy: allow cancellation up to 1 hour before showtime
    const oneHourBefore = new Date(showStart.getTime() - 60 * 60 * 1000);
    if (now >= oneHourBefore && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation deadline passed. Bookings can only be cancelled at least 1 hour before showtime.',
      });
    }

    // Extract seat numbers to release
    const seatNumbersToRelease = booking.selectedSeats.map((s) => s.seatNumber);

    // Atomically release seats from Showtime
    await Showtime.updateOne(
      { _id: showtime._id },
      {
        $pull: {
          bookedSeats: { seatNumber: { $in: seatNumbersToRelease } },
        },
      }
    );

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been released.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
