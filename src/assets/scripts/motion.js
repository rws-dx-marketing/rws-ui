// Shared motion capability checks used across the interactive scripts.
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const canViewTransition = () => typeof document.startViewTransition === 'function' && !reducedMotion()
