import { execFile } from 'node:child_process'
import { cpus, totalmem, freemem, platform, release, arch } from 'node:os'
import type { DeviceReport } from '../../shared/device-api'
const missing = '未检测到（可能未安装或不在 PATH 中）'
export function command(file: string, args: string[]): Promise<string> {
  return new Promise((resolve) =>
    execFile(
      file,
      args,
      { windowsHide: true, timeout: 10_000, maxBuffer: 2 * 1024 * 1024 },
      (error, stdout, stderr) =>
        resolve(error ? '' : (stdout || stderr).trim()),
    ),
  )
}
export function parseNvidia(csv: string): DeviceReport['nvidia'] {
  return csv
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      const [name, driver, memory] = line.split(',').map((part) => part.trim())
      return name && driver && memory
        ? [{ name, driver, memory: `${memory} MiB` }]
        : []
    })
}
export async function readDevice(appVersion: string): Promise<DeviceReport> {
  const [csv, smi, nvcc, python3, git, display] = await Promise.all([
    command('nvidia-smi', [
      '--query-gpu=name,driver_version,memory.total',
      '--format=csv,noheader,nounits',
    ]),
    command('nvidia-smi', []),
    command('nvcc', ['--version']),
    command('python3', ['--version']),
    command('git', ['--version']),
    platform() === 'darwin'
      ? command('/usr/sbin/system_profiler', ['SPDisplaysDataType', '-json'])
      : Promise.resolve(''),
  ])
  let graphics: string[] = []
  try {
    graphics = (JSON.parse(display).SPDisplaysDataType ?? [])
      .map((gpu: { sppci_model?: string }) => gpu.sppci_model)
      .filter(Boolean)
  } catch {
    /* Optional macOS probe. */
  }
  const nvidia = parseNvidia(csv)
  if (!graphics.length) graphics = nvidia.map((gpu) => gpu.name)
  const python = python3 || (await command('python', ['--version']))
  return {
    system: `${platform()} ${release()} · ${arch()}`,
    cpu: `${cpus()[0]?.model ?? '未知'} · ${cpus().length} 逻辑核心`,
    memory: `${(totalmem() / 1024 ** 3).toFixed(1)} GB · 当前空闲 ${(freemem() / 1024 ** 3).toFixed(1)} GB`,
    graphics,
    nvidia,
    cudaDriver: smi.match(/CUDA Version:\s*([\d.]+)/)?.[1] ?? missing,
    cudaToolkit: nvcc.match(/release\s+([\d.]+)/)?.[1] ?? missing,
    python: python || missing,
    git: git || missing,
    app: appVersion,
    checkedAt: new Date().toISOString(),
  }
}
