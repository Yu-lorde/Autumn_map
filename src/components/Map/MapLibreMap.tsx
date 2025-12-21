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
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          className: 'plant-popup'
        }).setDOMContent(popupContainer);

        // 将 popup 添加到引用数组中
        popupsRef.current.push(popup);

        const marker = new maplibregl.Marker({ 
          element: el,
          anchor: 'center' // 确保标记中心点对齐，修复缩放时位置偏移
        })
          .setLngLat([plantInstance.coords[1], plantInstance.coords[0]])
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
