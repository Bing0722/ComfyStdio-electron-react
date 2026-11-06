import { spawn, execFile, type ChildProcess } from 'node:child_process'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { get } from 'node:http'
import { StringDecoder } from 'node:string_decoder'
import { resolvePython } from './python.ts'
import type { RunMode, RuntimeSnapshot } from '../../shared/runtime-api'
export function logLevel(message: string): '信息' | '警告' | '异常' {
  if (/error|exception|traceback|failed|错误|异常/i.test(message)) return '异常'
  if (/warn|deprecated|警告/i.test(message)) return '警告'
  return '信息'
}
export class RuntimeService {
  state: RuntimeSnapshot = {
    status: '已停止',
    path: '',
    python: '',
    mode: 'API 服务',
    logs: [],
  }
  private child: ChildProcess | null = null
  private sequence = 0
  private serial: Promise<unknown> = Promise.resolve()
  private stopRequested = false
  private poll: ReturnType<typeof setInterval> | undefined
  private changed: (state: RuntimeSnapshot) => void
  private openUI: () => Promise<void>
  private port: number
  private environment: NodeJS.ProcessEnv
  constructor(
    changed: (state: RuntimeSnapshot) => void,
    openUI: () => Promise<void>,
    port = 8188,
    environment: NodeJS.ProcessEnv = {},
  ) {
    this.changed = changed
    this.openUI = openUI
    this.port = port
    this.environment = environment
  }
  get busy() {
    return !!this.child || ['启动中', '停止中'].includes(this.state.status)
  }
  log(message: string, source = '启动器') {
    this.state.logs.push({
      id: ++this.sequence,
      time: new Date().toISOString(),
      level: logLevel(message),
      source,
      message: message.slice(0, 16000),
    })
    this.state.logs = this.state.logs.slice(-1000)
    this.emit()
  }
  private emit() {
    this.changed({ ...this.state, logs: [...this.state.logs] })
  }
  private queue(job: () => Promise<void>) {
    const task = this.serial.then(job)
    this.serial = task.catch(() => {})
    return task
  }
  start(path: string, mode: RunMode, python?: string, portableCpu = false) {
    return this.queue(() => this.launch(path, mode, python, portableCpu))
  }
  restart(path: string, mode: RunMode, python?: string, portableCpu = false) {
    return this.queue(async () => {
      await this.terminate()
      await this.launch(path, mode, python, portableCpu)
    })
  }
  stop() {
    return this.queue(() => this.terminate())
  }
  private async launch(
    path: string,
    mode: RunMode,
    selected: string | undefined,
    portableCpu: boolean,
  ) {
    if (this.busy) throw new Error('ComfyUI 已在运行或正在切换状态')
    if (!['API 服务', '打开网页'].includes(mode))
      throw new Error('未知启动模式')
    this.state.status = '启动中'
    this.state.path = path
    this.state.mode = mode
    this.emit()
    try {
      await access(join(path, 'main.py'))
      await new Promise<void>((resolve, reject) => {
        const server = createServer()
        server.once('error', () =>
          reject(new Error('端口 8188 已被占用，请先关闭占用程序')),
        )
        server.listen(this.port, '127.0.0.1', () =>
          server.close(() => resolve()),
        )
      })
      const { executable: python, embedded } = await resolvePython(path, selected)
      this.state.python = python
      this.log(`启动 ${path} · ${mode} · Python: ${python}`)
      this.stopRequested = false
      const child = spawn(
        python,
        [
          '-u',
          ...(embedded ? ['-s'] : []),
          'main.py',
          '--listen',
          '127.0.0.1',
          '--port',
          String(this.port),
          '--disable-auto-launch',
          ...(embedded ? ['--windows-standalone-build'] : []),
          ...(embedded && portableCpu ? ['--cpu'] : []),
        ],
        {
          cwd: path,
          windowsHide: true,
          detached: process.platform !== 'win32',
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, ...this.environment, PYTHONUNBUFFERED: '1' },
        },
      )
      this.child = child
      for (const [stream, source] of [
        [child.stdout, 'stdout'],
        [child.stderr, 'stderr'],
      ] as const) {
        const decoder = new StringDecoder('utf8')
        let buffer = ''
        let traceback = false
        const line = (text: string) => {
          if (!text.trim()) return
          const cleaned = text.replace(/\x1b\[[0-9;]*m/g, '')
          traceback =
            /Traceback/.test(cleaned) || (traceback && /^\s/.test(cleaned))
          this.log(traceback ? `异常堆栈 · ${cleaned}` : cleaned, source)
        }
        stream?.on('data', (chunk) => {
          buffer += decoder.write(chunk)
          const lines = buffer.split(/\r?\n|\r/)
          buffer = lines.pop() ?? ''
          lines.forEach(line)
          if (buffer.length > 16000) {
            line(buffer)
            buffer = ''
          }
        })
        stream?.on('end', () => {
          buffer += decoder.end()
          line(buffer)
        })
      }
      child.on('error', (error) => this.log(`启动异常：${error.message}`))
      child.once('close', (code, signal) => {
        clearInterval(this.poll)
        this.poll = undefined
        this.child = null
        this.state.status = this.stopRequested ? '已停止' : '失败'
        this.log(
          this.stopRequested
            ? 'ComfyUI 已停止'
            : `进程异常退出 · code=${code} · signal=${signal ?? 'none'}`,
        )
      })
      let checking = false
      const began = Date.now()
      this.poll = setInterval(() => {
        if (checking || this.child !== child || this.state.status !== '启动中')
          return
        checking = true
        const request = get(
          `http://127.0.0.1:${this.port}/system_stats`,
          (response) => {
            const ready = response.statusCode === 200
            response.resume()
            if (
              ready &&
              this.child === child &&
              !this.stopRequested &&
              this.state.status === '启动中'
            ) {
              clearInterval(this.poll)
              this.poll = undefined
              this.state.status = '运行中'
              this.log('API 已就绪 · http://127.0.0.1:8188')
              if (mode === '打开网页')
                void this.openUI().catch((error) =>
                  this.log(`打开网页异常：${error.message}`),
                )
            }
          },
        )
        request.setTimeout(1000, () => request.destroy())
        request.on('error', () => {})
        request.on('close', () => {
          checking = false
        })
        if (Date.now() - began > 180000) {
          clearInterval(this.poll)
          this.poll = undefined
          this.log(
            '警告：启动超过三分钟，尚未确认 API 就绪，请检查日志并停止后重试',
          )
        }
      }, 500)
    } catch (error) {
      this.state.status = '失败'
      this.log(
        `启动异常：${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }
  private async terminate() {
    const child = this.child
    if (!child) return
    this.stopRequested = true
    this.state.status = '停止中'
    clearInterval(this.poll)
    this.emit()
    await new Promise<void>((resolve, reject) => {
      const signal = (force: boolean) => {
        if (!child.pid) return
        if (process.platform === 'win32')
          execFile(
            'taskkill',
            ['/pid', String(child.pid), '/T', ...(force ? ['/F'] : [])],
            { windowsHide: true },
            () => {},
          )
        else {
          try {
            process.kill(-child.pid, force ? 'SIGKILL' : 'SIGTERM')
          } catch {}
        }
      }
      const force = setTimeout(() => signal(true), 3000)
      const timeout = setTimeout(() => {
        clearTimeout(force)
        this.log('停止异常：进程未退出，请在系统任务管理器检查')
        reject(new Error('进程未退出'))
      }, 8000)
      child.once('close', () => {
        clearTimeout(force)
        clearTimeout(timeout)
        resolve()
      })
      signal(false)
    })
  }
}
