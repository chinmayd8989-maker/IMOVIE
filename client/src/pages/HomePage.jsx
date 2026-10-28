import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import MovieCard from '../components/MovieCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { Play, Ticket, Star, Clock, Sparkles, Film, X } from 'lucide-react';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [activeTab, setActiveTab] = useState('now_showing'); // 'now_showing' or 'coming_soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [availableGenres, setAvailableGenres] = useState([]);
  const [trailerModalUrl, setTrailerModalUrl] = useState(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/movies', {
        params: {
          limit: 20,
        },
      });
      setMovies(res.data.data.movies || []);
      setAvailableGenres(res.data.data.filters?.genres || []);
    } catch (err) {
      setError(err.customMessage || 'Failed to load movie collection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Filter movies by active tab, search, and genre
  const filteredMovies = movies.filter((m) => {
    const matchesTab = m.status === activeTab;
    const matchesGenre = selectedGenre === 'All' || (m.genre || []).includes(selectedGenre);
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genre || []).some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.director && m.director.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesGenre && matchesSearch;
  });

  const featuredMovie = movies.find((m) => m.status === 'now_showing') || movies[0];

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      {featuredMovie && (
        <section className="relative w-full h-[520px] md:h-[620px] overflow-hidden bg-black">
          {/* Backdrop Image */}
          <div className="absolute inset-0">
            <img
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-top opacity-35 scale-105 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080A0F] via-[#080A0F]/80 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 z-10">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Spotlight
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-white border border-white/15">
                  {featuredMovie.certification}
                </span>
                {featuredMovie.rating > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {featuredMovie.rating.toFixed(1)} / 10
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight text-glow">
                {featuredMovie.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed">
                {featuredMovie.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={`/movies/${featuredMovie._id}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-[#E50914] hover:bg-[#B81D24] shadow-xl shadow-[#E50914]/30 transition-all hover:scale-105"
                >
                  <Ticket className="w-5 h-5" />
                  Book Tickets Now
                </Link>

                {featuredMovie.trailerUrl && (
                  <button
                    onClick={() => setTrailerModalUrl(getYoutubeEmbedUrl(featuredMovie.trailerUrl))}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-8">
        {/* Search & Tabs Toolbar */}
        <div className="bg-[#0E131E] p-4 sm:p-6 rounded-2xl border border-[#1D2536] shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Tab switchers */}
            <div className="flex items-center bg-[#090C12] p-1.5 rounded-xl border border-[#1A2234] w-full md:w-auto">
              <button
                onClick={() => setActiveTab('now_showing')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'now_showing'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Now Showing
              </button>
              <button
                onClick={() => setActiveTab('coming_soon')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'coming_soon'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Coming Soon
              </button>
            </div>

            {/* Quick Search */}
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search movies by title, director, or cast..."
              />
            </div>
          </div>

          {/* Genre Filters */}
          {availableGenres.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Genre:</span>
              <button
                onClick={() => setSelectedGenre('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedGenre === 'All'
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#151B28] text-slate-400 hover:text-white border border-[#20293D]'
                }`}
              >
                All Genres
              </button>
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedGenre === genre
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#151B28] text-slate-400 hover:text-white border border-[#20293D]'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Movies Grid Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Film className="w-6 h-6 text-[#E50914]" />
                {activeTab === 'now_showing' ? 'In Theaters Now' : 'Coming Soon to IMovies'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'now_showing'
                  ? 'Book your tickets in advance with verified seat locking'
                  : 'Get ready for upcoming Hollywood and global blockbusters'}
              </p>
            </div>
            <Link
              to="/movies"
              className="text-xs font-bold text-[#E50914] hover:text-[#FF4C61] transition-colors"
            >
              Browse All Movies &rarr;
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching cinema schedule..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchMovies} />
          ) : filteredMovies.length === 0 ? (
            <div className="bg-[#0E131E] border border-[#1D2536] rounded-2xl p-12 text-center max-w-lg mx-auto">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No movies found</h3>
              <p className="text-slate-400 text-xs mb-4">
                No titles match your current search and filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                }}
                className="px-4 py-2 bg-[#1A2234] hover:bg-[#E50914] text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <button
              onClick={() => setTrailerModalUrl(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-[#E50914] transition-colors"
              aria-label="Close trailer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={trailerModalUrl}
                title="Movie Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
