/**
 * HostAI Design System Tokens
 * Reference: /notes/hostai_frontend_context.md
 */

export const hostaiColors = {
  // Gray Scale (Light Mode)
  gray: {
    1: "#fcfdfd",
    2: "#f9fafb",
    3: "#f0f2f3",
    4: "#e8ebec",
    5: "#e0e4e6",
    6: "#d9dee0",
    7: "#cdd3d6",
    8: "#b9c2c6",
    9: "#8b9498",
    11: "#61686b",
    12: "#001821",
  },
  // Gray Scale (Dark Mode)
  grayDark: {
    1: "#001821",
    2: "#092029",
    3: "#122831",
    6: "#2c4047",
    11: "#afb7b9",
    12: "#edefef",
  },
  // Semantic
  info: "#272962",
  error: "#64172b",
  success: "#1d3b31",
  // Base
  white: "#fff",
  black: "#000",
  background: "#fff",
  backgroundDashboard: "#f9fafb",
} as const

export const hostaiGradients = {
  // Primary gradient - for CTAs and buttons
  primary: "linear-gradient(90deg, #5753c6 0%, #ca244d 100%)",
  // Accent gradient - for decorative elements
  accent: "linear-gradient(90deg, #cbcdff 0%, #f8bfc8 100%)",
} as const

export const hostaiTypography = {
  fontFamily: "'TWKLausanne', system-ui, -apple-system, sans-serif",
  fontWeight: {
    book: 300,
    regular: 400,
  },
  // Title sizes with letter spacing
  title: {
    sm: { size: "14px", lineHeight: "22px", letterSpacing: "-0.005em" },
    base: { size: "16px", lineHeight: "22px", letterSpacing: "-0.005em" },
    md: { size: "18px", lineHeight: "24px", letterSpacing: "-0.01em" },
    lg: { size: "24px", lineHeight: "30px", letterSpacing: "-0.01em" },
    xl: { size: "32px", lineHeight: "36px", letterSpacing: "-0.015em" },
    "2xl": { size: "40px", lineHeight: "44px", letterSpacing: "-0.02em" },
    "3xl": { size: "48px", lineHeight: "52px", letterSpacing: "-0.02em" },
    "4xl": { size: "64px", lineHeight: "66px", letterSpacing: "-0.02em" },
  },
  // Body text sizes
  text: {
    xs: { size: "12px", lineHeight: "19px" },
    sm: { size: "13px", lineHeight: "18px" },
    base: { size: "14px", lineHeight: "22px" },
    md: { size: "16px", lineHeight: "24px" },
    lg: { size: "18px", lineHeight: "26px" },
    xl: { size: "20px", lineHeight: "30px" },
  },
} as const

export const hostaiSpacing = {
  base: 4, // 4px base unit
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const

export const hostaiBorderRadius = {
  none: "0",
  sm: "6px",
  base: "10px",
  lg: "16px",
  round: "9999px",
} as const

export const hostaiShadows = {
  sm: "0px 1px 1px -0.5px rgba(0, 0, 0, 0.05)",
  focus: "0px 0px 0px 3px rgba(7, 36, 43, 0.09)",
} as const

// Tailwind-compatible CSS variable classes
export const hostaiTailwindVars = `
  /* HostAI Colors */
  --hostai-gray-1: #fcfdfd;
  --hostai-gray-2: #f9fafb;
  --hostai-gray-3: #f0f2f3;
  --hostai-gray-5: #e0e4e6;
  --hostai-gray-9: #8b9498;
  --hostai-gray-11: #61686b;
  --hostai-gray-12: #001821;

  /* Gradients */
  --hostai-gradient-primary: linear-gradient(90deg, #5753c6 0%, #ca244d 100%);
  --hostai-gradient-accent: linear-gradient(90deg, #cbcdff 0%, #f8bfc8 100%);
`
