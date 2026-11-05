import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { easeOut } from './config'
export function Collapse({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className="collapse"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.24, ease: easeOut }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
