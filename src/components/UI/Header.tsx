import { useGeolocation } from '../../hooks/useGeolocation';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { MapLayerType } from '../../types';

export default function Header() {
  const { getCurrentPosition, isLoading } = useGeolocation();
  const { setUserLocation, currentLayer, setLayer } = useMapStore();
  const { map } = useMapContext();

  const handleLocateMe = async () => {
    if (!map) return;
    
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      if (map.setView) {
        map.setView(coords, 17);
      }
      
      // 更新用户位置标记
      if ((map as any).setUserLocation) {
        (map as any).setUserLocation(coords);
      }
    } catch (error) {
      console.error('定位失败:', error);
    }
  };

  const handleSetMapType = (type: MapLayerType) => {
    setLayer(type);
  };

  return (
    <header className="absolute top-0 left-0 right-0 h-[60px] bg-white/95 backdrop-blur-md z-[1100] flex items-center justify-between px-5 shadow-md border-b-2 border-orange-200/60">
      <div className="flex items-center gap-6">
        <h1 className="m-0 text-xl text-orange-600 font-bold flex items-center gap-2 drop-shadow-sm">
          <span className="text-2xl">🍂</span>
          浙江大学紫金港校区 · 秋季植物地图
        </h1>
        
        {/* 地图切换按钮 */}
        <div className="flex bg-amber-50 p-1 rounded-xl border-2 border-orange-200/50 shadow-sm">
          <button
            onClick={() => handleSetMapType('light')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              currentLayer === 'light' 
                ? 'bg-primary text-white btn-primary-shine btn-shine' 
                : 'text-orange-700/70 hover:text-primary hover:bg-amber-100 btn-light-shine'
            }`}
          >
            简明地图
          </button>
          <button
            onClick={() => handleSetMapType('satellite')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              currentLayer === 'satellite' 
                ? 'bg-primary text-white btn-primary-shine btn-shine' 
                : 'text-orange-700/70 hover:text-primary hover:bg-amber-100 btn-light-shine'
            }`}
          >
            实景地图
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1 hover:scale-105 btn-primary-shine btn-shine"
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
