import type { ReactNode } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'
import { easeOut } from './config'

export function Popover({
  id,
  label,
  placement,
  children,
}: {
  id: string
  label: string
  placement: 'top' | 'bottom'
  children: ReactNode
}) {
  const present = useIsPresent()
  const reduce = useReducedMotion()
  return (
    <motion.div
      id={id}
      role="listbox"
      aria-label={label}
      aria-hidden={!present}
      inert={!present}
      className="select-menu"
      initial={{
        opacity: 0,
        y: reduce ? 0 : placement === 'top' ? 5 : -5,
        scale: reduce ? 1 : 0.97,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
      transition={{ duration: reduce ? 0 : 0.16, ease: easeOut }}
      style={{
        transformOrigin: placement === 'top' ? 'bottom center' : 'top center',
      }}
    >
      {children}
    </motion.div>
  )
}
