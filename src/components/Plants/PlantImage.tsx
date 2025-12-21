import { useState, useEffect } from 'react';

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
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // 当 src prop 改变时，同步更新 imgSrc 并重置错误状态
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
      // 如果本地图片加载失败，且存在备用图片，则切换到备用图片
      setImgSrc(fallbackSrc);
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
