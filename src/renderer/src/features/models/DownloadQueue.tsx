import { useWorkspace } from '../../state/WorkspaceProvider'
import { Section, Status } from '../../components/ui/Section'
import { useFeedback } from '../../components/ui/FeedbackProvider'
import './models.css'

export function DownloadQueue() {
  const { state, dispatch } = useWorkspace()
  const { showDialog } = useFeedback()
  return (
    <Section title="下载队列" count={state.downloads.length}>
      {!state.downloads.length && (
        <p className="section-hint">还没有下载任务。</p>
      )}
      <div className="item-list">
        {state.downloads.map((task) => (
          <div className="download-row" key={task.id}>
            <div className="download-heading">
              <h3>{task.name}</h3>
              <Status value={task.phase} />
              <span className="progress-label">{task.progress}%</span>
            </div>
            <progress
              aria-label={`${task.name} 下载进度`}
              value={task.progress}
              max={100}
            />
            <div className="download-footer">
              <span className="row-description">
                {((task.size * task.progress) / 100).toFixed(1)} / {task.size}{' '}
                GB
                {task.phase === '下载中' &&
                  ` · ${(task.size * 1024 * 0.05).toFixed(0)} MB/s · ${Math.ceil((100 - task.progress) / 5)} 秒`}
              </span>
              <div className="row-actions">
                {task.phase === '下载中' && (
                  <button
                    className="button-quiet"
                    onClick={() =>
                      dispatch({
                        type: 'download/status',
                        id: task.id,
                        phase: '暂停',
                      })
                    }
                  >
                    暂停
                  </button>
                )}
                {['暂停', '失败'].includes(task.phase) && (
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'download/status',
                        id: task.id,
                        phase: '下载中',
                      })
                    }
                  >
                    {task.phase === '失败' ? '重试' : '继续'}
                  </button>
                )}
                <button
                  className="button-quiet"
                  onClick={() =>
                    showDialog({
                      title: `${task.phase === '完成' ? '清除记录' : '取消下载'}：${task.name}？`,
                      text: '此操作仅影响演示队列。',
                      confirmLabel:
                        task.phase === '完成' ? '清除记录' : '取消下载',
                      danger: true,
                      action: () =>
                        dispatch({ type: 'download/remove', id: task.id }),
                    })
                  }
                >
                  {task.phase === '完成' ? '清除记录' : '取消'}
                </button>
              </div>
            </div>
            {task.phase === '下载中' && (
              <details className="demo-tools">
                <summary>演示操作</summary>
                <button
                  onClick={() =>
                    dispatch({
                      type: 'download/status',
                      id: task.id,
                      phase: '失败',
                    })
                  }
                >
                  模拟下载失败
                </button>
              </details>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}
