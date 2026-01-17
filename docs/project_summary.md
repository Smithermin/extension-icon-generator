# AI-Icon Master 项目总结与技术档案

**最后更新日期**: 2026年1月8日
**版本**: 1.0 (MVP Completed)

---

## 1. 项目概述 (Overview)

**AI-Icon Master** 是一个**纯前端**的图片处理工具，专为独立开发者设计。它致力于解决由 Midjourney、Stable Diffusion 等 AI 工具生成的 Logo 图片无法直接用于生产环境的痛点。

**核心价值**：将非标准的 AI 生成图，一键转换为符合 Chrome 扩展、iOS App、Android Launcher 等多平台规范的高清图标包。

**主要特性**：
*   🛡️ **隐私安全**：所有处理（AI抠图、缩放、打包）均在浏览器本地完成，无服务器上传。
*   ⚡ **一站式工作流**：裁剪 -> 抠图 -> 排版 -> 预览 -> 打包。
*   🎨 **所见即所得**：提供真实的场景模拟（Chrome 栏、iOS 桌面）。

---

## 2. 功能需求与实现状态 (Features Status)

| 模块 | 功能点 | 状态 | 说明 |
| :--- | :--- | :--- | :--- |
| **输入** | 拖拽/点击上传 | ✅ | 支持 PNG, JPG, WEBP |
| | **样例试用** | ✅ | 内置 SVG 示例，一键体验 |
| **裁剪** | **手动裁剪 (Cropper)** | ✅ | 集成 `cropperjs`，支持 1:1, 16:9, 自由比例 |
| | 小图自适应优化 | ✅ | 智能识别小尺寸图片，强制拉伸填满编辑区，便于操作 |
| | 交互优化 | ✅ | 支持鼠标滚轮缩放，提供“重置”功能 |
| **处理** | **AI 智能抠图** | ✅ | 使用 `@imgly/background-removal` (WASM) |
| | 智能排版 (Layout) | ✅ | 基于 Canvas 实现 Padding (内边距)、圆角 (Radius)、背景色调整 |
| | 智能裁剪 (Trim) | ✅ | 自动识别透明像素边界 (算法实现) |
| **预览** | 实时画布 | ✅ | 512px/1024px 高清实时预览 |
| | **场景模拟** | ✅ | 模拟 Chrome 扩展栏 (16px) 和 iOS 主屏幕效果 |
| **导出** | **批量生成** | ✅ | 自动生成 Chrome (16/32/48/128), iOS, Android 全套尺寸 |
| | 矢量化 (SVG) | ✅ | 集成 `imagetracerjs` 将位图转为 SVG |
| | Manifest 生成 | ✅ | 针对 Chrome 扩展自动生成 `manifest.json` 片段 |
| | 自定义导出 | ✅ | 支持勾选需要的平台（如只导出 iOS 或 Chrome） |
| | ZIP 打包下载 | ✅ | 使用 `JSZip` 打包所有资源 |

---

## 3. 技术架构 (Technical Architecture)

### 3.1 技术栈
*   **核心框架**: `Vue 3` (Composition API) + `TypeScript` + `Vite`
*   **样式库**: `Tailwind CSS`
*   **核心依赖库**:
    *   `cropperjs` (v1.6.2): 图片裁剪引擎。
    *   `@imgly/background-removal`: 本地 AI 背景移除。
    *   `pica`: 高质量图像缩放 (Lanczos3 算法)，避免 Canvas 原生缩放锯齿。
    *   `jszip` / `file-saver`: 前端压缩打包与下载。
    *   `imagetracerjs`: 位图转矢量图 (SVG)。

### 3.2 目录结构
```text
src/
├── components/
│   ├── preview/
│   │   └── ScenarioPreview.vue    # [组件] 场景模拟 (Chrome/iOS)
│   ├── upload/
│   │   ├── DropZone.vue           # [组件] 文件上传区域
│   │   └── ImageCropperModal.vue  # [组件] 裁剪弹窗 (含样式覆盖)
├── composables/
│   ├── useBackgroundRemoval.ts    # [Logic] AI 抠图逻辑封装
│   ├── useImageProcessor.ts       # [Logic] Canvas 绘图、Padding、圆角计算
│   └── useExport.ts               # [Logic] 批量尺寸生成、Zip 打包、Manifest 生成
├── config/
│   └── export-presets.ts          # [配置] 各平台图标尺寸定义
├── utils/
│   ├── pica-resizer.ts            # [工具] Pica 缩放封装
│   └── vectorizer.ts              # [工具] ImageTracer 转换封装
├── App.vue                        # 主应用入口 (状态管理与视图组装)
└── main.ts
```

---

## 4. 关键实现细节 (Key Implementation Details)

### A. 小图片裁剪优化
在 `ImageCropperModal.vue` 中，为了解决小尺寸图片（如 16x16）在裁剪框中显示过小的问题，实现了以下逻辑：
1.  **容器强制铺满**: 外层 `div` 设置 `w-full h-full` (限制高度 60vh)。
2.  **样式重置**: 针对小图 (`naturalWidth < 600`)，动态设置 `img.style.width = '100%'` 或 `height: 100%`，利用 `object-fit` 的思路强制拉伸图片元素，使 `Cropper.js` 能在放大的画布上工作。
3.  **背景去噪**: 覆盖了 `.cropper-bg` 样式，去除了默认的马赛克背景，保持 UI 简洁。

### B. AI 抠图与 Canvas 管道
处理流程是一个串行管道：
1.  **Source**: 获取原始文件或裁剪后的 Blob。
2.  **Background Removal (Optional)**: 如果开启，调用 AI 模型生成透明 PNG。
3.  **Processing**:
    *   创建一个临时 Canvas。
    *   **Trim**: 扫描 Alpha 通道，计算最小包围盒，切除多余空白。
    *   **Layout**: 将 Trim 后的图像绘制到正方形 Canvas 中心，根据 `padding` 参数缩放，根据 `borderRadius` 绘制蒙版。
4.  **Output**: 生成最终的 DataURL 用于预览。

### C. 批量导出逻辑
`useExport.ts` 遍历 `EXPORT_PRESETS` 配置：
1.  根据用户勾选的平台 ID 过滤预设。
2.  使用 `Pica` 库的高质量重采样算法，基于**处理后的大图**生成各尺寸 Blob。
3.  对于 Chrome 扩展，额外生成 JSON 字符串。
4.  对于 SVG，使用 `imagetracerjs` 追踪路径。
5.  最后统一压入 ZIP 包。

---

## 5. 待优化项 (Future Todo)

1.  **PWA 支持**: 配置 Vite PWA 插件，使应用可离线运行。
2.  **更多预设**: 添加 macOS App, Windows ICO, PWA Maskable Icon 等预设。
3.  **ICO 格式支持**: 目前 Web Favicon 仅导出 PNG，可增加 `.ico` 生成。
4.  **性能优化**: AI 模型较大（~100MB），可考虑 Service Worker 缓存策略优化首次加载。

---

*此文档旨在帮助开发者快速理解项目全貌与核心逻辑。*
