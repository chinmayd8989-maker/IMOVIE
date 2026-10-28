import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true, // e.g. "A1", "A2"
    },
    colIndex: {
      type: Number,
      required: true,
    },
    isWalkway: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const rowSchema = new mongoose.Schema(
  {
    rowLabel: {
      type: String,
      required: true, // "A", "B", "C", etc.
    },
    category: {
      type: String,
      enum: ['Regular', 'Premium', 'Recliner'],
      required: true,
    },
    seats: [seatSchema],
  },
  { _id: false }
);

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cinema name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    screenInfo: {
      screenNumber: {
        type: Number,
        default: 1,
      },
      screenType: {
        type: String,
        enum: ['Standard 2D', 'Standard 3D', 'IMAX 3D', '4DX', 'Dolby Atmos'],
        default: 'Dolby Atmos',
      },
    },
    seatLayout: {
      rows: [rowSchema],
      totalSeats: {
        type: Number,
        default: 0,
      },
    },
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

// Pre-save hook to calculate total seats
cinemaSchema.pre('save', function (next) {
  if (this.seatLayout && this.seatLayout.rows) {
    let count = 0;
    this.seatLayout.rows.forEach(r => {
      count += (r.seats || []).filter(s => !s.isWalkway).length;
    });
    this.seatLayout.totalSeats = count;
  }
  next();
});

const Cinema = mongoose.model('Cinema', cinemaSchema);

export default Cinema;
