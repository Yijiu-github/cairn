export const cairnRadii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  panel: '1.5rem',
} as const;

export const cairnSpace = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
} as const;

export const cairnColors = {
  accent: {
    blue: '#2563eb',
    blueSoft: '#dbeafe',
    blueStrong: '#1d4ed8',
  },
  border: {
    strong: '#cbd5e1',
    subtle: '#dbe5f0',
  },
  code: {
    background: '#0f172a',
    foreground: '#dbeafe',
  },
  surface: {
    canvas: '#eef3f8',
    inverse: '#0f172a',
    muted: '#f8fafc',
    panel: '#ffffff',
  },
  text: {
    inverse: '#ffffff',
    muted: '#64748b',
    primary: '#0f172a',
    subtle: '#475569',
  },
} as const;

export const cairnElevation = {
  navItem: '0 10px 24px rgb(15 23 42 / 14%)',
  panel: '0 24px 70px rgb(15 23 42 / 8%)',
} as const;

export const cairnCssVariables = {
  '--cairn-color-accent-blue': cairnColors.accent.blue,
  '--cairn-color-accent-blue-soft': cairnColors.accent.blueSoft,
  '--cairn-color-accent-blue-strong': cairnColors.accent.blueStrong,
  '--cairn-color-border-strong': cairnColors.border.strong,
  '--cairn-color-border-subtle': cairnColors.border.subtle,
  '--cairn-color-code-background': cairnColors.code.background,
  '--cairn-color-code-foreground': cairnColors.code.foreground,
  '--cairn-color-surface-canvas': cairnColors.surface.canvas,
  '--cairn-color-surface-inverse': cairnColors.surface.inverse,
  '--cairn-color-surface-muted': cairnColors.surface.muted,
  '--cairn-color-surface-panel': cairnColors.surface.panel,
  '--cairn-color-text-inverse': cairnColors.text.inverse,
  '--cairn-color-text-muted': cairnColors.text.muted,
  '--cairn-color-text-primary': cairnColors.text.primary,
  '--cairn-color-text-subtle': cairnColors.text.subtle,
  '--cairn-elevation-nav-item': cairnElevation.navItem,
  '--cairn-elevation-panel': cairnElevation.panel,
} as const;

export const cairnMotion = {
  duration: {
    hover: '120ms',
    surface: '160ms',
    dialog: '180ms',
    route: '200ms',
  },
  easing: {
    emphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
  },
} as const;

export const cairnStatusTone = {
  blocked: 'warning',
  cancelled: 'neutral',
  completed: 'success',
  failed: 'danger',
  idle: 'neutral',
  running: 'info',
} as const;

export type CairnStatusTone = (typeof cairnStatusTone)[keyof typeof cairnStatusTone];
