import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from 'motion/react'
import { Button } from './Button'
import { easeOut } from '../motion/config'
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

function Dialog({
  content,
  onDismiss,
}: {
  content: DialogContent
  onDismiss: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const textId = useId()
  const present = useIsPresent()
  const reduce = useReducedMotion()
  useEffect(() => {
    const returnFocus = document.activeElement as HTMLElement | null
    const dialog = ref.current
    dialog?.showModal()
    return () => {
      dialog?.close()
      returnFocus?.focus()
    }
  }, [])
  return (
    <motion.dialog
      ref={ref}
      className="modal-panel"
      aria-labelledby={titleId}
      aria-describedby={textId}
      data-exiting={!present}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.97, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: reduce ? 1 : 0.98, y: reduce ? 0 : -6 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: easeOut }}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        if (
          event.target === event.currentTarget &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
        )
          onDismiss()
      }}
    >
      <h2 id={titleId}>{content.title}</h2>
      <p id={textId} className="dialog-text">
        {content.text}
      </p>
      <div className="dialog-actions">
        <Button autoFocus disabled={!present} onClick={onDismiss}>
          {content.action ? '取消' : '关闭'}
        </Button>
        {content.action && (
          <Button
            disabled={!present}
            className={content.danger ? 'button-danger' : 'button-primary'}
            onClick={() => {
              content.action?.()
              onDismiss()
            }}
          >
            {content.confirmLabel ?? '确认'}
          </Button>
        )}
      </div>
    </motion.dialog>
  )
}
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; id: number } | null>(
    null,
  )
  const [dialog, setDialog] = useState<DialogContent | null>(null)
  const noticeId = useRef(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(timer)
  }, [notice])
  return (
    <Context.Provider
      value={{
        notify: (message) => setNotice({ message, id: ++noticeId.current }),
        showDialog: setDialog,
      }}
    >
      {children}
      <div className="toast-container">
        <AnimatePresence mode="wait">
          {notice && (
            <motion.div
              key={notice.id}
              role="status"
              className="toast"
              initial={{
                opacity: 0,
                y: reduce ? 0 : -12,
                scale: reduce ? 1 : 0.98,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: easeOut }}
            >
              {notice.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {dialog && (
          <Dialog content={dialog} onDismiss={() => setDialog(null)} />
        )}
      </AnimatePresence>
    </Context.Provider>
  )
}
export function useFeedback() {
  const context = useContext(Context)
  if (!context) throw new Error('FeedbackProvider is missing')
  return context
}
