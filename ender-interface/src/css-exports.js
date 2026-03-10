// Example preset
module.exports = {
  theme: {
    colors: {
      purple: {
        DEFAULT: "#9A76FF",
      },
      gray: {
        inactive: "#BABABA",
        DEFAULT: "#848484",
      },
      blue: {
        DEFAULT: "#41B2E2",
      },
    },
    fontFamily: {
      sans: ["Graphik", "sans-serif"],
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
