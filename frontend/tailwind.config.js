/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './features/**/*.{js,jsx,ts,tsx}', './shared/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#7ECFB3',
        secondary: '#FFB5A0',
        primaryLight: '#E8F8F3',
        secondaryLight: '#FFF0EC',
        surface: '#F8F9FA',
        border: '#F0F0F0',
        premium: '#F5D87A',
      },
    },
  },
  plugins: [],
};
