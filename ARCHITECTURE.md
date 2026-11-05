# 渲染进程模块结构

应用入口只组装依赖与页面。页面按业务拆分，共享组件不承载业务状态，模拟状态转换不依赖 React 或浏览器 API。

```text
src/renderer/src/
├── main.tsx                       # 挂载应用、加载公共样式
├── app/
│   ├── App.tsx                    # 页面映射与切换
│   ├── AppProviders.tsx           # 组装状态、偏好与反馈 Provider
│   └── navigation.ts              # 导航名称、图标与简短说明
├── components/
│   ├── layout/                    # 自定义标题栏、固定侧栏、独立滚动内容区
│   ├── motion/                    # 过渡参数、页面切换、折叠与浮层动画
│   └── ui/                        # Surface、按钮、开关、进度条、下拉、弹窗与通知
├── features/
│   ├── instances/                 # 启动页、实例选择、实例专有样式
│   ├── models/                    # 下载页、模型库、共享模型列表与队列
│   ├── versions/                  # 安装、默认版本、切换和卸载
│   ├── plugins/                   # 按实例管理插件
│   └── settings/                  # 配置页、外观偏好与持久化
├── state/
│   ├── types.ts                   # 领域类型与动作协议
│   ├── demo-data.ts               # 示例目录与初始数据工厂
│   ├── workspace-reducer.ts       # 纯函数状态转换与业务保护
│   └── WorkspaceProvider.tsx      # React 状态适配、定时模拟、会话筛选
└── styles/
    ├── tokens.css                 # 明暗主题颜色、字体变量
    ├── base.css                   # 原生元素、焦点、减少动态效果
    ├── layout.css                 # 应用框架与响应式布局
    ├── glass.css                  # 液态玻璃材质、环境光和反光层
    └── components.css             # 公共列表、按钮、菜单、弹窗
```

## 数据流和边界

- 页面通过 `useWorkspace()` 读取状态、发送有类型约束的动作；不直接修改其他页面的数据。
- `workspaceReducer` 集中维护跨业务约束，例如下载完成入库、版本使用保护与实例隔离。没有活动任务时，定时 tick 保留原状态引用。
- `WorkspaceProvider` 位于页面切换之外，下载任务、实例状态和 `useSessionFilter()` 的搜索条件在导航后继续保留。
- `PreferencesProvider` 负责系统主题订阅、主题与液态外观的本地存储，以及本次会话的配置表单。只有外观偏好持久化。
- `FeedbackProvider` 管理通知和原生模态弹窗，包括确认动作、Esc 关闭、焦点返回。页面不各自复制弹窗实现。
- 模型下载和模型管理复用 `ModelFilters`、`ModelList`；下载队列单独维护呈现。版本页和插件页复用 `InstancePicker`。
- `Surface` 读取外观偏好，以 Motion value 更新反光坐标，不在指针移动时触发 React 状态渲染；`Button`、`Switch` 和 `Progress` 复用 Motion 动效。
- `components/ui/` 不导入业务数据。业务专用样式与页面放在同一 feature 中；全局颜色仅来自主题变量。

真实 ComfyUI 接入仍未开始。后续文件、网络与进程操作应放在 `src/main/`，通过 preload 的窄范围接口传递结果，不在页面或 reducer 内直接执行。

## 验证

`npm test` 使用 Node 内置测试运行器执行纯状态回归，无额外测试依赖。覆盖下载暂停/失败/恢复/入库/移除、实例停止和重试、版本保护，以及插件启用状态与更新提示相互独立。`npm run build` 执行全项目类型检查及构建；界面按 [设计与验收](DESIGN.md) 在 Electron 中检查。

## 桌面窗口边界

- `src/main/application-menu.ts` 配置精简应用菜单，并处理 Cmd/Ctrl+A/C/X/V/Z/Y 等编辑快捷键。
- `src/main/window-controls.ts` 注册固定的最小化、最大化/还原、关闭、状态读取/订阅通道，仅处理所属窗口主 frame 的消息。
- `src/preload/index.ts` 通过 `contextBridge` 暴露 `windowControls`，不暴露 ipcRenderer、任意通道或 Node API。
- `src/shared/window-api.ts` 定义窗口接口；`TitleBar` 只调用该接口。macOS 使用原生交通灯，Windows/Linux 使用自定义窗口按钮。
- `contextIsolation` 和 `sandbox` 保持开启，`nodeIntegration` 保持关闭。玻璃效果只作用于应用内部，未读取桌面壁纸或其他窗口。
