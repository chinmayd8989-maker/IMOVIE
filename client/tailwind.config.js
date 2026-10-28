/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        imovies: {
          dark: '#080A0F',
          darker: '#040508',
          card: '#0F131D',
          cardHover: '#161C2B',
          border: '#1E2638',
          red: '#E50914',
          redHover: '#B81D24',
          accent: '#FF334B',
          gold: '#F59E0B',
          seatAvailable: '#334155',
          seatSelected: '#E50914',
          seatBooked: '#1E293B',
          seatRegular: '#3B82F6',
          seatPremium: '#A855F7',
          seatRecliner: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
