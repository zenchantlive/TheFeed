/**
 * Chat Theme Utilities
 * 
 * Centralized theme management for the chat interface
 * Leverages existing CSS custom properties for consistency
 */

export interface ChatTheme {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
}

/**
 * Get theme values based on current CSS custom properties
 */
export function getChatTheme(): ChatTheme {
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  
  return {
    background: computed.getPropertyValue('--background').trim() || '#faf9f6',
    foreground: computed.getPropertyValue('--foreground').trim() || '#2d2d34',
    card: computed.getPropertyValue('--card').trim() || '#ffffff',
    cardForeground: computed.getPropertyValue('--card-foreground').trim() || '#2d2d34',
    primary: computed.getPropertyValue('--primary').trim() || '#52796f',
    primaryForeground: computed.getPropertyValue('--primary-foreground').trim() || '#fffbf0',
    secondary: computed.getPropertyValue('--secondary').trim() || '#f5f3ed',
    secondaryForeground: computed.getPropertyValue('--secondary-foreground').trim() || '#2d2d34',
    muted: computed.getPropertyValue('--muted').trim() || '#f1eee6',
    mutedForeground: computed.getPropertyValue('--muted-foreground').trim() || '#6b6b6b',
    accent: computed.getPropertyValue('--accent').trim() || '#f4e3d7',
    accentForeground: computed.getPropertyValue('--accent-foreground').trim() || '#2d2d34',
    border: computed.getPropertyValue('--border').trim() || '#e4dfd3',
    input: computed.getPropertyValue('--input').trim() || '#e4dfd3',
    ring: computed.getPropertyValue('--ring').trim() || '#8fa998',
  };
}

/**
 * Generate CSS classes for theme-aware styling
 */
export function getChatStyles() {
  return {
    // Container styles
    container: `
      bg-background text-foreground
    `,
    
    // Message bubble styles
    userMessage: `
      bg-primary text-primary-foreground
      border border-primary/20
      shadow-sm
    `,
    
    assistantMessage: `
      bg-card text-card-foreground
      border border-border
      shadow-sm
    `,
    
    // Input area styles
    inputContainer: `
      bg-card/95 backdrop-blur-[8px]
      border-t border-border
      shadow-lg shadow-background/40
    `,
    
    inputField: `
      bg-background border border-border
      text-foreground placeholder:text-muted-foreground
      shadow-sm
    `,
    
    // Card styles
    card: `
      bg-card border border-border
      text-card-foreground
      shadow-sm
    `,
    
    // Button styles
    primaryButton: `
      bg-primary text-primary-foreground
      hover:bg-primary/90
      shadow-sm
    `,
    
    secondaryButton: `
      bg-secondary text-secondary-foreground
      border border-border
      hover:bg-secondary/80
    `,
    
    ghostButton: `
      hover:bg-accent hover:text-accent-foreground
      transition-colors
    `,
    
    // Status indicators
    onlineStatus: `
      bg-green-500/20 text-green-700
      dark:bg-green-400/20 dark:text-green-400
    `,
    
    offlineStatus: `
      bg-red-500/20 text-red-700
      dark:bg-red-400/20 dark:text-red-400
    `,
    
    // Loading states
    loadingBackground: `
      bg-muted/50
      dark:bg-muted/30
    `,
    
    shimmer: `
      bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent
      animate-shimmer
    `,
  };
}

/**
 * Create theme-aware CSS custom property values
 */
export function createThemeVariables(theme: 'light' | 'dark' = 'light'): Record<string, string> {
  if (theme === 'dark') {
    return {
      '--chat-background': 'hsl(var(--background))',
      '--chat-foreground': 'hsl(var(--foreground))',
      '--chat-card': 'hsl(var(--card))',
      '--chat-border': 'hsl(var(--border))',
      '--chat-primary': 'hsl(var(--primary))',
      '--chat-muted': 'hsl(var(--muted))',
      '--chat-accent': 'hsl(var(--accent))',
    };
  }
  
  return {
    '--chat-background': 'hsl(var(--background))',
    '--chat-foreground': 'hsl(var(--foreground))',
    '--chat-card': 'hsl(var(--card))',
    '--chat-border': 'hsl(var(--border))',
    '--chat-primary': 'hsl(var(--primary))',
    '--chat-muted': 'hsl(var(--muted))',
    '--chat-accent': 'hsl(var(--accent))',
  };
}

/**
 * Check if dark mode is currently active
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  return document.documentElement.classList.contains('dark') ||
         window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Listen for theme changes
 */
export function onThemeChange(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const classObserver = new MutationObserver(() => {
    callback(isDarkMode());
  });
  
  const handleMediaChange = () => callback(isDarkMode());
  
  mediaQuery.addEventListener('change', handleMediaChange);
  classObserver.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['class'] 
  });
  
  return () => {
    mediaQuery.removeEventListener('change', handleMediaChange);
    classObserver.disconnect();
  };
}
