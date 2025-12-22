import { useEffect, useState } from 'react';
import MapLibreMap from './components/Map/MapLibreMap';
import PlantList from './components/Plants/PlantList';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import StatusBar from './components/UI/StatusBar';
import { MapProvider } from './contexts/MapContext';
import { useMapStore } from './stores/mapStore';

function App() {
  const { toggleSidebar, setSidebarOpen } = useMapStore();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下了 Ctrl+B (Windows/Linux) 或 Cmd+B (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault(); // 阻止浏览器默认行为
        toggleSidebar();
      }
    };

    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown);

    // 清理函数：组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  // 手机端默认收起列表，避免首屏被抽屉遮住
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const collapseIfMobile = (matches: boolean) => {
      setIsDesktop(matches);
      if (!matches) setSidebarOpen(false);
    };

    collapseIfMobile(mql.matches);

    const onChange = (e: MediaQueryListEvent) => collapseIfMobile(e.matches);
    // Safari < 14
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [setSidebarOpen]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-autumn-bg via-amber-50/50 to-autumn-bg">
      <Header />
      {/* 内容区：只渲染当前端（避免两个 MapLibreMap 同时挂载导致上下文错绑、路线画在隐藏地图上） */}
      <div className="pt-[60px] h-screen box-border relative">
        {isDesktop ? (
          <MapProvider>
            <div className="h-full relative flex">
              <PlantList variant="desktop" />
              <div className="flex-1 relative">
                <MapLibreMap center={[30.3081, 120.0827]} zoom={15} />
              </div>
              <Sidebar variant="desktop" />
            </div>
          </MapProvider>
        ) : (
          <MapProvider>
            <div className="h-full relative">
              <div className="absolute inset-0">
                <MapLibreMap center={[30.3081, 120.0827]} zoom={15} />
              </div>
              <PlantList variant="mobile" />
              <Sidebar variant="mobile" />
            </div>
          </MapProvider>
        )}
      </div>
      <StatusBar />
    </div>
  );
}

export default App;

