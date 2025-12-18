import { useEffect, useRef } from 'react';
import { TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../stores/mapStore';
import { plants } from '../../data/plantsData';
import { mapLayers } from '../../utils/mapUtils';
import { useMapContext } from '../../contexts/MapContext';

// 组件：动态更新地图图层
export function MapLayerUpdater() {
  const map = useMap();
  const { currentLayer } = useMapStore();

  useEffect(() => {
    // 移除所有图层
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // 添加新图层
    const newLayer = mapLayers[currentLayer];
    newLayer.addTo(map);
  }, [map, currentLayer]);

  return null;
}

// 初始图层组件
export function InitialTileLayer() {
  const { currentLayer } = useMapStore();
  
  const getTileUrl = () => {
    if (currentLayer === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  };

  return (
    <TileLayer
      url={getTileUrl()}
      attribution={currentLayer === 'satellite' ? 'Esri' : 'CartoDB'}
    />
  );
}

// 组件：初始化路由控制和地图实例
export function RoutingControl() {
  const map = useMap();
  const { setMap, setRoutingControl } = useMapContext();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    setMap(map);
    
    if (!routingControlRef.current) {
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
        },
        createMarker: () => null
      });
      routingControl.addTo(map);
      routingControlRef.current = routingControl;
      setRoutingControl(routingControl);
    }

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, setMap, setRoutingControl]);

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

