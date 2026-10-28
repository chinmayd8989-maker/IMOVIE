import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import MovieCard from '../components/MovieCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { SlidersHorizontal, ArrowUpDown, Film, RotateCcw } from 'lucide-react';

const MovieListingPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [sortBy, setSortBy] = useState('releaseDate');
  const [order, setOrder] = useState('desc');

  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        sortBy,
        order,
        limit: 50,
      };
      if (search.trim()) params.search = search.trim();
      if (status !== 'All') params.status = status;
      if (genre !== 'All') params.genre = genre;
      if (language !== 'All') params.language = language;

      const res = await api.get('/movies', { params });
      setMovies(res.data.data.movies || []);
      setAvailableGenres(res.data.data.filters?.genres || []);
      setAvailableLanguages(res.data.data.filters?.languages || []);
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch movies catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, genre, language, sortBy, order]);

  const handleReset = () => {
    setSearch('');
    setStatus('All');
    setGenre('All');
    setLanguage('All');
    setSortBy('releaseDate');
    setOrder('desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Movie Catalog</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore movies currently showing in theaters and upcoming releases.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-[#0E131E] p-6 rounded-2xl border border-[#1A2234] shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:max-w-lg">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by title, genre, director, or cast..."
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Sort Field */}
            <div className="flex items-center gap-2 bg-[#141B29] px-3 py-2 rounded-xl border border-[#222E46] text-xs font-semibold text-slate-300 w-full md:w-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                <option value="releaseDate" className="bg-[#141B29]">Release Date</option>
                <option value="rating" className="bg-[#141B29]">Rating</option>
                <option value="title" className="bg-[#141B29]">Movie Title</option>
                <option value="duration" className="bg-[#141B29]">Duration</option>
              </select>
            </div>

            {/* Sort Direction */}
            <button
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 bg-[#141B29] border border-[#222E46] rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-colors"
              title="Toggle sort direction"
            >
              {order === 'asc' ? '▲ ASC' : '▼ DESC'}
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#182133]">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Availability
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E50914]"
            >
              <option value="All">All Releases</option>
              <option value="now_showing">Now Showing</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E50914]"
            >
              <option value="All">All Genres</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#141B29] border border-[#222E46] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E50914]"
            >
              <option value="All">All Languages</option>
              {availableLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Action */}
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 bg-[#172031] hover:bg-[#202C45] border border-[#232E47] text-slate-300 hover:text-white py-2 px-3 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400 font-semibold">
            Showing <span className="text-white font-bold">{movies.length}</span> movie
            {movies.length === 1 ? '' : 's'}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading movie catalog..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchMovies} />
        ) : movies.length === 0 ? (
          <div className="bg-[#0E131E] border border-[#1A2234] rounded-2xl p-12 text-center max-w-lg mx-auto">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No matching movies found</h3>
            <p className="text-slate-400 text-xs mb-4">
              We couldn't find any movies that match your search filters.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[#E50914] text-white rounded-xl text-xs font-semibold shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieListingPage;
