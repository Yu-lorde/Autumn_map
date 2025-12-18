export interface Plant {
  id: string;
  name: string;
  latin: string;
  img: string;
  coords: [number, number]; // [latitude, longitude]
  tag: string;
  description: string;
}

export type MapLayerType = 'satellite' | 'light';

export interface MapState {
  currentLayer: MapLayerType;
  userLocation: [number, number] | null;
  isSidebarOpen: boolean;
}


