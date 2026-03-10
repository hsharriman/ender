/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        notoSans: ["Noto Sans", "Helvetica", "sans-serif"],
        notoSerif: ["Noto Serif", "Georgia", "serif"],
      },
      keyframes: {
        smallBounce: {
          "0%, 100%": {
            transform: "translateY(-3%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
      },
      animation: {
        smallBounce: "smallBounce 1s infinite",
      },
    },
  },
  plugins: [],
};
