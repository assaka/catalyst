/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'catalyst-blue': '#2563eb',
        'catalyst-green': '#059669',
        'catalyst-red': '#dc2626',
        'catalyst-yellow': '#d97706'
      }
    },
  },
  plugins: [],
}