import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface MapAdapter {
  setView: (coords: [number, number], zoom: number) => void;
  fitBounds: (bounds: any, options?: any) => void;
  invalidateSize?: () => void;
  eachLayer?: (callback: (layer: any) => void) => void;
  removeLayer?: (layer: any) => void;
  setUserLocation?: (coords: [number, number]) => void;
  flashMarker?: (plantId: string, locationIndex: number) => void;
}

interface RoutingControlAdapter {
  setWaypoints: (waypoints: any[]) => void;
}

interface MapContextType {
  map: MapAdapter | null;
  routingControl: RoutingControlAdapter | null;
  setMap: (map: MapAdapter) => void;
  setRoutingControl: (control: RoutingControlAdapter) => void;
}

const MapContext = createContext<MapContextType>({
  map: null,
  routingControl: null,
  setMap: () => {},
  setRoutingControl: () => {},
});

export const useMapContext = () => useContext(MapContext);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMapState] = useState<MapAdapter | null>(null);
  const [routingControl, setRoutingControlState] = useState<RoutingControlAdapter | null>(null);

  const setMap = useCallback((newMap: MapAdapter) => {
    setMapState(newMap);
  }, []);

  const setRoutingControl = useCallback((control: RoutingControlAdapter) => {
    setRoutingControlState(control);
  }, []);

  return (
    <MapContext.Provider value={{ map, routingControl, setMap, setRoutingControl }}>
      {children}
    </MapContext.Provider>
  );
}

