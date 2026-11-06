import { useEffect, useId, useState, type ReactNode } from 'react'
import { validateProxy } from '../../../../shared/proxy'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { useFeedback } from '../../components/ui/FeedbackProvider'
export function ProxyCard({
  title,
  value,
  onSave,
  description,
  children,
}: {
  title: string
  value: string
  onSave: (value: string) => void
  description: string
  children?: ReactNode
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const { notify } = useFeedback()
  useEffect(() => setDraft(value), [value])
  return (
    <Section title={title}>
      {children}
      <form
        className="settings-form"
        onSubmit={(event) => {
          event.preventDefault()
          try {
            const proxy = validateProxy(draft)
            onSave(proxy)
            setDraft(proxy)
            setError('')
            notify(`${title}代理已保存`)
          } catch (error) {
            setError(error instanceof Error ? error.message : '代理地址无效')
          }
        }}
      >
        <label htmlFor={id}>
          代理地址 <span className="muted">留空直连</span>
        </label>
        <input
          id={id}
          value={draft}
          placeholder="http://127.0.0.1:7890 或 socks5://127.0.0.1:1080"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setDraft(event.target.value)
            setError('')
          }}
        />
        <p id={`${id}-hint`} className="footnote">
          支持 HTTP / HTTPS / SOCKS5 / SOCKS5H。{description}
        </p>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <Button type="submit">保存代理</Button>
      </form>
    </Section>
  )
}
