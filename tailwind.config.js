/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        notoSans: ["Noto Sans", "Helvetica", "sans-serif"],
        notoSerif: ["Noto Serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
