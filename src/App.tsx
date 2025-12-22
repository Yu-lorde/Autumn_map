import { useEffect } from 'react';
import MapLibreMap from './components/Map/MapLibreMap';
import PlantList from './components/Plants/PlantList';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import StatusBar from './components/UI/StatusBar';
import { MapProvider } from './contexts/MapContext';
import { useMapStore } from './stores/mapStore';

function App() {
  const { toggleSidebar, setSidebarOpen } = useMapStore();

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
    if (!mql.matches) setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MapProvider>
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-autumn-bg via-amber-50/50 to-autumn-bg">
        <Header />
        {/* 内容区：手机/电脑完全分开 */}
        <div className="pt-[60px] h-screen box-border relative">
          {/* Desktop: 恢复原始布局（侧边栏 + 地图 + 把手） */}
          <div className="hidden md:flex h-full relative">
            <PlantList variant="desktop" />
            <div className="flex-1 relative">
              <MapLibreMap center={[30.3081, 120.0827]} zoom={15} />
            </div>
            <Sidebar variant="desktop" />
          </div>

          {/* Mobile: 地图全屏 + 底部抽屉 + 浮动入口 */}
          <div className="md:hidden h-full relative">
            <div className="absolute inset-0">
              <MapLibreMap center={[30.3081, 120.0827]} zoom={15} />
            </div>
            <PlantList variant="mobile" />
            <Sidebar variant="mobile" />
          </div>
        </div>
        <StatusBar />
      </div>
    </MapProvider>
  );
}

export default App;

