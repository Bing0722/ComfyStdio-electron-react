import { Button } from '../../components/ui/Button'
import { Section } from '../../components/ui/Section'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { useComfy, useWorkspace } from '../../state/WorkspaceProvider'
import { latestDemoVersion, versionCatalog } from '../../state/demo-data'
import { ComfyContext } from '../comfy/ComfyContext'
export function VersionsPage() {
  const comfy = useComfy()
  const { state, dispatch, readBlockedReason } = useWorkspace()
  const { showDialog } = useFeedback()
  const changeVersion = (version: string, kind: 'update' | 'switch') =>
    showDialog({
      title: `${kind === 'update' ? '更新' : '切换'}到 ${version}？`,
      text: `当前目录：${comfy.path}\n仅变更这份 ComfyUI 的版本，模型和插件保留。\n本次为演示，不修改真实程序文件。`,
      confirmLabel: kind === 'update' ? '演示更新' : '演示切换',
      action: () => dispatch({ type: 'version/change', version, kind }),
    })
  return (
    <>
      <ComfyContext />
      <Section title="当前版本">
        <div className="list-row wrap-row">
          <div className="row-content">
            <div className="row-title">
              {comfy.version}
              <span className="inline-note">当前使用</span>
            </div>
            <p className="row-description">
              {state.versionTask
                ? `正在${state.versionTask.kind === 'update' ? '更新' : '切换'}到 ${state.versionTask.version}（演示）…`
                : '一个 ComfyUI 目录，切换版本时保留模型与插件。'}
            </p>
          </div>
          {comfy.source === 'demo' && (
            <Button
              className="button-primary"
              disabled={
                Boolean(readBlockedReason) ||
                comfy.version === latestDemoVersion
              }
              onClick={() => changeVersion(latestDemoVersion, 'update')}
            >
              {comfy.version === latestDemoVersion
                ? '已是演示最新版本'
                : `更新到 ${latestDemoVersion}`}
            </Button>
          )}
        </div>
      </Section>
      {comfy.source === 'demo' ? (
        <>
          <Section title="切换版本">
            <div className="item-list">
              {versionCatalog.map((item) => (
                <div className="list-row" key={item.version}>
                  <div className="row-content">
                    <div className="row-title">{item.version}</div>
                    <div className="row-description">
                      {item.channel} · {item.date}
                    </div>
                  </div>
                  <Button
                    disabled={
                      item.version === comfy.version ||
                      Boolean(readBlockedReason)
                    }
                    onClick={() => changeVersion(item.version, 'switch')}
                  >
                    {item.version === comfy.version ? '使用中' : '切换'}
                  </Button>
                </div>
              ))}
            </div>
          </Section>
          {readBlockedReason && <p className="footnote">{readBlockedReason}</p>}
          <p className="footnote">
            版本列表为演示数据；不会另外创建或安装第二份 ComfyUI。
          </p>
        </>
      ) : (
        <Section title="版本管理">
          <p className="section-hint">
            已读取本地版本。真实版本切换、远程更新和依赖安装尚未接入；当前不会修改这份程序。演示环境可预览完整切换与更新流程。
          </p>
        </Section>
      )}
    </>
  )
}
