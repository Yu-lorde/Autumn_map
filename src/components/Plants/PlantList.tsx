import { plants } from '../../data/plantsData';
import PlantCard from './PlantCard';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { FALLBACK_START } from '../../data/plantsData';
import { showStatus, hideStatus } from '../UI/StatusBar';
import { useRef } from 'react';
import L from 'leaflet';

export default function PlantList() {
  const { isSidebarOpen } = useMapStore();
  const { map, routingControl } = useMapContext();
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);

  const handleViewLocation = (id: string) => {
    const plant = plants.find((p) => p.id === id);
    if (plant && map) {
      map.setView(plant.coords, 17);
      // 查找并打开对应的marker popup
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const latlng = layer.getLatLng();
          if (Math.abs(latlng.lat - plant.coords[0]) < 0.0001 && 
              Math.abs(latlng.lng - plant.coords[1]) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }
  };

  const handleNavigate = async (id: string) => {
    const plant = plants.find((p) => p.id === id);
    if (!plant || !map || !routingControl) return;

    showStatus('正在请求实时位置以规划最佳路线...');
    
    let startPoint: [number, number];
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000
        });
      });
      startPoint = [position.coords.latitude, position.coords.longitude];
      
      // 清理之前的标记
      if (userLocationMarkerRef.current) {
        map.removeLayer(userLocationMarkerRef.current);
        userLocationMarkerRef.current = null;
      }
      
      // 更新用户位置标记
      const circleMarker = L.circleMarker(startPoint, {
        radius: 8,
        fillColor: '#2563eb',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);
      circleMarker.bindTooltip("您在这里").openTooltip();
      userLocationMarkerRef.current = circleMarker;
    } catch (err) {
      console.warn('Location access denied or timed out:', err);
      startPoint = FALLBACK_START;
      showStatus('定位不可用（请检查权限），为您展示从南门出发的路线');
      setTimeout(hideStatus, 4000);
    }
    
    // 设置路线
    routingControl.setWaypoints([
      L.latLng(startPoint[0], startPoint[1]),
      L.latLng(plant.coords[0], plant.coords[1])
    ]);

    // 自动缩放以适应全路线
    const bounds = L.latLngBounds([startPoint, plant.coords]);
    map.fitBounds(bounds, { padding: [100, 100] });

    if (!document.getElementById('status-bar')?.innerText.includes('南门')) {
      hideStatus();
    }
  };

  return (
    <aside
      className={`bg-slate-50 h-full overflow-y-auto border-r border-slate-200 z-[1000] box-border transition-all duration-400 scrollbar-thin relative ${
        isSidebarOpen ? 'w-[380px] p-4' : 'w-0 p-0 -translate-x-full overflow-hidden'
      }`}
    >
      <div id="plant-list">
        {plants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onViewLocation={handleViewLocation}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </aside>
  );
}

