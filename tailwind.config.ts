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
        page: "#F8F9F6",
        surface: "#FFFFFF",
        charcoal: {
          DEFAULT: "#252923",
          light: "#3A3F37",
          muted: "#73786F",
        },
        forest: {
          DEFAULT: "#3F6B52",
          hover: "#345843",
          light: "#4E8264",
          dark: "#2A4736",
        },
        sage: {
          DEFAULT: "#EAF0E8",
          dark: "#D7E2D4",
          light: "#F4F7F3",
        },
        border: {
          subtle: "#E5E8E1",
          DEFAULT: "#D8DCD3",
          strong: "#B5BCAD",
        },
        status: {
          success: "#2E7D32",
          "success-bg": "#E8F5E9",
          warning: "#D97706",
          "warning-bg": "#FEF3C7",
          error: "#DC2626",
          "error-bg": "#FEE2E2",
          info: "#2563EB",
          "info-bg": "#EFF6FF",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(37, 41, 35, 0.05), 0 1px 2px 0 rgba(37, 41, 35, 0.03)",
        card: "0 2px 6px -1px rgba(37, 41, 35, 0.06), 0 2px 4px -2px rgba(37, 41, 35, 0.04)",
        dropdown: "0 10px 15px -3px rgba(37, 41, 35, 0.08), 0 4px 6px -4px rgba(37, 41, 35, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
