// 可调节的路线估算配置
export const WALK_SPEED_M_PER_MIN = 80; // 步行速度（m/min） ~4.8 km/h
export const BIKE_SPEED_M_PER_MIN = 250; // 骑行速度（m/min） ~15 km/h

// 初始路由因子（路网因子）——用于把直线距离放大为近似路网距离
export let WALK_ROUTE_FACTOR = 0.3991238451966968;
export let BIKE_ROUTE_FACTOR = 1.2472620162396775;

export function setRouteFactors({ walk, bike }: { walk?: number; bike?: number }) {
  if (typeof walk === 'number') WALK_ROUTE_FACTOR = walk;
  if (typeof bike === 'number') BIKE_ROUTE_FACTOR = bike;
}

export default {
  WALK_SPEED_M_PER_MIN,
  BIKE_SPEED_M_PER_MIN,
  WALK_ROUTE_FACTOR,
  BIKE_ROUTE_FACTOR,
  setRouteFactors
};