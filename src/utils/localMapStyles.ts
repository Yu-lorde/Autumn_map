import type { StyleSpecification } from 'maplibre-gl';

/**
 * 浙大紫金港校区本地地图样式配置
 * 优先使用本地资源，提高加载速度
 */

// 浙大紫金港校区中心坐标和范围
export const ZJU_CENTER: [number, number] = [30.3081, 120.0827]; // [lat, lng]
export const ZJU_BOUNDS: [[number, number], [number, number]] = [
  [30.2950, 120.0700], // 西南角
  [30.3200, 120.0950]  // 东北角
];

/**
 * 本地 light 样式 - 优先使用 GitHub 上的瓦片
 * 紫金港校区的瓦片已提交到 git，可以直接从 GitHub 加载，无需 API 调用
 * 
 * 加载顺序（MapLibre GL 会按顺序尝试，使用第一个可用的）：
 * 1. 本地/相对路径瓦片（GitHub Pages 或本地开发）- 最快
 * 2. CartoDB Positron（CDN 加速，通常最稳定）- 默认在线源
 * 3. OSM 标准服务（备用）
 */
export const localLightStyle: StyleSpecification = {
  version: 8,
  sources: {
    'local-light': {
      type: 'raster',
      tiles: [
        // 1. 优先使用本地/相对路径瓦片（GitHub Pages 或本地开发）
        '/map-tiles/light/{z}/{x}/{y}.png',
        // 2. CartoDB Positron（CDN 加速，参考 Leaflet 实现使用单一稳定源）
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      minzoom: 10,
      maxzoom: 18
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#fff7ed'
      }
    },
    {
      id: 'local-light-layer',
      type: 'raster',
      source: 'local-light',
      minzoom: 10,
      maxzoom: 18,
      paint: {
        'raster-saturation': 0.2,
        'raster-contrast': 0.1,
        'raster-hue-rotate': 10
      }
    }
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sprite: 'https://demotiles.maplibre.org/sprites/sprites'
};

/**
 * 本地卫星样式 - 优先使用 GitHub 上的瓦片
 * 紫金港校区的卫星瓦片已提交到 git，可以直接从 GitHub 加载
 * 
 * 加载顺序：
 * 1. 本地/相对路径瓦片（最快）
 * 2. 多个 Esri 服务器（提高成功率）
 */
export const localSatelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    'local-satellite': {
      type: 'raster',
      tiles: [
        // 1. 优先使用本地/相对路径瓦片（GitHub Pages 或本地开发）
        '/map-tiles/satellite/{z}/{x}/{y}.jpg',
        // 2. Esri World Imagery（参考 Leaflet 实现使用单一稳定源）
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Esri',
      minzoom: 10,
      maxzoom: 18
    }
  },
  layers: [
    {
      id: 'local-satellite-layer',
      type: 'raster',
      source: 'local-satellite',
      minzoom: 10,
      maxzoom: 18
    }
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sprite: 'https://demotiles.maplibre.org/sprites/sprites'
};

/**
 * 组合样式 - 同时包含 light 和 satellite 两个源
 * 用于图层切换优化：切换时只改变图层可见性，不重新下载瓦片
 */
// 优化的组合样式 - 简化瓦片 URL，参考 Leaflet 的快速加载方式
// 只使用最稳定的 CDN 源，减少备用 URL 数量，提高加载速度
export const combinedMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    'local-light': {
      type: 'raster',
      tiles: [
        // 优先使用本地瓦片（如果存在）
        '/map-tiles/light/{z}/{x}/{y}.png',
        // 使用 CartoDB CDN（参考 Leaflet 实现，使用单一稳定源）
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      minzoom: 10,
      maxzoom: 18
    },
    'local-satellite': {
      type: 'raster',
      tiles: [
        // 优先使用本地瓦片（如果存在）
        '/map-tiles/satellite/{z}/{x}/{y}.jpg',
        // 使用 Esri 主服务器（参考 Leaflet 实现，使用单一稳定源）
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Esri',
      minzoom: 10,
      maxzoom: 18
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#fff7ed' // orange-50, autumn warm bg
      }
    },
    {
      id: 'local-light-layer',
      type: 'raster',
      source: 'local-light',
      minzoom: 10,
      maxzoom: 18,
      layout: {
        visibility: 'visible' // 默认显示 light 图层
      },
      paint: {
        'raster-saturation': 0.2, // 增加饱和度
        'raster-contrast': 0.1,   // 增加对比度
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.9,
        'raster-hue-rotate': 10    // 稍微向暖色偏转
      }
    },
    {
      id: 'local-satellite-layer',
      type: 'raster',
      source: 'local-satellite',
      minzoom: 10,
      maxzoom: 18,
      layout: {
        visibility: 'none' // 默认隐藏 satellite 图层
      }
    }
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sprite: 'https://demotiles.maplibre.org/sprites/sprites'
};

/**
 * 检查是否为紫金港校区区域
 */
export function isZJUArea(lat: number, lng: number): boolean {
  const [sw, ne] = ZJU_BOUNDS;
  return lat >= sw[0] && lat <= ne[0] && lng >= sw[1] && lng <= ne[1];
}

/**
 * 获取紫金港校区的地图瓦片坐标范围（zoom 15）
 * 用于预加载关键区域的地图
 */
export function getZJUTileRange(zoom: number = 15): { minX: number; maxX: number; minY: number; maxY: number } {
  const [sw, ne] = ZJU_BOUNDS;
  
  // 将经纬度转换为瓦片坐标
  const latToTile = (lat: number, z: number) => {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
  };
  
  const lngToTile = (lng: number, z: number) => {
    return Math.floor((lng + 180) / 360 * Math.pow(2, z));
  };
  
  return {
    minX: lngToTile(sw[1], zoom),
    maxX: lngToTile(ne[1], zoom),
    minY: latToTile(ne[0], zoom),
    maxY: latToTile(sw[0], zoom)
  };
}
