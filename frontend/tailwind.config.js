/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#0D1512",
          surface: "#15201A",
          forest: "#20372B",
          copper: "#B46A45",
          gold: "#C29B5B",
          bone: "#E5DED0",
          muted: "#9A9B91",
          border: "#304036",
          supported: "#4E8752",
          partially: "#C29B5B",
          contradicted: "#B44C43",
          inconclusive: "#9A9B91",
          insufficient: "#B46A45"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        subtle: "0 4px 20px rgba(0, 0, 0, 0.4)",
        copper: "0 0 15px rgba(180, 106, 69, 0.25)",
        gold: "0 0 15px rgba(194, 155, 91, 0.25)",
        forest: "0 0 15px rgba(32, 55, 43, 0.3)"
      }
    },
  },
  plugins: [],
};
