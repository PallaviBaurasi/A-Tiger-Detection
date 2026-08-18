/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#e1ede6',
          200: '#c5dbc8',
          300: '#9ec2a4',
          400: '#72a37a',
          500: '#508659',
          600: '#3c6b44',
          700: '#315537',
          800: '#29442e',
          900: '#1b3a2b', // Main deep forest green
          950: '#112219',
        },
        earth: {
          50: '#fdfbf7',
          100: '#f7f2e8',
          200: '#ece0cb',
          300: '#dec9a4',
          400: '#cfad7b',
          500: '#c29358',
          600: '#b27b4b',
          700: '#94613f',
          800: '#774d37',
          900: '#614030',
        }
      }
    },
  },
  plugins: [],
}
