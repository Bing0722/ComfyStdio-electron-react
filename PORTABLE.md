# ComfyStdio 文件夹便携版

1. 下载对应系统和架构的 ZIP，先完整解压到一个可写文件夹。
2. Windows 双击 ComfyStdio.exe；macOS 打开同目录下 ComfyStdio.app；Linux 运行目录内程序。不要在压缩包或只读磁盘映像内运行。
3. 配置、浏览器状态、缓存、临时文件、日志导出默认位置与更新包保存在程序旁的 Data 文件夹。
4. “获取或使用源码”将官方源码放在程序旁的 `ComfyUI`，需要 Git，并需自行配置 Python 及依赖。已有程序也可通过“选择并读取”导入。
5. Windows x64 可选择“获取或使用便携版（含 Python）”。程序下载并校验官方 NVIDIA / CPU 包，用 Windows 内置 tar 解压到 `ComfyUI_windows_portable`。没有兼容 NVIDIA GPU 时，在启动页开启“仅使用 CPU”。[官方便携版说明](https://docs.comfy.org/installation/comfyui_portable_windows)
6. “同时获取两种版本”会并行获取源码和便携版，两者都就绪后选中便携版。之后可通过启动页的获取入口切换到已存在的版本。模型、插件、输入、输出和默认用户数据跟随各自的程序目录。

```text
ComfyStdio/
  ComfyStdio.exe        # 或 .app / Linux 可执行程序
  resources/           # 应用文件，请勿单独移动 exe
  Data/                # 配置、缓存、日志、临时文件、更新包
  ComfyUI/             # Git 获取的源码
  ComfyUI_windows_portable/
    ComfyUI/           # 便携版程序和资产
    python_embeded/    # 便携版自带的 Python
```

## 移动与更新

先关闭程序，再移动整个文件夹。目录内的当前 ComfyUI 以相对路径保存，移动后仍可恢复；手动选择的外部目录不会被复制进来，也不具备随包移动能力。

“关于 → 检查软件更新”访问本项目 GitHub Releases；发现匹配系统的便携包后可下载并校验。下载到 Data/updates 后，退出程序，将新 ZIP 解压的程序文件覆盖到旧文件夹。保留 Data、ComfyUI 和 ComfyUI_windows_portable。更新包只包含应用程序文件。

## 边界

这里的“便携”指本软件管理的数据位于同一文件夹，不是隔离操作系统。系统驱动、系统临时记录、操作系统自身日志仍由系统管理。所选外部 Python、Git 以及第三方插件也可能有自己的系统配置；应用会将常用 Python/模型库缓存重定向到 Data，但不能承诺第三方代码不写其他位置。为了保留便携性，请将运行环境和模型放在本文件夹内。
