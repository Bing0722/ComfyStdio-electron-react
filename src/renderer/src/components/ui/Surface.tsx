import type { ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
  type HTMLMotionProps,
} from 'motion/react'
import { usePreferences } from '../../features/settings/PreferencesProvider'

export function Surface({
  children,
  className = '',
  ...props
}: Omit<HTMLMotionProps<'section'>, 'children'> & { children: ReactNode }) {
  const { liquid } = usePreferences()
  const reduce = useReducedMotion()
  const x = useMotionValue(50)
  const y = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 120, damping: 24 })
  const smoothY = useSpring(y, { stiffness: 120, damping: 24 })
  const reflection = useMotionTemplate`radial-gradient(500px circle at ${smoothX}% ${smoothY}%, var(--glass-shine), transparent 65%)`
  return (
    <motion.section
      {...props}
      className={`surface ${className}`}
      onPointerMove={(event) => {
        if (!liquid || reduce || event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        x.set(((event.clientX - rect.left) / rect.width) * 100)
        y.set(((event.clientY - rect.top) / rect.height) * 100)
      }}
      onPointerLeave={() => {
        x.set(50)
        y.set(0)
      }}
    >
      <motion.span
        className="glass-reflection"
        aria-hidden="true"
        style={{ background: reflection }}
      />
      {children}
    </motion.section>
  )
}
