/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        safeBlack: "#0B0F13", // if you want a custom off-black
      },
    },
  },
  plugins: [],
};
