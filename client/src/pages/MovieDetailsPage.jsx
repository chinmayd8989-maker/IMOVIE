import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  Star,
  Clock,
  Calendar,
  Globe,
  Film,
  MapPin,
  Play,
  Ticket,
  ChevronRight,
  Info,
} from 'lucide-react';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cinemasWithShowtimes, setCinemasWithShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected date filter
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate the next 3 days
  const dateOptions = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dateString: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/movies/${id}`);
      setMovie(res.data.data.movie);
      setCinemasWithShowtimes(res.data.data.cinemasWithShowtimes || []);
    } catch (err) {
      setError(err.customMessage || 'Failed to load movie details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen message="Loading movie details and showtimes..." />;
  if (error || !movie) return <ErrorMessage message={error || 'Movie not found.'} onRetry={fetchMovieDetails} />;

  const selectedDateStr = dateOptions[selectedDateIndex].dateString;

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const trailerEmbed = getYoutubeEmbedUrl(movie.trailerUrl);

  return (
    <div className="min-h-screen pb-24">
      {/* Backdrop Header */}
      <div className="relative w-full h-[380px] md:h-[460px] bg-black overflow-hidden">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top opacity-35 filter blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080A0F] via-transparent to-black/60" />
      </div>

      {/* Main Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="rounded-2xl overflow-hidden border-2 border-[#1E2638] shadow-2xl bg-[#0E131E] aspect-[2/3]">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-black bg-[#E50914] text-white">
                {movie.certification || 'UA'}
              </span>
              {movie.rating > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {movie.rating.toFixed(1)} / 10
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-300 bg-[#161C2A] px-3 py-1 rounded-lg border border-[#232D42]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-300 bg-[#161C2A] px-3 py-1 rounded-lg border border-[#232D42]">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {(movie.language || []).join(', ')}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {movie.title}
            </h1>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {(movie.genre || []).map((g) => (
                <span
                  key={g}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1B2335] text-slate-300 border border-[#26334D]"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl pt-2">
              {movie.description}
            </p>

            {/* Crew / Cast */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs border-t border-[#1C2436]">
              {movie.director && (
                <div>
                  <span className="text-slate-400">Director: </span>
                  <span className="text-white font-semibold">{movie.director}</span>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <span className="text-slate-400">Cast: </span>
                  <span className="text-white font-semibold">{movie.cast.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Showtime Booking Section */}
        <div className="mt-14 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1A2234] pb-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Ticket className="w-6 h-6 text-[#E50914]" />
                Select Cinema & Showtime
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose your preferred date, theater, and showtime to pick your seats.
              </p>
            </div>
          </div>

          {/* Date Selector Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {dateOptions.map((opt, idx) => (
              <button
                key={opt.dateString}
                onClick={() => setSelectedDateIndex(idx)}
                className={`flex flex-col items-center justify-center min-w-[100px] py-3 px-4 rounded-xl border transition-all ${
                  selectedDateIndex === idx
                    ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg shadow-[#E50914]/25 scale-105'
                    : 'bg-[#0E131E] border-[#1D2638] text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                <span className="text-[11px] uppercase font-bold tracking-wider">{opt.dayName}</span>
                <span className="text-base font-extrabold">{opt.formatted}</span>
              </button>
            ))}
          </div>

          {/* Cinemas & Showtimes List */}
          {cinemasWithShowtimes.length === 0 ? (
            <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl p-10 text-center">
              <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No upcoming showtimes scheduled</h3>
              <p className="text-xs text-slate-400">
                Check back soon or explore other movies in theaters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cinemasWithShowtimes.map(({ cinema, showtimes }) => {
                // Filter showtimes for selected day
                const dayShowtimes = showtimes.filter((st) => {
                  const stDateStr = new Date(st.startTime).toISOString().split('T')[0];
                  return stDateStr === selectedDateStr;
                });

                return (
                  <div
                    key={cinema._id}
                    className="bg-[#0E131E] border border-[#1A2234] rounded-2xl p-5 hover:border-[#222E46] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#182133]">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{cinema.name}</h3>
                          <span className="bg-[#182133] text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-[#24314A]">
                            {cinema.screenInfo?.screenType || 'Dolby Atmos'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {cinema.address}, {cinema.city}
                        </p>
                      </div>

                      <div className="text-xs text-slate-400">
                        Regular: <span className="text-white font-bold">₹{showtimes[0]?.pricing?.Regular || 200}</span> | Recliner: <span className="text-amber-400 font-bold">₹{showtimes[0]?.pricing?.Recliner || 450}</span>
                      </div>
                    </div>

                    {/* Showtimes Pill Buttons */}
                    {dayShowtimes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No shows scheduled on {dateOptions[selectedDateIndex].formatted} for this cinema.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {dayShowtimes.map((st) => (
                          <Link
                            key={st._id}
                            to={`/showtimes/${st._id}/seats`}
                            className="group flex flex-col items-center justify-center px-4 py-2.5 rounded-xl bg-[#141B29] border border-[#222E46] hover:border-[#E50914] hover:bg-[#1D1724] transition-all shadow-sm"
                          >
                            <span className="text-sm font-bold text-white group-hover:text-[#E50914] transition-colors">
                              {formatTime(st.startTime)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {st.availableSeatsCount > 0 ? (
                                <span className="text-emerald-400 font-medium">
                                  {st.availableSeatsCount} seats left
                                </span>
                              ) : (
                                <span className="text-red-400 font-medium">Sold Out</span>
                              )}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Trailer Section */}
        {trailerEmbed && (
          <div className="mt-14 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-[#E50914] fill-[#E50914]" />
              Official Trailer
            </h2>
            <div className="rounded-2xl overflow-hidden border border-[#1A2234] bg-black shadow-2xl aspect-video max-w-4xl">
              <iframe
                src={trailerEmbed}
                title={`${movie.title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailsPage;
