/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      // Base colors
      "background": "var(--fyi-bg)",
      "on-background": "var(--fyi-text)",
      "surface": "var(--fyi-surface)",
      "surface-container": "var(--fyi-surface-2)",
      "surface-container-high": "var(--fyi-surface-3)",
      "surface-variant": "var(--fyi-surface-4)",
      "on-surface": "var(--fyi-text)",
      "on-surface-variant": "var(--fyi-muted)",
      
      // Primary
      "primary": "var(--fyi-text)",
      "on-primary": "var(--fyi-bg)",
      "primary-container": "var(--fyi-highlight)",
      
      // Secondary
      "secondary": "var(--fyi-accent)",
      "secondary-container": "var(--fyi-accent-strong)",
      "on-secondary": "var(--fyi-accent-contrast)",
      "on-secondary-container": "var(--fyi-accent-soft)",
      
      // Tertiary
      "tertiary": "var(--fyi-accent-2)",
      "tertiary-container": "var(--fyi-accent-2-strong)",
      "tertiary-fixed-dim": "var(--fyi-accent-2-soft)",
      "on-tertiary": "var(--fyi-accent-2-contrast)",
      "on-tertiary-container": "var(--fyi-accent-2-soft)",
      
      // Utility
      "outline": "var(--fyi-outline)",
      "outline-variant": "var(--fyi-border)",
      "error": "#ffb4ab",
      "on-error": "#690005",
      "inverse-surface": "var(--fyi-text)",
      "inverse-on-surface": "var(--fyi-bg)",
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
        serif: ["Fraunces", "serif"],
        sans: ["Sora", "sans-serif"],
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

