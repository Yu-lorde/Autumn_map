import { Plant } from '../types';
import { withBase } from '../utils/publicUrl';

/**
 * 获取植物图片路径
 * 默认使用 .jpg 扩展名，PlantImage 组件会自动尝试 .png, .webp 等其他格式
 * 优先使用本地图片：plant-images/{plantId}-{locationIndex}.jpg（会自动补齐 base）
 * 如果本地图片不存在，PlantImage 组件会自动使用备用在线图片
 */
function getPlantImagePath(plantId: string, locationIndex: number): string {
  return withBase(`plant-images/${plantId}-${locationIndex}.jpg`);
}

// 植物数据：每个植物可以有多个位置，共享名称、说明等信息
// 注意：img 字段会自动优先使用本地图片（plant-images/{plantId}-{locationIndex}.jpg）
// 如果本地图片不存在，PlantImage 组件会自动使用备用在线图片URL
export const plants: Plant[] = [
  {
    id: 'p1',
    name: '枫香树',
    latin: 'Liquidambar formosana',
    tag: '芳香',
    description: '坐标数据：30.309452N，120.078723E\n植物志记录：落叶乔木，高达30米，胸径最大可达1米，树皮灰褐色，方块状剥落；小枝干后灰色，被柔毛，略有皮孔；芽体卵形，长约1厘米，略被微毛，鳞状苞片敷有树脂，干后棕黑色，有光泽。叶薄革质，阔卵形，掌状3裂，中央裂片较长，先端尾状渐尖；两侧裂片平展；基部心形旁均有种植。\n气味数据：有清凉气味，有药用价值\n情绪数据：心旷神怡，放松身心',
    locations: [
      {
        coords: [30.309452, 120.078723],
        img: getPlantImagePath('p1', 0)
      }
      // 示例：如何添加多个位置（同一植物在不同位置）
      // {
      //   coords: [30.3100, 120.0820],  // 第二个位置的坐标
      //   img: 'https://images.unsplash.com/photo-第二个位置的图片?w=800&q=60'  // 第二个位置的照片
      // },
      // {
      //   coords: [30.3110, 120.0830],  // 第三个位置的坐标
      //   img: 'https://images.unsplash.com/photo-第三个位置的图片?w=800&q=60'  // 第三个位置的照片
      // }
    ]
  },
  {
    id: 'P2',
    name: '红枫',
    latin: 'Acer palmatum Atropurpureum',
    tag: '红叶',
    description: '坐标数据：30.304790 N，120.075703 E\n植物志记录：园艺种。落叶小乔木，高5～8 m；树冠伞形，枝条开张，细弱。单叶对生，近圆形，薄纸质，掌状7～9深裂，裂深常为全叶片的1/2～1/3，基部心形，裂片卵状长椭圆形至披针形，先端尖，有细锐重锯齿，背面脉腋有白簇毛。伞房花序径约6～8 mm，萼片暗红色，花瓣紫色。果长1～2.5 cm，两翅开展成钝角。花期5月；果期9～10月。叶片常年红色或紫红色，枝条紫红色。\n气味数据：干燥的草本香，略带焦糖微甜\n情绪数据：宁静而幸福',
    locations: [
      {
        coords: [30.304790, 120.075703],
        img: getPlantImagePath('P2', 0)
      }
    ]
  },
  {
    id: 'P3',
    name: '法国梧桐（二球悬铃木）',
    latin: 'Platanus orientalis',
    tag: '清冷',
    description: '坐标数据：30.306485 N，120.079155 E\n植物志记录：叶大乔木，高达30米，树皮薄片状脱落；嫩枝被黄褐色绒毛，老枝秃净，干后红褐色，有细小皮孔。叶大，轮廓阔卵形，宽9-18厘米，长8-16厘米，基部浅三角状心形，或近于平截，上部掌状5-7裂，稀为3裂，中央裂片深裂过半，长7-9厘米，宽4-6厘米，两侧裂片稍短，边缘有少数裂片状粗齿，上下两面初时被灰黄色毛被，以后脱落，仅在背脉上有毛，掌状脉5条或3条，从基部发出\n气味数据：淡淡青草香，有微微发酵感\n情绪数据：有一点清冷的感觉',
    locations: [
      {
        coords: [30.306485, 120.079155],
        img: getPlantImagePath('P3', 0)
      }
    ]
  },
  {
    id: 'P4',
    name: '桂花（木樨）',
    latin: 'Osmanthus fragrans',
    tag: '馥郁',
    description: '坐标数据：30.299785 N，120.078075 E\n植物志记录：绿乔木或灌木，高3-5米，最高可达18米；树皮灰褐色。小枝黄褐色，无毛。叶片革质，椭圆形、长椭圆形或椭圆状披针形，长7-14.5厘米，宽2.6-4.5厘米，先端渐尖；花极芳香；花萼长约1毫米，裂片稍不整齐；花冠黄白色、淡黄色、黄色或桔红色\n气味数据：极其芳香，有蜜香和果脯香，清雅悠远\n情绪数据：温和，愉悦，积极',
    locations: [
      {
        coords: [30.299785, 120.078075],
        img: getPlantImagePath('P4', 0)
      },
    ]
  },
  {
    id: 'P5',
    name: '鹅掌楸',
    latin: 'Liriodendron chinense',
    tag: '清雅',
    description: '坐标数据：30.300303 N，120.077620 E\n植物志记录：乔木，高达40米，胸径1米以上，小枝灰色或灰褐色。叶马褂状，长4-12（18）厘米，近基部每边具1侧裂片，先端具2浅裂，下面苍白色，叶柄长4-8（-16）厘米。\n气味数据：介于柑橘、松针与薄荷之间的清澈气息\n情绪数据：平静、安宁',
    locations: [
      {
        coords: [30.300303, 120.077620],
        img: getPlantImagePath('P5', 0)
      }
    ]
  },
  {
    id: 'P6',
    name: '金钱松',
    latin: 'Pseudolarix amabilis',
    tag: '别致',
    description: '坐标数据：30.302559 N，120.07825 E\n植物志记录：树皮灰褐或灰色，裂成不规则鳞状块片；大枝不规则轮生；枝有长枝和短枝；叶在长枝上螺旋状排列，散生，在短枝上簇生状，辐射平展呈圆盘形，线形，柔软，长2-5.5厘米，宽1.5-4毫米，上部稍宽，上面中脉微隆起，下面中脉明显，每边有5-14条气孔线\n气味数据：柑橘-松脂清香，防虫防腐\n情绪数据：温和、坚定',
    locations: [
      {
        coords: [30.302559, 120.07825],
        img: getPlantImagePath('P6', 0)
      }
    ]
  },
];

// 展平的植物实例（用于地图标记和列表显示）
// 每个位置都会生成一个独立的实例，但共享植物信息
export interface PlantInstance {
  plantId: string; // 所属植物的ID
  locationIndex: number; // 在植物locations数组中的索引
  name: string;
  latin: string;
  tag: string;
  description: string;
  coords: [number, number];
  img: string;
}

// 获取所有植物实例（展平后的数据，用于地图标记）
export function getAllPlantInstances(): PlantInstance[] {
  const instances: PlantInstance[] = [];
  
  plants.forEach(plant => {
    plant.locations.forEach((location, index) => {
      instances.push({
        plantId: plant.id,
        locationIndex: index,
        name: plant.name,
        latin: plant.latin,
        tag: plant.tag,
        description: plant.description,
        coords: location.coords,
        img: location.img
      });
    });
  });
  
  return instances;
}

// 获取唯一的植物列表（用于侧边栏卡片显示，每个植物只显示一次）
export function getUniquePlants(): PlantInstance[] {
  return plants.map(plant => ({
    plantId: plant.id,
    locationIndex: 0,
    name: plant.name,
    latin: plant.latin,
    tag: plant.tag,
    description: plant.description,
    coords: plant.locations[0].coords,
    img: plant.locations[0].img
  }));
}

// 默认备用起点（浙大南门）
export const FALLBACK_START: [number, number] = [30.300644, 120.084806];




