import { Section } from '../../components/ui/Section'
import { useComfy } from '../../state/WorkspaceProvider'
import { ComfyContext } from '../comfy/ComfyContext'
export function VersionsPage() {
  const comfy = useComfy()
  return (
    <>
      <ComfyContext />
      <Section title="当前 ComfyUI 版本">
        <h3>{comfy.version}</h3>
        <p className="footnote">
          版本来自当前程序文件。内置版本切换尚未接入；手动更新此目录后可重新读取。ComfyStdio
          自身更新位于“关于”。
        </p>
      </Section>
    </>
  )
}
