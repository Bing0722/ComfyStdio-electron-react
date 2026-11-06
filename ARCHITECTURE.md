# 模块结构

## 唯一 ComfyUI 上下文

`WorkspaceState.comfy` 只有一个可空对象，包含程序路径、版本、模型目录、插件目录及它们的内容。初始化为 `null`，读取成功才产生内容；不存在实例数组、实例选择器、默认版本或独立的全局模型库。

`read.phase` 区分未读取、读取中、就绪和失败。`ComfyGate` 包住五个业务页面，读取未就绪时只显示引导。每次请求携带递增 `requestId`，过期或已结束请求不能覆盖新上下文。

- 读取过程中隐藏旧内容并阻止业务操作；取消选择恢复之前上下文，失败清空旧内容，成功整体替换。
- 运行中、版本操作中及下载任务未结束时不能重新读取或更换目录。
- 版本切换和更新只变更当前程序版本，保留模型与插件，不创建第二份 ComfyUI。
- 下载任务记录 `comfyPath` 与 `targetPath`，不会随目录改变自动转移。
- 本地扫描结果与演示内容通过 `source` 区分。纯 reducer 禁止修改本地扫描资产、版本和插件；演示下载完成不会伪造成真实磁盘文件。

## 目录

```text
src/
├── main/
│   ├── index.ts                    # 创建窗口、注册能力
│   ├── application-menu.ts         # 应用菜单与编辑快捷键
│   ├── window-controls.ts          # 窗口控制 IPC
│   └── comfy/
│       ├── register-comfy.ts       # 原生目录选择、当前路径、固定读取 IPC
│       └── read-installation.ts    # 校验目录、读取版本与模型/插件元数据
├── preload/index.ts               # 只暴露固定能力，不暴露通用 IPC 或文件 API
├── shared/
│   ├── window-api.ts
│   └── comfy-api.ts                # 目录快照与读取协议
└── renderer/src/
    ├── app/                        # 页面映射、导航、Provider 组装
    ├── components/
    │   ├── layout/                 # 标题栏、侧栏、独立滚动内容区
    │   ├── motion/                 # 统一过渡、页面切换、折叠、浮层
    │   └── ui/                     # 卡片、按钮、开关、进度、弹窗等
    ├── features/
    │   ├── comfy/                  # 读取引导、当前上下文、启动页
    │   ├── models/                 # 模型库、演示下载、队列
    │   ├── versions/               # 当前程序版本与切换/更新演示
    │   ├── plugins/                # 当前程序插件
    │   └── settings/               # 外观偏好、派生模型目录、网络表单
    ├── state/                      # 类型、显式演示夹具、纯 reducer、React 适配
    └── styles/                     # 主题、基础样式、布局、玻璃、组件
```

## 读取边界

渲染进程只能请求 `chooseAndRead()` 和 `readCurrent()`。路径由系统目录选择器取得，重新读取仅使用主进程保存的当前路径；没有任意路径读取接口。仅所属窗口的主 frame 能调用。

扫描器只读取文件元数据和有限大小的版本描述文件，不导入或执行 Python，不启动 ComfyUI，不执行 Git，不访问网络，不修改程序目录。模型分类依据实际子目录；插件版本未知时显示未识别，不生成虚假的更新状态。跳过的符号链接、额外路径配置、权限错误及扫描上限都通过 `warnings` 返回。

主进程继续使用 `sandbox`、`contextIsolation`，关闭 `nodeIntegration`。本地路径及扫描内容不写入项目仓库。真实操作未来通过独立主进程能力接入，不能在页面/reducer 内执行。

## 状态与界面

`WorkspaceProvider` 在页面切换之外运行定时演示、读取请求及会话筛选。`PreferencesProvider` 只持久化外观；设置里的模型目录直接取自当前快照，不提供脱离 ComfyUI 的第二个目录配置。

`FeedbackProvider` 负责确认、通知和焦点恢复。`Surface` 使用 Motion value 更新反光，不在指针移动时触发 React 状态更新。布局、玻璃和业务模块相互独立。

## 验证

`npm test` 使用 Node 内置运行器验证纯状态转换，并在临时目录创建 ComfyUI 夹具验证真实扫描。夹具包含会抛异常的 Python 内容，扫描不执行它。`npm run build` 完成全项目类型检查与打包。桌面验收见 [设计文档](DESIGN.md)。

## 真实进程与日志

`main/runtime/service.ts` 持有唯一 Python 子进程并串行处理启动、重启和关闭；`register-runtime.ts` 限定当前根目录、原生 Python 选择与日志导出。固定启动参数为 `--listen 127.0.0.1 --port 8188 --disable-auto-launch`。API 模式不打开浏览器；`/system_stats` 响应后进入运行中，真实状态不受演示 tick 推进。主进程在读取和运行之间互锁。

stdout/stderr 经 UTF-8 分块解码，按行记录时间、来源与启发式级别；最多保留 1000 条，每条 16000 字符。重启不清空日志。`WorkspaceProvider.liveRuntime` 跨页面订阅快照，日志页在没有当前程序时也能查看已有记录。Unix 通过进程组停止，Windows 使用本应用创建的固定 PID 调用 taskkill；超时强制停止，失败保留停止中状态。应用退出会停止其管理的进程。

`ViewTabs` 为下载状态与模型分类提供按钮组。模型分类由常用类型与真实目录联合生成；未知目录保留自身名称。`PreferencesProvider` 现已持久化外观和模块代理配置。
