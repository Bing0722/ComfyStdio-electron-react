import { useState } from 'react'
import type { PageId } from '../state/types'
import { AppLayout } from '../components/layout/AppLayout'
import { InstancesPage } from '../features/instances/InstancesPage'
import { DownloadsPage } from '../features/models/DownloadsPage'
import { ModelsPage } from '../features/models/ModelsPage'
import { VersionsPage } from '../features/versions/VersionsPage'
import { PluginsPage } from '../features/plugins/PluginsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
const pages = {
  instances: InstancesPage,
  downloads: DownloadsPage,
  models: ModelsPage,
  versions: VersionsPage,
  plugins: PluginsPage,
  settings: SettingsPage,
}
export default function App() {
  const [page, setPage] = useState<PageId>('instances')
  const Page = pages[page]
  return (
    <AppLayout page={page} onNavigate={setPage}>
      <Page />
    </AppLayout>
  )
}
