/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fab: {
          950: '#060911',
          900: '#0b0f19',
          850: '#111726',
          800: '#161f33',
          700: '#23304d',
          600: '#33446b',
          accent: '#06b6d4',
          glow: '#0891b2',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
