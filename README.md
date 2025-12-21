# 浙江大学紫金港校区 · 秋季植物地图

一个基于 React + TypeScript + MapLibre GL 的交互式校园植物地图应用。

## 🚀 技术栈

- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **MapLibre GL** - 地图库（开源替代 Mapbox）
- **Zustand** - 轻量级状态管理
- **pnpm** - 包管理器

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── Map/            # 地图相关组件
│   ├── Plants/         # 植物相关组件
│   └── UI/             # 通用UI组件
├── contexts/           # React Context
├── data/               # 数据文件
├── hooks/              # 自定义Hooks
├── stores/             # Zustand状态管理
├── types/              # TypeScript类型定义
└── utils/              # 工具函数
```

## 🛠️ 开发

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### 预加载本地地图瓦片

为了提高地图加载速度，紫金港校区的地图瓦片已预加载并提交到 git：

```bash
pnpm preload-tiles
```

这将下载紫金港校区区域的地图瓦片（zoom 15-16）到 `public/map-tiles` 目录。

**重要**：
- 紫金港校区的瓦片（zoom 15-16）**已提交到 git**，可以直接从 GitHub 加载
- 地图会优先从 GitHub 加载瓦片，无需从在线 API 调用
- 如果使用 GitHub Pages 部署，瓦片会自动从 GitHub 加载，速度更快
- 其他区域的瓦片不会提交到 git（文件较大）

## 📝 功能特性

- 🗺️ 双图层地图（卫星影像 + 简约导航）
- 📱 响应式侧边栏（可折叠）
- 🌿 植物信息卡片展示
- 📍 实时GPS定位
- 🧭 路径导航功能
- 🎨 现代化UI设计
- ⚡ 本地地图瓦片缓存（可选，提升加载速度）

## 📚 参考文件

原始HTML版本保存在 `reference/` 文件夹中，包括：
- `index.html` - HTML基础示例
- `MAP_wa.html` - Leaflet入门示例
- `map_zju.html` - 早期版本
- `map_final.html` - 完整功能版本

## 📄 许可证

MIT



