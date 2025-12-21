import { Plant } from '../types';

/**
 * 获取植物图片路径
 * 默认使用 .jpg 扩展名，PlantImage 组件会自动尝试 .png, .webp 等其他格式
 * 优先使用本地图片：/plant-images/{plantId}-{locationIndex}.jpg
 * 如果本地图片不存在，PlantImage 组件会自动使用备用在线图片
 */
function getPlantImagePath(plantId: string, locationIndex: number): string {
  return `/plant-images/${plantId}-${locationIndex}.jpg`;
}

// 植物数据：每个植物可以有多个位置，共享名称、说明等信息
// 注意：img 字段会自动优先使用本地图片（/plant-images/{plantId}-{locationIndex}.jpg）
// 如果本地图片不存在，PlantImage 组件会自动使用备用在线图片URL
export const plants: Plant[] = [
  {
    id: 'p1',
    name: '枫香树',
    latin: 'Liquidambar formosana',
    tag: '金黄',
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
    id: 'p2',
    name: '红枫',
    latin: 'Acer palmatum Atropurpureum',
    tag: '红叶',
    description: '坐标数据：30.304790 N，120.075703 E\n植物志记录：园艺种。落叶小乔木，高5～8 m；树冠伞形，枝条开张，细弱。单叶对生，近圆形，薄纸质，掌状7～9深裂，裂深常为全叶片的1/2～1/3，基部心形，裂片卵状长椭圆形至披针形，先端尖，有细锐重锯齿，背面脉腋有白簇毛。伞房花序径约6～8 mm，萼片暗红色，花瓣紫色。果长1～2.5 cm，两翅开展成钝角。花期5月；果期9～10月。叶片常年红色或紫红色，枝条紫红色。\n气味数据：干燥的草本香，略带焦糖微甜\n情绪数据：宁静而幸福',
    locations: [
      {
        coords: [30.304790, 120.075703],
        img: getPlantImagePath('p2', 0)
      }
    ]
  },
  {
    id: 'p3',
    name: '法国梧桐（三球悬铃木）',
    latin: 'Platanus orientalis',
    tag: '馥郁',
    description: '坐标数据：30.306485 N，120.079155 E\n植物志记录：叶大乔木，高达30米，树皮薄片状脱落；嫩枝被黄褐色绒毛，老枝秃净，干后红褐色，有细小皮孔。叶大，轮廓阔卵形，宽9-18厘米，长8-16厘米，基部浅三角状心形，或近于平截，上部掌状5-7裂，稀为3裂，中央裂片深裂过半，长7-9厘米，宽4-6厘米，两侧裂片稍短，边缘有少数裂片状粗齿，上下两面初时被灰黄色毛被，以后脱落，仅在背脉上有毛，掌状脉5条或3条，从基部发出\n气味数据：淡淡青草香，有微微发酵感\n情绪数据：有一点清冷的感觉',
    locations: [
      {
        coords: [30.306485, 120.079155],
        img: getPlantImagePath('p3', 0)
      }
    ]
  },
  {
    id: 'p4',
    name: '大红袍',
    latin: 'Camellia sinensis',
    tag: '红叶',
    description: '常绿灌木。秋季叶片呈现鲜艳的红色，在紫金港校区多个区域均有种植，是秋季校园中一道亮丽的风景线。',
    locations: [
      {
        coords: [30.3050, 120.0820],
        img: getPlantImagePath('p4', 0)
      },
    ]
  },
  {
    id: 'P10',
    name: 'A1med',
    latin: 'A1med sp.',
    tag: '测试',
    description: '测试植物物种，用于验证本地照片上传功能。该植物位于紫金港校区内，具有独特的形态特征，是校园植物多样性研究的重要样本。',
    locations: [
      {
        coords: [30.3020, 120.0830],
        img: getPlantImagePath('P10', 1)
      }
    ]
  }
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
export const FALLBACK_START: [number, number] = [30.29517, 120.08215];




