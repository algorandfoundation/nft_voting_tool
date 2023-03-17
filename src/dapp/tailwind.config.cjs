const defaultSansFontFamily = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Oxygen",
  "Ubuntu",
  "Cantarell",
  "Fira Sans",
  "Droid Sans",
  "Helvetica Neue",
  "sans-serif",
];

// @ts-check
/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
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
      background: {
        "algorand-pattern": "linear(135deg, #DCFE54 0%, #01DC94 100%)",
      },
      fontFamily: {
        beni: ["Beni", ...defaultSansFontFamily],
        "open-sans": ["Open Sans", ...defaultSansFontFamily],
      },
      animation: {
        spin: "spinning 1s infinite",
      },
      keyframes: {
        spinning: {
          "0%": {
            opacity: 1,
            transform: "125ms ease-in-out",
          },
          "12.5%": {
            opacity: 0.75,
            transform: "125ms ease-in-out",
          },
          "25%": {
            opacity: 0.5,
            transform: "125ms ease-in-out",
          },
          "37.5%": {
            opacity: 0.25,
            transform: "125ms ease-in-out",
          },
          "50%": {
            opacity: 0,
            transform: "125ms ease-in-out",
          },
          "62.5%": {
            opacity: 0.25,
            transform: "125ms ease-in-out",
          },
          "75%": {
            opacity: 0.5,
            transform: "125ms ease-in-out",
          },
          "87.5%": {
            opacity: 0.75,
            transform: "125ms ease-in-out",
          },
          "100%": {
            opacity: 1,
            transform: "125ms ease-in-out",
          },
        },
      },
    },
  },
  plugins: [],
};
