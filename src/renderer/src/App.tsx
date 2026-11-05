import { useEffect, useRef, useState, type ReactNode } from 'react'
import './style.css'

type Phase = '排队' | '下载中' | '暂停' | '完成' | '失败'
type Model = {
  id: number
  name: string
  type: string
  size: number
  source: string
}
type Task = Model & { progress: number; phase: Phase }
const catalog: Model[] = [
  {
    id: 1,
    name: 'FLUX.1 · Dev',
    type: 'Checkpoint',
    size: 23.8,
    source: 'Black Forest Labs',
  },
  {
    id: 2,
    name: 'SDXL Base 1.0',
    type: 'Checkpoint',
    size: 6.9,
    source: 'Stability AI',
  },
  {
    id: 3,
    name: 'Film Photography',
    type: 'LoRA',
    size: 0.2,
    source: 'Community',
  },
  { id: 4, name: 'SDXL VAE', type: 'VAE', size: 0.3, source: 'Stability AI' },
  {
    id: 5,
    name: 'ControlNet · Depth',
    type: 'ControlNet',
    size: 2.5,
    source: 'Community',
  },
]
const pages = ['启动', '模型下载', '模型管理', 'ComfyUI 版本', '插件', '设置']
const symbols = ['◈', '↓', '▦', '◇', '⊞', '⚙']
const descriptions = [
  '从一个灵感，开始今天的创作。',
  '发现并准备下一次创作需要的模型。',
  '让每一个模型，都有自己的位置。',
  '在熟悉的版本中保持稳定，探索新的可能。',
  '为你的工作流，添加更多可能。',
  '打造适合自己的创作空间。',
]
function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function Select({
  value,
  options,
  onChange,
  label,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  return (
    <div
      className="select"
      ref={wrapper}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
          e.preventDefault()
          setOpen(true)
          setActive((i) =>
            e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? options.length - 1
                : (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) %
                  options.length,
          )
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          setOpen(false)
          trigger.current?.focus()
        }
        if (open && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onChange(options[active])
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)))
          setOpen(!open)
        }}
      >
        {value}
        <span>⌄</span>
      </button>
      {open && (
        <div className="options" role="listbox" aria-label={label}>
          {options.map((option, i) => (
            <button
              key={option}
              role="option"
              aria-selected={option === value}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                onChange(option)
                setOpen(false)
                trigger.current?.focus()
              }}
            >
              {option}
              <span>{option === value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <article className={`card ${className}`}>{children}</article>
}
export default function App() {
  const [page, setPage] = useState('启动')
  const [theme, setTheme] = useState(() => readPreference('theme', '跟随系统'))
  const [liquid, setLiquid] = useState(
    () => readPreference('liquid', 'false') === 'true',
  )
  const [instance, setInstance] = useState('创作工作室')
  const [instances, setInstances] = useState<
    Record<string, { status: string; logs: string[] }>
  >({
    创作工作室: { status: '已停止', logs: [] },
    实验空间: { status: '已停止', logs: [] },
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [library, setLibrary] = useState<Model[]>(catalog.slice(1, 4))
  const [filters, setFilters] = useState<
    Record<string, { search: string; type: string }>
  >({})
  const [versions, setVersions] = useState(['v0.3.26'])
  const [defaultVersion, setDefaultVersion] = useState('v0.3.26')
  const [instanceVersions, setInstanceVersions] = useState<
    Record<string, string>
  >({ 创作工作室: 'v0.3.26', 实验空间: 'v0.3.26' })
  const [plugins, setPlugins] = useState<
    Record<string, Record<string, string>>
  >({
    创作工作室: {
      'ComfyUI Manager': '待更新',
      'ComfyUI Impact Pack': '已启用',
    },
    实验空间: {},
  })
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<{
    title: string
    text: string
    action?: () => void
  } | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [directory, setDirectory] = useState('/demo/ComfyUI/models')
  const [proxy, setProxy] = useState('')
  const [concurrency, setConcurrency] = useState('2 个任务')
  const [showLogs, setShowLogs] = useState(true)
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === '深色' || (theme === '跟随系统' && media.matches)
          ? 'dark'
          : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    try {
      localStorage.setItem('theme', theme)
    } catch {}
    return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.documentElement.dataset.liquid = String(liquid)
    try {
      localStorage.setItem('liquid', String(liquid))
    } catch {}
  }, [liquid])
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((list) =>
        list.map((task) =>
          task.phase === '排队'
            ? { ...task, phase: '下载中' }
            : task.phase === '下载中'
              ? {
                  ...task,
                  progress: Math.min(100, task.progress + 5),
                  phase: task.progress >= 95 ? '完成' : '下载中',
                }
              : task,
        ),
      )
      setInstances((all) =>
        Object.fromEntries(
          Object.entries(all).map(([name, state]) => [
            name,
            state.status === '启动中'
              ? {
                  status: '运行中',
                  logs: [
                    ...state.logs,
                    '[演示] 模型索引已加载',
                    '[演示] 服务已就绪 · 127.0.0.1:8188',
                  ],
                }
              : state,
          ]),
        ),
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const done = tasks.filter((t) => t.phase === '完成')
    if (done.length)
      setLibrary((list) => [
        ...list,
        ...done
          .filter((t) => !list.some((m) => m.id === t.id))
          .map(({ id, name, type, size, source }) => ({
            id,
            name,
            type,
            size,
            source,
          })),
      ])
  }, [tasks])
  useEffect(() => {
    if (dialog) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [dialog])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])
  const filter = filters[page] ?? { search: '', type: '全部类型' }
  const updateFilter = (value: Partial<typeof filter>) =>
    setFilters((all) => ({ ...all, [page]: { ...filter, ...value } }))
  const current = instances[instance]
  const changeInstance = (status: string, log: string) =>
    setInstances((all) => ({
      ...all,
      [instance]: {
        status,
        logs: [...all[instance].logs, `[演示] ${log}`].slice(-30),
      },
    }))
  const changeTask = (id: number, phase: Phase) =>
    setTasks((all) => all.map((t) => (t.id === id ? { ...t, phase } : t)))
  const changePlugin = (name: string, status: string) => {
    setPlugins((all) => ({
      ...all,
      [instance]: { ...all[instance], [name]: status },
    }))
    setNotice(`${name}：${status}（演示）`)
  }
  const toolbar = (
    <div className="toolbar">
      <input
        aria-label="搜索模型"
        placeholder="搜索模型名称、来源…"
        value={filter.search}
        onChange={(e) => updateFilter({ search: e.target.value })}
      />
      <Select
        label="模型类型"
        value={filter.type}
        options={['全部类型', 'Checkpoint', 'LoRA', 'VAE', 'ControlNet']}
        onChange={(type) => updateFilter({ type })}
      />
    </div>
  )
  const models = (page === '模型下载' ? catalog : library).filter(
    (m) =>
      `${m.name} ${m.source}`
        .toLowerCase()
        .includes(filter.search.toLowerCase()) &&
      (filter.type === '全部类型' || filter.type === m.type),
  )
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <span className="logo">C</span>
          <div>
            ComfyStdio<small>YOUR CREATIVE SPACE</small>
          </div>
        </div>
        <div className="nav-label">工作空间</div>
        <nav>
          {pages.slice(0, 5).map((name, i) => (
            <button
              key={name}
              className={page === name ? 'selected' : ''}
              onClick={() => setPage(name)}
            >
              <span>{symbols[i]}</span>
              {name}
              {name === '模型下载' &&
                tasks.some((t) => t.phase === '下载中') && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-indicator">
            <i /> 本地界面演示
          </div>
          <button
            className={page === '设置' ? 'selected' : ''}
            onClick={() => setPage('设置')}
          >
            ⚙ <span>设置</span>
          </button>
          <Select
            label="主题"
            value={theme}
            options={['浅色', '深色', '跟随系统']}
            onChange={setTheme}
          />
          <small>ComfyStdio · Preview 0.1</small>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <div className="eyebrow">
              WORKSPACE / {String(pages.indexOf(page) + 1).padStart(2, '0')}
            </div>
            <h1>{page}</h1>
            <p>{descriptions[pages.indexOf(page)]}</p>
          </div>
          <span className="badge">◌ 演示模式</span>
        </header>
        <section key={page} className="page">
          {page === '启动' && (
            <>
              <Card className="hero">
                <div>
                  <span className="eyebrow">READY WHEN YOU ARE</span>
                  <h2>创作，从这里出发。</h2>
                  <p>管理你的 ComfyUI 空间，让想象成为画面。</p>
                  <button
                    className="primary"
                    onClick={() =>
                      changeInstance('启动中', '正在准备运行环境…')
                    }
                    disabled={['启动中', '运行中'].includes(current.status)}
                  >
                    ▶ 启动当前实例
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  ◇<span>✦</span>
                </div>
              </Card>
              <div className="section-heading">
                <h2>
                  我的实例 <small>02</small>
                </h2>
                <span>示例环境 · 无需安装 ComfyUI</span>
              </div>
              <div className="grid">
                {Object.entries(instances).map(([name, state]) => (
                  <Card
                    key={name}
                    className={instance === name ? 'chosen' : ''}
                  >
                    <div className="card-top">
                      <span className="tile">◈</span>
                      <span
                        className={`badge ${state.status === '运行中' ? 'success' : state.status === '失败' ? 'danger' : ''}`}
                      >
                        {state.status}
                      </span>
                    </div>
                    <h3>{name}</h3>
                    <p>{instanceVersions[name]} · Python 3.12</p>
                    <code>
                      /demo/{name === '创作工作室' ? 'studio' : 'lab'}/ComfyUI
                    </code>
                    <div className="card-footer">
                      <span>
                        {instance === name ? '● 当前实例' : '独立工作空间'}
                      </span>
                      <button
                        onClick={() => setInstance(name)}
                        disabled={instance === name}
                      >
                        选择实例
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
              <Card>
                <div className="section-heading">
                  <h3>{instance} · 运行控制</h3>
                  <button onClick={() => setShowLogs(!showLogs)}>
                    {showLogs ? '收起日志' : '展开日志'}
                  </button>
                </div>
                <div className="actions">
                  <button
                    disabled={!['运行中', '启动中'].includes(current.status)}
                    onClick={() => changeInstance('已停止', '服务已停止')}
                  >
                    ■ 停止实例
                  </button>
                  <button
                    onClick={() =>
                      changeInstance('失败', '启动失败：示例端口被占用，请重试')
                    }
                  >
                    模拟启动失败
                  </button>
                  {current.status === '失败' && (
                    <button
                      className="primary"
                      onClick={() => changeInstance('启动中', '正在重新启动…')}
                    >
                      重试启动
                    </button>
                  )}
                </div>
                {showLogs && (
                  <pre aria-live="polite">
                    {current.logs.join('\n') || '[演示] 等待启动实例…'}
                  </pre>
                )}
              </Card>
            </>
          )}
          {(page === '模型下载' || page === '模型管理') && (
            <>
              {toolbar}
              <div className="grid">
                {models.map((model) => (
                  <Card key={model.id}>
                    <div className="card-top">
                      <span className={`model-art art-${model.id}`}>◈</span>
                      <span className="badge">{model.type}</span>
                    </div>
                    <h3>{model.name}</h3>
                    <p>{model.source}</p>
                    <div className="card-footer">
                      <span>{model.size} GB</span>
                      {page === '模型下载' ? (
                        <button
                          className="primary"
                          disabled={tasks.some((t) => t.id === model.id)}
                          onClick={() =>
                            setTasks((all) => [
                              ...all,
                              { ...model, phase: '排队', progress: 0 },
                            ])
                          }
                        >
                          {tasks.some((t) => t.id === model.id)
                            ? '已加入队列'
                            : '↓ 加入下载'}
                        </button>
                      ) : (
                        <div className="actions">
                          <button
                            onClick={() =>
                              setDialog({
                                title: model.name,
                                text: `类型：${model.type}\n大小：${model.size} GB\n来源：${model.source}\n示例路径：/demo/ComfyUI/models/${model.type.toLowerCase()}/${model.name}.safetensors`,
                              })
                            }
                          >
                            详情
                          </button>
                          <button
                            className="danger"
                            onClick={() =>
                              setDialog({
                                title: `移除 ${model.name}？`,
                                text: '仅从本次演示模型库移除，不会操作真实文件。',
                                action: () => {
                                  setLibrary((all) =>
                                    all.filter((m) => m.id !== model.id),
                                  )
                                  setTasks((all) =>
                                    all.filter((t) => t.id !== model.id),
                                  )
                                  setNotice('已从演示模型库移除')
                                },
                              })
                            }
                          >
                            移除
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              {models.length === 0 && (
                <div className="empty">
                  ◇
                  <h3>
                    {library.length === 0 && page === '模型管理'
                      ? '模型库还是空的'
                      : '没有找到匹配的模型'}
                  </h3>
                  <p>调整搜索条件，或前往模型下载添加模型。</p>
                </div>
              )}
              {page === '模型下载' && (
                <Card>
                  <div className="section-heading">
                    <h2>
                      下载队列 <small>{tasks.length}</small>
                    </h2>
                    <span>模拟传输 · 不使用网络</span>
                  </div>
                  {tasks.length === 0 && (
                    <p className="empty">
                      选择一个模型，开始你的第一次演示下载。
                    </p>
                  )}
                  {tasks.map((task) => (
                    <div className="task" key={task.id}>
                      <div className="section-heading">
                        <h3>{task.name}</h3>
                        <span className={task.phase === '失败' ? 'danger' : ''}>
                          {task.phase} · {task.progress}%
                        </span>
                      </div>
                      <progress
                        aria-label={`${task.name} 下载进度`}
                        value={task.progress}
                        max={100}
                      />
                      <div className="card-footer">
                        <span>
                          {((task.size * task.progress) / 100).toFixed(1)} /{' '}
                          {task.size} GB ·{' '}
                          {task.phase === '下载中'
                            ? `${(task.size * 1024 * 0.05).toFixed(0)} MB/s · 剩余 ${Math.ceil((100 - task.progress) / 5)} 秒`
                            : '—'}
                        </span>
                        <div className="actions">
                          {task.phase === '下载中' && (
                            <>
                              <button
                                onClick={() => changeTask(task.id, '暂停')}
                              >
                                暂停
                              </button>
                              <button
                                onClick={() => changeTask(task.id, '失败')}
                              >
                                模拟失败
                              </button>
                            </>
                          )}
                          {['暂停', '失败'].includes(task.phase) && (
                            <button
                              onClick={() => changeTask(task.id, '下载中')}
                            >
                              {task.phase === '失败' ? '重试' : '继续'}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setDialog({
                                title: `${task.phase === '完成' ? '清除记录' : '取消下载'}：${task.name}？`,
                                text: '此操作仅影响演示队列。',
                                action: () =>
                                  setTasks((all) =>
                                    all.filter((t) => t.id !== task.id),
                                  ),
                              })
                            }
                          >
                            {task.phase === '完成' ? '清除记录' : '取消'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}
          {page === 'ComfyUI 版本' && (
            <>
              <div className="info">
                默认版本用于后续新实例。当前实例：{instance} ·{' '}
                {instanceVersions[instance]}
              </div>
              <div className="grid">
                {['v0.3.26', 'v0.3.25', 'nightly'].map((version, i) => (
                  <Card key={version}>
                    <div className="card-top">
                      <span className="tile">◇</span>
                      <span className="badge">
                        {i === 2 ? '开发版' : '稳定版'}
                        {version === defaultVersion ? ' · 默认' : ''}
                      </span>
                    </div>
                    <h3>{version}</h3>
                    <p>示例发布日期 · 2025-04-{17 - i * 3}</p>
                    <p>
                      {versions.includes(version) ? '✓ 已安装' : '可供安装'}
                    </p>
                    <div className="actions">
                      {versions.includes(version) ? (
                        <>
                          <button
                            disabled={version === defaultVersion}
                            onClick={() => {
                              setDefaultVersion(version)
                              setNotice('默认版本已更新（演示）')
                            }}
                          >
                            设为默认
                          </button>
                          <button
                            disabled={instanceVersions[instance] === version}
                            onClick={() => {
                              if (
                                ['运行中', '启动中'].includes(current.status)
                              ) {
                                setNotice('请先停止当前实例，再切换版本')
                                return
                              }
                              setInstanceVersions((all) => ({
                                ...all,
                                [instance]: version,
                              }))
                              setNotice('实例版本已切换（演示）')
                            }}
                          >
                            切换版本
                          </button>
                          <button
                            className="danger"
                            onClick={() =>
                              setDialog({
                                title: `卸载 ${version}？`,
                                text: '默认版本或实例正在使用的版本不可卸载。此操作为演示。',
                                action: () => {
                                  if (
                                    version === defaultVersion ||
                                    Object.values(instanceVersions).includes(
                                      version,
                                    )
                                  )
                                    setNotice(
                                      '卸载失败：版本仍被使用，请先切换版本',
                                    )
                                  else
                                    setVersions((all) =>
                                      all.filter((v) => v !== version),
                                    )
                                },
                              })
                            }
                          >
                            卸载
                          </button>
                        </>
                      ) : (
                        <button
                          className="primary"
                          onClick={() => {
                            setVersions((all) => [...all, version])
                            setNotice(`${version} 安装完成（演示）`)
                          }}
                        >
                          安装版本
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
          {page === '插件' && (
            <>
              <div className="toolbar">
                <Select
                  label="插件所属实例"
                  value={instance}
                  options={Object.keys(instances)}
                  onChange={setInstance}
                />
                <input
                  aria-label="搜索插件"
                  placeholder="搜索自定义节点…"
                  value={filter.search}
                  onChange={(e) => updateFilter({ search: e.target.value })}
                />
              </div>
              <div className="grid">
                {[
                  'ComfyUI Manager',
                  'ComfyUI Impact Pack',
                  'ComfyUI Essentials',
                ]
                  .filter((name) =>
                    name.toLowerCase().includes(filter.search.toLowerCase()),
                  )
                  .map((name) => (
                    <Card key={name}>
                      <div className="card-top">
                        <span className="tile">⊞</span>
                        <span className="badge">
                          {plugins[instance][name] ?? '未安装'}
                        </span>
                      </div>
                      <h3>{name}</h3>
                      <p>
                        {plugins[instance][name] === '待更新'
                          ? 'v1.0 → v1.1 · 有可用更新'
                          : 'v1.1 · 自定义节点'}
                      </p>
                      <div className="actions">
                        {plugins[instance][name] ? (
                          <>
                            <button
                              onClick={() =>
                                changePlugin(
                                  name,
                                  plugins[instance][name] === '已禁用'
                                    ? '已启用'
                                    : '已禁用',
                                )
                              }
                            >
                              {plugins[instance][name] === '已禁用'
                                ? '启用'
                                : '禁用'}
                            </button>
                            {plugins[instance][name] === '待更新' && (
                              <button
                                className="primary"
                                onClick={() => changePlugin(name, '已启用')}
                              >
                                更新
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            className="primary"
                            onClick={() => changePlugin(name, '已启用')}
                          >
                            安装插件
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setNotice(
                              `${name} 操作失败（演示）：连接超时，请重试`,
                            )
                          }
                        >
                          模拟失败
                        </button>
                      </div>
                    </Card>
                  ))}
              </div>
              {![
                'ComfyUI Manager',
                'ComfyUI Impact Pack',
                'ComfyUI Essentials',
              ].some((n) =>
                n.toLowerCase().includes(filter.search.toLowerCase()),
              ) && (
                <div className="empty">没有匹配的插件，请调整搜索内容。</div>
              )}
              {Object.keys(plugins[instance]).length === 0 && (
                <div className="info">
                  此实例尚未安装插件，可从上方示例目录安装。
                </div>
              )}
            </>
          )}
          {page === '设置' && (
            <>
              <Card>
                <h2>外观</h2>
                <div className="setting">
                  <div>
                    <h3>界面主题</h3>
                    <p>主题偏好会在下次打开时恢复。</p>
                  </div>
                  <Select
                    label="界面主题"
                    value={theme}
                    options={['浅色', '深色', '跟随系统']}
                    onChange={setTheme}
                  />
                </div>
                <div className="setting">
                  <div>
                    <h3>液态效果</h3>
                    <p>为侧栏和弹层添加柔和的透明质感。</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={liquid}
                    aria-label="液态效果"
                    className={`switch ${liquid ? 'on' : ''}`}
                    onClick={() => setLiquid(!liquid)}
                  >
                    <span />
                  </button>
                </div>
              </Card>
              <Card>
                <h2>
                  下载与网络 <span className="badge">演示配置</span>
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setNotice('配置校验通过，仅保留于当前演示会话')
                  }}
                >
                  <label>
                    模型目录
                    <input
                      required
                      value={directory}
                      onChange={(e) => setDirectory(e.target.value)}
                      placeholder="/demo/ComfyUI/models"
                    />
                  </label>
                  {!directory.trim() && (
                    <p className="danger">请输入模型目录。</p>
                  )}
                  <label>并行下载任务</label>
                  <Select
                    label="并行下载任务"
                    value={concurrency}
                    options={['1 个任务', '2 个任务', '3 个任务']}
                    onChange={setConcurrency}
                  />
                  <label>
                    代理地址（可选）
                    <input
                      type="url"
                      pattern="https?://.*"
                      value={proxy}
                      onChange={(e) => setProxy(e.target.value)}
                      placeholder="http://127.0.0.1:7890"
                    />
                  </label>
                  <p>
                    支持 HTTP / HTTPS 地址。此处展示表单校验，不应用到演示下载。
                  </p>
                  <button className="primary" disabled={!directory.trim()}>
                    保存演示配置
                  </button>
                </form>
              </Card>
            </>
          )}
        </section>
        <footer>
          专注创作，其余交给工作空间。<span>所有业务操作均为模拟数据</span>
        </footer>
      </main>
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
      <dialog
        ref={dialogRef}
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDialog(null)
        }}
      >
        <h2>{dialog?.title}</h2>
        <p className="dialog-text">{dialog?.text}</p>
        <div className="actions">
          <button autoFocus onClick={() => setDialog(null)}>
            {dialog?.action ? '取消' : '关闭'}
          </button>
          {dialog?.action && (
            <button
              className="primary"
              onClick={() => {
                dialog.action?.()
                setDialog(null)
              }}
            >
              确认操作
            </button>
          )}
        </div>
      </dialog>
    </div>
  )
}
