import { Button } from './Button'
export function ViewTabs({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="view-tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          aria-pressed={value === option.value}
          className={value === option.value ? 'selected' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
