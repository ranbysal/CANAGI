/** Three wheel steps, or three smooth gestures, charge the entry button. */
export function createScrollCharge() {
  let units = 0
  let lastWheel = -Infinity
  let direction = 0
  let smooth = false
  let gestureUnits = 0
  const add = (amount: number) => {
    units = Math.max(0, Math.min(3, units + amount))
    if (units > 3 - 0.00001) units = 3
    return units / 3
  }
  return {
    add,
    wheel(delta: number, mode: number, now: number) {
      if (!delta) return units / 3
      const nextDirection = Math.sign(delta)
      if (now - lastWheel > 180 || nextDirection !== direction) {
        // Wheel events do not expose the device. Large, integral steps usually
        // come from a notched wheel; small continuous deltas form one gesture.
        smooth = mode === 0 && !(Math.abs(delta) >= 80 && Number.isInteger(delta))
        gestureUnits = 0
      }
      lastWheel = now
      direction = nextDirection
      if (!smooth) return add(direction)
      const amount = Math.min(1 - gestureUnits, Math.abs(delta) / 100)
      gestureUnits += amount
      return add(direction * amount)
    },
  }
}
