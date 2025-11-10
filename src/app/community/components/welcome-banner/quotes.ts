/**
 * Community welcome quotes
 * Rotating messages that set the tone for the community space
 */

export const WELCOME_QUOTES = [
  "Welcome to the neighborhood! What do you need today?",
  "Great to see you here. How can we help each other?",
  "Your neighbors are here. What's on your mind?",
  "Community starts with connection. Let's share.",
  "No one goes hungry when neighbors come together.",
  "Every offer matters. Every request is valid.",
  "Welcome! This is a judgment-free zone.",
] as const;

/**
 * Get a random welcome quote
 */
export function getWelcomeQuote(): string {
  return WELCOME_QUOTES[Math.floor(Math.random() * WELCOME_QUOTES.length)];
}

/**
 * Get quote by time of day
 */
export function getTimeBasedQuote(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning! What can the neighborhood help with today?";
  } else if (hour < 17) {
    return "Good afternoon! Let's see what's happening in the community.";
  } else {
    return "Good evening! Your neighbors are here to help.";
  }
}
