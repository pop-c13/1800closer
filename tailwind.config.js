/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#F47920',
        'closer-red': '#FF3B30',
        'brand-blue': '#00BCD4',
        'dark-bg': '#0f0f13',
        'dark-bar': '#18181f',
        'light-blue': '#E8F4FD',
      },
      fontFamily: {
        'dm': ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
