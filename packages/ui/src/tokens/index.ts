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

export const cairnMotion = {
  duration: {
    hover: '120ms',
    surface: '160ms',
    dialog: '180ms',
    route: '200ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

export const cairnStatusTone = {
  idle: 'neutral',
  running: 'info',
  blocked: 'warning',
  completed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
} as const;

export type CairnStatusTone = (typeof cairnStatusTone)[keyof typeof cairnStatusTone];
