// @ts-check
/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  important: '#root',
  theme: {
    extend: {
      colors: {
        'dark-yellow': '#FFD83D',
        'header-blue': '#172852',
        'footer-blue': '#051C2C',
        algorand: {
          teal: '#006883',
          'sky-teal': '#31D8EE',
          diamond: '#c2f3fa',
          coal: '#201F21',
          'arctic-lime': '#DCFE54',
          'orange-coral': '#FF684E',
          warning: '#ffcbcb',
          green: '#b4f5df',
          'vote-open': '#81EECA',
          'vote-closed': '#DDDDDF',
        },
        grey: {
          dark: '#333333',
          DEFAULT: '#878787',
          light: '#CCCCCC',
        },
        blue: {
          DEFAULT: '#02A0FC',
          light: '#D7F0FF',
        },
        yellow: {
          DEFAULT: '#F6C001',
          light: '#FFF6D7',
        },
        red: {
          DEFAULT: '#FF3A29',
          light: '#FFE5D3',
        },
        green: {
          DEFAULT: '#00C785',
          light: '#E2FBD7',
        },
        purple: {
          DEFAULT: '#6270F2',
          light: '#E9E8FF',
        },
      },
      backgroundColor: {
        'algorand-red': '#FF0000',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
