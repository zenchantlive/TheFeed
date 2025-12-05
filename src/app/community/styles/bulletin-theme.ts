/**
 * Bulletin Board Theme System
 *
 * Provides consistent styling for the community bulletin board aesthetic.
 * Supports both light (cork board) and dark (chalkboard) themes.
 */



/**
 * Pin colors for cards - subtle, warm tones
 */
export const PIN_COLORS = {
  red: "hsl(0, 70%, 65%)",
  blue: "hsl(210, 70%, 65%)",
  yellow: "hsl(45, 80%, 60%)",
  green: "hsl(140, 60%, 55%)",
  purple: "hsl(270, 60%, 65%)",
} as const;

/**
 * Card background colors with subtle sticky note feel
 */
export const CARD_COLORS = {
  yellow: "bg-amber-50/90 dark:bg-slate-800/90 border-amber-200/40 dark:border-slate-700/40",
  pink: "bg-pink-50/90 dark:bg-slate-800/90 border-pink-200/40 dark:border-slate-700/40",
  blue: "bg-blue-50/90 dark:bg-slate-800/90 border-blue-200/40 dark:border-slate-700/40",
  green: "bg-emerald-50/90 dark:bg-slate-800/90 border-emerald-200/40 dark:border-slate-700/40",
  cream: "bg-orange-50/80 dark:bg-slate-800/90 border-orange-200/30 dark:border-slate-700/40",
  white: "bg-white/95 dark:bg-slate-800/95 border-slate-200/50 dark:border-slate-700/50",
} as const;

/**
 * Handwritten font classes - sophisticated, not childish
 */
export const HANDWRITTEN_FONTS = {
  heading: "font-handwritten tracking-tight", // Will need to add custom font
  accent: "font-handwritten-accent",
} as const;

/**
 * Base bulletin card style
 */
export const bulletinCard = (color: keyof typeof CARD_COLORS = "white"): string => {
  return `
    relative rounded-lg border-2 ${CARD_COLORS[color]}
    shadow-[0.125rem_0.25rem_0.5rem_rgba(0,0,0,0.08)]
    dark:shadow-[0.125rem_0.25rem_0.75rem_rgba(0,0,0,0.3)]
    transition-all duration-200
    hover:shadow-[0.1875rem_0.375rem_0.75rem_rgba(0,0,0,0.12)]
    hover:dark:shadow-[0.1875rem_0.375rem_1rem_rgba(0,0,0,0.4)]
    hover:-translate-y-0.5
  `.trim().replace(/\s+/g, ' ');
};

/**
 * Pushpin graphic (CSS-based, subtle)
 */
export const pushpinStyle = (color: keyof typeof PIN_COLORS = "red"): React.CSSProperties => ({
  position: "absolute",
  top: "-0.5rem",
  left: "50%",
  transform: "translateX(-50%)",
  width: "1rem",
  height: "1rem",
  borderRadius: "50%",
  backgroundColor: PIN_COLORS[color],
  boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.2), inset 0 -0.0625rem 0.125rem rgba(0,0,0,0.3)",
});

/**
 * Slight rotation classes for cards (subtle)
 */
export const ROTATION_CLASSES = [
  "rotate-[-0.5deg]",
  "rotate-[0.5deg]",
  "rotate-[-0.3deg]",
  "rotate-[0.3deg]",
  "",
] as const;

/**
 * Background texture overlay classes
 */
export const BACKGROUND_TEXTURE = {
  light: "bg-[url('/textures/cork-subtle.png')] bg-amber-50/30",
  dark: "bg-[url('/textures/chalkboard-subtle.png')] bg-slate-900",
} as const;

/**
 * Get a random rotation class for variety
 */
export function getRandomRotation(): string {
  return ROTATION_CLASSES[Math.floor(Math.random() * ROTATION_CLASSES.length)];
}

/**
 * Get a random card color
 */
export function getRandomCardColor(): keyof typeof CARD_COLORS {
  const colors = Object.keys(CARD_COLORS) as Array<keyof typeof CARD_COLORS>;
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get a card color based on post type
 */
export function getCardColorByType(type: "share" | "request" | "update" | "resource"): keyof typeof CARD_COLORS {
  switch (type) {
    case "share":
      return "green";
    case "request":
      return "yellow";
    case "update":
      return "blue";
    case "resource":
      return "cream";
    default:
      return "white";
  }
}
