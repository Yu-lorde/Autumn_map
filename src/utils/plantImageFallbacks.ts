/**
 * 植物图片备用URL配置
 * 当本地图片不存在时，使用这些在线图片作为备用
 */

export const PLANT_IMAGE_FALLBACKS: Record<string, string> = {
  'p1-0': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=60',
  'p2-0': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60',
  'p3-0': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=60',
  'p4-0': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60',
  'p4-1': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60',
  'A1med-0': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=60',
};

/**
 * 获取植物图片的备用URL
 * @param plantId 植物ID
 * @param locationIndex 位置索引
 * @returns 备用图片URL，如果不存在则返回空字符串
 */
export function getPlantImageFallback(plantId: string, locationIndex: number): string {
  const key = `${plantId}-${locationIndex}`;
  return PLANT_IMAGE_FALLBACKS[key] || '';
}
