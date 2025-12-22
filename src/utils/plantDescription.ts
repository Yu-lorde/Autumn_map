const PREFIXES = ['坐标数据：', '植物志记录：', '气味数据：', '情绪数据：'] as const;

export type PlantDescriptionPrefix = (typeof PREFIXES)[number];

export type PlantDescriptionPart =
  | { type: 'prefixed'; prefix: PlantDescriptionPrefix; text: string }
  | { type: 'plain'; text: string };

/**
 * 将植物描述按行拆分，并识别固定前缀（如“坐标数据：”）。
 * 用于在不同渲染场景（React/DOM）里复用同一份解析逻辑，避免重复代码。
 */
export function parsePlantDescription(description: string): PlantDescriptionPart[] {
  const raw = (description ?? '').toString();
  if (!raw) return [];

  return raw.split('\n').map((line) => {
    const matched = PREFIXES.find((p) => line.startsWith(p));
    if (matched) {
      return { type: 'prefixed', prefix: matched, text: line.slice(matched.length) };
    }
    return { type: 'plain', text: line };
  });
}

