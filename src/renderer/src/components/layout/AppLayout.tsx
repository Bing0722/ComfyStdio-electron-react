import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { navigation } from '../../app/navigation'
import type { PageId } from '../../state/types'
import { Sidebar } from './Sidebar'
import { TitleBar } from './TitleBar'
import { PageTransition } from '../motion/PageTransition'
import '../../styles/layout.css'
import '../../styles/glass.css'
export function AppLayout({
  page,
  onNavigate,
  children,
}: {
  page: PageId
  onNavigate: (page: PageId) => void
  children: ReactNode
}) {
  const current = navigation.find((item) => item.id === page)!
  const content = useRef<HTMLElement>(null)
  useEffect(() => {
    content.current?.scrollTo(0, 0)
  }, [page])
  return (
    <div className="app-shell">
      <div className="ambient-backdrop" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <TitleBar
        title={current.label}
        onSettings={() => onNavigate('settings')}
      />
      <div className="shell-body">
        <Sidebar page={page} onNavigate={onNavigate} />
        <div className="workspace">
          <motion.main layoutScroll ref={content} id="main-content">
            <AnimatePresence initial={false} mode="popLayout">
              <PageTransition key={page}>
                <header className="page-heading">
                  <h1>{current.label}</h1>
                  <p>{current.description}</p>
                </header>
                <div className="page-body">{children}</div>
              </PageTransition>
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  )
}
