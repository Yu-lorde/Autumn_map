import type { StyleSpecification } from 'maplibre-gl';

/**
 * 浙大紫金港校区本地地图样式配置
 * 优先使用国内 CDN 资源，提高大陆地区加载速度
 */

// 浙大紫金港校区中心坐标和范围 (WGS-84)
export const ZJU_CENTER: [number, number] = [30.3081, 120.0827]; // [lat, lng]
export const ZJU_BOUNDS: [[number, number], [number, number]] = [
  [30.2950, 120.0700], // 西南角
  [30.3200, 120.0950]  // 东北角
];

/**
 * 本地 light 样式 - 使用高德地图瓦片
 * 
 * 注意：高德地图使用 GCJ-02 坐标系，而原始数据为 WGS-84。
 * 在渲染标记和路线时需要进行坐标转换。
 */
export const localLightStyle: StyleSpecification = {
  version: 8,
  sources: {
    'local-light': {
      type: 'raster',
      tiles: [
        'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        'https://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="http://www.amap.com/">Amap</a>',
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
        'raster-saturation': -0.2, // 稍微降低饱和度以匹配简约风格
        'raster-contrast': 0,
        'raster-brightness-min': 0,
        'raster-brightness-max': 1
      }
    }
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sprite: 'https://demotiles.maplibre.org/sprites/sprites'
};

/**
 * 本地卫星样式 - 使用高德卫星图瓦片
 */
export const localSatelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    'local-satellite': {
      type: 'raster',
      tiles: [
        'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="http://www.amap.com/">Amap</a>',
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
 */
export const combinedMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    'local-light': {
      type: 'raster',
      tiles: [
        'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        'https://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="http://www.amap.com/">Amap</a>',
      minzoom: 10,
      maxzoom: 18
    },
    'local-satellite': {
      type: 'raster',
      tiles: [
        'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="http://www.amap.com/">Amap</a>',
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
      layout: {
        visibility: 'visible'
      },
      paint: {
        'raster-saturation': -0.2,
        'raster-contrast': 0,
        'raster-brightness-min': 0,
        'raster-brightness-max': 1
      }
    },
    {
      id: 'local-satellite-layer',
      type: 'raster',
      source: 'local-satellite',
      minzoom: 10,
      maxzoom: 18,
      layout: {
        visibility: 'none'
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
