import { forwardRef, type ReactNode } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'
import { easeOut } from './config'
export const PageTransition = forwardRef<
  HTMLDivElement,
  { children: ReactNode }
>(function PageTransition({ children }, ref) {
  const reduce = useReducedMotion()
  const present = useIsPresent()
  return (
    <motion.div
      ref={ref}
      className="page-content"
      inert={!present}
      aria-hidden={!present}
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        y: reduce ? 0 : -5,
        transition: { duration: reduce ? 0 : 0.12 },
      }}
      transition={{ duration: reduce ? 0 : 0.26, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
})
