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
        treasury: '#1F2937',
        // X1 EcoChain brand palette (x1ecochain.com)
        x1Green: '#5b9d07',
        x1GreenBright: '#7dd320',
        x1Ink: '#0a140a'
      },
      fontFamily: {
        arcade: ['"Orbitron"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
