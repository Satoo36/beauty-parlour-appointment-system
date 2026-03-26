

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#ffffff",
          100: "#faf7f5",
          200: "#f4ede9",
          300: "#fbf6f4",
        },

        rose: {
          50: "#fdecef",
          100: "#f6c9cf",
          200: "#e6a5af",
          300: "#c7747e",
          400: "#b05b66",
          500: "#9b3c4a",
          600: "#862f3e",
          700: "#702533",
          800: "#5a1c28",
          900: "#44131e",
        },

        ink: {
          900: "#2e1e1e",
          700: "#6b4a4a",
          500: "#8a6f6f",
          300: "#b9a5a5",
        },

        ui: {
          100: "#f1e3e5",
          200: "#e5dada",
          300: "#d8c9c9",
          400: "#c98d95",
        },
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}