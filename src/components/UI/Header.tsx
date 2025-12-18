import { useGeolocation } from '../../hooks/useGeolocation';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import L from 'leaflet';

export default function Header() {
  const { getCurrentPosition, isLoading } = useGeolocation();
  const { setUserLocation } = useMapStore();
  const { map } = useMapContext();

  const handleLocateMe = async () => {
    if (!map) return;
    
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      map.setView(coords, 17);
      
      // 添加用户位置标记
      const circleMarker = L.circleMarker(coords, {
        radius: 8,
        fillColor: '#2563eb',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);
      circleMarker.bindTooltip("您在这里").openTooltip();
    } catch (error) {
      console.error('定位失败:', error);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 h-[60px] bg-white/92 backdrop-blur-md z-[1100] flex items-center justify-between px-5 shadow-sm border-b border-black/5">
      <h1 className="m-0 text-xl text-primary font-bold">
        浙江大学紫金港校区 · 秋季植物地图
      </h1>
      <div className="flex items-center gap-2">
        <button
          className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1 hover:bg-primary/90"
          onClick={handleLocateMe}
          disabled={isLoading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {isLoading ? '定位中...' : '我的位置'}
        </button>
      </div>
    </header>
  );
}

