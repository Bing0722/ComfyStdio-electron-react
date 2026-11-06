import { useWorkspace } from '../../state/WorkspaceProvider'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { useFeedback } from '../../components/ui/FeedbackProvider'
export function FolderSettings() {
  const { state, readComfy, readBlockedReason } = useWorkspace()
  const { notify, showDialog } = useFeedback()
  const current = state.comfy
  const select = () => void readComfy('choose')
  return (
    <Section title="文件夹管理">
      <div className="setting-row">
        <div>
          <h3>当前 ComfyUI</h3>
          <p>选择程序目录后，模型与插件目录同步更新。</p>
        </div>
        <Button
          disabled={Boolean(readBlockedReason)}
          title={readBlockedReason}
          onClick={() =>
            current
              ? showDialog({
                  title: '更换 ComfyUI 目录',
                  text: '选择后将重新读取程序、模型和插件，替换当前工作目录。取消选择会保留当前内容。',
                  confirmLabel: '选择文件夹',
                  action: select,
                })
              : select()
          }
        >
          {state.read.phase === 'reading' ? '读取中…' : '选择文件夹'}
        </Button>
      </div>
      {state.read.error && (
        <p role="alert" className="error-text">
          {state.read.error}
        </p>
      )}
      {(
        [
          ['program', '程序目录', current?.path],
          ['models', '模型目录', current?.modelsPath],
          ['plugins', '插件目录', current?.pluginsPath],
        ] as const
      ).map(([kind, label, path]) => (
        <div className="folder-setting" key={kind}>
          <label htmlFor={`${kind === 'models' ? 'model' : kind}-directory`}>
            {label}
          </label>
          <div className="folder-input">
            <input
              id={`${kind === 'models' ? 'model' : kind}-directory`}
              readOnly
              value={path ?? ''}
              placeholder="请先选择 ComfyUI 文件夹"
            />
            <Button
              disabled={!current || current.source !== 'local'}
              onClick={async () => {
                try {
                  const error = await window.comfy?.openFolder(kind)
                  if (error) notify(`无法打开文件夹：${error}`)
                } catch {
                  notify('打开文件夹失败，请检查目录是否存在')
                }
              }}
            >
              打开文件夹
            </Button>
          </div>
        </div>
      ))}
      <p className="footnote">
        模型与插件归属于同一个
        ComfyUI。此处不移动文件；需要切换位置时请选择对应的程序目录。
      </p>
    </Section>
  )
}
