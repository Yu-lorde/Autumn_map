# 地图瓦片目录

## 概述

此目录包含浙大紫金港校区的地图瓦片文件。紫金港校区的瓦片（zoom 15-16）已提交到 git，可以直接从 GitHub 加载，无需从在线 API 调用。

## 目录结构

```
map-tiles/
├── light/          # 简约导航图层
│   ├── 15/        # zoom 15 级别（已提交到 git）
│   └── 16/        # zoom 16 级别（已提交到 git）
└── satellite/     # 卫星影像图层
    ├── 15/        # zoom 15 级别（已提交到 git）
    └── 16/        # zoom 16 级别（已提交到 git）
```

## 瓦片文件命名规则

- Light 图层：`{z}/{x}/{y}.png`
- Satellite 图层：`{z}/{x}/{y}.jpg`

例如：`light/15/28960/13550.png`

## 使用方法

### 1. 预加载瓦片

运行预加载脚本下载紫金港校区的瓦片：

```bash
pnpm preload-tiles
```

### 2. 提交到 Git

紫金港校区的瓦片（zoom 15-16）会自动提交到 git：

```bash
git add public/map-tiles/light/15/
git add public/map-tiles/light/16/
git add public/map-tiles/satellite/15/
git add public/map-tiles/satellite/16/
git commit -m "添加紫金港校区地图瓦片"
```

### 3. 从 GitHub 加载

地图会自动优先从以下位置加载瓦片：

1. **相对路径**（GitHub Pages 或本地开发）：`/map-tiles/{type}/{z}/{x}/{y}.{ext}`
2. **GitHub raw 内容**（如果需要）：`https://raw.githubusercontent.com/{owner}/{repo}/{branch}/public/map-tiles/{type}/{z}/{x}/{y}.{ext}`
3. **在线 API**（作为最后备选）

## 注意事项

- 只有紫金港校区的瓦片（zoom 15-16）会提交到 git
- 其他区域的瓦片不会提交（文件较大）
- 如果使用 GitHub Pages 部署，瓦片会自动从 GitHub 加载
- 如果使用其他部署方式，可能需要配置 GitHub raw URL

## 更新瓦片

如果需要更新瓦片：

1. 删除旧的瓦片文件
2. 运行 `pnpm preload-tiles` 重新下载
3. 提交更新到 git
