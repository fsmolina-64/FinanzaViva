/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css}"
  ],
  theme: {
    extend: {
      colors: {
        app: '#1C1C1E',
        card: '#2C2C2E',
        elevated: '#3A3A3C',
        input: '#242426',
        primary: '#F2F2F7',
        'primary-hover': '#FFFFFF',
        'primary-muted': '#3A3A3C',
        'primary-light': '#AEAEB2',
        muted: '#AEAEB2',
        subtle: '#636366',
        default: '#3A3A3C',
        strong: '#48484A',
        success: '#34C759',
        danger: '#FF3B30',
        warning: '#FFCC00',
        accent: {
          blue: '#3B82F6',
          emerald: '#10B981',
          amber: '#F59E0B',
          purple: '#A855F7',
          violet: '#8B5CF6',
          orange: '#F97316',
        },
      },
    }
  },
  plugins: []
}
