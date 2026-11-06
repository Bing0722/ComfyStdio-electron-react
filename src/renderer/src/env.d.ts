import type { ComfyAPI } from '../../shared/comfy-api'
import type { WindowAPI } from '../../shared/window-api'
declare global {
  interface Window {
    windowControls?: WindowAPI
    runtime?: import('../../shared/runtime-api').RuntimeAPI
    application?: import('../../shared/application-api').ApplicationAPI
    comfy?: ComfyAPI
    device?: import('../../shared/device-api').DeviceAPI
  }
}
