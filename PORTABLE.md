# ComfyStdio 文件夹便携版

1. 下载对应系统和架构的 ZIP，先完整解压到一个可写文件夹。
2. Windows 双击 ComfyStdio.exe；macOS 打开同目录下 ComfyStdio.app；Linux 运行目录内程序。不要在压缩包或只读磁盘映像内运行。
3. 配置、浏览器状态、缓存、临时文件、日志导出默认位置与更新包保存在程序旁的 Data 文件夹。
4. 点击“获取 ComfyUI”后，官方源码固定存放在程序旁的 ComfyUI 文件夹，不再选择下载位置。已有目录不会覆盖，可使用“选择并读取”导入。
5. ComfyUI 的模型、插件、输入、输出和默认用户数据跟随 ComfyUI 目录。建议 Python 虚拟环境也建立在 ComfyUI/.venv 内；Python/PyTorch 等依赖需要自行配置。

```text
ComfyStdio/
  ComfyStdio.exe        # 或 .app / Linux 可执行程序
  resources/           # 应用文件，请勿单独移动 exe
  Data/                # 配置、缓存、日志、临时文件、更新包
  ComfyUI/             # 获取后生成；包含 models、custom_nodes、user 等
```

## 移动与更新

先关闭程序，再移动整个文件夹。目录内的当前 ComfyUI 以相对路径保存，移动后仍可恢复；手动选择的外部目录不会被复制进来，也不具备随包移动能力。

“关于 → 检查软件更新”访问本项目 GitHub Releases；发现匹配系统的便携包后可下载并校验。下载到 Data/updates 后，退出程序，将新 ZIP 解压的程序文件覆盖到旧文件夹。保留 Data 和 ComfyUI。不要把整个旧文件夹删除。更新包不包含这两个目录，不会自动覆盖个人内容。

## 边界

这里的“便携”指本软件管理的数据位于同一文件夹，不是隔离操作系统。系统驱动、系统临时记录、操作系统自身日志仍由系统管理。所选外部 Python、Git 以及第三方插件也可能有自己的系统配置；应用会将常用 Python/模型库缓存重定向到 Data，但不能承诺第三方代码不写其他位置。为了保留便携性，请将运行环境和模型放在本文件夹内。
