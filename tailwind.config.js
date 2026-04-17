/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0b0f",
        ember: "#8d1a1a",
        gold: "#d4a94d",
        lacquer: "#17171e",
        smoke: "#9b9ba8",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(212,169,77,0.25), 0 18px 40px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        texture:
          "radial-gradient(circle at 10% 20%, rgba(212,169,77,0.08), transparent 40%), radial-gradient(circle at 90% 0%, rgba(141,26,26,0.2), transparent 45%)",
      },
    },
  },
  plugins: [],
};
