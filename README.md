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

### 构建独立单文件 HTML

生成一个完全自包含的 standalone HTML 文件，所有 CSS、JS 都内联在其中：

```bash
pnpm build:standalone
```

构建完成后，在 `dist-standalone` 目录中会生成一个独立的 `index.html` 文件，可以直接在浏览器中打开使用。

**注意：**
- standalone HTML 文件包含所有 JavaScript 和 CSS（内联）
- 图片资源（如植物图片、地图瓦片）仍需要从服务器加载或使用在线服务
- 地图瓦片会使用在线服务（CartoDB、Esri），不依赖本地文件
- 生成的 HTML 文件较大（通常几 MB），但可以完全离线使用（除了地图瓦片）

## 🚀 部署

### GitHub Pages 部署

项目已配置 GitHub Actions 自动部署到 GitHub Pages。

**部署步骤：**

1. 在 GitHub 仓库设置中启用 GitHub Pages：
   - 进入仓库的 `Settings` → `Pages`
   - 在 `Source` 中选择 `GitHub Actions`

2. 推送代码到 `main` 或 `master` 分支：
   ```bash
   git push origin main
   ```

3. GitHub Actions 会自动构建并部署到 GitHub Pages

4. 访问地址：`https://<你的用户名>.github.io/<仓库名>/`

**注意：**
- 如果是 fork 的仓库，URL 使用的是**你的 GitHub 用户名**，不是原作者的
- 例如：如果你的用户名是 `yourname`，仓库名是 `Autumn_map`，则访问地址为 `https://yourname.github.io/Autumn_map/`
- base 路径会根据仓库名自动设置（例如：`/Autumn_map/`）
- 如果遇到资源文件 404 错误，检查 GitHub Pages 的 URL 路径是否与 base 配置匹配
- 如需手动设置 base 路径，可以在 workflow 中添加环境变量：`VITE_BASE_PATH=/your-path/`
- 确保 GitHub Pages 设置中使用 GitHub Actions 作为源
- 部署后可能需要几分钟才能生效

## 📝 功能特性

- 🗺️ 双图层地图（卫星影像 + 简约导航）
- 📱 响应式侧边栏（可折叠）
- 🌿 植物信息卡片展示
- 📍 实时GPS定位
- 🧭 路径导航功能
- 🎨 现代化UI设计

## 📚 参考文件

原始HTML版本保存在 `reference/` 文件夹中，包括：
- `index.html` - HTML基础示例
- `MAP_wa.html` - Leaflet入门示例
- `map_zju.html` - 早期版本
- `map_final.html` - 完整功能版本

## 📄 许可证

MIT



