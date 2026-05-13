/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      // Base colors
      "background": "#131313",
      "on-background": "#e5e2e1",
      "surface": "#131313",
      "surface-container": "#201f1f",
      "surface-container-high": "#2a2a2a",
      "surface-variant": "#353534",
      "on-surface": "#e5e2e1",
      "on-surface-variant": "#c5c7c9",
      
      // Primary
      "primary": "#ffffff",
      "on-primary": "#2f3132",
      "primary-container": "#e2e2e4",
      
      // Secondary
      "secondary": "#c0c1ff",
      "secondary-container": "#3131c0",
      "on-secondary": "#1000a9",
      "on-secondary-container": "#b0b2ff",
      
      // Tertiary
      "tertiary": "#ffffff",
      "tertiary-container": "#f0dbff",
      "tertiary-fixed-dim": "#ddb7ff",
      "on-tertiary": "#490080",
      "on-tertiary-container": "#8a33d9",
      
      // Utility
      "outline": "#8f9194",
      "outline-variant": "#44474a",
      "error": "#ffb4ab",
      "on-error": "#690005",
      "inverse-surface": "#e5e2e1",
      "inverse-on-surface": "#313030",
    },
    extend: {
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        "unit": "4px",
        "safe-area": "32px",
        "container-padding": "24px",
        "section-margin": "40px",
        "element-gap": "16px",
      },
      fontFamily: {
        serif: ["Newsreader", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

