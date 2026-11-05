import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')
if (!root) throw new Error('ComfyStdio root element is missing')

createRoot(root).render(
  <main>
    <h1>ComfyStdio</h1>
    <p>ComfyUI 桌面启动器</p>
    <p>当前开发目标是用模拟数据完成启动器界面和交互。</p>
  </main>
)
