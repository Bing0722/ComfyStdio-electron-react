import { useState } from 'react'
import { useWorkspace } from '../../state/WorkspaceProvider'
import { Section } from '../../components/ui/Section'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { SearchInput } from '../../components/ui/SearchInput'
import { useFeedback } from '../../components/ui/FeedbackProvider'
export function LogsPage() {
  const { state, liveRuntime } = useWorkspace()
  const { notify } = useFeedback()
  const [level, setLevel] = useState('全部')
  const [query, setQuery] = useState('')
  const logs = liveRuntime.logs.filter(
    (log) =>
      (level === '全部' || log.level === level) &&
      log.message.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <>
      <div className="toolbar">
        <SearchInput label="搜索日志内容…" value={query} onChange={setQuery} />
        <Select
          label="日志级别"
          value={level}
          options={['全部', '信息', '警告', '异常']}
          onChange={setLevel}
        />
      </div>
      <Section
        title="运行日志"
        count={logs.length}
        action={
          <Button
            disabled={!liveRuntime.logs.length}
            onClick={async () => {
              try {
                if (await window.runtime?.exportLogs()) notify('运行日志已导出')
              } catch {
                notify('日志导出失败，请检查文件权限')
              }
            }}
          >
            导出日志
          </Button>
        }
      >
        <p className="footnote">
          保留本次应用会话最近 1000 条记录，含时间、输出来源、警告和异常。重启
          ComfyUI 不清空记录。级别按文本识别，完整堆栈保留供分析。
        </p>
        <div className="runtime-log" aria-label="运行日志记录">
          {logs.map((log) => (
            <div className={`log-line log-${log.level}`} key={log.id}>
              <span>
                {new Date(log.time).toLocaleTimeString()} · {log.level} ·{' '}
                {log.source}
              </span>
              <pre>{log.message}</pre>
            </div>
          ))}
        </div>
        {!logs.length && (
          <p className="section-hint">
            {liveRuntime.logs.length
              ? '没有匹配的日志。'
              : '尚无真实运行记录。启动 ComfyUI 后会自动捕获输出。'}
          </p>
        )}
      </Section>
      {state.comfy?.source === 'demo' && (
        <Section title="演示环境记录">
          <pre className="log-output">
            {state.runtime.logs.join('\n') || '等待启动演示。'}
          </pre>
        </Section>
      )}
    </>
  )
}
