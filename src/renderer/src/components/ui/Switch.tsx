import { motion, useReducedMotion } from 'motion/react'
import { spring } from '../motion/config'
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      whileTap={reduce ? undefined : { scale: 0.95 }}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 18 : 0 }}
        transition={reduce ? { duration: 0 } : spring}
      />
    </motion.button>
  )
}
