import { AboutPage } from '../features/about/AboutPage'
import { useState } from 'react'
import type { PageId } from '../state/types'
import { AppLayout } from '../components/layout/AppLayout'
import { LaunchPage } from '../features/comfy/LaunchPage'
import { ComfyGate } from '../features/comfy/ComfyGate'
import { DownloadsPage } from '../features/models/DownloadsPage'
import { ModelsPage } from '../features/models/ModelsPage'
import { VersionsPage } from '../features/versions/VersionsPage'
import { PluginsPage } from '../features/plugins/PluginsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
const pages = {
  about: AboutPage,
  launch: LaunchPage,
  downloads: DownloadsPage,
  models: ModelsPage,
  versions: VersionsPage,
  plugins: PluginsPage,
  settings: SettingsPage,
}
export default function App() {
  const [page, setPage] = useState<PageId>('launch')
  const Page = pages[page]
  return (
    <AppLayout page={page} onNavigate={setPage}>
      {page === 'settings' || page === 'about' ? (
        <Page />
      ) : (
        <ComfyGate>
          <Page />
        </ComfyGate>
      )}
    </AppLayout>
  )
}
