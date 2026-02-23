export function getScreenHorizontalPadding(width: number) {
  if (width >= 430) return 48;
  if (width >= 400) return 38;
  return 24;
}

export function getCenteredTextMaxWidth(
  width: number,
  horizontalPadding: number,
  cap: number = 420
) {
  return Math.min(width - horizontalPadding * 2, cap);
}

