# ComfyStdio · Electron + React

ComfyStdio 启动器的当前开发主线，使用 Electron、React、TypeScript 和 electron-vite。

## 本地开发

在本目录使用 Node.js 22 LTS（至少 22.12）和 npm。

```sh
npm ci
npm run dev
```

运行 `npm run typecheck` 检查类型，运行 `npm run build` 构建桌面应用代码。

`src/main/` 管理 Electron 窗口，`src/renderer/` 存放 React 界面。第一阶段是导入已有 ComfyUI 实例、启动和显示实时日志。随后接入代理和模型下载、模型管理与自定义节点安装。

[协作规范](AGENTS.md) · [设计与验收](DESIGN.md)

[项目总览与验收场景](https://github.com/Bing0722/ComfyStdio)
