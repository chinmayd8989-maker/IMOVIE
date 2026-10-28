import mongoose from 'mongoose';

const bookedSeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie ID is required'],
      index: true,
    },
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
      required: [true, 'Cinema ID is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Show start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Show end time is required'],
    },
    pricing: {
      Regular: {
        type: Number,
        required: true,
        min: [50, 'Price must be at least 50'],
      },
      Premium: {
        type: Number,
        required: true,
        min: [50, 'Price must be at least 50'],
      },
      Recliner: {
        type: Number,
        required: true,
        min: [50, 'Price must be at least 50'],
      },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
      index: true,
    },
    bookedSeats: [bookedSeatSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for rapid lookup and scheduling conflicts
showtimeSchema.index({ cinemaId: 1, startTime: 1 });
showtimeSchema.index({ movieId: 1, startTime: 1 });
showtimeSchema.index({ 'bookedSeats.seatNumber': 1 });

const Showtime = mongoose.model('Showtime', showtimeSchema);

export default Showtime;
