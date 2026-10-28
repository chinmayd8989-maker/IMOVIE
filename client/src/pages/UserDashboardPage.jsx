import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  User,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Printer,
  XCircle,
  AlertTriangle,
  Lock,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const UserDashboardPage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'profile'
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation state
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/bookings/my-bookings');
      setUpcomingBookings(res.data.data.upcoming || []);
      setPastBookings(res.data.data.past || []);
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancellingBookingId(cancelModalBooking._id);
      await api.patch(`/bookings/${cancelModalBooking._id}/cancel`, {
        reason: 'User cancelled from dashboard',
      });
      showToast('Booking cancelled successfully. Seats have been released.', 'success');
      setCancelModalBooking(null);
      fetchBookings();
    } catch (err) {
      showToast(err.customMessage || 'Failed to cancel booking.', 'error');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const payload = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await updateProfile(payload);
      if (res.success) {
        showToast('Profile updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Error updating profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderBookingCard = (booking, isPast = false) => {
    const showtime = booking.showtimeId || {};
    const movie = showtime.movieId || {};
    const cinema = showtime.cinemaId || {};
    const isCancelled = booking.bookingStatus === 'cancelled';

    return (
      <div
        key={booking._id}
        className="bg-[#0E131E] border border-[#1A2234] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between gap-6 hover:border-[#222E46] transition-all"
      >
        <div className="flex gap-4">
          {/* Poster Thumb */}
          <div className="w-20 h-28 rounded-xl overflow-hidden bg-[#161D2B] flex-shrink-0 border border-[#20293D]">
            <img
              src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba'}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Ref:</span>
              <span className="text-xs font-black text-white tracking-wider bg-[#141B29] px-2 py-0.5 rounded border border-[#222E46]">
                {booking.bookingReference}
              </span>
              {isCancelled ? (
                <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">
                  Cancelled
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Confirmed
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-white">{movie.title || 'Movie'}</h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {cinema.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
                {formatDateTime(showtime.startTime)}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">Seats:</span>
              {booking.selectedSeats.map((s) => (
                <span
                  key={s.seatNumber}
                  className="bg-[#172031] text-white font-bold px-2 py-0.5 rounded border border-[#232F47]"
                >
                  {s.seatNumber}
                </span>
              ))}
              <span className="text-slate-400 ml-2">Total:</span>
              <span className="font-bold text-white">₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 md:border-l border-[#182133] pt-3 md:pt-0 md:pl-6">
          <Link
            to={`/booking-confirmation/${booking._id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E50914] hover:bg-[#B81D24] shadow-md shadow-[#E50914]/20 transition-all"
          >
            <Ticket className="w-3.5 h-3.5" />
            View Ticket
          </Link>

          {!isPast && !isCancelled && (
            <button
              onClick={() => setCancelModalBooking(booking)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2234] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your cinema bookings, tickets, and profile credentials.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0E131E] border border-[#1D2536] px-4 py-2 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-[#E50914] text-white flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1A2234]">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-[#E50914] text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Upcoming Bookings ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'past'
              ? 'border-[#E50914] text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Past Bookings ({pastBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#E50914] text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          My Profile & Security
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <LoadingSpinner message="Fetching user records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchBookings} />
      ) : activeTab === 'upcoming' ? (
        <div className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl p-12 text-center max-w-lg mx-auto">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No upcoming bookings</h3>
              <p className="text-xs text-slate-400 mb-6">
                You haven't reserved any tickets for upcoming showtimes.
              </p>
              <Link
                to="/"
                className="px-5 py-2.5 bg-[#E50914] hover:bg-[#B81D24] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Explore Now Showing
              </Link>
            </div>
          ) : (
            upcomingBookings.map((b) => renderBookingCard(b, false))
          )}
        </div>
      ) : activeTab === 'past' ? (
        <div className="space-y-4">
          {pastBookings.length === 0 ? (
            <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl p-12 text-center max-w-lg mx-auto">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No past booking records</h3>
              <p className="text-xs text-slate-400">Completed movie bookings will appear here.</p>
            </div>
          ) : (
            pastBookings.map((b) => renderBookingCard(b, true))
          )}
        </div>
      ) : (
        /* Profile Tab */
        <div className="bg-[#0E131E] border border-[#1A2234] rounded-3xl p-6 sm:p-8 max-w-2xl shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Account Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your display name and login credentials.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#101520] border border-[#1A2234] rounded-xl px-4 py-3 text-slate-400 text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">Email cannot be changed.</p>
            </div>

            <div className="pt-4 border-t border-[#182133] space-y-4">
              <h3 className="text-sm font-bold text-white">Change Password (Optional)</h3>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password to set a new one"
                  className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131E] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">Cancel Booking Confirmation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to cancel booking{' '}
                <span className="text-white font-bold">{cancelModalBooking.bookingReference}</span>?
                Your reserved seats (
                <span className="text-[#FF4C61] font-bold">
                  {cancelModalBooking.selectedSeats.map((s) => s.seatNumber).join(', ')}
                </span>
                ) will be immediately released back to the auditorium inventory.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                disabled={Boolean(cancellingBookingId)}
                className="flex-1 py-3 bg-[#161D2B] hover:bg-[#20283A] text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={Boolean(cancellingBookingId)}
                className="flex-1 py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                {cancellingBookingId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;
