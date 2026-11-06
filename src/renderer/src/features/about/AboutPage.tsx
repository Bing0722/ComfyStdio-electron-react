import { SoftwareUpdate } from './SoftwareUpdate'
import { useEffect, useState } from 'react'
import type { DeviceReport } from '../../../../shared/device-api'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { useWorkspace } from '../../state/WorkspaceProvider'
import './about.css'
function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="device-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
export function AboutPage() {
  const { state } = useWorkspace()
  const [report, setReport] = useState<DeviceReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function refresh() {
    setBusy(true)
    setError('')
    try {
      if (!window.device) throw new Error('请在桌面应用中读取设备信息。')
      setReport(await window.device.read())
    } catch (error) {
      setError(error instanceof Error ? error.message : '读取失败，请重试。')
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])
  return (
    <div className="about-stack" aria-busy={busy}>
      <SoftwareUpdate />
      <Section
        title="ComfyStdio"
        action={
          <Button disabled={busy} onClick={() => void refresh()}>
            {busy ? '检测中…' : '刷新设备信息'}
          </Button>
        }
      >
        <p className="footnote">一个 ComfyUI，统一管理程序、模型与插件。</p>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <Facts
          rows={[
            ['应用版本', report?.app ?? '检测中…'],
            [
              '当前 ComfyUI',
              state.read.phase === 'ready'
                ? `${state.comfy?.version} · 本地程序`
                : '尚未读取',
            ],
            [
              '检测时间',
              report ? new Date(report.checkedAt).toLocaleString() : '等待检测',
            ],
          ]}
        />
      </Section>
      {report && (
        <>
          <Section title="设备">
            <Facts
              rows={[
                ['系统', report.system],
                ['处理器', report.cpu],
                ['内存', report.memory],
                ['显卡', report.graphics.join(' / ') || '未能读取显卡名称'],
              ]}
            />
          </Section>
          <Section title="NVIDIA 与 CUDA">
            {report.nvidia.length ? (
              report.nvidia.map((gpu, index) => (
                <Facts
                  key={index}
                  rows={[
                    [`显卡 ${index + 1}`, gpu.name],
                    ['驱动版本', gpu.driver],
                    ['显存', gpu.memory],
                  ]}
                />
              ))
            ) : (
              <p className="footnote">
                未检测到可通过 nvidia-smi 读取的 NVIDIA 显卡或驱动。
              </p>
            )}
            <Facts
              rows={[
                ['驱动支持的 CUDA 上限', report.cudaDriver],
                ['CUDA 工具包（nvcc）', report.cudaToolkit],
              ]}
            />
            <p className="footnote">
              驱动支持版本不等于已安装的 CUDA 工具包或 PyTorch CUDA 版本。
            </p>
          </Section>
          <Section title="基础工具">
            <Facts
              rows={[
                ['系统 Python', report.python],
                ['Git', report.git],
              ]}
            />
            <p className="footnote">
              检测当前应用环境中的工具。尚未检测 ComfyUI 独立虚拟环境与
              PyTorch；这些信息不代表程序已具备运行条件。
            </p>
          </Section>
        </>
      )}
    </div>
  )
}
