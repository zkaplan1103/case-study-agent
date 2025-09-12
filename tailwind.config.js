/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PartSelect brand colors (approximated)
        'partselect': {
          'blue': '#1e40af',
          'light-blue': '#3b82f6',
          'gray': '#6b7280',
          'light-gray': '#f3f4f6',
          'dark': '#1f2937',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}