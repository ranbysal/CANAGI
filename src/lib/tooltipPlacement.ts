export interface Rectangle { left: number; top: number; width: number; height: number }

/** Prefer free space outside the hovered tile; keep the cursor and panel in view. */
export function placeTooltip(pointer: { x: number; y: number }, tile: Rectangle, panel: { width: number; height: number }, viewport: { width: number; height: number }) {
  const gap = 18, margin = 12
  const clampX = (x: number) => Math.max(margin, Math.min(x, viewport.width - panel.width - margin))
  const clampY = (y: number) => Math.max(margin, Math.min(y, viewport.height - panel.height - margin))
  const overlap = (a: Rectangle, b: Rectangle) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top))
  const cursor = { left: pointer.x - gap, top: pointer.y - gap, width: gap * 2, height: gap * 2 }
  const candidates = [
    [tile.left + tile.width + gap, pointer.y - panel.height / 2],
    [tile.left - panel.width - gap, pointer.y - panel.height / 2],
    [pointer.x - panel.width / 2, tile.top - panel.height - gap],
    [pointer.x - panel.width / 2, tile.top + tile.height + gap],
    [pointer.x + gap, pointer.y + gap], [pointer.x - panel.width - gap, pointer.y - panel.height - gap],
  ].map(([x, y], index) => {
    const box = { left: clampX(x), top: clampY(y), ...panel }
    return { ...box, penalty: overlap(box, cursor) * 10000 + overlap(box, tile) + index * .01 }
  }).sort((a, b) => a.penalty - b.penalty)
  return { left: candidates[0].left, top: candidates[0].top }
}
