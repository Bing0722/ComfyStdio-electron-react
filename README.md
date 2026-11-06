# ComfyStdio · Electron + React

当前开发版本：**0.8.18**。基于 Electron、React、TypeScript 和 Motion 的 ComfyUI 桌面管理程序，采用固定液态玻璃界面，只展示真实程序和本地资产。

## 文件夹便携版

下载 Windows 对应 ZIP，完整解压到一个可写文件夹，双击 `ComfyStdio.exe` 即可运行，无需安装器。不应只复制 exe；Electron 的 resources、DLL 等程序文件需要一起保留。

- `Data/`：配置、界面偏好、浏览器状态、缓存、临时文件、日志默认目录和更新包。
- `ComfyUI/` 保存官方源码，`ComfyUI_windows_portable/` 保存官方 Windows x64 便携包及内置 Python。两种程序可同时保存在应用旁。
- 更新或移动时，先关闭应用，保留 `Data`、`ComfyUI` 和 `ComfyUI_windows_portable`，移动整个文件夹。
- 原生目录选择仍可导入外部程序，但外部目录不会自动复制到便携文件夹。

详细步骤与边界见 [便携使用说明](PORTABLE.md)。系统驱动和操作系统自身配置仍由系统管理；外部 Python、Git 和第三方插件不能保证完全不写外部位置。

## 软件更新

“关于 → 检查软件更新”读取本项目 GitHub Releases 正式版本。只接受匹配系统/架构、含 SHA-256 摘要的便携 ZIP。下载完成且大小与摘要均匹配后，保存在 `Data/updates`；失败时删除未完成文件。未发布版本、网络失败和缺少平台包分别显示，不伪装为更新成功。

当前采用**下载后手动覆盖更新**：退出应用后解压新包覆盖程序文件，保留 `Data`、`ComfyUI` 和 `ComfyUI_windows_portable`；不会在线替换运行中的程序。

## 已接入功能与边界

- 一个 ComfyUI 工作目录：真实扫描版本、模型、插件，保存当前目录；目录内路径相对保存，移动后可恢复。
- 获取官方源码或 Windows x64 NVIDIA / CPU 便携包，也可同时获取两种版本并选中便携版。源码获取需要 Git。便携包使用 Windows 内置 tar 解压，解压前核对发布大小和 SHA-256。两种获取均使用程序代理。
- 启动、重启、停止：仅监听 `127.0.0.1:8188`。保存 API 服务／打开网页和仅使用 CPU 的选择。便携版默认使用内置 Python，也可为各程序目录指定解释器，路径保存在 `Data/python.json`。
- 运行日志：捕获 stdout/stderr、警告与异常，支持搜索、级别筛选和导出，保留本次会话最近 1000 条。
- 模型分类、明显的插件禁用标记、设备与 NVIDIA/CUDA 信息。
- 所有演示入口、模拟定时任务和预置资产已移除。模型下载、插件版本更新、ComfyUI 版本切换尚未接入；对应页面只读，不提供模拟成功按钮。
- 获取源码不会自动安装 Python/PyTorch；建议在 `ComfyUI/.venv` 内配置环境。常见模型库/Python 缓存重定向至 `Data/cache`。
- 目录扫描暂不解析 `extra_model_paths.yaml` 或跟随符号链接；发现这些情况会提示。

## 本地开发

使用 Node.js 22 LTS（至少 22.12）与 pnpm 10.28.0：

```sh
pnpm install --frozen-lockfile
pnpm run dev
pnpm test
pnpm run build
pnpm run package:win
```

`package:win` 生成 `release/ComfyStdio-0.8.18-win32-x64.zip`；`package:dir` 生成本机解包目录；`package` 生成本机 ZIP。开发模式的数据也在项目旁 `Data`，已被 Git 忽略。自动测试需要 Python 与本机临时端口。

`.github/workflows/portable.yml` 可手动生成各平台包；推送 `v*` 标签时在构建通过后发布 GitHub Release。普通 main 推送不会自动发布版本。

[协作规范](AGENTS.md) · [设计与验收](DESIGN.md) · [模块结构](ARCHITECTURE.md)

## 开发版本沿革

| 版本 | 内容 |
| --- | --- |
| 0.8.0 | 保存启动偏好和各目录的 Python，获取并启动官方 Windows 便携版 |
| 0.7.0 | 移除演示、固定液态界面、文件夹便携化、软件更新检查与校验下载 |
| 0.6.0 | 目录管理、模块代理、Windows 窗口；后续接入真实运行控制、独立日志和资产分类 |
| 0.5.0 | 官方 ComfyUI 获取与设备诊断 |
| 0.4.0 | 单 ComfyUI 上下文与本地扫描 |
| 0.3.0 | 自定义标题栏、液态玻璃和 Motion 动效 |
| 0.2.x | 早期交互原型与模块拆分（已移除模拟功能） |
| 0.1.x | 应用骨架 |

0.8.1 接入插件 HTTPS Git 安装、requirements.txt 依赖安装、启用和禁用。操作前须停止 ComfyUI，操作后自动重新读取目录。依赖安装使用当前程序的解释器。
