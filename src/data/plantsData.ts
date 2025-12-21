import { Plant, PlantLocation } from '../types';

// 植物数据：每个植物可以有多个位置，共享名称、说明等信息
export const plants: Plant[] = [
  {
    id: 'p1',
    name: '银杏',
    latin: 'Ginkgo biloba',
    tag: '金黄',
    description: '落叶乔木。秋季叶片转为金黄色。紫金港校区东西大道两旁均有种植。',
    locations: [
      {
        coords: [30.3095, 120.0817],
        img: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=60'
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
    name: '鸡爪槭',
    latin: 'Acer palmatum',
    tag: '红叶',
    description: '落叶小乔木。秋后叶片由绿变红，形态优美。',
    locations: [
      {
        coords: [30.3072, 120.0839],
        img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60'
      }
    ]
  },
  {
    id: 'p3',
    name: '桂花',
    latin: 'Osmanthus fragrans',
    tag: '馥郁',
    description: '常绿阔叶乔木。秋季开花，香气袭人。',
    locations: [
      {
        coords: [30.3015, 120.0845],
        img: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=60'
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
        img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60'
      },
      {
        coords: [30.3030, 120.0840],
        img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60'
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




