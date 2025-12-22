import { create } from 'zustand';
import { MapLayerType } from '../types';

interface MapStore {
  currentLayer: MapLayerType;
  userLocation: [number, number] | null;
  isSidebarOpen: boolean;
  
  setLayer: (layer: MapLayerType) => void;
  setUserLocation: (coords: [number, number] | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  currentLayer: 'light',
  userLocation: null,
  isSidebarOpen: true,
  
  setLayer: (layer) => set({ currentLayer: layer }),
  setUserLocation: (coords) => set({ userLocation: coords }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));





