import { useEffect, useRef, type ReactNode } from 'react'
import { navigation } from '../../app/navigation'
import type { PageId } from '../../state/types'
import { Sidebar } from './Sidebar'
import '../../styles/layout.css'
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
      <Sidebar page={page} onNavigate={onNavigate} />
      <div className="workspace">
        <header className="workspace-bar">
          <span>{current.label}</span>
          <span className="demo-label">演示模式</span>
        </header>
        <main ref={content} id="main-content">
          <div className="page-content">
            <header className="page-heading">
              <h1>{current.label}</h1>
              <p>{current.description}</p>
            </header>
            <div key={page} className="page-body">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
