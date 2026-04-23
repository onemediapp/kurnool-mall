/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#1A56DB',
        'brand-dark': '#1E3A5F',
        'brand-light': '#DBEAFE',
        accent: '#F59E0B',
      },
      fontFamily: {
        telugu: ['NotoSansTelugu-Regular'],
        'telugu-bold': ['NotoSansTelugu-Bold'],
      },
    },
  },
  plugins: [],
}
