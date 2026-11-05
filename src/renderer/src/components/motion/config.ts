export const spring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
  mass: 0.8,
}
export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 30,
  mass: 0.8,
}
export const easeOut = [0.22, 1, 0.36, 1] as const
