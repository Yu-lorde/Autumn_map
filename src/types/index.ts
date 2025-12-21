// 植物位置信息（每个位置有自己的坐标和照片）
export interface PlantLocation {
  coords: [number, number]; // [latitude, longitude]
  img: string; // 该位置的照片
}

// 植物信息（共享名称、说明等，可以有多个位置）
export interface Plant {
  id: string;
  name: string;
  latin: string;
  tag: string;
  description: string;
  locations: PlantLocation[]; // 多个位置，每个位置有自己的坐标和照片
}

export type MapLayerType = 'satellite' | 'light';

export interface MapState {
  currentLayer: MapLayerType;
  userLocation: [number, number] | null;
  isSidebarOpen: boolean;
}




