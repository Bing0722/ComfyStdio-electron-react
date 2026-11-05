import type { ReactNode } from 'react'
export type IconName =
  | 'glass'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'terminal'
  | 'download'
  | 'models'
  | 'versions'
  | 'plugins'
  | 'settings'
  | 'sun'
  | 'chevron'
  | 'check'
  | 'play'
  | 'stop'
  | 'search'
  | 'close'
  | 'sidebar'
const paths: Record<IconName, ReactNode> = {
  glass: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="m8 12 4-4m-2 8 6-6" />
    </>
  ),
  minimize: <path d="M5 12h14" />,
  maximize: <rect x="5" y="5" width="14" height="14" rx="2" />,
  restore: (
    <>
      <path d="M9 5h10v10" />
      <rect x="5" y="9" width="10" height="10" rx="1" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m7 9 3 3-3 3m6 0h4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4" />
    </>
  ),
  models: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M10 10v10" />
    </>
  ),
  versions: (
    <>
      <circle cx="7" cy="5" r="2" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="17" cy="7" r="2" />
      <path d="M7 7v10m10-8a8 8 0 0 1-8 8" />
    </>
  ),
  plugins: (
    <path d="M9 3h6v5h2a2 2 0 1 1 0 4h-2v8H4v-8h2a2 2 0 1 0 0-4H4V3h5Z" />
  ),
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
    </>
  ),
  chevron: <path d="m8 10 4 4 4-4" />,
  check: <path d="m5 12 4 4L19 6" />,
  play: <path d="m8 5 11 7-11 7Z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  sidebar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
}
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
