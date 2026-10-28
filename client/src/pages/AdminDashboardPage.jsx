import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  Users,
  Film,
  Ticket,
  DollarSign,
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  Building,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'movies', 'showtimes', 'bookings', 'users'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Movies list & modals
  const [movies, setMovies] = useState([]);
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: '',
    duration: 120,
    language: 'English, Hindi',
    rating: 8.0,
    certification: 'UA',
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    director: '',
    cast: '',
    releaseDate: new Date().toISOString().split('T')[0],
    status: 'now_showing',
  });

  // Cinemas & Showtimes state
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeModalOpen, setShowtimeModalOpen] = useState(false);
  const [showtimeForm, setShowtimeForm] = useState({
    movieId: '',
    cinemaId: '',
    startTime: '',
    endTime: '',
    priceRegular: 200,
    pricePremium: 300,
    priceRecliner: 450,
  });

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');

  // Users state
  const [usersList, setUsersList] = useState([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data.stats);
    } catch (err) {
      setError(err.customMessage || 'Failed to load admin stats.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await api.get('/movies?limit=50');
      setMovies(res.data.data.movies || []);
    } catch (err) {
      showToast('Failed to load movies list', 'error');
    }
  };

  const fetchCinemasAndShowtimes = async () => {
    try {
      const [cinemasRes, showtimesRes] = await Promise.all([
        api.get('/cinemas'),
        api.get('/showtimes'),
      ]);
      setCinemas(cinemasRes.data.data.cinemas || []);
      setShowtimes(showtimesRes.data.data.showtimes || []);
    } catch (err) {
      showToast('Failed to load cinemas or showtimes', 'error');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings?limit=50');
      setAllBookings(res.data.data.bookings || []);
    } catch (err) {
      showToast('Failed to load bookings list', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsersList(res.data.data.users || []);
    } catch (err) {
      showToast('Failed to load users list', 'error');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMovies();
    fetchCinemasAndShowtimes();
    fetchBookings();
    fetchUsers();
  }, []);

  // Handle Movie Add/Edit
  const handleOpenMovieModal = (movie = null) => {
    if (movie) {
      setEditingMovie(movie);
      setMovieForm({
        title: movie.title,
        description: movie.description,
        genre: (movie.genre || []).join(', '),
        duration: movie.duration,
        language: (movie.language || []).join(', '),
        rating: movie.rating,
        certification: movie.certification,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl || '',
        trailerUrl: movie.trailerUrl || '',
        director: movie.director || '',
        cast: (movie.cast || []).join(', '),
        releaseDate: new Date(movie.releaseDate).toISOString().split('T')[0],
        status: movie.status,
      });
    } else {
      setEditingMovie(null);
      setMovieForm({
        title: '',
        description: '',
        genre: 'Action, Sci-Fi',
        duration: 120,
        language: 'English, Hindi',
        rating: 8.0,
        certification: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        director: 'Director Name',
        cast: 'Actor One, Actor Two',
        releaseDate: new Date().toISOString().split('T')[0],
        status: 'now_showing',
      });
    }
    setMovieModalOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...movieForm,
        genre: movieForm.genre.split(',').map((s) => s.trim()).filter(Boolean),
        language: movieForm.language.split(',').map((s) => s.trim()).filter(Boolean),
        cast: movieForm.cast.split(',').map((s) => s.trim()).filter(Boolean),
        duration: Number(movieForm.duration),
        rating: Number(movieForm.rating),
      };

      if (editingMovie) {
        await api.put(`/movies/${editingMovie._id}`, payload);
        showToast('Movie updated successfully!', 'success');
      } else {
        await api.post('/movies', payload);
        showToast('Movie added successfully!', 'success');
      }

      setMovieModalOpen(false);
      fetchMovies();
      fetchStats();
    } catch (err) {
      showToast(err.customMessage || 'Failed to save movie.', 'error');
    }
  };

  const handleDeleteMovie = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/movies/${id}`);
      showToast(`"${title}" deleted successfully.`, 'success');
      fetchMovies();
      fetchStats();
    } catch (err) {
      showToast(err.customMessage || 'Cannot delete movie.', 'error');
    }
  };

  // Handle Showtime Add
  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        movieId: showtimeForm.movieId,
        cinemaId: showtimeForm.cinemaId,
        startTime: new Date(showtimeForm.startTime),
        endTime: new Date(showtimeForm.endTime),
        pricing: {
          Regular: Number(showtimeForm.priceRegular),
          Premium: Number(showtimeForm.pricePremium),
          Recliner: Number(showtimeForm.priceRecliner),
        },
      };

      await api.post('/admin/showtimes', payload);
      showToast('Showtime scheduled successfully!', 'success');
      setShowtimeModalOpen(false);
      fetchCinemasAndShowtimes();
      fetchStats();
    } catch (err) {
      showToast(err.customMessage || 'Failed to schedule showtime.', 'error');
    }
  };

  // Handle manual booking status update
  const handleUpdateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { bookingStatus: status });
      showToast(`Booking marked as ${status}.`, 'success');
      fetchBookings();
    } catch (err) {
      showToast(err.customMessage || 'Failed to update booking status.', 'error');
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading administrator portal..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStats} />;

  const filteredBookings = allBookings.filter((b) => {
    if (!bookingSearch.trim()) return true;
    const term = bookingSearch.toLowerCase();
    return (
      b.bookingReference?.toLowerCase().includes(term) ||
      b.userId?.email?.toLowerCase().includes(term) ||
      b.showtimeId?.movieId?.title?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2234] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-500/20 text-[#FF4C61] text-[10px] uppercase font-black px-2 py-0.5 rounded border border-red-500/30">
              Admin Portal
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Cinema Management System</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Full administrative access to manage movies, schedules, auditoriums, and customer bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenMovieModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E50914] hover:bg-[#B81D24] shadow-md shadow-[#E50914]/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Movie
          </button>
          <button
            onClick={() => setShowtimeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1A2234] hover:bg-[#253047] border border-[#26334D] transition-all"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            Schedule Showtime
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1A2234] overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Stats' },
          { id: 'movies', label: `Movies (${movies.length})` },
          { id: 'showtimes', label: `Showtimes (${showtimes.length})` },
          { id: 'bookings', label: `All Bookings (${allBookings.length})` },
          { id: 'users', label: `Users (${usersList.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#0E131E] border border-[#1A2234] p-5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">₹{stats.totalRevenue}</p>
              <p className="text-[11px] text-emerald-400 font-semibold">Simulated demo payments</p>
            </div>

            <div className="bg-[#0E131E] border border-[#1A2234] p-5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
                <Ticket className="w-5 h-5 text-[#E50914]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalBookings}</p>
              <p className="text-[11px] text-slate-400">All customer reservations</p>
            </div>

            <div className="bg-[#0E131E] border border-[#1A2234] p-5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Movies</span>
                <Film className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalMovies}</p>
              <p className="text-[11px] text-slate-400">
                {stats.nowShowingMovies} Now Showing • {stats.comingSoonMovies} Upcoming
              </p>
            </div>

            <div className="bg-[#0E131E] border border-[#1A2234] p-5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Auditoriums</span>
                <Building className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalCinemas}</p>
              <p className="text-[11px] text-slate-400">{stats.upcomingShowtimes} scheduled shows</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0E131E] border border-[#1A2234] p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E50914]" />
                Recent Movies in Catalog
              </h3>
              <div className="space-y-3">
                {movies.slice(0, 5).map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#141B29] border border-[#222E46] text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{m.title}</p>
                      <p className="text-slate-400">
                        {m.certification} • {m.duration} mins • {m.status}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenMovieModal(m)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1A2438] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0E131E] border border-[#1A2234] p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-400" />
                Latest Bookings Received
              </h3>
              <div className="space-y-3">
                {allBookings.slice(0, 5).map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#141B29] border border-[#222E46] text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">Ref: {b.bookingReference}</p>
                      <p className="text-slate-400">
                        {b.showtimeId?.movieId?.title || 'Movie'} • {b.ticketQuantity} Seats • ₹
                        {b.totalAmount}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        b.bookingStatus === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Movies */}
      {activeTab === 'movies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">All Movie Titles</h2>
            <button
              onClick={() => handleOpenMovieModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E50914] text-white text-xs font-bold rounded-xl"
            >
              <PlusCircle className="w-4 h-4" /> Add Movie
            </button>
          </div>

          <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121826] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1A2234]">
                  <tr>
                    <th className="py-3.5 px-4">Movie</th>
                    <th className="py-3.5 px-4">Genre</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Release</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161D2B]">
                  {movies.map((m) => (
                    <tr key={m._id} className="hover:bg-[#141B29] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                        <img
                          src={m.posterUrl}
                          alt=""
                          className="w-8 h-12 object-cover rounded bg-[#1A2234]"
                        />
                        <div>
                          <p>{m.title}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {m.certification} • {m.duration} mins
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{(m.genre || []).join(', ')}</td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">★ {m.rating}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.status === 'now_showing'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(m.releaseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenMovieModal(m)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(m._id, m.title)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Showtimes */}
      {activeTab === 'showtimes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Scheduled Screenings</h2>
            <button
              onClick={() => setShowtimeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E50914] text-white text-xs font-bold rounded-xl"
            >
              <PlusCircle className="w-4 h-4" /> Schedule Showtime
            </button>
          </div>

          <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121826] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1A2234]">
                  <tr>
                    <th className="py-3.5 px-4">Movie</th>
                    <th className="py-3.5 px-4">Cinema & Screen</th>
                    <th className="py-3.5 px-4">Show Start</th>
                    <th className="py-3.5 px-4">Pricing</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161D2B]">
                  {showtimes.map((st) => (
                    <tr key={st._id} className="hover:bg-[#141B29] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {st.movieId?.title || 'Unknown Movie'}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{st.cinemaId?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {st.cinemaId?.city} • {st.cinemaId?.screenInfo?.screenType}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(st.startTime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        R: ₹{st.pricing?.Regular} | P: ₹{st.pricing?.Premium} | Rec: ₹
                        {st.pricing?.Recliner}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: All Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <h2 className="text-lg font-bold text-white">All User Bookings</h2>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Filter by ref, user, movie..."
                className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121826] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1A2234]">
                  <tr>
                    <th className="py-3.5 px-4">Ref Code</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Movie & Cinema</th>
                    <th className="py-3.5 px-4">Seats</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161D2B]">
                  {filteredBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-[#141B29] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {b.bookingReference}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{b.userId?.name || 'User'}</p>
                        <p className="text-[10px] text-slate-400">{b.userId?.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{b.showtimeId?.movieId?.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {b.showtimeId?.cinemaId?.name} ({b.showtimeId?.cinemaId?.city})
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#FF4C61]">
                        {b.selectedSeats.map((s) => s.seatNumber).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">₹{b.totalAmount}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.bookingStatus === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {b.bookingStatus === 'confirmed' ? (
                          <button
                            onClick={() => handleUpdateBookingStatus(b._id, 'cancelled')}
                            className="text-[10px] font-bold text-red-400 hover:bg-red-500/10 px-2 py-1 rounded"
                          >
                            Cancel/Refund
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Registered Customer Accounts</h2>

          <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121826] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1A2234]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Total Bookings</th>
                    <th className="py-3.5 px-4">Total Spent</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161D2B]">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-[#141B29] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#E50914] text-white flex items-center justify-center font-bold text-[10px]">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{u.bookingCount || 0}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ₹{u.totalSpent || 0}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {movieModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0E131E] border border-[#222E46] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#1A2234] pb-4">
              <h3 className="text-lg font-black text-white">
                {editingMovie ? 'Edit Movie Details' : 'Add New Movie to Catalog'}
              </h3>
              <button
                onClick={() => setMovieModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Movie Title *</label>
                  <input
                    type="text"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status *</label>
                  <select
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Synopsis / Description *</label>
                <textarea
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rating (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Certification</label>
                  <select
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  >
                    <option value="U">U</option>
                    <option value="UA">UA</option>
                    <option value="A">A</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Release Date</label>
                  <input
                    type="date"
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    placeholder="Action, Sci-Fi, Drama"
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    placeholder="English, Hindi, Tamil"
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Poster URL *</label>
                <input
                  type="url"
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  required
                  placeholder="https://..."
                  className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Backdrop URL</label>
                  <input
                    type="url"
                    value={movieForm.backdropUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, backdropUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Trailer YouTube URL</label>
                  <input
                    type="url"
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#182133]">
                <button
                  type="button"
                  onClick={() => setMovieModalOpen(false)}
                  className="px-4 py-2 bg-[#172031] text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl shadow-md"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Showtime Modal */}
      {showtimeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131E] border border-[#222E46] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1A2234] pb-4">
              <h3 className="text-lg font-black text-white">Schedule New Screening</h3>
              <button
                onClick={() => setShowtimeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Movie *</label>
                <select
                  value={showtimeForm.movieId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                  required
                  className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                >
                  <option value="">-- Choose Movie --</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.certification})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Cinema / Screen *</label>
                <select
                  value={showtimeForm.cinemaId}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, cinemaId: e.target.value })}
                  required
                  className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                >
                  <option value="">-- Choose Cinema --</option>
                  {cinemas.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {c.city} ({c.screenInfo?.screenType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={showtimeForm.startTime}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, startTime: e.target.value })}
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={showtimeForm.endTime}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, endTime: e.target.value })}
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Regular (₹)</label>
                  <input
                    type="number"
                    value={showtimeForm.priceRegular}
                    onChange={(e) =>
                      setShowtimeForm({ ...showtimeForm, priceRegular: e.target.value })
                    }
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Premium (₹)</label>
                  <input
                    type="number"
                    value={showtimeForm.pricePremium}
                    onChange={(e) =>
                      setShowtimeForm({ ...showtimeForm, pricePremium: e.target.value })
                    }
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Recliner (₹)</label>
                  <input
                    type="number"
                    value={showtimeForm.priceRecliner}
                    onChange={(e) =>
                      setShowtimeForm({ ...showtimeForm, priceRecliner: e.target.value })
                    }
                    required
                    className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#182133]">
                <button
                  type="button"
                  onClick={() => setShowtimeModalOpen(false)}
                  className="px-4 py-2 bg-[#172031] text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
