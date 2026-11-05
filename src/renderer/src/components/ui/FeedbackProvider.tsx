import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
interface DialogContent {
  title: string
  text: string
  confirmLabel?: string
  danger?: boolean
  action?: () => void
}
interface Feedback {
  notify: (message: string) => void
  showDialog: (dialog: DialogContent) => void
}
const Context = createContext<Feedback | null>(null)
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string } | null>(null)
  const [dialog, setDialog] = useState<DialogContent | null>(null)
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const textId = useId()
  useEffect(() => {
    if (dialog) ref.current?.showModal()
    else {
      ref.current?.close()
      returnFocus.current?.focus()
    }
  }, [dialog])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(timer)
  }, [notice])
  return (
    <Context.Provider
      value={{
        notify: (message) => setNotice({ message }),
        showDialog: (content) => {
          returnFocus.current = document.activeElement as HTMLElement
          setDialog(content)
        },
      }}
    >
      {children}
      {notice && (
        <div role="status" className="toast">
          {notice.message}
        </div>
      )}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={textId}
        onCancel={() => setDialog(null)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          if (
            event.target === event.currentTarget &&
            (event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom)
          )
            setDialog(null)
        }}
      >
        <h2 id={titleId}>{dialog?.title}</h2>
        <p id={textId} className="dialog-text">
          {dialog?.text}
        </p>
        <div className="dialog-actions">
          <button autoFocus onClick={() => setDialog(null)}>
            {dialog?.action ? '取消' : '关闭'}
          </button>
          {dialog?.action && (
            <button
              className={dialog.danger ? 'button-danger' : 'button-primary'}
              onClick={() => {
                dialog.action?.()
                setDialog(null)
              }}
            >
              {dialog.confirmLabel ?? '确认'}
            </button>
          )}
        </div>
      </dialog>
    </Context.Provider>
  )
}
export function useFeedback() {
  const context = useContext(Context)
  if (!context) throw new Error('FeedbackProvider is missing')
  return context
}
