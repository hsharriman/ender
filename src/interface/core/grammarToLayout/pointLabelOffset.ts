export const POINT_LABEL_OFFSET_RADIUS = 10;

export const POINT_LABEL_OFFSET_BY_CODE: Record<string, [number, number]> =
  (() => {
    const r = POINT_LABEL_OFFSET_RADIUS;
    const lOffset = 10;
    const d = r / Math.sqrt(2);
    return {
      t: [0, r],
      tr: [d, d],
      r: [r, 0],
      br: [d, -2 * d],
      b: [-d, -2 * r],
      bl: [-d - lOffset, -2 * d],
      l: [-r - lOffset, 0],
      tl: [-d - lOffset, 2 * d],
    };
  })();

export const resolvePointLabelOffset = (
  offsetCode: string,
): [number, number] => {
  const mapped = POINT_LABEL_OFFSET_BY_CODE[offsetCode.toLowerCase()];
  return mapped ?? [0, 0];
};
