/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b7d6b', // Taupe medium
        'primary-dark': '#6b5e4c', // Taupe dark
        'primary-darker': '#5a4d3b', // Taupe darker
        'primary-light': '#9a8d7b', // Taupe light
        'primary-lighter': '#b8ab99', // Taupe lighter
        secondary: '#FFD166', // Jaune doux (kept for accent)
        neutral: {
          light: '#FFFFFF', // Blanc pur
          dark: '#1E1E1E', // Noir doux
          gray: '#F4F4F4', // Gris clair très doux
        },
      },
    },
  },
  plugins: [],
}