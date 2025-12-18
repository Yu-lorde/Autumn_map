import { Plant } from '../../types';

interface PlantCardProps {
  plant: Plant;
  onViewLocation: (id: string) => void;
  onNavigate: (id: string) => void;
}

export default function PlantCard({ plant, onViewLocation, onNavigate }: PlantCardProps) {
  return (
    <div className="bg-white rounded-2xl mb-5 overflow-hidden shadow-md transition-all duration-300 border border-slate-100 cursor-pointer min-w-[340px] hover:-translate-y-1 hover:shadow-xl hover:border-primary">
      <div className="relative h-40">
        <img
          src={plant.img}
          alt={plant.name}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-[11px] backdrop-blur-sm">
          {plant.tag}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">{plant.name}</h3>
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 bg-white text-primary border border-primary"
            onClick={(e) => {
              e.stopPropagation();
              onViewLocation(plant.id);
            }}
          >
            查看位置
          </button>
          <button
            className="flex-1 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 bg-primary text-white"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(plant.id);
            }}
          >
            开始导航
          </button>
        </div>
      </div>
    </div>
  );
}

