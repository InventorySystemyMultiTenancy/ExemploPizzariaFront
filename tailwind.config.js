/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c0b08",
        ember: "#a81a1a",
        gold: "#c9a227",
        lacquer: "#161410",
        smoke: "#a09880",
        cream: "#f5e6c8",
        rosso: "#cc2020",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        script: ["Dancing Script", "cursive"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(201,162,39,0.25), 0 18px 40px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        texture:
          "radial-gradient(circle at 10% 20%, rgba(201,162,39,0.07), transparent 40%), radial-gradient(circle at 90% 0%, rgba(168,26,26,0.18), transparent 45%)",
      },
    },
  },
  plugins: [],
};
