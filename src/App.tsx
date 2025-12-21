import { useEffect } from 'react';
import MapLibreMap from './components/Map/MapLibreMap';
import PlantList from './components/Plants/PlantList';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import StatusBar from './components/UI/StatusBar';
import { MapProvider } from './contexts/MapContext';
import { useMapStore } from './stores/mapStore';

function App() {
  const { toggleSidebar } = useMapStore();

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

  return (
    <MapProvider>
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-autumn-bg via-amber-50/50 to-autumn-bg">
        <Header />
        <div className="flex h-screen pt-[60px] box-border relative">
          <PlantList />
          <div className="flex-1 relative">
            <MapLibreMap center={[30.3081, 120.0827]} zoom={15} />
          </div>
          <Sidebar />
        </div>
        <StatusBar />
      </div>
    </MapProvider>
  );
}

export default App;

