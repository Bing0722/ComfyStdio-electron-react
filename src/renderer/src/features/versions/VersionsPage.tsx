import { Button } from '../../components/ui/Button'
import { versionCatalog } from '../../state/demo-data'
import { useCurrentInstance, useWorkspace } from '../../state/WorkspaceProvider'
import { versionInUse } from '../../state/workspace-reducer'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import { Section } from '../../components/ui/Section'
import { InstancePicker } from '../instances/InstancePicker'
export function VersionsPage() {
  const { state, dispatch } = useWorkspace()
  const current = useCurrentInstance()
  const { notify, showDialog } = useFeedback()
  const renderVersions = (installed: boolean) =>
    versionCatalog
      .filter((item) => state.versions.includes(item.version) === installed)
      .map(({ version, channel, date }) => (
        <div className="list-row wrap-row" key={version}>
          <div className="row-content">
            <div className="row-title">
              {version}
              {state.defaultVersion === version && (
                <span className="inline-note">默认</span>
              )}
              {current.version === version && (
                <span className="inline-note">使用中</span>
              )}
            </div>
            <div className="row-description">
              {channel} · {date}
            </div>
          </div>
          <div className="row-actions">
            {installed ? (
              <>
                <Button
                  className="button-quiet"
                  disabled={state.defaultVersion === version}
                  onClick={() => {
                    dispatch({ type: 'version/default', version })
                    notify('已设为默认版本（演示）')
                  }}
                >
                  设为默认
                </Button>
                <Button
                  disabled={current.version === version}
                  onClick={() => {
                    if (['启动中', '运行中'].includes(current.status)) {
                      notify('请先停止当前实例，再切换版本')
                      return
                    }
                    dispatch({
                      type: 'version/switch',
                      id: current.id,
                      version,
                    })
                    notify('已切换实例版本（演示）')
                  }}
                >
                  切换
                </Button>
                <Button
                  className="button-quiet"
                  onClick={() =>
                    showDialog({
                      title: `卸载 ${version}？`,
                      text: '默认版本或实例正在使用的版本不可卸载。',
                      confirmLabel: '卸载版本',
                      danger: true,
                      action: () => {
                        if (versionInUse(state, version))
                          notify('卸载失败：版本仍被使用，请先切换')
                        else {
                          dispatch({ type: 'version/remove', version })
                          notify('已卸载版本（演示）')
                        }
                      },
                    })
                  }
                >
                  卸载
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  dispatch({ type: 'version/install', version })
                  notify(`${version} 已安装（演示）`)
                }}
              >
                安装
              </Button>
            )}
          </div>
        </div>
      ))
  return (
    <>
      <div className="toolbar">
        <InstancePicker />
        <span className="muted toolbar-note">当前版本 {current.version}</span>
      </div>
      <Section title="已安装" count={state.versions.length}>
        <div className="item-list">{renderVersions(true)}</div>
      </Section>
      <Section title="可用版本">
        <div className="item-list">{renderVersions(false)}</div>
        {state.versions.length === versionCatalog.length && (
          <p className="section-hint">所有示例版本均已安装。</p>
        )}
      </Section>
      <p className="footnote">
        版本和发布日期为示例数据。默认版本用于后续新实例。
      </p>
    </>
  )
}
