# AI-Logo 助手 (AI-Icon Master) 开发设计文档

## 1. 项目概述
本项目旨在开发一个**纯前端**的 AI Logo 处理工具，专为独立开发者设计。它解决 AI 生成 Logo 尺寸不标准、背景残留、位图缩放模糊等痛点，提供一键去背景、智能裁剪、多尺寸高清生成、SVG 矢量化及开发者资源打包功能。

## 2. 技术架构

### 2.1 技术栈选型
*   **核心框架**: `Vue 3` (Composition API) + `Vite`
    *   *理由*: 响应式数据绑定适合实时预览调整，Vite 构建速度快。
*   **UI 框架**: `Tailwind CSS`
    *   *理由*: 快速构建现代 UI，灵活定制，无冗余样式。
*   **AI 去背景**: `@imgly/background-removal`
    *   *理由*: 纯前端 WebAssembly 运行，保护用户隐私（图片不上传服务器），无需后端 GPU 成本。
*   **高质量缩放**: `Pica.js`
    *   *理由*: 提供 Lanczos3 算法，解决原生 Canvas `drawImage` 在大幅缩小时产生的锯齿和模糊问题。
*   **矢量化**: `ImageTracer.js` (或类似库)
    *   *理由*: 前端实现位图转 SVG 路径。
*   **打包下载**: `JSZip` + `FileSaver.js`
    *   *理由*: 浏览器端生成压缩包并触发下载。

### 2.2 架构模式
*   **Client-side Only (CSR)**: 所有计算逻辑（去背景、图像处理、打包）均在浏览器主线程或 Web Worker 中执行。无后端服务依赖，不仅降低运维成本，也符合“隐私安全”的产品卖点。

## 3. 核心模块设计

### 3.1 图像上传与预处理模块 (`UploadModule`)
*   **功能**:
    *   支持拖拽 (`Drag & Drop`) 和点击上传。
    *   文件校验：格式 (PNG, JPG, WEBP)，大小限制 (e.g., < 10MB)。
    *   **初步解析**: 读取文件为 `Image` 对象，获取原始宽高。

### 3.2 图像处理流水线 (`ImageProcessor`)
这是一个核心逻辑层，串联各个处理步骤：
1.  **背景移除 (Optional)**:
    *   输入: 原始 `Blob`
    *   处理: 调用 `@imgly/background-removal`
    *   输出: 透明背景 `ImageBitmap` / `Canvas`
2.  **智能裁剪与布局 (Smart Layout)**:
    *   **Trim**: 扫描 Canvas 像素，计算非透明像素的最小包围盒 (Bounding Box)，切除多余留白。
    *   **Square**: 将包围盒居中放置在一个正方形 Canvas 中。
    *   **Padding**: 根据用户设置的百分比 (0% - 50%)，调整 Logo 主体在正方形中的缩放比例。
    *   **Border Radius**: 可选，为图标添加圆角（常用于 App 图标）。
3.  **矢量化 (Vectorization)**:
    *   输入: 处理好的高分位图。
    *   处理: 调用 `ImageTracer.js`。
    *   输出: SVG XML 字符串。

### 3.3 预览与交互模块 (`PreviewDashboard`)
*   **实时预览**:
    *   主预览区：展示当前处理后的大图（512px 或 1024px）。
    *   网格预览区：展示实际应用尺寸 (16px, 32px, 48px, 128px)，验证小尺寸下的清晰度。
*   **配置面板**:
    *   开关：“移除背景”
    *   滑块：“内边距 (Padding)”
    *   滑块：“圆角 (Radius)”
    *   背景色切换：透明/白/黑/灰（用于检查抠图边缘）。
*   **场景模拟 (Contextual Preview)**:
    *   利用 CSS 绝对定位模拟 Chrome 浏览器插件栏、iOS 主屏幕等背景，将生成的图标叠加显示。

### 3.4 导出与打包模块 (`ExportManager`)
*   **生成策略**:
    *   根据预定义的 `SizeConfig` (见 4.1)，使用 `Pica.js` 从高分源图生成指定尺寸的 Blob。
*   **资源生成**:
    *   `manifest.json`: 根据生成的尺寸路径，动态生成 Chrome Extension Manifest V3 标准的 icons 字段。
*   **打包**:
    *   创建 Zip 实例。
    *   按目录结构 (`/chrome`, `/ios`, `/android`) 写入图片文件。
    *   写入 `manifest.json` 和 `icon.svg`。
    *   触发 `saveAs` 下载。

## 4. 数据结构

### 4.1 尺寸配置常量
```javascript
export const EXPORT_PRESETS = {
  chrome_extension: {
    folder: 'chrome-extension',
    sizes: [16, 32, 48, 128],
    format: 'png'
  },
  ios_app: {
    folder: 'ios-assets',
    sizes: [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024],
    format: 'png' // iOS 通常不带透明通道，需注意背景色处理
  },
  android_launcher: {
    folder: 'android-launcher',
    sizes: [36, 48, 72, 96, 144, 192, 512],
    format: 'png'
  },
  web_favicon: {
    folder: 'web',
    sizes: [16, 32, 192, 512],
    format: 'png' // 也可以生成 .ico
  }
};
```

## 5. 目录结构规划 (`src/`)

```text
src/
├── assets/             # 静态资源 (Logo, 演示图)
├── components/         # Vue 组件
│   ├── layout/         # 布局组件 (Header, Footer)
│   ├── upload/         # 上传相关
│   │   └── DropZone.vue
│   ├── editor/         # 编辑控制相关
│   │   ├── ControlPanel.vue   # 设置面板 (Padding, Radius)
│   │   └── PreviewCanvas.vue  # 主画布
│   ├── preview/        # 结果预览
│   │   ├── GridPreview.vue    # 多尺寸网格
│   │   └── ScenarioPreview.vue# 场景模拟
│   └── common/         # 通用 UI 组件 (Button, Slider)
├── composables/        # 组合式 API (Logic Hooks)
│   ├── useImageProcessor.ts   # 图像处理核心逻辑
│   ├── useBackgroundRemoval.ts# AI 抠图逻辑封装
│   └── useExport.ts           # 打包下载逻辑
├── utils/              # 工具函数
│   ├── pica-resizer.ts # Pica 封装
│   ├── vectorizer.ts   # ImageTracer 封装
│   └── manifest-gen.ts # Manifest 生成器
├── App.vue
└── main.ts
```

## 6. 开发步骤与里程碑

1.  **里程碑 1: 基础原型 (MVP)**
    *   搭建 Vue + Tailwind 环境。
    *   实现图片上传与 Canvas 显示。
    *   集成 `Pica.js` 实现基础的多尺寸生成与单图下载。
    *   *目标*: 能用，解决最基本的缩放模糊问题。

2.  **里程碑 2: 核心处理能力**
    *   集成 `@imgly/background-removal`，实现本地 AI 抠图。
    *   实现 Canvas 像素分析，完成“智能裁剪”与“Padding 调整”算法。
    *   *目标*: 解决 AI 生图背景和构图不佳的问题。

3.  **里程碑 3: 批量导出与矢量化**
    *   实现 `JSZip` 打包全套图标。
    *   实现 `manifest.json` 自动生成。
    *   集成矢量化库，尝试输出 SVG。
    *   *目标*: 完成一站式交付能力。

4.  **里程碑 4: UI/UX 优化**
    *   添加场景预览（Chrome 栏模拟）。
    *   加载状态优化（AI 模型加载进度条）。
    *   暗黑模式适配。
