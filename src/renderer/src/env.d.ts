import type { WindowAPI } from '../../shared/window-api'
declare global {
  interface Window {
    windowControls?: WindowAPI
  }
}
