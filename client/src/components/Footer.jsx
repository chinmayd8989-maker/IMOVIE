import React from 'react';
import { Film, Heart, ShieldCheck, Ticket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#05070A] border-t border-[#161C2A] text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-wider text-white">
                I<span className="text-[#E50914]">MOVIES</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The premier online cinema reservation platform. Real-time visual seating layouts, instant simulated demo payments, dynamic ticket generation, and seamless booking management.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#111723] text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Real-Time Seat Locking
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#111723] text-[#E50914] border border-[#E50914]/20">
                <Sparkles className="w-3.5 h-3.5" />
                B.Tech CS Project
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Now Showing</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-white transition-colors">All Movies & Filter</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Booking History</Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Info */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide mb-3">Tech Stack</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>React 18 + Vite</li>
              <li>Node.js + Express.js</li>
              <li>MongoDB + Mongoose ODM</li>
              <li>Tailwind CSS + Lucide React</li>
              <li>JWT + bcryptjs Auth</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-[#121622] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} IMovies. Intermediate-Level Full-Stack Cinema Booking Platform.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-[#E50914] fill-[#E50914]" /> for modern cinema lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
