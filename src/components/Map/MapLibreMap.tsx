import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { getAllPlantInstances, plants } from '../../data/plantsData';
import { localLightStyle, localSatelliteStyle } from '../../utils/localMapStyles';

interface MapContainerProps {
  center: [number, number];
  zoom: number;
}

export default function MapLibreMap({ center, zoom }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map()); // 存储标记映射：plantId-locationIndex -> Marker
  const popupsRef = useRef<maplibregl.Popup[]>([]); // 存储所有 popup 实例的引用
  const clusterMarkersRef = useRef<maplibregl.Marker[]>([]); // 聚合标记
  const navControlRef = useRef<maplibregl.NavigationControl | null>(null);
  const { currentLayer } = useMapStore();
  const { setMap, setRoutingControl } = useMapContext();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 优化：初始化地图时加载组合样式（包含 light 和 satellite 两个源）
  // 切换图层时只改变图层可见性，不重新下载瓦片
  useEffect(() => {
    if (!mapContainer.current || mapInstanceRef.current) return;

    // 重置 popups 引用数组
    popupsRef.current = [];

    // 优化：初始只加载 light 图层，参考 Leaflet 的快速加载方式
    // 切换到 satellite 时再动态加载 satellite 源，减少初始加载时间
    const initialStyle = currentLayer === 'light' ? localLightStyle : localSatelliteStyle;
    
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle, // 初始只加载当前需要的图层，而不是同时加载两个
      center: [center[1], center[0]], // MapLibre 使用 [lng, lat]
      zoom: zoom,
      minZoom: 10,
      maxZoom: 18,
      // 限制地图边界，比紫金港校区稍大一点，提供更合理的视野范围
      // maxBounds 会限制用户移动范围，同时 MapLibre GL 也会限制在此范围内的瓦片请求
      maxBounds: [
        [120.0600, 30.2850], // 西南角 [lng, lat] - 比校区边界扩大约 1-2 公里
        [120.1050, 30.3300]  // 东北角 [lng, lat] - 比校区边界扩大约 1-2 公里
      ],
      // 不渲染世界副本，只显示一次地图，减少瓦片加载
      renderWorldCopies: false,
    });

    mapInstanceRef.current = map;
    
    // MapLibre GL 的瓦片加载机制说明：
    // 1. 内置懒加载：自动只加载当前视野（viewport）范围内的瓦片
    // 2. maxBounds 限制：限制地图移动范围，同时也会限制瓦片请求范围
    // 3. 预加载机制：会预加载视野边缘的少量瓦片，用于平滑移动
    // 4. 自动卸载：视野外的瓦片会自动从缓存中移除，释放内存
    // 
    // 因此，设置了 maxBounds 后：
    // - 用户无法移动到边界外，所以不会请求边界外的瓦片
    // - 即使在地图边界内，也只会加载当前视野可见的瓦片
    // - 这样可以有效减少瓦片加载量和内存占用
    
    // 创建适配器以兼容现有的 Leaflet API
    const mapAdapter = {
      setView: (coords: [number, number], zoomLevel: number) => {
        map.flyTo({ center: [coords[1], coords[0]], zoom: zoomLevel });
      },
      fitBounds: (bounds: { getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } }, options?: { padding?: number | number[] }) => {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        let padding: number = 50;
        if (typeof options?.padding === 'number') {
          padding = options.padding;
        } else if (Array.isArray(options?.padding)) {
          padding = options.padding[0]; // 取数组第一个值作为统一 padding
        }
        map.fitBounds(
          [[sw.lng, sw.lat], [ne.lng, ne.lat]],
          { padding }
        );
      },
      invalidateSize: () => {
        map.resize();
      },
      eachLayer: (callback: (layer: { getLatLng: () => { lat: number; lng: number } }) => void) => {
        markersRef.current.forEach(marker => {
          callback({
            getLatLng: () => ({ lat: marker.getLngLat().lat, lng: marker.getLngLat().lng })
          });
        });
      },
      setUserLocation: (coords: [number, number]) => {
        const source = map.getSource('user-location') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coords[1], coords[0]]
            },
            properties: {}
          });
        }
      },
      flashMarker: (plantId: string, locationIndex: number) => {
        const markerKey = `${plantId}-${locationIndex}`;
        const marker = markersMapRef.current.get(markerKey);
        if (!marker) return;

        const markerElement = marker.getElement();
        if (!markerElement) return;

        // 找到内层元素（第一个子元素，用于动画）
        const innerElement = markerElement.firstElementChild as HTMLElement;
        const targetElement = innerElement || markerElement;

        if (!targetElement) return;

        // 闪烁动画：放大缩小两次
        let flashCount = 0;
        const flashAnimation = () => {
          if (flashCount >= 2) {
            // 动画结束，恢复原状
            targetElement.style.transform = 'scale(1)';
            return;
          }

          flashCount++;
          
          // 放大
          targetElement.style.transform = 'scale(1.6)';
          targetElement.style.transition = 'transform 0.25s ease-out';
          
          // 缩小
          setTimeout(() => {
            targetElement.style.transform = 'scale(1)';
            targetElement.style.transition = 'transform 0.25s ease-in';
            
            // 等待后继续下一次闪烁
            setTimeout(() => {
              flashAnimation();
            }, 200);
          }, 250);
        };

        // 开始闪烁
        flashAnimation();
      }
    } as {
      setView: (coords: [number, number], zoomLevel: number) => void;
      fitBounds: (bounds: { getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } }, options?: { padding?: number | number[] }) => void;
      invalidateSize: () => void;
      eachLayer: (callback: (layer: { getLatLng: () => { lat: number; lng: number } }) => void) => void;
      setUserLocation: (coords: [number, number]) => void;
      flashMarker: (plantId: string, locationIndex: number) => void;
    };

    setMap(mapAdapter);

    map.on('load', () => {
      setMapLoaded(true);
      setIsLoading(false);
      
      // 添加路线源和图层
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      map.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f97316', // 明亮的橙色
          'line-width': 6,
          'line-opacity': 0.85
        }
      });

      // 添加用户位置源和图层
      map.addSource('user-location', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {}
        }
      });

      map.addLayer({
        id: 'user-location-layer',
        type: 'circle',
        source: 'user-location',
        paint: {
          'circle-radius': 8,
          'circle-color': '#f97316', // 明亮的橙色
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // 使用 GeoJSON source + MapLibre 的 cluster 功能来替换基于 DOM 的大量 Marker（性能优化）
      const plantInstances = getAllPlantInstances();

      const features = plantInstances.map(pi => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pi.coords[1], pi.coords[0]] },
        properties: {
          plantId: pi.plantId,
          locationIndex: pi.locationIndex,
          name: pi.name,
          latin: pi.latin,
          desc: pi.description,
          emoji: '🍂'
        }
      }));

      // 添加 GeoJSON source（开启聚合）
      if (!map.getSource('plants')) {
        map.addSource('plants', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        // 聚合圈层
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'plants',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#f97316', 10, '#fb923c', 30, '#ea580c'],
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 28],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        });

        // 聚合计数文字
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'plants',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: {
            'text-color': '#fff'
          }
        });

        // 非聚合点（单个植物）
        map.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'plants',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'plant-emoji',
            'icon-size': 0.9,
            'icon-allow-overlap': true
          }
        });

        // 注册一个简单的 canvas / image 作为图标（使用 emoji 渲染到 canvas）
        if (!map.hasImage('plant-emoji')) {
          const size = 64;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, size, size);
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍂', size / 2, size / 2 + 2);
            map.addImage('plant-emoji', canvas);
          }
        }

        // 动态 popup（只在点击时创建并复用）
        const popup = new maplibregl.Popup({ offset: 12, closeButton: true, closeOnClick: false });

        // 点击聚合点 => 缩放到该聚合
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource('plants') as maplibregl.GeoJSONSource;
          if (source && clusterId != null) {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
            });
          }
        });

        // 点击单点 => 显示 popup（按需构造 DOM）
        map.on('click', 'unclustered-point', (e) => {
          const f = e.features && e.features[0];
          if (!f) return;
          const props = f.properties as any;

          // 构造 popup DOM
          const popupContainer = document.createElement('div');
          popupContainer.style.cssText = `font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; min-width: 180px;`;

          const header = document.createElement('div');
          header.style.cssText = `background: linear-gradient(135deg,#f97316 0%,#fb923c 100%); color: #fff; padding: 10px; border-radius: 6px 6px 0 0; font-weight:600;`;
          header.textContent = props.name || '';

          const body = document.createElement('div');
          body.style.cssText = `background:#fff; padding:8px; border:2px solid #f97316; border-top:none;`;
          const latin = document.createElement('div');
          latin.style.cssText = `color:#92400e; font-size:11px; font-style:italic; margin-bottom:6px;`;
          latin.textContent = props.latin || '';
          const desc = document.createElement('div');
          desc.style.cssText = `color:#78350f; font-size:12px; line-height:1.4;`;
          desc.textContent = props.desc ? (props.desc.length > 60 ? props.desc.substring(0,60)+'...' : props.desc) : '';

          body.appendChild(latin);
          body.appendChild(desc);
          popupContainer.appendChild(header);
          popupContainer.appendChild(body);

          popup.setLngLat((f.geometry as any).coordinates as [number, number]).setDOMContent(popupContainer).addTo(map);

          // 平滑移动并调整缩放
          const currentZoom = map.getZoom();
          const targetZoom = currentZoom < 15 ? 15 : Math.min(currentZoom + 1, 16);
          map.flyTo({ center: (f.geometry as any).coordinates as [number, number], zoom: targetZoom, duration: 800, essential: true });
        });

        // 更友好的鼠标样式
        map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
        map.on('mouseenter', 'unclustered-point', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'unclustered-point', () => map.getCanvas().style.cursor = '');
      } else {
        // 如果 source 已存在，仅更新数据
        const src = map.getSource('plants') as maplibregl.GeoJSONSource;
        src.setData({ type: 'FeatureCollection', features });
      }

      // 将 markersRef，markersMapRef，popupsRef 的使用范围缩减为备用，不再在渲染路径中创建大量 DOM 标记
      const routingControlAdapter = {
        setWaypoints: async (waypoints: { lat: number; lng: number }[]) => {
          if (waypoints.length < 2) return;
          const start = waypoints[0];
          const end = waypoints[1];
          
          try {
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0].geometry;
              const source = map.getSource('route') as maplibregl.GeoJSONSource;
              if (source) {
                source.setData({
                  type: 'Feature',
                  properties: {},
                  geometry: route
                });
              }
            }
          } catch (err) {
            console.error('Failed to fetch route geometry:', err);
          }
        }
      };
      setRoutingControl(routingControlAdapter);
    });

    // 监听数据加载事件
    map.on('data', () => {
      if (map.loaded()) {
        setIsLoading(false);
      }
    });

    // 添加导航控件
    const nav = new maplibregl.NavigationControl({
      visualizePitch: true
    });
    map.addControl(nav, 'bottom-right');
    navControlRef.current = nav;

    return () => {
      // 清理聚合标记
      clusterMarkersRef.current.forEach(clusterMarker => {
        clusterMarker.remove();
      });
      clusterMarkersRef.current = [];
      
      // 清理地图实例（会自动清理所有事件监听器）
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      // 清理 popups 引用数组
      popupsRef.current = [];
    };
  }, [center, zoom]);

  // 优化：动态加载图层，参考 Leaflet 的快速加载方式
  // 初始只加载当前图层，切换到另一个图层时动态加载
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;
    
    // 图层切换处理函数（定义在 useEffect 内部）
    const handleLayerSwitch = (targetLayer: 'satellite' | 'light') => {
      const lightSource = map.getSource('local-light');
      const satelliteSource = map.getSource('local-satellite');
      const lightLayer = map.getLayer('local-light-layer');
      const satelliteLayer = map.getLayer('local-satellite-layer');
      
      if (targetLayer === 'satellite') {
        // 切换到卫星图层
        if (!satelliteSource) {
          // 如果卫星源不存在，动态添加（延迟加载）
          map.addSource('local-satellite', {
            type: 'raster',
            tiles: [
              '/map-tiles/satellite/{z}/{x}/{y}.jpg',
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri',
            minzoom: 10,
            maxzoom: 18
          });
          
          map.addLayer({
            id: 'local-satellite-layer',
            type: 'raster',
            source: 'local-satellite',
            minzoom: 10,
            maxzoom: 18
          });
        }
        
        // 隐藏 light 图层，显示 satellite 图层
        if (lightLayer) {
          map.setLayoutProperty('local-light-layer', 'visibility', 'none');
        }
        const newSatelliteLayer = map.getLayer('local-satellite-layer');
        if (newSatelliteLayer) {
          map.setLayoutProperty('local-satellite-layer', 'visibility', 'visible');
        }
      } else {
        // 切换到 light 图层
        if (!lightSource) {
          // 如果 light 源不存在，动态添加（延迟加载）
          map.addSource('local-light', {
            type: 'raster',
            tiles: [
              '/map-tiles/light/{z}/{x}/{y}.png',
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            minzoom: 10,
            maxzoom: 18
          });
          
          map.addLayer({
            id: 'local-light-layer',
            type: 'raster',
            source: 'local-light',
            minzoom: 10,
            maxzoom: 18,
            paint: {
              'raster-saturation': 0.2,
              'raster-contrast': 0.1,
              'raster-brightness-min': 0,
              'raster-brightness-max': 0.9,
              'raster-hue-rotate': 10
            }
          });
        }
        
        // 隐藏 satellite 图层，显示 light 图层
        if (satelliteLayer) {
          map.setLayoutProperty('local-satellite-layer', 'visibility', 'none');
        }
        const newLightLayer = map.getLayer('local-light-layer');
        if (newLightLayer) {
          map.setLayoutProperty('local-light-layer', 'visibility', 'visible');
        }
      }
    };
    
    // 确保样式已加载
    if (!map.isStyleLoaded()) {
      map.once('style.load', () => {
        handleLayerSwitch(currentLayer);
      });
      return;
    }
    
    handleLayerSwitch(currentLayer);
  }, [currentLayer, mapLoaded]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        height: '100%', 
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }} 
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50/95 to-orange-50/95 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <span className="text-sm font-medium text-orange-700">地图加载中</span>
          </div>
        </div>
      )}
    </div>
  );
}
