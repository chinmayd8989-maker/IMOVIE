import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Movie from '../src/models/Movie.js';
import Cinema from '../src/models/Cinema.js';
import Showtime from '../src/models/Showtime.js';
import Booking from '../src/models/Booking.js';
import { generateQRCode } from '../src/utils/qr.js';

// Helper to generate a realistic cinema seating layout
const generateCinemaLayout = (regularRows = ['A', 'B'], premiumRows = ['C', 'D', 'E'], reclinerRows = ['F', 'G']) => {
  const rows = [];

  // Regular rows: 10 seats per row
  regularRows.forEach((rowLabel) => {
    const seats = [];
    for (let col = 1; col <= 10; col++) {
      seats.push({
        seatNumber: `${rowLabel}${col}`,
        colIndex: col,
        isWalkway: col === 3 || col === 8 ? false : false, // clean layout
      });
    }
    rows.push({
      rowLabel,
      category: 'Regular',
      seats,
    });
  });

  // Premium rows: 10 seats per row
  premiumRows.forEach((rowLabel) => {
    const seats = [];
    for (let col = 1; col <= 10; col++) {
      seats.push({
        seatNumber: `${rowLabel}${col}`,
        colIndex: col,
        isWalkway: false,
      });
    }
    rows.push({
      rowLabel,
      category: 'Premium',
      seats,
    });
  });

  // Recliner rows: 8 seats per row (luxury spacious seats)
  reclinerRows.forEach((rowLabel) => {
    const seats = [];
    for (let col = 1; col <= 8; col++) {
      seats.push({
        seatNumber: `${rowLabel}${col}`,
        colIndex: col,
        isWalkway: false,
      });
    }
    rows.push({
      rowLabel,
      category: 'Recliner',
      seats,
    });
  });

  return { rows };
};

import { connectDB, disconnectDB } from '../src/config/db.js';

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to database for seeding...');

    // Clear existing collections safely
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Cinema.deleteMany({}),
      Showtime.deleteMany({}),
      Booking.deleteMany({}),
    ]);
    console.log('Cleaned existing collections.');

    // 1. Seed Users (1 Admin, 2 Regular Demo Users)
    const adminPasswordHash = await User.hashPassword(process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPassword123!');
    const userPasswordHash = await User.hashPassword('DemoUser123!');

    const [adminUser, regularUser, regularUser2] = await User.create([
      {
        name: 'IMovies Chief Admin',
        email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@imovies.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
      },
      {
        name: 'Alex Johnson',
        email: 'alex@imovies.com',
        passwordHash: userPasswordHash,
        role: 'user',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@imovies.com',
        passwordHash: userPasswordHash,
        role: 'user',
      },
    ]);
    console.log(`Users seeded (Admin: ${adminUser.email}, Demo: ${regularUser.email})`);

    // 2. Seed Cinemas
    const cinemas = await Cinema.create([
      {
        name: 'IMovies Grand IMAX - Lower Parel',
        address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        screenInfo: {
          screenNumber: 1,
          screenType: 'IMAX 3D',
        },
        seatLayout: generateCinemaLayout(['A', 'B'], ['C', 'D', 'E'], ['F', 'G']),
      },
      {
        name: 'IMovies Dolby Atmos Cineplex - Koramangala',
        address: '80 Feet Road, 4th Block, Koramangala',
        city: 'Bengaluru',
        screenInfo: {
          screenNumber: 3,
          screenType: 'Dolby Atmos',
        },
        seatLayout: generateCinemaLayout(['A', 'B'], ['C', 'D', 'E'], ['F', 'G']),
      },
      {
        name: 'IMovies Megaplex 4DX - Connaught Place',
        address: 'Radial Road 1, Block M, Connaught Place',
        city: 'Delhi NCR',
        screenInfo: {
          screenNumber: 2,
          screenType: '4DX',
        },
        seatLayout: generateCinemaLayout(['A', 'B'], ['C', 'D', 'E'], ['F', 'G']),
      },
    ]);
    console.log(`Seeded ${cinemas.length} Cinemas.`);

    // 3. Seed Movies (At least 8 sample movies)
    const movies = await Movie.create([
      {
        title: 'Dune: Part Two',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        duration: 166,
        language: ['English', 'Hindi'],
        rating: 8.6,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
        director: 'Denis Villeneuve',
        releaseDate: new Date('2024-03-01'),
        status: 'now_showing',
      },
      {
        title: 'Oppenheimer',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genre: ['Biography', 'Drama', 'History'],
        duration: 180,
        language: ['English', 'Hindi'],
        rating: 8.9,
        certification: 'A',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
        director: 'Christopher Nolan',
        releaseDate: new Date('2023-07-21'),
        status: 'now_showing',
      },
      {
        title: 'Spider-Man: Across the Spider-Verse',
        description:
          'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
        genre: ['Animation', 'Action', 'Adventure'],
        duration: 140,
        language: ['English', 'Hindi', 'Tamil'],
        rating: 8.7,
        certification: 'U',
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
        cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac'],
        director: 'Joaquim Dos Santos, Kemp Powers',
        releaseDate: new Date('2023-06-02'),
        status: 'now_showing',
      },
      {
        title: 'Interstellar',
        description:
          'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        duration: 169,
        language: ['English'],
        rating: 8.7,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
        director: 'Christopher Nolan',
        releaseDate: new Date('2014-11-07'),
        status: 'now_showing',
      },
      {
        title: 'The Dark Knight',
        description:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genre: ['Action', 'Crime', 'Drama'],
        duration: 152,
        language: ['English', 'Hindi'],
        rating: 9.0,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
        director: 'Christopher Nolan',
        releaseDate: new Date('2008-07-18'),
        status: 'now_showing',
      },
      {
        title: 'Gladiator II',
        description:
          'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome.',
        genre: ['Action', 'Adventure', 'Drama'],
        duration: 148,
        language: ['English', 'Hindi'],
        rating: 7.8,
        certification: 'A',
        posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
        cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington'],
        director: 'Ridley Scott',
        releaseDate: new Date('2024-11-15'),
        status: 'now_showing',
      },
      {
        title: 'Avatar: The Way of Water',
        description:
          'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
        genre: ['Sci-Fi', 'Action', 'Adventure'],
        duration: 192,
        language: ['English', 'Hindi', 'Telugu'],
        rating: 7.6,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
        director: 'James Cameron',
        releaseDate: new Date('2022-12-16'),
        status: 'now_showing',
      },
      {
        title: 'Inception',
        description:
          'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
        genre: ['Sci-Fi', 'Action', 'Thriller'],
        duration: 148,
        language: ['English', 'Hindi'],
        rating: 8.8,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
        director: 'Christopher Nolan',
        releaseDate: new Date('2010-07-16'),
        status: 'now_showing',
      },
      {
        title: 'Tron: Ares',
        description:
          'A highly sophisticated Program named Ares is sent from the digital world into the real world on a dangerous mission, marking humankind\'s first encounter with A.I. beings.',
        genre: ['Sci-Fi', 'Action', 'Adventure'],
        duration: 135,
        language: ['English'],
        rating: 8.2,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=example',
        cast: ['Jared Leto', 'Greta Lee', 'Evan Peters'],
        director: 'Joachim Rønning',
        releaseDate: new Date('2026-10-10'),
        status: 'coming_soon',
      },
      {
        title: 'Avengers: Secret Wars',
        description:
          'Earth\'s mightiest heroes face their greatest multiversal crisis as timelines collide in an epic battle that will determine the fate of all reality.',
        genre: ['Action', 'Sci-Fi', 'Adventure'],
        duration: 180,
        language: ['English', 'Hindi', 'Tamil', 'Telugu'],
        rating: 9.2,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
        backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=example2',
        cast: ['Robert Downey Jr.', 'Pedro Pascal', 'Benedict Cumberbatch'],
        director: 'Anthony and Joe Russo',
        releaseDate: new Date('2027-05-07'),
        status: 'coming_soon',
      },
    ]);
    console.log(`Seeded ${movies.length} Movies (8 Now Showing, 2 Coming Soon).`);

    // 4. Seed Showtimes for Now Showing movies over the next 3 days
    const nowShowing = movies.filter((m) => m.status === 'now_showing');
    const showtimesToInsert = [];
    const baseDate = new Date();

    const timeSlots = [
      { hours: 10, mins: 30 },
      { hours: 14, mins: 15 },
      { hours: 18, mins: 0 },
      { hours: 21, mins: 45 },
    ];

    let count = 0;
    // Iterate over days (today, tomorrow, day after)
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      for (const cinema of cinemas) {
        for (let i = 0; i < nowShowing.length; i++) {
          // Distribute movies across cinemas and slots
          const movie = nowShowing[(i + dayOffset) % nowShowing.length];
          const slot = timeSlots[i % timeSlots.length];

          const start = new Date(baseDate);
          start.setDate(start.getDate() + dayOffset);
          start.setHours(slot.hours, slot.mins, 0, 0);

          // Only schedule if start time is in the future
          if (start > new Date()) {
            const end = new Date(start.getTime() + (movie.duration + 20) * 60 * 1000);

            showtimesToInsert.push({
              movieId: movie._id,
              cinemaId: cinema._id,
              startTime: start,
              endTime: end,
              pricing: {
                Regular: cinema.screenInfo.screenType.includes('IMAX') ? 280 : 200,
                Premium: cinema.screenInfo.screenType.includes('IMAX') ? 380 : 300,
                Recliner: cinema.screenInfo.screenType.includes('IMAX') ? 600 : 450,
              },
              status: 'active',
              bookedSeats: [],
            });
            count++;
          }
        }
      }
    }

    const insertedShowtimes = await Showtime.insertMany(showtimesToInsert);
    console.log(`Seeded ${insertedShowtimes.length} future Showtimes.`);

    // 5. Seed a sample confirmed booking for the demo user
    if (insertedShowtimes.length > 0) {
      const sampleShowtime = insertedShowtimes[0];
      const selectedSeats = [
        { seatNumber: 'C4', category: 'Premium', price: sampleShowtime.pricing.Premium },
        { seatNumber: 'C5', category: 'Premium', price: sampleShowtime.pricing.Premium },
      ];
      const totalAmount = selectedSeats.reduce((acc, s) => acc + s.price, 0);
      const bookingRef = 'IMV-DEMO01';

      const qrPayload = {
        ref: bookingRef,
        movie: movies[0].title,
        cinema: cinemas[0].name,
        seats: 'C4, C5',
        showtime: sampleShowtime.startTime,
        verifyUrl: `https://imovies.app/verify/${bookingRef}`,
      };
      const qrCode = await generateQRCode(qrPayload);

      const sampleBooking = await Booking.create({
        bookingReference: bookingRef,
        userId: regularUser._id,
        showtimeId: sampleShowtime._id,
        selectedSeats,
        ticketQuantity: 2,
        totalAmount,
        paymentStatus: 'paid',
        paymentDetails: {
          transactionId: 'TXN-DEMO123456',
          paymentMethod: 'UPI / Credit Card Demo',
          paidAt: new Date(),
        },
        bookingStatus: 'confirmed',
        qrCodeDataUrl: qrCode,
      });

      // Update showtime booked seats atomically
      await Showtime.updateOne(
        { _id: sampleShowtime._id },
        {
          $push: {
            bookedSeats: {
              $each: [
                { seatNumber: 'C4', bookingId: sampleBooking._id, bookedAt: new Date() },
                { seatNumber: 'C5', bookingId: sampleBooking._id, bookedAt: new Date() },
              ],
            },
          },
        }
      );
      console.log('Sample booking confirmed for Alex Johnson (C4, C5).');
    }

    console.log('=============================================');
    console.log(' Database Seeding Completed Successfully! ');
    console.log('=============================================');
    console.log('Demo Credentials:');
    console.log(`Admin User: admin@imovies.com / AdminPassword123!`);
    console.log(`Demo User:  alex@imovies.com  / DemoUser123!`);
    console.log('=============================================');

    await disconnectDB();
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
