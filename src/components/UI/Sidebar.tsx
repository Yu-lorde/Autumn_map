import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { useEffect } from 'react';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useMapStore();
  const { map } = useMapContext();

  useEffect(() => {
    // 当侧边栏状态改变时，调整地图大小
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 400);
    }
  }, [isSidebarOpen, map]);

  return (
    <>
      <button
        className={`absolute top-1/2 -translate-y-1/2 w-6 h-[60px] bg-slate-50 border border-slate-200 border-l-0 rounded-r-lg cursor-pointer z-[1005] flex items-center justify-center transition-all duration-400 shadow-md ${
          isSidebarOpen ? 'left-[380px]' : 'left-0'
        }`}
        onClick={toggleSidebar}
        title="收起/展开列表"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-400 text-primary ${
            isSidebarOpen ? '' : 'rotate-180'
          }`}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </>
  );
}

