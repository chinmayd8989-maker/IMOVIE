import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  Film,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

const SeatSelectionPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showtimeData, setShowtimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected seats state: array of seatNumber strings, e.g. ["A1", "A2"]
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const fetchSeatData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/showtimes/${showtimeId}/seats`);
      setShowtimeData(res.data.data);
    } catch (err) {
      setError(err.customMessage || 'Failed to load auditorium seating configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatData();
    window.scrollTo(0, 0);
  }, [showtimeId]);

  if (loading) return <LoadingSpinner fullScreen message="Loading cinema seat layout..." />;
  if (error || !showtimeData) return <ErrorMessage message={error || 'Showtime unavailable.'} onRetry={fetchSeatData} />;

  const { movie, cinema, startTime, pricing, bookedSeats = [] } = showtimeData;
  const bookedSet = new Set(bookedSeats);

  // Toggle seat selection
  const handleSeatClick = (seatNumber, isBooked, category) => {
    if (isBooked) {
      showToast(`Seat ${seatNumber} is already occupied.`, 'warning');
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length >= 10) {
        showToast('Maximum 10 seats allowed per booking transaction.', 'warning');
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Build quick price map
  const getSeatCategory = (seatNumber) => {
    const rowChar = seatNumber.charAt(0);
    const rowObj = (cinema.seatLayout?.rows || []).find((r) => r.rowLabel === rowChar);
    return rowObj ? rowObj.category : 'Regular';
  };

  // Price calculations
  const breakdown = selectedSeats.reduce(
    (acc, seatNum) => {
      const cat = getSeatCategory(seatNum);
      const price = pricing[cat] || 200;
      if (!acc[cat]) {
        acc[cat] = { count: 0, price, total: 0 };
      }
      acc[cat].count += 1;
      acc[cat].total += price;
      acc.grandTotal += price;
      return acc;
    },
    { grandTotal: 0 }
  );

  const formattedDateTime = () => {
    const d = new Date(startTime);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Proceed to simulated payment
  const handleProceedToPayment = () => {
    if (!user) {
      showToast('Please sign in or create an account to proceed with booking.', 'info');
      navigate(`/login?redirect=/showtimes/${showtimeId}/seats`);
      return;
    }

    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat on the visual layout.', 'warning');
      return;
    }

    setShowCheckoutModal(true);
  };

  // Execute actual booking API
  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true);
      const payload = {
        showtimeId,
        seats: selectedSeats.map((seatNumber) => ({
          seatNumber,
          category: getSeatCategory(seatNumber),
        })),
      };

      const res = await api.post('/bookings', payload);
      const confirmedBooking = res.data.data.booking;

      showToast('Booking successfully confirmed! Enjoy your movie.', 'success');
      setShowCheckoutModal(false);

      // Navigate to confirmation page
      navigate(`/booking-confirmation/${confirmedBooking._id}`);
    } catch (err) {
      showToast(err.customMessage || 'Failed to complete booking. Seats may have been taken.', 'error');
      // Refresh current seats in case someone booked concurrently
      fetchSeatData();
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Breadcrumb & Showtime Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0E131E] border border-[#1A2234] p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <Link
            to={`/movies/${movie._id}`}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Movie Details
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white">{movie.title}</h1>
            <span className="bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {movie.certification || 'UA'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {cinema.name} ({cinema.screenInfo?.screenType || 'Dolby Atmos'})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
              {formattedDateTime()}
            </span>
          </div>
        </div>

        {/* Pricing Summary Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#141B29] border border-[#222E46] text-slate-300">
            Regular: <span className="font-bold text-white">₹{pricing.Regular}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#141B29] border border-[#222E46] text-purple-300">
            Premium: <span className="font-bold text-white">₹{pricing.Premium}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#141B29] border border-[#222E46] text-amber-300">
            Recliner: <span className="font-bold text-white">₹{pricing.Recliner}</span>
          </div>
        </div>
      </div>

      {/* Main Seating Layout & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Seating Map Canvas */}
        <div className="lg:col-span-8 bg-[#0B0E16] border border-[#1A2234] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          {/* Cinema Screen Indicator */}
          <div className="w-full max-w-xl text-center mb-10">
            <div className="w-full h-3 bg-gradient-to-r from-transparent via-[#E50914] to-transparent rounded-full shadow-[0_-8px_20px_rgba(229,9,20,0.5)]" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400 mt-3">
              All Eyes This Way • Cinema Screen
            </p>
          </div>

          {/* Seat Layout Grid */}
          <div className="w-full overflow-x-auto pb-6 flex flex-col items-center">
            <div className="min-w-[480px] space-y-3">
              {(cinema.seatLayout?.rows || []).map((row) => (
                <div key={row.rowLabel} className="flex items-center justify-center gap-2">
                  {/* Row Letter Left */}
                  <span className="w-5 text-xs font-bold text-slate-400 text-center">
                    {row.rowLabel}
                  </span>

                  {/* Seats in row */}
                  <div className="flex items-center gap-1.5">
                    {row.seats.map((seat) => {
                      const isBooked = bookedSet.has(seat.seatNumber);
                      const isSelected = selectedSeats.includes(seat.seatNumber);
                      const isRecliner = row.category === 'Recliner';

                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          onClick={() => handleSeatClick(seat.seatNumber, isBooked, row.category)}
                          disabled={isBooked}
                          title={`${seat.seatNumber} (${row.category}) - ₹${pricing[row.category] || 200}`}
                          className={`flex items-center justify-center text-[10px] font-bold rounded-t-lg transition-all select-none ${
                            isRecliner ? 'w-8 h-8 rounded-md' : 'w-7 h-7'
                          } ${
                            isBooked
                              ? 'bg-[#182030] text-slate-600 border border-[#222B3F] cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-[#E50914] text-white border-2 border-white shadow-lg shadow-[#E50914]/50 scale-110 z-10'
                              : row.category === 'Recliner'
                              ? 'bg-[#1C1F2B] hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-200'
                              : row.category === 'Premium'
                              ? 'bg-[#181D2C] hover:bg-purple-500 hover:text-white border border-purple-500/30 text-purple-200'
                              : 'bg-[#161C2A] hover:bg-[#253047] hover:text-white border border-[#26334D] text-slate-300'
                          }`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Letter Right */}
                  <span className="w-5 text-xs font-bold text-slate-400 text-center">
                    {row.rowLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Legend */}
          <div className="w-full pt-6 mt-4 border-t border-[#161D2B] flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#161C2A] border border-[#26334D]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#E50914] border-2 border-white" />
              <span className="text-white font-semibold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#182030] border border-[#222B3F] opacity-50" />
              <span>Already Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#1C1F2B] border border-amber-500/50" />
              <span>Recliner (Luxury)</span>
            </div>
          </div>
        </div>

        {/* Booking Summary Sidebar */}
        <div className="lg:col-span-4 bg-[#0E131E] border border-[#1A2234] rounded-3xl p-6 shadow-2xl space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-white border-b border-[#1A2234] pb-3 flex items-center gap-2">
            <Film className="w-5 h-5 text-[#E50914]" />
            Booking Summary
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">Movie</p>
              <p className="text-base font-bold text-white">{movie.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400">Cinema</p>
                <p className="font-semibold text-slate-200">{cinema.name}</p>
              </div>
              <div>
                <p className="text-slate-400">City</p>
                <p className="font-semibold text-slate-200">{cinema.city}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400">Showtime</p>
              <p className="text-xs font-semibold text-white">{formattedDateTime()}</p>
            </div>
          </div>

          {/* Selected Seats Badges */}
          <div className="border-t border-[#182133] pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Selected Seats:</span>
              <span className="text-white font-bold">
                {selectedSeats.length > 0 ? selectedSeats.length : 'None'}
              </span>
            </div>

            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedSeats.map((seatNum) => (
                  <span
                    key={seatNum}
                    className="inline-flex items-center px-2 py-1 rounded bg-[#E50914] text-white text-xs font-bold shadow-sm"
                  >
                    {seatNum}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Click seats on the layout above to pick.</p>
            )}
          </div>

          {/* Pricing Breakdown */}
          {selectedSeats.length > 0 && (
            <div className="border-t border-[#182133] pt-4 space-y-2 text-xs">
              {Object.keys(breakdown)
                .filter((k) => k !== 'grandTotal')
                .map((cat) => (
                  <div key={cat} className="flex justify-between text-slate-300">
                    <span>
                      {cat} × {breakdown[cat].count}
                    </span>
                    <span className="font-semibold text-white">₹{breakdown[cat].total}</span>
                  </div>
                ))}

              <div className="flex justify-between text-slate-400 pt-1 text-[11px]">
                <span>Convenience Fee (Demo Waiver):</span>
                <span className="text-emerald-400 font-semibold">FREE (₹0)</span>
              </div>

              <div className="flex justify-between items-center text-sm font-extrabold text-white pt-3 border-t border-[#1D2538]">
                <span>Total Payable:</span>
                <span className="text-xl text-[#FF4C61]">₹{breakdown.grandTotal}</span>
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={selectedSeats.length === 0}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${
              selectedSeats.length > 0
                ? 'bg-[#E50914] hover:bg-[#B81D24] text-white shadow-[#E50914]/30 cursor-pointer hover:scale-[1.02]'
                : 'bg-[#182132] text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Proceed to Checkout
          </button>

          <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Instant Seat Reservation Guarantee
          </p>
        </div>
      </div>

      {/* Simulated Payment Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131E] border border-[#222E46] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1A2234] pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#E50914]" />
                <h3 className="text-lg font-black text-white">Simulated Payment</h3>
              </div>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-amber-500/30">
                Demo Mode
              </span>
            </div>

            <div className="bg-[#141B29] p-4 rounded-2xl border border-[#1D2638] space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Movie:</span>
                <span className="font-bold text-white">{movie.title}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Seats:</span>
                <span className="font-bold text-white">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tickets:</span>
                <span className="font-bold text-white">{selectedSeats.length}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-[#20293D]">
                <span>Total Amount:</span>
                <span className="text-[#E50914]">₹{breakdown.grandTotal}</span>
              </div>
            </div>

            <div className="bg-[#172031]/60 border border-[#232F46] p-3 rounded-xl text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Demo Simulated Checkout
              </p>
              <p className="text-[11px] text-slate-400">
                No real credit card is charged. The backend validates real-time seat availability atomically and issues your confirmed booking reference with a verified QR ticket.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={bookingLoading}
                className="flex-1 py-3 bg-[#161D2B] hover:bg-[#20283A] text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Back to Seats
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="flex-1 py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#E50914]/25 transition-all flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Pay & Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelectionPage;
