import { useMapStore } from '../../stores/mapStore';
import { MapLayerType } from '../../types';

export default function MapControls() {
  const { currentLayer, setLayer } = useMapStore();

  const handleSetMapType = (type: MapLayerType) => {
    setLayer(type);
  };

  return (
    <div className="absolute top-20 right-5 z-[1001] flex flex-col gap-2.5">
      <button
        className={`bg-white border-2 rounded-lg shadow-md cursor-pointer w-20 h-15 overflow-hidden flex flex-col items-center justify-center p-0 transition-all ${
          currentLayer === 'satellite' ? 'border-primary' : 'border-white'
        }`}
        onClick={() => handleSetMapType('satellite')}
        id="btn-sat"
      >
        <div
          className="w-full h-10 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/27236/53874')`
          }}
        />
        <span
          className={`text-[10px] font-bold py-0.5 ${
            currentLayer === 'satellite'
              ? 'text-primary bg-primary-light w-full text-center'
              : 'text-slate-500'
          }`}
        >
          实景地图
        </span>
      </button>
      
      <button
        className={`bg-white border-2 rounded-lg shadow-md cursor-pointer w-20 h-15 overflow-hidden flex flex-col items-center justify-center p-0 transition-all ${
          currentLayer === 'light' ? 'border-primary' : 'border-white'
        }`}
        onClick={() => handleSetMapType('light')}
        id="btn-light"
      >
        <div
          className="w-full h-10 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://a.basemaps.cartocdn.com/light_all/16/53874/27236.png')`
          }}
        />
        <span
          className={`text-[10px] font-bold py-0.5 ${
            currentLayer === 'light'
              ? 'text-primary bg-primary-light w-full text-center'
              : 'text-slate-500'
          }`}
        >
          简约导航
        </span>
      </button>
    </div>
  );
}

