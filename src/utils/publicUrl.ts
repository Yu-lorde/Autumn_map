/**
 * 将 public 下的资源路径自动补齐 Vite base（兼容 GitHub Pages 子路径部署）。
 *
 * - 传入外部 URL（http/https//data/blob）会原样返回
 * - 传入以 / 开头或不以 / 开头的本地路径都会被拼接到 import.meta.env.BASE_URL 下
 *
 * 示例：
 * - base = "/"            => withBase("plant-images/a.jpg")  -> "/plant-images/a.jpg"
 * - base = "/Autumn_map/" => withBase("/plant-images/a.jpg") -> "/Autumn_map/plant-images/a.jpg"
 */
function isExternalUrl(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url);
}

function ensureTrailingSlash(p: string): string {
  return p.endsWith('/') ? p : `${p}/`;
}

/**
 * 给 public 资源路径补齐 base 前缀。
 */
export function withBase(path: string): string {
  if (!path) return path;
  if (isExternalUrl(path)) return path;

  const base = ensureTrailingSlash(import.meta.env.BASE_URL || '/');

  // 避免重复拼接 base
  const withoutBase =
    base !== '/' && path.startsWith(base) ? path.slice(base.length) : path;

  const cleaned = withoutBase.replace(/^\/+/, '');
  return `${base}${cleaned}`;
}

/**
 * 将一个本地 URL/path 去掉 base 和前导 /，得到相对 public 的路径（如 "plant-images/a.jpg"）。
 */
export function stripBase(path: string): string {
  if (!path) return path;
  if (isExternalUrl(path)) return path;

  const base = ensureTrailingSlash(import.meta.env.BASE_URL || '/');

  const withoutBase =
    base !== '/' && path.startsWith(base) ? path.slice(base.length) : path;

  return withoutBase.replace(/^\/+/, '');
}

