/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#050812',
          card: '#0a0e1a',
          border: 'rgba(255,255,255,0.08)',
        },
        accent: {
          primary: '#06b6d4',
          secondary: '#10b981',
        },
        text: {
          primary: '#ffffff',
          secondary: '#94a3b8',
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}