import { useEffect, useRef, useMemo } from 'react';
import { TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../stores/mapStore';
import { plants } from '../../data/plantsData';
import { useMapContext } from '../../contexts/MapContext';

// 组件：动态更新地图图层
export function MapLayerUpdater() {
  const { currentLayer } = useMapStore();
  const map = useMap();
  const layerChangedRef = useRef(false);
  
  const tileUrl = useMemo(() => {
    if (currentLayer === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  }, [currentLayer]);

  const attribution = useMemo(() => {
    return currentLayer === 'satellite' ? 'Esri' : 'CartoDB';
  }, [currentLayer]);

  // 图层切换时确保地图大小正确更新
  useEffect(() => {
    if (map && layerChangedRef.current) {
      // 图层切换后，确保地图重新计算大小
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    }
    layerChangedRef.current = true;
  }, [map, currentLayer]);

  return (
    <TileLayer
      url={tileUrl}
      attribution={attribution}
      key={currentLayer}
      minZoom={10}
      maxZoom={18}
      tileSize={256}
      zoomOffset={0}
      updateWhenIdle={false}
      updateWhenZooming={true}
      keepBuffer={2}
      noWrap={false}
    />
  );
}

// 组件：地图初始化 - 确保地图容器正确初始化
export function MapInitializer() {
  const map = useMap();
  const { setMap } = useMapContext();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && map) {
      // 等待地图完全准备好
      map.whenReady(() => {
        // 设置地图实例
        setMap(map);
        
        // 确保地图大小正确计算
        setTimeout(() => {
          map.invalidateSize();
        }, 0);
        
        initializedRef.current = true;
      });
    }
  }, [map, setMap]);

  return null;
}

// 组件：初始化路由控制和地图实例
export function RoutingControl() {
  const map = useMap();
  const { setRoutingControl } = useMapContext();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!routingControlRef.current && map) {
      const routingControl = L.Routing.control({
        waypoints: [],
        router: L.Routing.osrmv1({ 
          serviceUrl: 'https://router.project-osrm.org/route/v1' 
        }),
        show: false,
        addWaypoints: false,
        lineOptions: { 
          styles: [{ color: '#1e622e', weight: 6, opacity: 0.8 }],
          extendToWaypoints: false,
          missingRouteTolerance: 0
        }
      });
      routingControl.addTo(map);
      routingControlRef.current = routingControl;
      setRoutingControl(routingControl);
    }

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

// 组件：植物标记
export function PlantMarkers() {
  return (
    <>
      {plants.map((plant) => (
        <Marker key={plant.id} position={plant.coords}>
          <Popup>
            <strong>{plant.name}</strong>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

