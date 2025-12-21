/**
 * 预加载浙大紫金港校区地图瓦片脚本
 * 将常用区域的地图瓦片下载到本地，提高加载速度
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES 模块中获取 __dirname 的方式
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 浙大紫金港校区边界
const ZJU_BOUNDS = {
  sw: [30.2950, 120.0700], // 西南角 [lat, lng]
  ne: [30.3200, 120.0950]  // 东北角 [lat, lng]
};

// 将经纬度转换为瓦片坐标
function latToTile(lat, z) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
}

function lngToTile(lng, z) {
  return Math.floor((lng + 180) / 360 * Math.pow(2, z));
}

// 下载单个瓦片（带重试机制）
function downloadTile(url, filepath, retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptDownload = (attempt) => {
      const file = fs.createWriteStream(filepath);
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
      
      const request = https.get(url, options, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          file.close();
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          if (attempt < retries) {
            // 重试
            setTimeout(() => attemptDownload(attempt + 1), 1000 * attempt);
          } else {
            reject(new Error(`Failed to download: ${response.statusCode}`));
          }
        }
      });
      
      // 设置超时（15秒）
      request.setTimeout(15000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        if (attempt < retries) {
          setTimeout(() => attemptDownload(attempt + 1), 1000 * attempt);
        } else {
          reject(new Error('Request timeout'));
        }
      });
      
      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        if (attempt < retries && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED')) {
          // 连接重置、超时或拒绝，重试
          console.log(`  重试 ${attempt}/${retries}: ${url}`);
          setTimeout(() => attemptDownload(attempt + 1), 1000 * attempt);
        } else {
          reject(err);
        }
      });
    };
    
    attemptDownload(1);
  });
}

// 预加载指定类型和缩放级别的瓦片
async function preloadTiles(zoom = 15, type = 'light') {
  const { sw, ne } = ZJU_BOUNDS;
  const minX = lngToTile(sw[1], zoom);
  const maxX = lngToTile(ne[1], zoom);
  const minY = latToTile(ne[0], zoom);
  const maxY = latToTile(sw[0], zoom);

  const baseDir = path.join(__dirname, '..', 'public', 'map-tiles', type);
  
  console.log(`开始预加载 ${type} 图层，zoom ${zoom}，范围: X[${minX}-${maxX}], Y[${minY}-${maxY}]`);
  
  let successCount = 0;
  let failCount = 0;
  const total = (maxX - minX + 1) * (maxY - minY + 1);
  
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const tileDir = path.join(baseDir, String(zoom), String(x));
      fs.mkdirSync(tileDir, { recursive: true });
      
      const ext = type === 'light' ? 'png' : 'jpg';
      const filepath = path.join(tileDir, `${y}.${ext}`);
      
      // 如果文件已存在，跳过
      if (fs.existsSync(filepath)) {
        console.log(`跳过已存在的瓦片: ${type}/${zoom}/${x}/${y}.${ext}`);
        successCount++;
        continue;
      }
      
      // 使用多个备用下载源，按顺序尝试直到成功
      let urlSources = [];
      if (type === 'light') {
        // Light 图层：优先使用 CartoDB（通常更稳定），然后 OSM
        urlSources = [
          // 优先：CartoDB Positron（简约风格，通常更稳定，CDN 加速）
          `https://a.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`,
          `https://b.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`,
          `https://c.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`,
          // 备用：OSM 标准服务
          `https://a.tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
          `https://b.tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
          `https://c.tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
          // 最后备用：Stamen Toner Lite
          `https://stamen-tiles-a.a.ssl.fastly.net/toner-lite/${zoom}/${x}/${y}.png`,
          `https://stamen-tiles-b.a.ssl.fastly.net/toner-lite/${zoom}/${x}/${y}.png`
        ];
      } else {
        // Satellite 图层：使用多个卫星图源
        urlSources = [
          // 主要源：Esri World Imagery
          `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
          // 备用源：其他 Esri 服务器
          `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`
        ];
      }
      
      // 尝试多个下载源，按顺序尝试直到成功
      let downloaded = false;
      let lastError = null;
      
      for (let i = 0; i < urlSources.length; i++) {
        const sourceUrl = urlSources[i];
        try {
          await downloadTile(sourceUrl, filepath);
          successCount++;
          downloaded = true;
          const progress = ((successCount + failCount) / total * 100).toFixed(1);
          const sourceName = new URL(sourceUrl).hostname.split('.')[0];
          console.log(`[${progress}%] 已下载: ${type}/${zoom}/${x}/${y}.${ext} (${sourceName})`);
          break; // 成功下载后跳出循环
        } catch (err) {
          lastError = err;
          // 如果不是最后一个源，继续尝试下一个
          if (i < urlSources.length - 1) {
            // 短暂延迟后尝试下一个源
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      if (!downloaded) {
        failCount++;
        console.error(`所有源都失败 ${type}/${zoom}/${x}/${y}.${ext}:`, lastError?.message || 'Unknown error');
      }
      
      // 添加延迟避免请求过快（增加到200ms，降低被限流的风险）
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`\n${type} 图层预加载完成! 成功: ${successCount}, 失败: ${failCount}`);
  return { successCount, failCount };
}

// 主函数
async function main() {
  console.log('开始预加载浙大紫金港校区地图瓦片...\n');
  
  // 预加载 zoom 15 的 light 和 satellite 图层
  const zooms = [15, 16]; // 可以添加更多缩放级别
  
  for (const zoom of zooms) {
    console.log(`\n=== Zoom ${zoom} ===`);
    
    // 预加载 light 图层
    await preloadTiles(zoom, 'light');
    
    // 预加载 satellite 图层
    await preloadTiles(zoom, 'satellite');
  }
  
  console.log('\n所有瓦片预加载完成!');
}

// 运行脚本
main().catch(console.error);

export { preloadTiles, ZJU_BOUNDS };
