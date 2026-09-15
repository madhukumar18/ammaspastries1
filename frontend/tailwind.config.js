/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#FDFBF7',
          100: '#F7F0E6',
          200: '#EDE0CE',
          300: '#DEC5A6',
          400: '#C6A178',
          500: '#A77D4F',
          600: '#8A5E35',
          700: '#6C4524',
          800: '#4E2F16',
          900: '#321D0D',
        },
        cream: {
          light: '#FFFDF9',
          DEFAULT: '#FAF5EE',
          dark: '#EFE7DA',
        },
        chocolate: {
          light: '#5C3826',
          DEFAULT: '#3D2314',
          dark: '#24140A',
        },
        gold: {
          light: '#FBBF24',
          DEFAULT: '#D97706',
          dark: '#B45309',
        },
        brand: {
          orange: '#ff6600',
          DEFAULT: '#ff6600',
          hover: '#e65c00',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        banner: ['"Bricolage Grotesque"', 'sans-serif'],
        bricolage: ['"Bricolage Grotesque"', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 10px 25px -5px rgba(61, 35, 20, 0.08), 0 8px 10px -6px rgba(61, 35, 20, 0.04)',
        'warm-lg': '0 20px 30px -10px rgba(61, 35, 20, 0.12), 0 10px 15px -5px rgba(61, 35, 20, 0.06)',
      }
    },
  },
  plugins: [],
}
