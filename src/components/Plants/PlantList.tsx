import { plants } from '../../data/plantsData';
import type { PlantInstance } from '../../data/plantsData';
import PlantCard from './PlantCard';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { FALLBACK_START } from '../../data/plantsData';
import { showStatus, hideStatus } from '../UI/StatusBar';
import { useState, useEffect } from 'react';

export default function PlantList() {
  const { isSidebarOpen } = useMapStore();
  const { map, routingControl } = useMapContext();
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0);
  // 为每个植物存储当前显示的位置索引
  const [plantLocationIndices, setPlantLocationIndices] = useState<Record<string, number>>(
    plants.reduce((acc, plant) => {
      acc[plant.id] = 0;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleNext = () => {
    setCurrentPlantIndex((prev) => (prev + 1) % plants.length);
  };

  const handlePrev = () => {
    setCurrentPlantIndex((prev) => (prev - 1 + plants.length) % plants.length);
  };

  // 切换同一植物的不同位置
  const handleSwitchLocation = (plantId: string, direction: 'next' | 'prev' | number) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant || plant.locations.length <= 1) return;
    
    setPlantLocationIndices(prev => {
      const currentIndex = prev[plantId] || 0;
      let newIndex: number;
      
      if (typeof direction === 'number') {
        // 直接切换到指定索引
        newIndex = direction;
      } else if (direction === 'next') {
        newIndex = (currentIndex + 1) % plant.locations.length;
      } else {
        newIndex = (currentIndex - 1 + plant.locations.length) % plant.locations.length;
      }
      
      return { ...prev, [plantId]: newIndex };
    });
  };

  const handleViewLocation = (id: string, locationIndex?: number) => {
    const plant = plants.find(p => p.id === id);
    if (!plant || !map) return;
    
    const targetLocationIndex = locationIndex !== undefined ? locationIndex : (plantLocationIndices[id] || 0);
    const location = plant.locations[targetLocationIndex];
    
    if (location) {
      // 移动地图到目标位置（使用 flyTo 实现平滑动画）
      if (map.setView) {
        map.setView(location.coords, 15);
      }
      
      // 等待地图移动完成后闪烁标记
      setTimeout(() => {
        if (map.flashMarker) {
          map.flashMarker(id, targetLocationIndex);
        }
      }, 1000); // 等待地图移动动画完成
    }
  };

  // 当切换植物时，自动定位
  useEffect(() => {
    if (!map) return;
    
    const plant = plants[currentPlantIndex];
    if (plant) {
      const locationIndex = plantLocationIndices[plant.id] || 0;
      const location = plant.locations[locationIndex];
      if (location) {
        handleViewLocation(plant.id, locationIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlantIndex]);

  // 当切换位置时，自动定位
  useEffect(() => {
    if (!map) return;
    
    // 检查当前显示的植物
    const plant = plants[currentPlantIndex];
    if (plant) {
      const locationIndex = plantLocationIndices[plant.id] || 0;
      const location = plant.locations[locationIndex];
      if (location) {
        handleViewLocation(plant.id, locationIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantLocationIndices]);

  importRouteConfig();

  type RouteEstimate = { minutes: number; source: 'osrm' | 'estimate' };

  async function importRouteConfig() {
    /* lazy import to avoid bundling if unused */
    return await import('../../config/routeConfig');
  }

  const fetchRouteTime = async (profile: 'foot' | 'bicycle', start: [number, number], end: [number, number]): Promise<RouteEstimate> => {
    // Map app-level profiles to OSRM-supported profiles
    const profileMap: Record<string, string> = { foot: 'walking', bicycle: 'cycling' };
    const osrmProfile = profileMap[profile] || profile;

    // Helper: haversine fallback estimate (meters)
    const haversineDistance = (a: [number, number], b: [number, number]) => {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371000; // Earth radius in meters
      const dLat = toRad(b[0] - a[0]);
      const dLon = toRad(b[1] - a[1]);
      const lat1 = toRad(a[0]);
      const lat2 = toRad(b[0]);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
      return R * c;
    };

    // Load config values
    const routeCfg = await importRouteConfig();
    const walkFactor = routeCfg.WALK_ROUTE_FACTOR ?? 1.2;
    const bikeFactor = routeCfg.BIKE_ROUTE_FACTOR ?? 1.1;
    const walkSpeed = routeCfg.WALK_SPEED_M_PER_MIN ?? 80;
    const bikeSpeed = routeCfg.BIKE_SPEED_M_PER_MIN ?? 250;

    try {
      const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=false&annotations=duration`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      // OSRM returns code === 'Ok' on success
      if (data && data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
        const durationSec = data.routes[0].duration; // seconds
        const minutes = Math.max(1, Math.round(durationSec / 60));
        return { minutes, source: 'osrm' };
      }

      throw new Error('No route returned');
    } catch (err) {
      console.warn(`Failed to fetch ${osrmProfile} route, using fallback estimate:`, err);

      // Fallback: improved straight-line estimate using route factor
      const dist = haversineDistance(start, end);
      const factor = profile === 'bicycle' ? bikeFactor : walkFactor;
      const speed = profile === 'bicycle' ? bikeSpeed : walkSpeed;
      const adjustedDistance = Math.max(1, dist * factor);
      const estimateMinutes = Math.max(1, Math.round(adjustedDistance / speed));
      return { minutes: estimateMinutes, source: 'estimate' };
    }
  };

  const handleNavigate = async (id: string) => {
    const plant = plants.find(p => p.id === id);
    if (!plant || !map || !routingControl) return;
    
    const locationIndex = plantLocationIndices[id] || 0;
    const location = plant.locations[locationIndex];
    
    // 创建 PlantInstance 用于导航
    const plantInstance: PlantInstance = {
      plantId: plant.id,
      locationIndex: locationIndex,
      name: plant.name,
      latin: plant.latin,
      tag: plant.tag,
      description: plant.description,
      coords: location.coords,
      img: location.img
    };

    showStatus('正在规划最佳路线...');
    
    let startPoint: [number, number];
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        });
      });
      startPoint = [position.coords.latitude, position.coords.longitude];
      
      // 更新用户位置标记
      if (map.setUserLocation) {
        map.setUserLocation(startPoint);
      }
    } catch (err) {
      console.warn('Location access denied or timed out:', err);
      startPoint = FALLBACK_START;
      showStatus('定位不可用，为您展示从南门出发的路线');
    }
    
    // 获取步行和骑行时间（并显示来源）
    const [walkEst, bikeEst] = await Promise.all([
      fetchRouteTime('foot', startPoint, plantInstance.coords),
      fetchRouteTime('bicycle', startPoint, plantInstance.coords)
    ]);

    const walkLabel = walkEst.source === 'osrm' ? `步行约 ${walkEst.minutes} 分钟` : `步行约 ${walkEst.minutes} 分钟（估算）`;
    const bikeLabel = bikeEst.source === 'osrm' ? `骑行约 ${bikeEst.minutes} 分钟` : `骑行约 ${bikeEst.minutes} 分钟（估算）`;

    const statusMsg = `建议路线已生成：${walkLabel}，${bikeLabel}`;
    showStatus(statusMsg);
    
    // 设置路线
    if (routingControl.setWaypoints) {
      routingControl.setWaypoints([
        { lat: startPoint[0], lng: startPoint[1] },
        { lat: plantInstance.coords[0], lng: plantInstance.coords[1] }
      ]);
    }

    // 自动缩放以适应全路线
    if (map.fitBounds) {
      // 构造简单的 bounds 对象兼容适配器
      const bounds = {
        getSouthWest: () => ({ 
          lat: Math.min(startPoint[0], plantInstance.coords[0]), 
          lng: Math.min(startPoint[1], plantInstance.coords[1]) 
        }),
        getNorthEast: () => ({ 
          lat: Math.max(startPoint[0], plantInstance.coords[0]), 
          lng: Math.max(startPoint[1], plantInstance.coords[1]) 
        })
      };
      map.fitBounds(bounds, { padding: 100 });
    }

    setTimeout(hideStatus, 6000);
  };

  return (
    <aside
      className={`bg-white/95 backdrop-blur-sm h-full border-r-2 border-orange-200/60 z-[1000] box-border transition-all duration-400 flex flex-col items-center justify-center relative shadow-lg ${
        isSidebarOpen ? 'w-[380px] p-6' : 'w-0 p-0 -translate-x-full overflow-hidden'
      }`}
      style={{ overflow: isSidebarOpen ? 'visible' : 'hidden' }}
    >
      <div className="w-full mb-6 text-center">
        <h2 className="text-xl font-black text-orange-600 m-0 tracking-tight drop-shadow-sm">秋季赏叶推荐</h2>
      </div>

      <div className="w-full relative group" style={{ height: '420px' }}>
        {/* Carousel Arrows */}
        <button 
          onClick={handlePrev}
          className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white backdrop-blur-sm border-2 border-orange-200/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 btn-light-shine btn-shine"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <button 
          onClick={handleNext}
          className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white backdrop-blur-sm border-2 border-orange-200/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 btn-light-shine btn-shine"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div className="w-full h-full overflow-hidden">
          <div 
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentPlantIndex * 100}%)` }}
          >
            {plants.map((plant) => {
              const locationIndex = plantLocationIndices[plant.id] || 0;
              const currentLocation = plant.locations[locationIndex];
              const plantInstance: PlantInstance = {
                plantId: plant.id,
                locationIndex: locationIndex,
                name: plant.name,
                latin: plant.latin,
                tag: plant.tag,
                description: plant.description,
                coords: currentLocation.coords,
                img: currentLocation.img
              };
              
              return (
                <div key={plant.id} className="min-w-full px-4 box-border h-full flex items-center justify-center relative">
                  <div className="w-full h-[380px] relative" style={{ perspective: '1000px' }}>
                    {/* 显示当前选中的位置卡片 */}
                    <PlantCard
                      plant={plantInstance}
                      onViewLocation={handleViewLocation}
                      onNavigate={handleNavigate}
                      locationCount={plant.locations.length}
                      currentLocationIndex={locationIndex}
                      onSwitchLocation={(direction) => handleSwitchLocation(plant.id, direction)}
                      onSwitchToLocation={(index) => handleSwitchLocation(plant.id, index)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-2 flex gap-1.5 justify-center">
        {plants.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPlantIndex ? 'w-6 shadow-sm' : 'w-1.5 bg-orange-300/50'}`}
            style={idx === currentPlantIndex ? { backgroundColor: '#f97316' } : {}}
          />
        ))}
      </div>
    </aside>
  );
}
