export function isOnLava(mask, x, y) {
  const px = Math.floor(x * mask.scale);
  const py = Math.floor(y * mask.scale);
  if (px < 0 || py < 0 || px >= mask.width || py >= mask.height) return true;
  const idx = (py * mask.width + px) * 4;
  // Mask is filled white (#fff) where track is. Alpha === 0 → lava.
  return mask.data[idx + 3] === 0;
}
