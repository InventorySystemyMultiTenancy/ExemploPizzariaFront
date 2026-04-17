/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#faf8f4",
        ember: "#a81a1a",
        gold: "#b8911f",
        lacquer: "#ffffff",
        smoke: "#7a6f62",
        cream: "#1a0e02",
        rosso: "#cc2020",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        script: ["Dancing Script", "cursive"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(184,145,31,0.2), 0 8px 30px rgba(0,0,0,0.1)",
      },
      backgroundImage: {
        texture:
          "radial-gradient(circle at 10% 20%, rgba(184,145,31,0.05), transparent 40%), radial-gradient(circle at 90% 0%, rgba(168,26,26,0.06), transparent 45%)",
      },
    },
  },
  plugins: [],
};
