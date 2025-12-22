import { wgs84ToGcj02 } from './coordUtils';

export type NavigationMode = 'walk' | 'drive' | 'bike';
export type MapProvider = 'tencent' | 'apple' | 'device' | 'amap' | 'baidu';

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPadOS 13+ 可能伪装成 Mac，但具备触摸点
  const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOS13Plus = /Macintosh/i.test(ua) && (navigator as any).maxTouchPoints > 1;
  return isAppleMobile || isIPadOS13Plus;
}

function openUrl(url: string) {
  // 尽量保持“点击即打开”的行为，减少被拦截概率
  window.location.href = url;
}

function safeLabel(name?: string) {
  return (name?.trim() || '目的地').slice(0, 40);
}

export function buildAppleMapsUrl(params: {
  dest: { lat: number; lng: number; name?: string };
  origin?: { lat: number; lng: number };
  mode?: NavigationMode;
}) {
  const { dest, origin, mode = 'walk' } = params;
  // Apple Maps 在中国大陆与高德合作，使用 GCJ-02 坐标系
  // 需要将 WGS-84 坐标转换为 GCJ-02
  const [gcjDestLat, gcjDestLng] = wgs84ToGcj02(dest.lat, dest.lng);
  
  // Apple Maps: https://maps.apple.com/?daddr=lat,lng&dirflg=w
  const dirflg = mode === 'walk' ? 'w' : mode === 'drive' ? 'd' : 'r';
  const qs = new URLSearchParams();
  qs.set('daddr', `${gcjDestLat},${gcjDestLng}`);
  if (origin) {
    const [gcjOriginLat, gcjOriginLng] = wgs84ToGcj02(origin.lat, origin.lng);
    qs.set('saddr', `${gcjOriginLat},${gcjOriginLng}`);
  }
  qs.set('dirflg', dirflg);
  return `https://maps.apple.com/?${qs.toString()}`;
}

export function buildDeviceMapUrl(params: {
  dest: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
}) {
  const { dest, mode = 'walk' } = params;

  if (isIOSDevice()) {
    // iOS: 直接唤起 Apple Maps App
    // Apple Maps 在中国大陆使用 GCJ-02 坐标系
    const [gcjLat, gcjLng] = wgs84ToGcj02(dest.lat, dest.lng);
    const dirflg = mode === 'walk' ? 'w' : mode === 'drive' ? 'd' : 'r';
    const qs = new URLSearchParams();
    qs.set('daddr', `${gcjLat},${gcjLng}`);
    qs.set('dirflg', dirflg);
    return `maps://?${qs.toString()}`;
  }

  // Android: geo scheme（由系统/已安装地图接管）
  // 大多数中国地图应用使用 GCJ-02 坐标系
  const [gcjLat, gcjLng] = wgs84ToGcj02(dest.lat, dest.lng);
  const name = encodeURIComponent(safeLabel(dest.name));
  // geo:lat,lng?q=lat,lng(name)
  return `geo:${gcjLat},${gcjLng}?q=${gcjLat},${gcjLng}(${name})`;
}

export function buildTencentMapsUrl(params: {
  dest: { lat: number; lng: number; name?: string };
  origin?: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
}) {
  const { dest, origin, mode = 'walk' } = params;

  // 腾讯地图 URI（Web）：https://apis.map.qq.com/uri/v1/routeplan?type=walk&to=xx&tocoord=lat,lng
  // 国内导航更贴合：使用 GCJ-02
  const [gcjLat, gcjLng] = wgs84ToGcj02(dest.lat, dest.lng);

  const qs = new URLSearchParams();
  qs.set('type', mode === 'drive' ? 'drive' : mode === 'bike' ? 'bike' : 'walk');
  qs.set('to', safeLabel(dest.name));
  qs.set('tocoord', `${gcjLat},${gcjLng}`);
  qs.set('policy', '0');

  if (origin) {
    qs.set('from', safeLabel(origin.name || '起点'));
    qs.set('fromcoord', `${origin.lat},${origin.lng}`);
  }

  return `https://apis.map.qq.com/uri/v1/routeplan?${qs.toString()}`;
}

export function buildAmapUrl(params: {
  dest: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
}) {
  const { dest, mode = 'walk' } = params;
  // 高德 URI: https://uri.amap.com/navigation?to=lng,lat,name&mode=walk
  const [gcjLat, gcjLng] = wgs84ToGcj02(dest.lat, dest.lng);
  const safeName = encodeURIComponent(safeLabel(dest.name));
  return `https://uri.amap.com/navigation?to=${gcjLng},${gcjLat},${safeName}&mode=${mode}&callnative=1`;
}

export function buildBaiduUrl(params: {
  dest: { lat: number; lng: number; name?: string };
  origin?: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
  src?: string;
}) {
  const { dest, origin, mode = 'walk', src = 'AutumnMap|Web' } = params;
  // 百度地图 direction（网页）：http://api.map.baidu.com/direction?...&coord_type=gcj02&output=html
  const [gcjLat, gcjLng] = wgs84ToGcj02(dest.lat, dest.lng);
  const destName = safeLabel(dest.name);
  const originName = safeLabel(origin?.name || '起点');

  const qs = new URLSearchParams();
  if (origin) {
    qs.set('origin', `latlng:${origin.lat},${origin.lng}|name:${originName}`);
  } else {
    // 兜底：让百度默认用“我的位置”，这里仍传一个空起点会导致失败，所以不传 origin
  }
  qs.set('destination', `latlng:${gcjLat},${gcjLng}|name:${destName}`);
  qs.set('mode', mode === 'drive' ? 'driving' : 'walking');
  qs.set('coord_type', 'gcj02');
  qs.set('output', 'html');
  qs.set('src', src);

  return `https://api.map.baidu.com/direction?${qs.toString()}`;
}

export function openNavigation(provider: MapProvider, params: {
  dest: { lat: number; lng: number; name?: string };
  origin?: { lat: number; lng: number; name?: string };
  mode?: NavigationMode;
}) {
  const { dest, origin, mode = 'walk' } = params;

  if (provider === 'apple') {
    openUrl(buildAppleMapsUrl({ dest, origin, mode }));
    return;
  }
  if (provider === 'tencent') {
    openUrl(buildTencentMapsUrl({ dest, origin, mode }));
    return;
  }
  if (provider === 'amap') {
    openUrl(buildAmapUrl({ dest, mode }));
    return;
  }
  if (provider === 'baidu') {
    openUrl(buildBaiduUrl({ dest, origin: origin ? { lat: origin.lat, lng: origin.lng, name: origin.name } : undefined, mode }));
    return;
  }
  openUrl(buildDeviceMapUrl({ dest, mode }));
}

/**
 * 兼容旧调用：默认 iOS 走 Apple，其它走高德。
 */
export function openSystemNavigation(params: {
  dest: { lat: number; lng: number; name?: string };
  origin?: { lat: number; lng: number };
  mode?: NavigationMode;
}) {
  const { dest, origin, mode } = params;

  if (isIOSDevice()) {
    openNavigation('apple', { dest, origin: origin ? { lat: origin.lat, lng: origin.lng, name: '起点' } : undefined, mode });
    return;
  }

  openNavigation('amap', { dest, origin: origin ? { lat: origin.lat, lng: origin.lng, name: '起点' } : undefined, mode });
}

