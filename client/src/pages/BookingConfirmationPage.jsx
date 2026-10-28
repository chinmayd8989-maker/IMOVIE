import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  CheckCircle2,
  Printer,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Film,
  ArrowRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data.data.booking);
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve booking confirmation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen message="Retrieving your confirmed ticket..." />;
  if (error || !booking) return <ErrorMessage message={error || 'Booking not found.'} onRetry={fetchBooking} />;

  const showtime = booking.showtimeId || {};
  const movie = showtime.movieId || {};
  const cinema = showtime.cinemaId || {};

  const formattedDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Top Success Banner */}
      <div className="bg-[#0f291e]/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-2xl no-print">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-emerald-300 text-sm max-w-md mx-auto">
          Your cinema seats have been locked in the database. A verification QR code has been generated for admission.
        </p>
        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Demo Simulated Payment Completed • Reference: {booking.bookingReference}</span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-[#141B29] px-4 py-2.5 rounded-xl border border-[#222E46] transition-colors"
        >
          <Ticket className="w-4 h-4 text-[#E50914]" />
          View All My Bookings
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E50914] hover:bg-[#B81D24] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#E50914]/20 transition-all hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            Print / Save Ticket
          </button>
        </div>
      </div>

      {/* The Printable Boarding Pass Ticket */}
      <div
        id="printable-ticket"
        className="bg-[#0E131E] border border-[#20293D] rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Ticket Header Brand */}
        <div className="bg-gradient-to-r from-[#B81D24] to-[#E50914] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6" />
            <span className="text-xl font-extrabold tracking-wider">IMOVIES ADMISSION PASS</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 block">
              Booking Ref
            </span>
            <span className="text-lg font-black tracking-widest">{booking.bookingReference}</span>
          </div>
        </div>

        {/* Ticket Main Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Movie & Venue Info */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider">
                  Movie Title
                </span>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {movie.certification || 'UA'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{movie.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {(movie.language || []).join(', ')} • {movie.duration} Minutes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1C2538] text-xs">
              <div>
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Cinema & Screen
                </span>
                <p className="font-bold text-white text-sm">{cinema.name}</p>
                <p className="text-slate-400 text-xs">{cinema.screenInfo?.screenType || 'Dolby Atmos'}</p>
              </div>

              <div>
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Show Date & Time
                </span>
                <p className="font-bold text-white text-sm">{formattedDateTime(showtime.startTime)}</p>
              </div>
            </div>

            {/* Seats Badges */}
            <div className="pt-4 border-t border-[#1C2538]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Confirmed Seats ({booking.ticketQuantity})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.selectedSeats.map((seat) => (
                  <div
                    key={seat.seatNumber}
                    className="bg-[#151D2C] border border-[#232F47] px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
                  >
                    <span className="text-[#FF4C61]">{seat.seatNumber}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({seat.category})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="pt-4 border-t border-[#1C2538] flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Total Paid (Demo):</span>
                <p className="text-xl font-black text-white mt-0.5">₹{booking.totalAmount}</p>
              </div>
              <div>
                <span className="text-slate-400">Payment Status:</span>
                <p className="text-emerald-400 font-bold uppercase text-xs">
                  {booking.paymentStatus}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Booked By:</span>
                <p className="text-slate-200 font-semibold">{booking.userId?.name || 'Guest User'}</p>
              </div>
            </div>
          </div>

          {/* QR Code & Scan Section */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#090C12] rounded-2xl border border-[#1A2234] text-center space-y-4">
            {booking.qrCodeDataUrl ? (
              <img
                src={booking.qrCodeDataUrl}
                alt="Ticket QR Code"
                className="w-44 h-44 rounded-xl border-4 border-white shadow-xl bg-white p-1"
              />
            ) : (
              <div className="w-44 h-44 bg-white/10 rounded-xl flex items-center justify-center text-xs text-slate-400">
                QR Unavailable
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-white tracking-wider uppercase">Scan at Entrance</p>
              <p className="text-[11px] text-slate-400 leading-tight">
                Present this digital QR code or printed ticket at the theater usher counter.
              </p>
            </div>
          </div>
        </div>

        {/* Tear-off Bottom Edge Decorative Circles */}
        <div className="relative border-t-2 border-dashed border-[#1C2538] p-4 bg-[#080B10] flex items-center justify-between text-[11px] text-slate-500">
          <span>IMovies Electronic Ticket • All rights reserved</span>
          <span>Security Token: {booking._id}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
