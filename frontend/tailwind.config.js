/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#6B46C1',
            light: '#9333EA',
            dark: '#4C1D95'
          },
          secondary: {
            DEFAULT: '#3B82F6',
            light: '#60A5FA',
            dark: '#1E40AF'
          },
          accent: {
            DEFAULT: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706'
          }
        }
      },
    },
    plugins: [],
  }