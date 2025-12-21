import { useState, useEffect } from 'react';
import { stripBase, withBase } from '../../utils/publicUrl';

interface PlantImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

/**
 * 植物图片组件
 * 支持本地图片加载失败时自动切换到备用图片
 */
export default function PlantImage({ 
  src, 
  alt, 
  fallbackSrc,
  className = '' 
}: PlantImageProps) {
  const [imgSrc, setImgSrc] = useState(withBase(src));
  const [retryIndex, setRetryIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const extensions = ['.jpg', '.png', '.webp', '.jpeg'];

  // 当 src prop 改变时，同步更新 imgSrc 并重置状态
  useEffect(() => {
    setImgSrc(withBase(src));
    setRetryIndex(0);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    const normalizedFallback = fallbackSrc ? withBase(fallbackSrc) : '';

    // 检查是否是本地植物图片路径 (public/plant-images 下)
    const currentRelative = stripBase(imgSrc);
    const isLocalPlantImage = currentRelative.startsWith('plant-images/');
    
    if (isLocalPlantImage && retryIndex < extensions.length - 1) {
      // 尝试下一个扩展名
      const nextIndex = retryIndex + 1;
      const relativeSrc = stripBase(src);
      const basePath = relativeSrc.replace(/\.[^.\/]+$/, '');
      setImgSrc(withBase(`${basePath}${extensions[nextIndex]}`));
      setRetryIndex(nextIndex);
    } else if (!hasError && normalizedFallback && imgSrc !== normalizedFallback) {
      // 如果所有本地扩展名都失败，且存在备用图片，则切换到备用图片
      setImgSrc(normalizedFallback);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
