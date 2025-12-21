import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { getAllPlantInstances, plants } from '../../data/plantsData';
import { localLightStyle, localSatelliteStyle } from '../../utils/localMapStyles';
import { wgs84ToGcj02 } from '../../utils/coordUtils';

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
    
    // 将 WGS-84 中心点转换为 GCJ-02 以匹配高德瓦片
    const [gcjLat, gcjLng] = wgs84ToGcj02(center[0], center[1]);
    
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle, // 初始只加载当前需要的图层，而不是同时加载两个
      center: [gcjLng, gcjLat], // MapLibre 使用 [lng, lat]
      zoom: zoom,
      minZoom: 10,
      maxZoom: 18,
      // 不渲染世界副本，只显示一次地图，减少瓦片加载
      renderWorldCopies: false,
    });

    mapInstanceRef.current = map;
    
    // MapLibre GL 的瓦片加载机制说明：
    // 1. 内置懒加载：自动只加载当前视野（viewport）范围内的瓦片
    // 2. 预加载机制：会预加载视野边缘的少量瓦片，用于平滑移动
    // 3. 自动卸载：视野外的瓦片会自动从缓存中移除，释放内存
    // 4. 只加载可见瓦片：即使地图可以自由移动，也只会加载当前视野可见的瓦片
    
    // 创建适配器以兼容现有的 Leaflet API
    const mapAdapter = {
      setView: (coords: [number, number], zoomLevel: number) => {
        const [glat, glng] = wgs84ToGcj02(coords[0], coords[1]);
        map.flyTo({ center: [glng, glat], zoom: zoomLevel });
      },
      fitBounds: (bounds: { getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } }, options?: { padding?: number | number[] }) => {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const [swLat, swLng] = wgs84ToGcj02(sw.lat, sw.lng);
        const [neLat, neLng] = wgs84ToGcj02(ne.lat, ne.lng);
        let padding: number = 50;
        if (typeof options?.padding === 'number') {
          padding = options.padding;
        } else if (Array.isArray(options?.padding)) {
          padding = options.padding[0]; // 取数组第一个值作为统一 padding
        }
        map.fitBounds(
          [[swLng, swLat], [neLng, neLat]],
          { padding }
        );
      },
      invalidateSize: () => {
        map.resize();
      },
      eachLayer: (callback: (layer: { getLatLng: () => { lat: number; lng: number } }) => void) => {
        // 这里返回 WGS84 坐标，即使地图内部使用 GCJ02
        markersRef.current.forEach(marker => {
          callback({
            getLatLng: () => ({ lat: marker.getLngLat().lat, lng: marker.getLngLat().lng })
          });
        });
      },
      setUserLocation: (coords: [number, number]) => {
        const source = map.getSource('user-location') as maplibregl.GeoJSONSource;
        if (source) {
          const [glat, glng] = wgs84ToGcj02(coords[0], coords[1]);
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [glng, glat]
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
        
        const baseTransform = (targetElement as any)._baseTransform || '';

        // 闪烁动画：放大缩小两次
        let flashCount = 0;
        const flashAnimation = () => {
          if (flashCount >= 2) {
            // 动画结束，恢复原状
            targetElement.style.transform = `${baseTransform} scale(1)`.trim();
            return;
          }

          flashCount++;
          
          // 放大
          targetElement.style.transform = `${baseTransform} scale(1.6)`.trim();
          targetElement.style.transition = 'transform 0.25s ease-out';
          
          // 缩小
          setTimeout(() => {
            targetElement.style.transform = `${baseTransform} scale(1)`.trim();
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
      
      // 添加植物标记（每个位置都会创建一个标记）
      const plantInstances = getAllPlantInstances();
      
      plantInstances.forEach(plantInstance => {
        // 获取该植物的总位置数，用于显示编号
        const plantData = plants.find(p => p.id === plantInstance.plantId);
        const locationCount = plantData?.locations.length || 1;
        const displayName = locationCount > 1 
          ? `${plantInstance.name}-${plantInstance.locationIndex + 1}`
          : plantInstance.name;
        // 外层容器：直接设置尺寸，确保没有额外的布局干扰
        const el = document.createElement('div');
        el.className = 'plant-marker';
        el.style.width = '30px';
        el.style.height = '40px';
        el.style.cursor = 'pointer';
        
        // 内部直接填充 SVG，确保针尖坐标 (15, 40) 是容器的绝对底边中心
        el.innerHTML = `
          <div style="position: relative; width: 30px; height: 40px; pointer-events: none; transform-origin: bottom;">
            <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
              <path d="M15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40Z" fill="#f97316"/>
              <path d="M15 38.5C15 38.5 28.5 25.5 28.5 15C28.5 7.5 22.5 1.5 15 1.5C7.5 1.5 1.5 7.5 1.5 15C1.5 25.5 15 38.5 15 38.5Z" stroke="white" stroke-width="1.5"/>
            </svg>
            <div style="position: absolute; top: 7px; left: 0; width: 30px; text-align: center; color: white; font-size: 14px; font-family: Arial, sans-serif; line-height: 1;">🍂</div>
          </div>
        `;
        
        // 存储内层元素的引用，用于后续闪烁动画
        const innerEl = el.firstElementChild as HTMLElement;
        (innerEl as any)._isInnerElement = true;
        (innerEl as any)._baseTransform = ''; 
        
        // 创建美观的 popup 内容（使用 DOM 元素避免 XSS 风险）
        const popupContainer = document.createElement('div');
        popupContainer.style.cssText = `
          font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
          padding: 0;
          min-width: 180px;
        `;

        // 头部区域
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px 8px 0 0;
          font-weight: bold;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        
        const emojiSpan = document.createElement('span');
        emojiSpan.style.fontSize = '18px';
        emojiSpan.textContent = '🍂';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = displayName; // 使用 textContent 防止 XSS
        
        headerDiv.appendChild(emojiSpan);
        headerDiv.appendChild(nameSpan);

        // 内容区域
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
          background: white;
          padding: 10px 16px 12px;
          border-radius: 0 0 8px 8px;
          border: 2px solid #f97316;
          border-top: none;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
        `;
        
        const latinDiv = document.createElement('div');
        latinDiv.style.cssText = `
          color: #92400e;
          font-size: 11px;
          font-style: italic;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        `;
        latinDiv.textContent = plantInstance.latin; // 使用 textContent 防止 XSS
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.style.cssText = `
          color: #78350f;
          font-size: 12px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        `;
        const descriptionText = plantInstance.description.length > 60 
          ? plantInstance.description.substring(0, 60) + '...'
          : plantInstance.description;
        descriptionDiv.textContent = descriptionText; // 使用 textContent 防止 XSS
        
        contentDiv.appendChild(latinDiv);
        contentDiv.appendChild(descriptionDiv);
        
        popupContainer.appendChild(headerDiv);
        popupContainer.appendChild(contentDiv);

        const popup = new maplibregl.Popup({ 
          offset: [0, -40], // 对应地图钉的高度，确保气泡在尖端正上方
          closeButton: true,
          closeOnClick: false,
          className: 'plant-popup'
        }).setDOMContent(popupContainer);

        // 将 popup 添加到引用数组中
        popupsRef.current.push(popup);

        const [gcjLat, gcjLng] = wgs84ToGcj02(plantInstance.coords[0], plantInstance.coords[1]);

        const marker = new maplibregl.Marker({ 
          element: el,
          anchor: 'bottom', // 强制锚定底部中心
          offset: [0, 0]    // 确保没有亚像素偏移
        })
          .setLngLat([gcjLng, gcjLat])
          .setPopup(popup)
          .addTo(map);
        
        // 存储植物实例数据到标记元素上，用于聚合
        (el as any)._plantInstance = plantInstance;

        // 存储标记映射，用于后续闪烁
        const markerKey = `${plantInstance.plantId}-${plantInstance.locationIndex}`;
        markersMapRef.current.set(markerKey, marker);

        // 添加点击事件：移动地图到植物位置并显示气泡
        el.addEventListener('click', () => {
          // 关闭其他已打开的 popup（使用 ref 中维护的实例引用）
          popupsRef.current.forEach((existingPopup) => {
            if (existingPopup !== popup && existingPopup.isOpen()) {
              existingPopup.remove();
            }
          });
          
          // 获取当前缩放级别，如果已经比较大了就不需要再放大太多
          const currentZoom = map.getZoom();
          // 目标缩放级别：如果当前缩放小于15，则放大到15；否则只放大到当前级别+1，但不超过16
          const targetZoom = currentZoom < 15 ? 15 : Math.min(currentZoom + 1, 16);
          
          // 先打开popup，这样在flyTo过程中它会跟随标记移动
          marker.togglePopup();
          
          // 平滑移动到植物位置
          const [destLat, destLng] = wgs84ToGcj02(plantInstance.coords[0], plantInstance.coords[1]);
          map.flyTo({
            center: [destLng, destLat],
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

      // 标记聚合功能
      const updateMarkerClustering = () => {
        const currentZoom = map.getZoom();
        
        // 缩放级别大于 14 时显示所有标记，不聚合
        if (currentZoom > 14) {
          // 隐藏所有聚合标记
          clusterMarkersRef.current.forEach(clusterMarker => {
            clusterMarker.remove();
          });
          clusterMarkersRef.current = [];
          
          // 显示所有单个标记
          markersRef.current.forEach(marker => {
            const element = marker.getElement();
            if (element) {
              element.style.display = 'block';
            }
          });
          return;
        }

        // 清除旧的聚合标记
        clusterMarkersRef.current.forEach(clusterMarker => {
          clusterMarker.remove();
        });
        clusterMarkersRef.current = [];

        // 默认隐藏所有原始标记，后续根据聚合情况决定显示哪些
        markersRef.current.forEach(marker => {
          const element = marker.getElement();
          if (element) {
            element.style.display = 'none';
          }
        });

        // 计算聚合 - 使用改进的聚类算法
        const clusters: Array<Array<{ marker: maplibregl.Marker; plantInstance: any; point: { x: number; y: number } }>> = [];
        const clusterRadius = 60; // 像素距离阈值，根据缩放级别调整

        // 获取所有标记的屏幕坐标
        const markerPoints = markersRef.current.map(marker => {
          const element = marker.getElement();
          if (!element) return null;
          
          const plantInstance = (element as any)._plantInstance;
          if (!plantInstance) return null;

          const lngLat = marker.getLngLat();
          const point = map.project(lngLat);
          
          return { marker, plantInstance, point };
        }).filter(Boolean) as Array<{ marker: maplibregl.Marker; plantInstance: any; point: { x: number; y: number } }>;

        // 简单的距离聚类算法
        markerPoints.forEach(markerPoint => {
          let addedToCluster = false;
          
          // 查找最近的聚合
          for (const cluster of clusters) {
            const clusterCenter = {
              x: cluster.reduce((sum, m) => sum + m.point.x, 0) / cluster.length,
              y: cluster.reduce((sum, m) => sum + m.point.y, 0) / cluster.length
            };
            
            const distance = Math.sqrt(
              Math.pow(markerPoint.point.x - clusterCenter.x, 2) + 
              Math.pow(markerPoint.point.y - clusterCenter.y, 2)
            );
            
            if (distance < clusterRadius) {
              cluster.push(markerPoint);
              addedToCluster = true;
              break;
            }
          }
          
          if (!addedToCluster) {
            clusters.push([markerPoint]);
          }
        });

        // 创建聚合标记
        clusters.forEach((clusterMarkers) => {
          if (clusterMarkers.length === 1) {
            // 只有一个标记，直接显示
            const element = clusterMarkers[0].marker.getElement();
            if (element) {
              element.style.display = 'block';
            }
          } else {
            // 多个标记，创建聚合标记
            // 计算聚合中心点（所有标记的平均位置）
            const avgLng = clusterMarkers.reduce((sum, m) => sum + m.marker.getLngLat().lng, 0) / clusterMarkers.length;
            const avgLat = clusterMarkers.reduce((sum, m) => sum + m.marker.getLngLat().lat, 0) / clusterMarkers.length;
            
            const clusterEl = document.createElement('div');
            clusterEl.className = 'plant-cluster-marker';
            clusterEl.style.cssText = `
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(249, 115, 22, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              cursor: pointer;
              position: relative;
            `;
            clusterEl.textContent = clusterMarkers.length.toString();

            // 创建聚合标记的 popup（显示所有聚合的植物）
            const clusterPopupContainer = document.createElement('div');
            clusterPopupContainer.style.cssText = `
              font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
              padding: 0;
              min-width: 200px;
              max-height: 400px;
              overflow-y: auto;
            `;

            const clusterHeader = document.createElement('div');
            clusterHeader.style.cssText = `
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              color: white;
              padding: 12px 16px;
              border-radius: 8px 8px 0 0;
              font-weight: bold;
              font-size: 15px;
            `;
            clusterHeader.textContent = `共 ${clusterMarkers.length} 个植物位置`;

            const clusterContent = document.createElement('div');
            clusterContent.style.cssText = `
              background: white;
              padding: 8px;
              border-radius: 0 0 8px 8px;
              border: 2px solid #f97316;
              border-top: none;
            `;

            clusterMarkers.forEach(({ plantInstance }) => {
              const plantData = plants.find(p => p.id === plantInstance.plantId);
              const locationCount = plantData?.locations.length || 1;
              const displayName = locationCount > 1 
                ? `${plantInstance.name}-${plantInstance.locationIndex + 1}`
                : plantInstance.name;

              const itemDiv = document.createElement('div');
              itemDiv.style.cssText = `
                padding: 8px;
                margin-bottom: 4px;
                border-radius: 4px;
                background: #fffbeb;
                cursor: pointer;
                transition: background 0.2s;
              `;
              itemDiv.textContent = `🍂 ${displayName}`;
              
              itemDiv.addEventListener('mouseenter', () => {
                itemDiv.style.background = '#ffedd5';
              });
              itemDiv.addEventListener('mouseleave', () => {
                itemDiv.style.background = '#fffbeb';
              });
              
              itemDiv.addEventListener('click', () => {
                // 关闭聚合 popup
                clusterPopup.remove();
                // 显示对应的单个标记
                clusterMarkers.forEach(({ marker }) => {
                  const element = marker.getElement();
                  if (element) {
                    element.style.display = 'block';
                  }
                });
                // 触发对应标记的点击事件
                const targetMarker = clusterMarkers.find(({ plantInstance: pi }) => 
                  pi.plantId === plantInstance.plantId && 
                  pi.locationIndex === plantInstance.locationIndex
                );
                if (targetMarker) {
                  const element = targetMarker.marker.getElement();
                  if (element) {
                    element.click();
                  }
                }
              });

              clusterContent.appendChild(itemDiv);
            });

            clusterPopupContainer.appendChild(clusterHeader);
            clusterPopupContainer.appendChild(clusterContent);

            const clusterPopup = new maplibregl.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false,
              className: 'plant-popup'
            }).setDOMContent(clusterPopupContainer);

            const clusterMarker = new maplibregl.Marker({
              element: clusterEl,
              anchor: 'center'
            })
              .setLngLat([avgLng, avgLat])
              .setPopup(clusterPopup)
              .addTo(map);
            
            // 点击聚合标记时切换 popup
            clusterEl.addEventListener('click', () => {
              clusterMarker.togglePopup();
            });

            clusterMarkersRef.current.push(clusterMarker);
          }
        });
      };

      // 初始聚合
      updateMarkerClustering();

      // 监听地图缩放和移动事件，更新聚合
      // 注意：当 map.remove() 被调用时，所有事件监听器会自动清理
      map.on('zoom', updateMarkerClustering);
      map.on('moveend', updateMarkerClustering);

      // 设置路由控制适配器
      const routingControlAdapter = {
        setWaypoints: async (waypoints: { lat: number; lng: number }[]) => {
          if (waypoints.length < 2) return;
          const start = waypoints[0];
          const end = waypoints[1];
          
          try {
            // OSRM 公共服务可能在大陆较慢，且需要 WGS84 坐标
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0].geometry;
              
              // 将路线中的所有 WGS84 坐标转换为 GCJ-02 以匹配底图
              if (route.type === 'LineString') {
                route.coordinates = route.coordinates.map((coord: number[]) => {
                  const [glat, glng] = wgs84ToGcj02(coord[1], coord[0]);
                  return [glng, glat];
                });
              }
              
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
          // 使用高德卫星图
          map.addSource('local-satellite', {
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
          // 使用高德街道图
          map.addSource('local-light', {
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
          });
          
          map.addLayer({
            id: 'local-light-layer',
            type: 'raster',
            source: 'local-light',
            minzoom: 10,
            maxzoom: 18,
            paint: {
              'raster-saturation': -0.2,
              'raster-contrast': 0,
              'raster-brightness-min': 0,
              'raster-brightness-max': 1
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
