import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './Icon'

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  icon,
  placement = 'bottom',
}: {
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  label: string
  icon?: boolean
  placement?: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }
  const select = (index: number) => {
    onChange(options[index])
    close()
  }
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => {
    if (open)
      document
        .getElementById(`${id}-${active}`)
        ?.scrollIntoView({ block: 'nearest' })
  }, [active, open, id])
  return (
    <div
      className={`select select-${placement}`}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={label}
        aria-controls={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)))
          setOpen(!open)
        }}
        onKeyDown={(event) => {
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault()
            if (!open) {
              setActive(Math.max(0, options.indexOf(value)))
              setOpen(true)
              return
            }
            setActive((index) =>
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? options.length - 1
                  : (index +
                      (event.key === 'ArrowDown' ? 1 : -1) +
                      options.length) %
                    options.length,
            )
          }
          if (event.key === 'Escape' && open) {
            event.preventDefault()
            close()
          }
          if (event.key === 'Tab') setOpen(false)
          if (open && ['Enter', ' '].includes(event.key)) {
            event.preventDefault()
            select(active)
          }
        }}
      >
        {icon && <Icon name="sun" />}
        <span>{value}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div id={id} role="listbox" aria-label={label} className="select-menu">
          {options.map((option, index) => (
            <div
              key={option}
              id={`${id}-${index}`}
              role="option"
              aria-selected={value === option}
              className={index === active ? 'active' : ''}
              onPointerMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(index)}
            >
              <span>{option}</span>
              {value === option && <Icon name="check" size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
