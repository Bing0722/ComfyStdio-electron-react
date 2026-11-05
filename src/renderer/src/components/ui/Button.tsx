import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { spring } from '../motion/config'

export function Button({
  children,
  disabled,
  ...props
}: HTMLMotionProps<'button'>) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      type="button"
      {...props}
      disabled={disabled}
      whileHover={disabled || reduce ? undefined : { y: -1 }}
      whileTap={disabled || reduce ? undefined : { scale: 0.97, y: 0 }}
      transition={spring}
    >
      {children}
    </motion.button>
  )
}
