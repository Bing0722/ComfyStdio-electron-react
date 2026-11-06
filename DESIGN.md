# 当前设计与验收（0.7.0）

## 产品行为

- 单一当前 ComfyUI，启动、日志、版本、模型、插件均基于真实目录。
- 移除所有演示入口与模拟成功流程。尚未实现的网络传输和资产修改明确标明未接入。
- 液态玻璃固定启用；仍支持浅色、深色、系统主题与减少动态效果。
- 侧栏主题箭头独立右对齐，展开时朝上；全局通知位于顶部中央。
- 资产按分类管理；禁用插件同时使用文字徽标、背景和强调线。

## 便携目录约束

Windows/Linux 根目录为可执行文件所在目录；macOS 为 `.app` 所在目录。开发根目录默认项目目录，测试可设置 `COMFYSTDIO_PORTABLE_ROOT`（仅开发模式生效）。Data 在 ready 前承接 Electron 配置、会话、缓存、临时目录与崩溃目录。不可写则提示退出，不静默回退系统用户目录。

Git 获取只能在根目录创建 ComfyUI，不再弹出目标选择。已有目录拒绝覆盖；失败/取消清理本次创建内容。当前目录和 Python 选择保存为内部相对路径或用户导入的外部绝对路径。系统驱动和第三方工具的所有外部行为不在便携隔离承诺内。

## 更新约束

固定访问本仓库 GitHub Releases。拒绝草稿、预发布、非法版本及不匹配平台的资产；只允许官方 release 下载 URL 和 SHA-256 摘要。读取元数据超时 20 秒，下载超时 10 分钟，包大小低于 1 GiB。下载到 Data/updates，校验完成前不产生可用包；下载失败清理 `.part`，保留旧的有效文件。

更新为手动覆盖式：先退出，再用更新包替换程序文件；保留 Data/ComfyUI。不自动执行下载内容、不报告已经安装。不存在 Release 时显示“暂未发布”，不显示“已是最新版”。

## 验收

- `npm run build`：类型检查与打包。
- `npm test`：真实目录扫描、读取取消/失败/过期、进程启动/重启/停止、API 就绪、日志、代理校验、便携路径与相对恢复、版本选择和下载摘要失败清理。
- 桌面：无演示文字/入口；液态旧偏好 false 仍固定开启；Electron 各数据路径位于 Data；实际官方版本检查；受控 release 响应验证更新下载与显示；真实 Git 获取固定到根目录 ComfyUI；重新打开恢复读取。
- ZIP：检查 Windows 包包含 exe 和 app.asar，不包含 Data/ComfyUI。Windows 原生运行及 GPU 推理需 Windows 真机，macOS 检查不能代替。

实现依据：[Electron app 路径](https://www.electronjs.org/docs/latest/api/app)、[electron-builder Windows ZIP 目标](https://www.electron.build/v26/docs/win/)。

2026-11-06 验证结果：构建及 18 项自动测试通过；实际官方更新接口返回暂无 Release；真实官方 ComfyUI 固定目录获取成功；受控更新响应的下载与 SHA-256 校验通过。Windows x64 ZIP 已生成并检查内容。实际打包的 macOS 应用整体移动后，当前 ComfyUI、主题、代理和 Data 路径恢复正常。Windows ZIP 尚未在 Windows 真机启动验证。
