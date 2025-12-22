import { plants } from '../../data/plantsData';
import type { PlantInstance } from '../../data/plantsData';
import PlantCard from './PlantCard';
import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { FALLBACK_START } from '../../data/plantsData';
import { showStatus, hideStatus } from '../UI/StatusBar';
import { useState, useEffect, useRef, useCallback } from 'react';
import NavigationSheet from '../UI/NavigationSheet';
import { agentLog } from '../../utils/agentLog';

export default function PlantList(props: { variant?: 'desktop' | 'mobile' } = {}) {
  const { isSidebarOpen, setSidebarOpen } = useMapStore();
  const { map, routingControl } = useMapContext();
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0);
  const [navDest, setNavDest] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [navInternal, setNavInternal] = useState<{ plantId: string; locationIndex: number } | null>(null);
  // 为每个植物存储当前显示的位置索引
  const [plantLocationIndices, setPlantLocationIndices] = useState<Record<string, number>>(
    plants.reduce((acc, plant) => {
      acc[plant.id] = 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // 触摸手势相关状态
  const drawerRef = useRef<HTMLElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    setIsDragging(true);
    setDragOffset(0);
  }, []);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    // 只允许向下拖动（正值），限制最大拖动距离
    if (deltaY > 0) {
      setDragOffset(Math.min(deltaY, 300));
    }
  }, []);

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    // 如果下滑超过 80px，则收起抽屉
    if (deltaY > 80) {
      setSidebarOpen(false);
    }
    
    // 重置拖动状态和偏移
    setIsDragging(false);
    setDragOffset(0);
  }, [setSidebarOpen]);

  // 点击地图区域收起抽屉（仅移动端）
  useEffect(() => {
    // 只在移动端且侧边栏打开时启用
    if (props.variant !== 'mobile' || !isSidebarOpen) return;
    
    // 额外检查：确保当前视口确实是移动端宽度
    // 因为手机端和电脑端的 PlantList 都挂载在 DOM 中，只是通过 CSS 隐藏
    const isMobileViewport = () => window.innerWidth < 768;
    if (!isMobileViewport()) return;

    const handleMapClick = (e: MouseEvent | TouchEvent) => {
      // 再次检查视口宽度，防止窗口大小改变
      if (!isMobileViewport()) return;
      
      // 检查点击目标是否在抽屉外部
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        // 确保不是点击在 Sidebar 按钮上
        const target = e.target as HTMLElement;
        if (target.closest('[title="收起/展开列表"]') || target.closest('.plant-marker')) {
          return;
        }
        setSidebarOpen(false);
      }
    };

    // 延迟添加监听器，避免与打开抽屉的点击冲突
    const timer = setTimeout(() => {
      document.addEventListener('click', handleMapClick);
      document.addEventListener('touchend', handleMapClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleMapClick);
      document.removeEventListener('touchend', handleMapClick);
    };
  }, [props.variant, isSidebarOpen, setSidebarOpen]);

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

  // 点击地图钉时，让左侧卡片自动切换到对应植物
  useEffect(() => {
    const onMarkerClick = (e: Event) => {
      const ce = e as CustomEvent<{ plantId: string; locationIndex: number }>;
      const plantId = ce.detail?.plantId;
      const locationIndex = ce.detail?.locationIndex ?? 0;
      if (!plantId) return;

      const idx = plants.findIndex(p => p.id === plantId);
      if (idx < 0) return;

      setCurrentPlantIndex(idx);
      setPlantLocationIndices(prev => ({ ...prev, [plantId]: locationIndex }));
    };

    window.addEventListener('plant-marker-click', onMarkerClick as EventListener);
    return () => window.removeEventListener('plant-marker-click', onMarkerClick as EventListener);
  }, []);

  const handleNavigate = (id: string) => {
    const plant = plants.find(p => p.id === id);
    if (!plant) return;
    
    const locationIndex = plantLocationIndices[id] || 0;
    const location = plant.locations[locationIndex];

    // 打开底部“选择地图”面板（不再在应用内画路线）
    setNavDest({ lat: location.coords[0], lng: location.coords[1], name: `${plant.name}${plant.locations.length > 1 ? `-${locationIndex + 1}` : ''}` });
    setNavInternal({ plantId: id, locationIndex });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F',location:'PlantList.tsx:handleNavigate',message:'open navigation sheet',data:{plantId:id,locationIndex,hasMap:!!map,hasRoutingControl:!!routingControl},timestamp:Date.now()})}).catch(()=>{});
    agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F',location:'PlantList.tsx:handleNavigate:beacon',message:'open navigation sheet',data:{plantId:id,locationIndex,hasMap:!!map,hasRoutingControl:!!routingControl},timestamp:Date.now()});
    // #endregion
  };

  const handleInternalNavigate = async (dest: { lat: number; lng: number; name?: string }, plantInfo?: { plantId: string; locationIndex: number }) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'PlantList.tsx:handleInternalNavigate(entry)',message:'handleInternalNavigate called',data:{hasPlantInfo:!!plantInfo,hasMap:!!map,hasRoutingControl:!!routingControl,destLatFinite:Number.isFinite(dest?.lat),destLngFinite:Number.isFinite(dest?.lng)},timestamp:Date.now()})}).catch(()=>{});
    agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'PlantList.tsx:handleInternalNavigate(entry):beacon',message:'handleInternalNavigate called',data:{hasPlantInfo:!!plantInfo,hasMap:!!map,hasRoutingControl:!!routingControl,destLatFinite:Number.isFinite(dest?.lat),destLngFinite:Number.isFinite(dest?.lng)},timestamp:Date.now()});
    // #endregion

    if (!plantInfo) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'PlantList.tsx:handleInternalNavigate',message:'early return: missing plantInfo',data:{},timestamp:Date.now()})}).catch(()=>{});
      agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'PlantList.tsx:handleInternalNavigate(missingPlantInfo):beacon',message:'early return: missing plantInfo',data:{},timestamp:Date.now()});
      // #endregion
      return;
    }
    const plant = plants.find(p => p.id === plantInfo.plantId);
    if (!plant || !map || !routingControl) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4eae8db4-22c8-438a-9d91-32fd1911a281',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'PlantList.tsx:handleInternalNavigate',message:'early return: missing plant/map/routingControl',data:{hasPlant:!!plant,hasMap:!!map,hasRoutingControl:!!routingControl},timestamp:Date.now()})}).catch(()=>{});
      agentLog({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'PlantList.tsx:handleInternalNavigate(missingDeps):beacon',message:'early return: missing plant/map/routingControl',data:{hasPlant:!!plant,hasMap:!!map,hasRoutingControl:!!routingControl},timestamp:Date.now()});
      // #endregion
      return;
    }

    const location = plant.locations[plantInfo.locationIndex];
    if (!location) return;

    // 创建 PlantInstance 用于导航（直接使用传入的数据）
    const plantInstance: PlantInstance = {
      plantId: plant.id,
      locationIndex: plantInfo.locationIndex,
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

    showStatus('导航路线已生成');

    // 设置路线
    if (routingControl.setWaypoints) {
      routingControl.setWaypoints([
        { lat: startPoint[0], lng: startPoint[1] },
        { lat: plantInstance.coords[0], lng: plantInstance.coords[1] }
      ]);
    }

    // 自动缩放以适应全路线
    if (map.fitBounds) {
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

    // 移动端自动收起抽屉，让用户看到完整路线
    if (props.variant === 'mobile') {
      setSidebarOpen(false);
    }

    setTimeout(hideStatus, 6000);
  };

  const Content = (
    <>
      <div className="w-full mb-6 text-center px-6 pt-6 md:px-0 md:pt-0 md:mb-6">
        <h2 className="text-xl font-black text-orange-600 m-0 tracking-tight drop-shadow-sm">秋季赏叶推荐</h2>
      </div>

      <div className="w-full relative group" style={{ height: (props.variant ?? 'desktop') === 'mobile' ? 'min(62vh, 420px)' : '420px' }}>
        {/* Carousel Arrows */}
        <button 
          onClick={handlePrev}
          className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white backdrop-blur-sm border-2 border-orange-200/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 -translate-x-2 md:group-hover:translate-x-0 btn-light-shine btn-shine"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <button 
          onClick={handleNext}
          className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white backdrop-blur-sm border-2 border-orange-200/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-x-2 md:group-hover:translate-x-0 btn-light-shine btn-shine"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div className="w-full h-full overflow-hidden px-2 md:px-0">
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
      
      <div className="mt-2 mb-5 md:mb-0 flex gap-1.5 justify-center">
        {plants.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPlantIndex ? 'w-6 shadow-sm' : 'w-1.5 bg-orange-300/50'}`}
            style={idx === currentPlantIndex ? { backgroundColor: '#f97316' } : {}}
          />
        ))}
      </div>
    </>
  );

  return (
    <>
      {(props.variant ?? 'desktop') === 'desktop' && (
        <aside
          className={`bg-white/95 backdrop-blur-sm h-full border-r-2 border-orange-200/60 z-[1000] box-border transition-all duration-400 flex flex-col items-center justify-center relative shadow-lg ${
            isSidebarOpen ? 'w-[380px] p-6' : 'w-0 p-0 -translate-x-full overflow-hidden'
          }`}
          style={{ overflow: isSidebarOpen ? 'visible' : 'hidden' }}
        >
          {Content}
        </aside>
      )}

      {(props.variant ?? 'desktop') === 'mobile' && (
        <aside
          ref={drawerRef}
          className={`fixed left-0 right-0 bottom-0 z-[1000] box-border shadow-lg bg-white/95 backdrop-blur-sm border-t-2 border-orange-200/60 rounded-t-3xl ${
            isSidebarOpen ? '' : 'translate-y-full'
          }`}
          style={{ 
            overflow: isSidebarOpen ? 'visible' : 'hidden',
            transform: isSidebarOpen 
              ? `translateY(${dragOffset}px)` 
              : 'translateY(100%)',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 可拖动的手柄区域 */}
          <div 
            className="pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
            style={{ touchAction: 'none' }}
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-orange-300/80 hover:bg-orange-400/80 transition-colors" />
            <div className="text-center text-xs text-orange-400/70 mt-1">下滑收起</div>
          </div>
          {Content}
        </aside>
      )}

      <NavigationSheet
        isOpen={!!navDest}
        onClose={() => {
          setNavDest(null);
          setNavInternal(null);
        }}
        dest={navDest ?? { lat: 0, lng: 0 }}
        onInternalNavigate={handleInternalNavigate}
        navInternal={navInternal}
        variant={props.variant}
      />
    </>
  );
}
