import { createContext, useContext, ReactNode, useState } from 'react';
import L from 'leaflet';

interface MapContextType {
  map: L.Map | null;
  routingControl: L.Routing.Control | null;
  setMap: (map: L.Map) => void;
  setRoutingControl: (control: L.Routing.Control) => void;
}

const MapContext = createContext<MapContextType>({
  map: null,
  routingControl: null,
  setMap: () => {},
  setRoutingControl: () => {},
});

export const useMapContext = () => useContext(MapContext);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMapState] = useState<L.Map | null>(null);
  const [routingControl, setRoutingControlState] = useState<L.Routing.Control | null>(null);

  const setMap = (newMap: L.Map) => {
    setMapState(newMap);
  };

  const setRoutingControl = (control: L.Routing.Control) => {
    setRoutingControlState(control);
  };

  return (
    <MapContext.Provider value={{ map, routingControl, setMap, setRoutingControl }}>
      {children}
    </MapContext.Provider>
  );
}

