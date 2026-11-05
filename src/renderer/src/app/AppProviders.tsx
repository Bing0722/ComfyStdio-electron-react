import { MotionConfig } from 'motion/react'
import { spring } from '../components/motion/config'
import type { ReactNode } from 'react'
import { WorkspaceProvider } from '../state/WorkspaceProvider'
import { PreferencesProvider } from '../features/settings/PreferencesProvider'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      <PreferencesProvider>
        <WorkspaceProvider>
          <FeedbackProvider>{children}</FeedbackProvider>
        </WorkspaceProvider>
      </PreferencesProvider>
    </MotionConfig>
  )
}
