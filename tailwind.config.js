/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "rgb(var(--main-background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
        customblue: "rgb(var(--bg-blue) / <alpha-value>)",
        customgrey: "rgb(var(--grey) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
