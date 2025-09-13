export function getStaggerDelay(index: number, baseDelay: number = 0.1): string {
  return `${index * baseDelay}s`;
}

export function getNestedDelay(
  groupIndex: number,
  itemIndex: number,
  groupDelay: number = 0.1,
  itemDelay: number = 0.05
): string {
  return `${groupIndex * groupDelay + itemIndex * itemDelay}s`;
}

export function getGridDelay(
  row: number,
  col: number,
  colsPerRow: number,
  baseDelay: number = 0.05
): string {
  const index = row * colsPerRow + col;
  return `${index * baseDelay}s`;
}
