import { motion, useReducedMotion } from 'motion/react'
import { easeOut } from '../motion/config'
export function Progress({ value, label }: { value: number; label: string }) {
  const reduce = useReducedMotion()
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="progress-fill"
        initial={false}
        animate={{ scaleX: value / 100 }}
        transition={{ duration: reduce ? 0 : 0.65, ease: easeOut }}
      />
    </div>
  )
}
