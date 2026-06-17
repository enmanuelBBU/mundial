import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "fifa-green": "#006633",
        "fifa-gold": "#C8A84B",
        "fifa-dark": "#0A0A1A",
      },
      backgroundImage: {
        "grass-pattern": "radial-gradient(ellipse at center, #1a5c2e 0%, #0d3a1c 100%)",
      },
      fontFamily: {
        heading: ["'Bebas Neue'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
