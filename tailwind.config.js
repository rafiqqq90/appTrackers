/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          400: "#939BF5",
          500: "#6E7BF2",
          600: "#5B67E0",
          700: "#4752C4",
        },
        canvas: {
          light: "#F7F7F8",
          dark: "#0A0A0B",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#141416",
          elevated: "#1C1C1F",
          muted: "#F7F7F8",
          border: "#E4E4E7",
          borderDark: "#242428",
        },
      },
    },
  },
  plugins: [],
};
