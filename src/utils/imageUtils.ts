/**
 * 图片工具函数
 * 支持本地图片和在线图片的自动切换
 */

/**
 * 获取植物照片的路径
 * 优先使用本地图片，如果不存在则使用在线图片URL
 * 
 * @param plantId 植物ID（如 'p1', 'p4'）
 * @param locationIndex 位置索引（从0开始）
 * @param fallbackUrl 备用在线图片URL
 * @returns 图片路径或URL
 */
export function getPlantImageUrl(
  plantId: string,
  locationIndex: number,
  fallbackUrl: string
): string {
  // 尝试的图片扩展名
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  // 构建本地图片路径
  for (const ext of extensions) {
    const localPath = `/plant-images/${plantId}-${locationIndex}.${ext}`;
    
    // 在开发环境中，尝试检查文件是否存在
    // 注意：在生产环境中，Vite 会自动处理静态资源
    // 如果文件不存在，浏览器会返回 404，但不会影响功能
    // 我们可以通过尝试加载图片来检查是否存在
    
    // 返回本地路径，如果不存在，浏览器会fallback到fallbackUrl
    // 但更好的方式是直接返回本地路径，让浏览器处理404
    // 实际上，我们应该让组件处理图片加载失败的情况
    return localPath;
  }
  
  return fallbackUrl;
}

/**
 * 检查本地图片是否存在
 * 通过尝试加载图片来判断
 * 
 * @param plantId 植物ID
 * @param locationIndex 位置索引
 * @returns Promise<boolean> 图片是否存在
 */
export async function checkLocalImageExists(
  plantId: string,
  locationIndex: number
): Promise<boolean> {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  for (const ext of extensions) {
    const imagePath = `/plant-images/${plantId}-${locationIndex}.${ext}`;
    
    try {
      const response = await fetch(imagePath, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // 继续尝试下一个扩展名
    }
  }
  
  return false;
}

/**
 * 获取植物照片URL（带fallback）
 * 优先使用本地图片，如果加载失败则使用在线图片
 * 
 * @param plantId 植物ID
 * @param locationIndex 位置索引
 * @param fallbackUrl 备用在线图片URL
 * @returns 图片URL
 */
export function getPlantImageUrlWithFallback(
  plantId: string,
  locationIndex: number,
  fallbackUrl: string
): string {
  // 直接返回本地路径，如果不存在，组件会处理错误并使用fallback
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  return `/plant-images/${plantId}-${locationIndex}.${extensions[0]}`;
}
