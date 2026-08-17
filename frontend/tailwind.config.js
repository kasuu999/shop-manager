/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy for the sidebar / dark surfaces
        ink: {
          900: "#151B2C",
          800: "#1C2438",
          700: "#252F48",
          600: "#37436499",
        },
        // Teal is the primary action color — feels like "business/money" without
        // leaning on the generic terracotta-on-cream AI look.
        brand: {
          50: "#EEFBF7",
          100: "#D3F4EA",
          400: "#2DBE9A",
          500: "#0F9C7F",
          600: "#0B7F68",
          700: "#0A6656",
        },
        // Warm amber reserved for one job only: money-facing highlights
        // (today's sales total, low-stock badges, primary billing CTA).
        amber: {
          50: "#FFF7EB",
          400: "#F5A524",
          500: "#E38F0A",
          600: "#C1740A",
        },
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21, 27, 44, 0.06), 0 1px 3px rgba(21, 27, 44, 0.04)",
      },
    },
  },
  plugins: [],
};
