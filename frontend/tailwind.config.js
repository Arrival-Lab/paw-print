/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './features/**/*.{js,jsx,ts,tsx}', './shared/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#5B7FA6',
        secondary: '#7EC8E3',
        primaryLight: '#EEF3F8',
        secondaryLight: '#EEF9FD',
        surface: '#F8F9FA',
        border: '#F0F0F0',
        premium: '#F5D87A',
      },
    },
  },
  plugins: [],
};
