import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')
if (!root) throw new Error('ComfyStdio root element is missing')

createRoot(root).render(
  <main>
    <h1>ComfyStdio</h1>
    <p>ComfyUI 桌面启动器</p>
    <p>首个开发目标是导入已有实例、启动 ComfyUI 并显示实时日志。</p>
  </main>
)
