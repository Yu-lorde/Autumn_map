# 预加载浙大紫金港校区地图瓦片脚本说明

## 概述
此脚本用于预加载浙大紫金港校区区域的地图瓦片，将其保存到本地 `public/map-tiles` 目录。

## 使用方法

### 方法 1: 使用 Node.js 脚本（推荐）

创建一个 Node.js 脚本来下载瓦片：

```javascript
// scripts/preload-zju-tiles.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const ZJU_BOUNDS = {
  sw: [30.2950, 120.0700],
  ne: [30.3200, 120.0950]
};

function latToTile(lat, z) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
}

function lngToTile(lng, z) {
  return Math.floor((lng + 180) / 360 * Math.pow(2, z));
}

function downloadTile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

async function preloadTiles(zoom = 15, type = 'light') {
  const { sw, ne } = ZJU_BOUNDS;
  const minX = lngToTile(sw[1], zoom);
  const maxX = lngToTile(ne[1], zoom);
  const minY = latToTile(ne[0], zoom);
  const maxY = latToTile(sw[0], zoom);

  const baseDir = path.join(__dirname, '..', 'public', 'map-tiles', type);
  
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const tileDir = path.join(baseDir, String(zoom), String(x));
      fs.mkdirSync(tileDir, { recursive: true });
      
      const ext = type === 'light' ? 'png' : 'jpg';
      const filepath = path.join(tileDir, `${y}.${ext}`);
      
      let url;
      if (type === 'light') {
        url = `https://a.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
      } else {
        url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
      }
      
      try {
        await downloadTile(url, filepath);
        console.log(`Downloaded: ${type}/${zoom}/${x}/${y}.${ext}`);
      } catch (err) {
        console.error(`Failed to download ${url}:`, err.message);
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('Preload completed!');
}

// 运行脚本
preloadTiles(15, 'light').then(() => {
  console.log('Light tiles preloaded');
  return preloadTiles(15, 'satellite');
}).then(() => {
  console.log('Satellite tiles preloaded');
}).catch(console.error);
```

### 方法 2: 手动下载关键区域

对于 zoom 15，紫金港校区大约需要下载 4x4 = 16 个瓦片。

关键瓦片坐标（zoom 15）：
- X: 28960-28963
- Y: 13550-13553

下载地址：
- Light: `https://a.basemaps.cartocdn.com/light_all/15/{x}/{y}.png`
- Satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/{y}/{x}`

保存路径：
- `public/map-tiles/light/15/{x}/{y}.png`
- `public/map-tiles/satellite/15/{x}/{y}.jpg`

## 注意事项

1. 瓦片文件可能较大，建议只预加载常用的 zoom 级别（15-16）
2. 确保 `public/map-tiles` 目录存在
3. 下载时注意遵守地图服务的使用条款
4. 本地瓦片会优先使用，如果不存在则自动回退到在线资源
