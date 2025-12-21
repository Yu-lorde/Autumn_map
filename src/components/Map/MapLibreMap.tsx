import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { getAllPlantInstances, plants } from '../../data/plantsData';
import { combinedMapStyle } from '../../utils/localMapStyles';

interface MapContainerProps {
  center: [number, number];
  zoom: number;
}

export default function MapLibreMap({ center, zoom }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map()); // 存储标记映射：plantId-locationIndex -> Marker
  const navControlRef = useRef<maplibregl.NavigationControl | null>(null);
  const { currentLayer } = useMapStore();
  const { setMap, setRoutingControl } = useMapContext();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 优化：初始化地图时加载组合样式（包含 light 和 satellite 两个源）
  // 切换图层时只改变图层可见性，不重新下载瓦片
  useEffect(() => {
    if (!mapContainer.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: combinedMapStyle, // 使用组合样式，同时包含两个源
      center: [center[1], center[0]], // MapLibre 使用 [lng, lat]
      zoom: zoom,
      minZoom: 10,
      maxZoom: 18
    });

    mapInstanceRef.current = map;
    
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
      removeLayer: (layer: { remove?: () => void }) => {
        if (layer && layer.remove) {
          layer.remove();
        }
      }
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
      
      // 添加植物标记（每个位置都会创建一个标记）
      const plantInstances = getAllPlantInstances();
      
      plantInstances.forEach(plantInstance => {
        // 获取该植物的总位置数，用于显示编号
        const plantData = plants.find(p => p.id === plantInstance.plantId);
        const locationCount = plantData?.locations.length || 1;
        const displayName = locationCount > 1 
          ? `${plantInstance.name}-${plantInstance.locationIndex + 1}`
          : plantInstance.name;
        // 外层容器：由 MapLibre 控制定位，不添加 transform
        const el = document.createElement('div');
        el.className = 'plant-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.cursor = 'pointer';
        el.style.position = 'relative';
        
        // 内层元素：用于显示和动画，不干扰 MapLibre 的定位
        const innerEl = document.createElement('div');
        innerEl.style.width = '100%';
        innerEl.style.height = '100%';
        innerEl.style.borderRadius = '50%';
        innerEl.style.background = 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'; // 明亮的橙色渐变
        innerEl.style.border = '3px solid white';
        innerEl.style.boxShadow = '0 3px 8px rgba(249, 115, 22, 0.4)';
        innerEl.style.transform = 'scale(1)'; // 初始缩放
        innerEl.style.transition = 'transform 0.3s ease-in-out'; // 添加过渡效果
        innerEl.style.display = 'flex';
        innerEl.style.alignItems = 'center';
        innerEl.style.justifyContent = 'center';
        innerEl.style.color = 'white';
        innerEl.style.fontSize = '14px';
        innerEl.innerHTML = '🍂';
        
        // 存储内层元素的引用，用于后续闪烁动画
        (innerEl as any)._isInnerElement = true;
        el.appendChild(innerEl);

        // 创建美观的 popup 内容
        const popupHTML = `
          <div style="
            font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            padding: 0;
            min-width: 180px;
          ">
            <div style="
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              color: white;
              padding: 12px 16px;
              border-radius: 8px 8px 0 0;
              font-weight: bold;
              font-size: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 18px;">🍂</span>
              <span>${displayName}</span>
            </div>
            <div style="
              background: white;
              padding: 10px 16px 12px;
              border-radius: 0 0 8px 8px;
              border: 2px solid #f97316;
              border-top: none;
              box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
            ">
              <div style="
                color: #92400e;
                font-size: 11px;
                font-style: italic;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">${plantInstance.latin}</div>
              <div style="
                color: #78350f;
                font-size: 12px;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              ">${plantInstance.description.substring(0, 60)}${plantInstance.description.length > 60 ? '...' : ''}</div>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          className: 'plant-popup'
        }).setHTML(popupHTML);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([plantInstance.coords[1], plantInstance.coords[0]])
          .setPopup(popup)
          .addTo(map);

        // 存储标记映射，用于后续闪烁
        const markerKey = `${plantInstance.plantId}-${plantInstance.locationIndex}`;
        markersMapRef.current.set(markerKey, marker);

        // 添加点击事件：移动地图到植物位置并显示气泡
        el.addEventListener('click', () => {
          // 先关闭其他可能打开的popup
          const existingPopups = document.querySelectorAll('.maplibregl-popup');
          existingPopups.forEach((pop: Element) => {
            const popupInstance = (pop as any)._maplibreglPopup;
            if (popupInstance && popupInstance !== popup) {
              popupInstance.remove();
            }
          });
          
          // 获取当前缩放级别，如果已经比较大了就不需要再放大太多
          const currentZoom = map.getZoom();
          // 目标缩放级别：如果当前缩放小于15，则放大到15；否则只放大到当前级别+1，但不超过16
          const targetZoom = currentZoom < 15 ? 15 : Math.min(currentZoom + 1, 16);
          
          // 先打开popup，这样在flyTo过程中它会跟随标记移动
          marker.togglePopup();
          
          // 平滑移动到植物位置
          map.flyTo({
            center: [plantInstance.coords[1], plantInstance.coords[0]],
            zoom: targetZoom,
            duration: 1000, // 动画时长 1 秒
            essential: true
          });
          
          // 在flyTo完成后，确保popup仍然打开
          map.once('moveend', () => {
            if (!popup.isOpen()) {
              marker.togglePopup();
            }
          });
        });

        markersRef.current.push(marker);
      });

      // 设置路由控制适配器
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

      // 更新用户位置的方法
      (mapAdapter as any).setUserLocation = (coords: [number, number]) => {
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
      };

      // 添加标记闪烁方法
      (mapAdapter as any).flashMarker = (plantId: string, locationIndex: number) => {
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
      };
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, zoom]);

  // 优化：切换图层时只改变图层可见性，不重新下载瓦片
  // 这样切换会非常快，因为瓦片已经缓存了
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;
    
    // 切换图层可见性的辅助函数
    const switchLayerVisibility = (map: maplibregl.Map, layer: 'satellite' | 'light') => {
      const lightLayer = map.getLayer('local-light-layer');
      const satelliteLayer = map.getLayer('local-satellite-layer');
      
      if (!lightLayer || !satelliteLayer) return;
      
      // 切换图层可见性
      if (layer === 'satellite') {
        map.setLayoutProperty('local-light-layer', 'visibility', 'none');
        map.setLayoutProperty('local-satellite-layer', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('local-light-layer', 'visibility', 'visible');
        map.setLayoutProperty('local-satellite-layer', 'visibility', 'none');
      }
    };
    
    // 确保样式已加载
    if (!map.isStyleLoaded()) {
      // 如果样式还没加载完，等待样式加载完成
      map.once('style.load', () => {
        switchLayerVisibility(map, currentLayer);
      });
      return;
    }
    
    switchLayerVisibility(map, currentLayer);
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
