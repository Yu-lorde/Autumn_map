/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e622e',
          light: '#f0fdf4',
        },
        accent: '#eab308',
      },
    },
  },
  plugins: [],
}

