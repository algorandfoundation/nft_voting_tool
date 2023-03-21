// @ts-check
/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  important: "#root",
  theme: {
    extend: {
      colors: {
        "dark-yellow": "#FFD83D",
        "header-blue": "#172852",
        "footer-blue": "#051C2C",
        algorand: {
          teal: "#006883",
          "sky-teal": "#31D8EE",
          coal: "#201F21",
          "arctic-lime": "#DCFE54",
          "orange-coral": "#FF684E",
        },
        grey: {
          dark: "#222222",
          DEFAULT: "#878787",
          light: "#CBCBCB",
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
