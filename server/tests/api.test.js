import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import User from '../src/models/User.js';
import Movie from '../src/models/Movie.js';
import Cinema from '../src/models/Cinema.js';
import Showtime from '../src/models/Showtime.js';
import Booking from '../src/models/Booking.js';

let mongoServer;

describe('IMovies API Test Suite', () => {
  let userToken;
  let adminToken;
  let testMovieId;
  let testCinemaId;
  let testShowtimeId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('1. Auth: User registration and password hashing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Viewer',
        email: 'viewer@example.com',
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.role, 'user');
    assert.strictEqual(res.body.data.user.passwordHash, undefined, 'Password hash must never be returned');
    assert.ok(res.body.data.token, 'Token should be returned');
    userToken = res.body.data.token;
  });

  test('2. Auth: User login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'viewer@example.com',
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, 'viewer@example.com');
  });

  test('3. Auth: Login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'viewer@example.com',
        password: 'WrongPassword!',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('4. Security: Normal user CANNOT access admin dashboard endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  test('5. Admin Setup & Authorization', async () => {
    // Create an admin user directly
    const passwordHash = await User.hashPassword('AdminSec123!');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin_test@example.com',
      passwordHash,
      role: 'admin',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin_test@example.com',
        password: 'AdminSec123!',
      });

    assert.strictEqual(loginRes.status, 200);
    adminToken = loginRes.body.data.token;

    // Verify Admin can access admin dashboard
    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(dashRes.body.success, true);
    assert.ok(dashRes.body.data.stats);
  });

  test('6. Setup test movie, cinema, and showtime', async () => {
    const movie = await Movie.create({
      title: 'Inception 2',
      description: 'Dream within a dream',
      genre: ['Sci-Fi', 'Action'],
      duration: 150,
      language: ['English'],
      rating: 8.8,
      certification: 'UA',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401',
      releaseDate: new Date(),
      status: 'now_showing',
    });
    testMovieId = movie._id;

    const cinema = await Cinema.create({
      name: 'Test Multiplex',
      address: 'Main Street',
      city: 'Metropolis',
      screenInfo: { screenNumber: 1, screenType: 'IMAX 3D' },
      seatLayout: {
        rows: [
          {
            rowLabel: 'A',
            category: 'Regular',
            seats: [
              { seatNumber: 'A1', colIndex: 1, isWalkway: false },
              { seatNumber: 'A2', colIndex: 2, isWalkway: false },
              { seatNumber: 'A3', colIndex: 3, isWalkway: false },
            ],
          },
          {
            rowLabel: 'B',
            category: 'Premium',
            seats: [
              { seatNumber: 'B1', colIndex: 1, isWalkway: false },
              { seatNumber: 'B2', colIndex: 2, isWalkway: false },
            ],
          },
        ],
        totalSeats: 5,
      },
    });
    testCinemaId = cinema._id;

    // Start time in the future
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const endTime = new Date(startTime.getTime() + 150 * 60 * 1000);

    const showtime = await Showtime.create({
      movieId: testMovieId,
      cinemaId: testCinemaId,
      startTime,
      endTime,
      pricing: { Regular: 150, Premium: 250, Recliner: 400 },
      status: 'active',
    });
    testShowtimeId = showtime._id;

    assert.ok(testShowtimeId);
  });

  test('7. Booking: Successful seat reservation with pricing derivation and QR code', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [{ seatNumber: 'A1' }, { seatNumber: 'A2' }],
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.booking.ticketQuantity, 2);
    assert.strictEqual(res.body.data.booking.totalAmount, 300); // 150 * 2 Regular seats
    assert.ok(res.body.data.booking.bookingReference.startsWith('IMV-'));
    assert.ok(res.body.data.booking.qrCodeDataUrl.startsWith('data:image/png;base64,'));
  });

  test('8. Concurrency / Double Booking Prevention: Attempting to book already-reserved seat A1 fails (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [{ seatNumber: 'A1' }], // Already booked in test 7
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /booked/i);
  });

  test('9. Simultaneous Concurrent Requests: Race condition test for same seat B1', async () => {
    // Fire two parallel booking requests for seat B1
    const [req1, req2] = await Promise.all([
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showtimeId: testShowtimeId,
          seats: [{ seatNumber: 'B1' }],
        }),
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showtimeId: testShowtimeId,
          seats: [{ seatNumber: 'B1' }],
        }),
    ]);

    const statuses = [req1.status, req2.status];
    // Exactly one must succeed (201) and the other must be rejected (409)
    assert.ok(statuses.includes(201), 'One request must succeed');
    assert.ok(statuses.includes(409), 'The duplicate request must be rejected with 409 Conflict');
  });

  test('10. Cancellation & Seat Release: Cancel booking and verify seat is available again', async () => {
    // Book seat B2
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [{ seatNumber: 'B2' }],
      });

    assert.strictEqual(bookRes.status, 201);
    const bookingId = bookRes.body.data.booking._id;

    // Cancel the booking
    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Change of plans' });

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.data.booking.bookingStatus, 'cancelled');

    // Verify seat B2 is now free again to be booked!
    const rebookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [{ seatNumber: 'B2' }],
      });

    assert.strictEqual(rebookRes.status, 201);
  });
});
