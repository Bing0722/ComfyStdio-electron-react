import type { ComfyAPI } from '../../shared/comfy-api'
import type { WindowAPI } from '../../shared/window-api'
declare global {
  interface Window {
    windowControls?: WindowAPI
    comfy?: ComfyAPI
    device?: import('../../shared/device-api').DeviceAPI
  }
}
