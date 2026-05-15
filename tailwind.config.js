/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonGreen: '#39FF14',
        neonPink: '#FF10F0',
        neonBlue: '#04D9FF',
        darkTurf: '#0B2915',
        treasury: '#1F2937'
      },
      fontFamily: {
        arcade: ['"Orbitron"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
