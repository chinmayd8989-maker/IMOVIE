import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket } from 'lucide-react';

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

const MovieCard = ({ movie }) => {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || FALLBACK_POSTER);

  const formatDuration = (mins) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const isNowShowing = movie.status === 'now_showing';

  return (
    <div className="group relative bg-[#0E121B] rounded-2xl overflow-hidden border border-[#1A2234] hover:border-[#E50914]/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full shadow-lg hover:shadow-2xl hover:shadow-[#E50914]/10">
      {/* Poster Image Container */}
      <Link to={`/movies/${movie._id}`} className="relative block aspect-[2/3] overflow-hidden bg-[#161D2B]">
        <img
          src={imgSrc}
          alt={movie.title}
          onError={() => setImgSrc(FALLBACK_POSTER)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E121B] via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Certification Badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 border border-white/10">
          {movie.certification || 'UA'}
        </div>

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div className="absolute top-3 right-3 bg-amber-500/90 text-black px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-md">
            <Star className="w-3.5 h-3.5 fill-black" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Language Badge */}
        {movie.language && movie.language.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-medium text-slate-300 border border-white/10">
            {movie.language.join(', ')}
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <Link to={`/movies/${movie._id}`} className="block">
            <h3 className="text-base font-bold text-white group-hover:text-[#E50914] transition-colors line-clamp-1 mb-1.5">
              {movie.title}
            </h3>
          </Link>

          {/* Genre Pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(movie.genre || []).slice(0, 3).map((g) => (
              <span
                key={g}
                className="text-[11px] font-medium text-slate-400 bg-[#161C2A] px-2 py-0.5 rounded-md border border-[#232D42]"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Info & Action */}
        <div className="pt-3 border-t border-[#182133] flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center text-xs text-slate-400 gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDuration(movie.duration)}</span>
          </div>

          <Link
            to={`/movies/${movie._id}`}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              isNowShowing
                ? 'bg-[#E50914] hover:bg-[#B81D24] text-white shadow-md shadow-[#E50914]/20'
                : 'bg-[#1C2436] hover:bg-[#253047] text-slate-300'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            {isNowShowing ? 'Book Tickets' : 'Details'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
