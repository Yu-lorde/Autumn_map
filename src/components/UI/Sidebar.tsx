import { useMapStore } from '../../stores/mapStore';
import { useMapContext } from '../../contexts/MapContext';
import { useEffect } from 'react';

export default function Sidebar(props: { variant?: 'desktop' | 'mobile' } = {}) {
  const { isSidebarOpen, toggleSidebar } = useMapStore();
  const { map } = useMapContext();

  useEffect(() => {
    // 当侧边栏状态改变时，调整地图大小
    // 问题 1 修复：确保 map 和 invalidateSize 都存在后再调用
    // 问题 2 修复：添加清理函数，避免内存泄漏，并优化延迟时间
    if (!map || !map.invalidateSize) return;
    
    const timer = setTimeout(() => {
      // 在回调中再次检查 map 是否存在，确保类型安全
      if (map && map.invalidateSize) {
        map.invalidateSize();
      }
    }, 300); // 延迟确保 DOM 更新完成后再调整地图大小
    
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);

  return (
    <>
      {/* Desktop: 恢复对话前的贴边把手样式 */}
      {(props.variant ?? 'desktop') === 'desktop' && (
        <button
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-[60px] bg-white border-2 border-orange-200/60 border-l-0 rounded-r-lg cursor-pointer z-[1005] flex items-center justify-center transition-all duration-400 hover:bg-amber-50 ${
            isSidebarOpen ? 'left-[380px]' : 'left-0'
          } btn-light-shine btn-shine`}
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
      )}

      {/* Mobile: 不用圆形，改成胶囊按钮 */}
      {(props.variant ?? 'desktop') === 'mobile' && (
        <button
          className="fixed right-4 bottom-24 z-[1005] px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-orange-200/70 shadow-lg text-sm font-bold text-orange-700 hover:bg-amber-50 transition-all btn-light-shine btn-shine"
          onClick={toggleSidebar}
          title="收起/展开列表"
        >
          <span className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 text-primary ${
                isSidebarOpen ? '' : 'rotate-180'
              }`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            列表
          </span>
        </button>
      )}
    </>
  );
}

