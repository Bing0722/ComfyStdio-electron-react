import type { ReactNode } from 'react'
import { WorkspaceProvider } from '../state/WorkspaceProvider'
import { PreferencesProvider } from '../features/settings/PreferencesProvider'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <WorkspaceProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </WorkspaceProvider>
    </PreferencesProvider>
  )
}
