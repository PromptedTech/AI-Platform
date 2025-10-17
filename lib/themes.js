// Nova AI Theme System
// Central configuration for all available themes

export const themes = {
  'nova-default': {
    id: 'nova-default',
    name: 'Nova Default',
    description: 'The signature Nova AI experience',
    isDefault: true,
    cssVariables: {
      '--bg-gradient': 'linear-gradient(135deg, #0d1117 0%, #1a1f29 50%, #0f141e 100%)',
      '--bg-gradient-light': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      '--sidebar-bg': '#121620',
      '--sidebar-bg-light': '#f1f5f9',
      '--topbar-bg': '#0f141e',
      '--topbar-bg-light': '#ffffff',
      '--chat-bubble-user': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      '--chat-bubble-ai': '#1e2633',
      '--chat-bubble-ai-light': '#f8fafc',
      '--accent-primary': '#8b5cf6',
      '--accent-secondary': '#6366f1',
      '--text-primary': '#e5e7eb',
      '--text-primary-light': '#1e293b',
      '--text-secondary': '#9ca3af',
      '--text-secondary-light': '#64748b',
      '--input-bg': '#1f2937',
      '--input-bg-light': '#ffffff',
      '--border-color': '#374151',
      '--border-color-light': '#e2e8f0',
      '--shadow-color': 'rgba(139, 92, 246, 0.25)',
      '--shadow-color-light': 'rgba(59, 130, 246, 0.15)',
      '--glass-bg': 'rgba(18, 22, 32, 0.8)',
      '--glass-bg-light': 'rgba(255, 255, 255, 0.8)',
    }
  },
  'aurora': {
    id: 'aurora',
    name: 'Aurora',
    description: 'Vibrant purple and blue cosmic vibes',
    cssVariables: {
      '--bg-gradient': 'linear-gradient(135deg, #1a0b2e 0%, #16213e 50%, #0f3460 100%)',
      '--bg-gradient-light': 'linear-gradient(135deg, #f3e8ff 0%, #ddd6fe 50%, #c4b5fd 100%)',
      '--sidebar-bg': '#1a0b2e',
      '--sidebar-bg-light': '#f3e8ff',
      '--topbar-bg': '#0f0a1a',
      '--topbar-bg-light': '#ffffff',
      '--chat-bubble-user': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      '--chat-bubble-ai': '#16213e',
      '--chat-bubble-ai-light': '#f8fafc',
      '--accent-primary': '#8b5cf6',
      '--accent-secondary': '#a855f7',
      '--text-primary': '#e5e7eb',
      '--text-primary-light': '#1e293b',
      '--text-secondary': '#9ca3af',
      '--text-secondary-light': '#64748b',
      '--input-bg': '#16213e',
      '--input-bg-light': '#ffffff',
      '--border-color': '#4c1d95',
      '--border-color-light': '#e9d5ff',
      '--shadow-color': 'rgba(139, 92, 246, 0.4)',
      '--shadow-color-light': 'rgba(168, 85, 247, 0.2)',
      '--glass-bg': 'rgba(26, 11, 46, 0.8)',
      '--glass-bg-light': 'rgba(243, 232, 255, 0.8)',
    }
  },
  'oceanic': {
    id: 'oceanic',
    name: 'Oceanic',
    description: 'Deep teal and cyan ocean depths',
    cssVariables: {
      '--bg-gradient': 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0c4a6e 100%)',
      '--bg-gradient-light': 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
      '--sidebar-bg': '#0c4a6e',
      '--sidebar-bg-light': '#ecfeff',
      '--topbar-bg': '#075985',
      '--topbar-bg-light': '#ffffff',
      '--chat-bubble-user': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      '--chat-bubble-ai': '#075985',
      '--chat-bubble-ai-light': '#f8fafc',
      '--accent-primary': '#0891b2',
      '--accent-secondary': '#06b6d4',
      '--text-primary': '#e5e7eb',
      '--text-primary-light': '#1e293b',
      '--text-secondary': '#9ca3af',
      '--text-secondary-light': '#64748b',
      '--input-bg': '#075985',
      '--input-bg-light': '#ffffff',
      '--border-color': '#0e7490',
      '--border-color-light': '#a5f3fc',
      '--shadow-color': 'rgba(8, 145, 178, 0.3)',
      '--shadow-color-light': 'rgba(6, 182, 212, 0.2)',
      '--glass-bg': 'rgba(12, 74, 110, 0.8)',
      '--glass-bg-light': 'rgba(236, 254, 255, 0.8)',
    }
  },
  'neon': {
    id: 'neon',
    name: 'Neon',
    description: 'Black with pink and turquoise glow',
    cssVariables: {
      '--bg-gradient': 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
      '--bg-gradient-light': 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
      '--sidebar-bg': '#1a1a2e',
      '--sidebar-bg-light': '#fdf2f8',
      '--topbar-bg': '#000000',
      '--topbar-bg-light': '#ffffff',
      '--chat-bubble-user': 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
      '--chat-bubble-ai': '#1a1a2e',
      '--chat-bubble-ai-light': '#f8fafc',
      '--accent-primary': '#ec4899',
      '--accent-secondary': '#06b6d4',
      '--text-primary': '#e5e7eb',
      '--text-primary-light': '#1e293b',
      '--text-secondary': '#9ca3af',
      '--text-secondary-light': '#64748b',
      '--input-bg': '#1a1a2e',
      '--input-bg-light': '#ffffff',
      '--border-color': '#374151',
      '--border-color-light': '#fbcfe8',
      '--shadow-color': 'rgba(236, 72, 153, 0.5)',
      '--shadow-color-light': 'rgba(6, 182, 212, 0.3)',
      '--glass-bg': 'rgba(26, 26, 46, 0.9)',
      '--glass-bg-light': 'rgba(253, 242, 248, 0.8)',
    }
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean light mode with pastel accents',
    cssVariables: {
      '--bg-gradient': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      '--bg-gradient-light': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      '--sidebar-bg': '#f8fafc',
      '--sidebar-bg-light': '#f8fafc',
      '--topbar-bg': '#ffffff',
      '--topbar-bg-light': '#ffffff',
      '--chat-bubble-user': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      '--chat-bubble-ai': '#ffffff',
      '--chat-bubble-ai-light': '#ffffff',
      '--accent-primary': '#3b82f6',
      '--accent-secondary': '#1d4ed8',
      '--text-primary': '#1e293b',
      '--text-primary-light': '#1e293b',
      '--text-secondary': '#64748b',
      '--text-secondary-light': '#64748b',
      '--input-bg': '#ffffff',
      '--input-bg-light': '#ffffff',
      '--border-color': '#e2e8f0',
      '--border-color-light': '#e2e8f0',
      '--shadow-color': 'rgba(59, 130, 246, 0.1)',
      '--shadow-color-light': 'rgba(59, 130, 246, 0.1)',
      '--glass-bg': 'rgba(255, 255, 255, 0.8)',
      '--glass-bg-light': 'rgba(255, 255, 255, 0.8)',
    }
  }
};

// Theme utilities
export const getThemeById = (themeId) => {
  return themes[themeId] || themes['nova-default'];
};

export const getDefaultTheme = () => {
  return themes['nova-default'];
};

export const getAllThemes = () => {
  return Object.values(themes);
};

export const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  Object.entries(theme.cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Add theme class for additional styling
  root.className = root.className.replace(/theme-\w+/g, '');
  root.classList.add(`theme-${theme.id}`);
};

export const getThemeFromStorage = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('nova-ai-theme');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading theme from storage:', error);
    return null;
  }
};

export const saveThemeToStorage = (theme) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('nova-ai-theme', JSON.stringify(theme));
  } catch (error) {
    console.error('Error saving theme to storage:', error);
  }
};
