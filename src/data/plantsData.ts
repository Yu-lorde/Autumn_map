import { Plant } from '../types';

export const plants: Plant[] = [
  {
    id: 'p1',
    name: '银杏',
    latin: 'Ginkgo biloba',
    img: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=60',
    coords: [30.3095, 120.0817],
    tag: '金黄',
    description: '落叶乔木。秋季叶片转为金黄色。紫金港校区东西大道两旁均有种植。'
  },
  {
    id: 'p2',
    name: '鸡爪槭',
    latin: 'Acer palmatum',
    img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60',
    coords: [30.3072, 120.0839],
    tag: '红叶',
    description: '落叶小乔木。秋后叶片由绿变红，形态优美。'
  },
  {
    id: 'p3',
    name: '桂花',
    latin: 'Osmanthus fragrans',
    img: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=60',
    coords: [30.3015, 120.0845],
    tag: '馥郁',
    description: '常绿阔叶乔木。秋季开花，香气袭人。'
  }
];

// 默认备用起点（浙大南门）
export const FALLBACK_START: [number, number] = [30.29517, 120.08215];

