import { useEffect } from 'react';
import { MapContainer, ZoomControl } from 'react-leaflet';
import { MapLayerUpdater, RoutingControl, PlantMarkers, InitialTileLayer } from './components/Map/MapContainer';
import MapControls from './components/Map/MapControls';
import PlantList from './components/Plants/PlantList';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import StatusBar from './components/UI/StatusBar';
import { useMapStore } from './stores/mapStore';
import { MapProvider } from './contexts/MapContext';
import L from 'leaflet';

function MapContent() {
  return (
    <>
      <MapLayerUpdater />
      <PlantMarkers />
      <RoutingControl />
      <MapControls />
      <PlantList />
      <Header />
      <Sidebar />
      <StatusBar />
      <ZoomControl position="bottomright" />
    </>
  );
}

function App() {

  useEffect(() => {
    // 修复 Leaflet 图标路径
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapProvider>
      <div className="h-screen w-screen overflow-hidden">
        <div className={`flex h-screen pt-[60px] box-border relative`}>
          <PlantList />
          <div className="flex-1 relative">
            <MapContainer
              center={[30.3081, 120.0827]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              minZoom={10}
              maxZoom={18}
              scrollWheelZoom={true}
            >
              <MapContent />
            </MapContainer>
          </div>
        </div>
      </div>
    </MapProvider>
  );
}

export default App;

