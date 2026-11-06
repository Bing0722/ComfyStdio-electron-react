# 模块结构

## 主进程

- `portable/paths.ts`：按 exe 所在文件夹定位根目录；macOS 使用 `.app` 所在文件夹。创建 Data 子目录和受管理的 ComfyUI 目标位置。
- `portable/bootstrap.ts`：在 app ready 前设置 appData、userData、sessionData、temp、logs、crashDumps 与 Chromium disk cache；不可写时拒绝启动，不回退用户目录。
- `portable/state.ts`：持久化当前 ComfyUI，内部路径相对存储；外部导入路径保留绝对路径。
- `comfy/`：原生目录读取、只读资产扫描、官方仓库获取。获取固定使用便携根目录；读取和运行互锁。
- `runtime/`：唯一 Python 子进程、串行运行操作、API 就绪检测、标准输出日志。Python 选择保存在 Data。常用 Python/模型缓存环境重定向到 Data；最后窗口关闭或退出应用会停止拥有的进程树。
- `updates/`：固定 GitHub Release 源、稳定版本比较、平台资产选择、流式下载与大小/SHA-256 校验。只保存更新包，不执行或自动替换应用。
- `device/`：系统硬件与工具信息读取。

主进程操作由 `shared/` 中的窄接口通过 preload 暴露。渲染进程不访问文件、子进程或任意 IPC。

## 渲染进程

`WorkspaceProvider` 只管理真实读取与进程快照，没有模拟定时器、模拟资产或模拟动作。启动时尝试恢复已保存目录；取消保留当前上下文，失败不显示旧资产，过期响应不能覆盖当前读取。

`PreferencesProvider` 将偏好保存在 Chromium 本地存储，其物理目录由主进程定位到 Data。液态效果固定为开启，浅色/深色/系统主题仍可选。页面结构按 `features/` 划分，模型分类由常用类型与实际目录联合生成。

尚未接入的模型下载、插件安装/更新和版本切换仅展示真实读取结果与能力说明，不修改数据或显示模拟成功。旧 `demo-data.ts`、下载模拟队列和模拟 reducer 已删除。

## 打包与更新

electron-builder 使用 ZIP 目标，不使用安装器或临时自解压的单 exe 目标。只包含构建输出、生产依赖与便携说明；Data、ComfyUI、凭据和开发文件不进入发布包。Windows/macOS/Linux 的包名包含应用版本、平台与架构，更新器按同一规则筛选。

更新包位于 Data/updates。部分下载使用 `.part`，大小和 SHA-256 校验后才替换为最终文件；失败不影响已有已校验包。用户退出程序后手动覆盖程序文件，保留 Data 和 ComfyUI。
