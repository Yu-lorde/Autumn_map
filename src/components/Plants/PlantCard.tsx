import { useState } from 'react';
import type { PlantInstance } from '../../data/plantsData';
import { plants } from '../../data/plantsData';

interface PlantCardProps {
  plant: PlantInstance;
  onViewLocation: (id: string, locationIndex?: number) => void;
  onNavigate: (id: string) => void;
  locationCount?: number;
  currentLocationIndex?: number;
  onSwitchLocation?: (direction: 'next' | 'prev') => void;
  onSwitchToLocation?: (index: number) => void;
}

export default function PlantCard({ 
  plant, 
  onViewLocation, 
  onNavigate,
  locationCount = 1,
  currentLocationIndex = 0,
  onSwitchLocation,
  onSwitchToLocation
}: PlantCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 获取该植物的所有位置信息
  const plantData = plants.find(p => p.id === plant.plantId);
  const allLocations = plantData?.locations || [];

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className={`relative w-full h-full perspective-1000 cursor-pointer transition-all duration-500 ${isFlipped ? 'card-flipped' : ''}`}
      onClick={() => !isFlipped && setIsFlipped(true)}
    >
      <div className="card-inner w-full h-full relative preserve-3d">
        {/* Front Side */}
        <div className="card-front bg-amber-50 rounded-2xl shadow-xl overflow-hidden border-2 border-orange-200/60 flex flex-col p-4">
          <div className="relative h-44 rounded-xl overflow-hidden shadow-inner mb-4 border border-orange-200/30">
            <img 
              src={plant.img} 
              alt={plant.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
            <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg backdrop-blur-sm btn-primary-shine">
              {plant.tag}
            </div>
            
            {/* 多个位置时的位置信息标签 */}
            {locationCount > 1 && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-orange-700 text-[10px] px-2 py-1 rounded-full font-bold shadow-md">
                位置 {currentLocationIndex + 1}/{locationCount}
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-orange-800 m-0 tracking-tight">
                  {plant.name}
                  {locationCount > 1 && `-${currentLocationIndex + 1}`}
                </h3>
                <span className="text-xs text-orange-600/70 italic font-semibold uppercase tracking-wider">{plant.latin}</span>
              </div>
              <button
                onClick={handleFlip}
                className="bg-amber-100 text-orange-800 px-3 py-1.5 rounded-lg border-2 border-orange-200/60 hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 group btn-light-shine btn-shine"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">查看详情</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-3">
              <button
                onClick={(e) => handleAction(e, () => onViewLocation(plant.plantId, currentLocationIndex))}
                className="bg-white text-xs font-bold py-3 rounded-xl border-2 border-orange-200/60 transition-all hover:bg-amber-50 flex items-center justify-center gap-1.5 btn-light-shine btn-shine"
                style={{ color: '#f97316' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                定位
              </button>
              <button
                onClick={(e) => handleAction(e, () => onNavigate(plant.plantId))}
                className="bg-primary text-white text-xs font-bold py-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 btn-primary-shine btn-shine"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                导航
              </button>
            </div>
            
            <button 
              onClick={handleFlip}
              className="mt-3 w-full py-2 text-[10px] font-bold text-orange-600/60 uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              点击卡片或此处查看详情
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            
            {/* 多个位置时的位置缩略图预览 */}
            {locationCount > 1 && allLocations.length > 1 && (
              <div className="mt-3 pt-3 border-t border-orange-200/50">
                <div className="text-[9px] font-bold text-orange-600/60 uppercase tracking-wider mb-2 text-center">
                  所有位置预览
                </div>
                <div className="flex items-center gap-2 justify-center relative">
                  {/* 左侧切换按钮 */}
                  {onSwitchLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchLocation('prev');
                      }}
                      className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm border-2 border-orange-200/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-md btn-light-shine btn-shine flex-shrink-0"
                      title="上一个位置"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  )}
                  
                  {/* 缩略图列表 */}
                  <div className="flex gap-2 justify-center flex-1">
                    {allLocations.map((location, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSwitchToLocation) {
                            onSwitchToLocation(idx);
                          }
                        }}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentLocationIndex
                            ? 'border-primary shadow-md scale-105'
                            : 'border-orange-200/40 hover:border-orange-300/60 hover:scale-105'
                        }`}
                        title={`位置 ${idx + 1}`}
                      >
                        <img
                          src={location.img}
                          alt={`${plant.name} 位置 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === currentLocationIndex && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* 右侧切换按钮 */}
                  {onSwitchLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchLocation('next');
                      }}
                      className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm border-2 border-orange-200/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-md btn-light-shine btn-shine flex-shrink-0"
                      title="下一个位置"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="card-back bg-amber-50 rounded-2xl shadow-xl overflow-hidden border-2 border-orange-300/60 p-6 flex flex-col text-orange-900"
          onClick={handleFlip}
        >
          <div className="flex items-center gap-3 mb-6 border-b-2 border-orange-300/50 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-orange-700 shadow-inner border border-orange-200/50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-black m-0 leading-tight text-orange-800">
                {plant.name}
                {locationCount > 1 && `-${currentLocationIndex + 1}`}
              </h3>
              <span className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest">{plant.latin}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
            <p className="text-sm leading-relaxed font-medium text-orange-800/90 first-letter:text-2xl first-letter:font-bold first-letter:mr-1">
              {plant.description}
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t-2 border-orange-300/50 flex items-center justify-center gap-2 text-[11px] font-bold text-orange-600/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-pulse">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            点击返回正面
          </div>
        </div>
      </div>
    </div>
  );
}
