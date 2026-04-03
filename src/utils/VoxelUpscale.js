/**
 * Upscale voxel models with smoothing for higher detail.
 *
 * 1. Nearest-neighbor 2x upscale (each voxel → 2×2×2 block)
 * 2. Remove exposed corner voxels to round edges
 * 3. Add subtle color variation to break up flat areas
 */

/**
 * Upscale + smooth voxel data.
 * @param {Array} voxels  - [[x,y,z,color], ...]
 * @param {number} factor - upscale factor (2 = double)
 * @returns {Array} new voxel array with smoothed detail
 */
export function upscaleAndSmooth(voxels, factor = 2) {
  // Step 1: nearest-neighbor upscale
  let scaled = [];
  for (const [x, y, z, c] of voxels) {
    for (let dx = 0; dx < factor; dx++)
      for (let dy = 0; dy < factor; dy++)
        for (let dz = 0; dz < factor; dz++)
          scaled.push([x * factor + dx, y * factor + dy, z * factor + dz, c]);
  }

  // Step 2: build occupancy set for neighbor lookups
  const key = (x, y, z) => `${x},${y},${z}`;
  const occupied = new Set();
  for (const [x, y, z] of scaled) occupied.add(key(x, y, z));

  // Count face-adjacent neighbors (6-connected)
  function faceNeighborCount(x, y, z) {
    let n = 0;
    if (occupied.has(key(x - 1, y, z))) n++;
    if (occupied.has(key(x + 1, y, z))) n++;
    if (occupied.has(key(x, y - 1, z))) n++;
    if (occupied.has(key(x, y + 1, z))) n++;
    if (occupied.has(key(x, y, z - 1))) n++;
    if (occupied.has(key(x, y, z + 1))) n++;
    return n;
  }

  // Remove corner voxels (exposed on 4+ faces) to round edges
  const smoothed = [];
  for (const v of scaled) {
    const [x, y, z] = v;
    const neighbors = faceNeighborCount(x, y, z);
    // Keep voxels with 3+ face neighbors (remove sharp corners with ≤2)
    if (neighbors >= 3) {
      smoothed.push(v);
    }
  }

  // Step 3: add color variation to surface voxels
  // Rebuild occupancy for the smoothed set
  const smoothOcc = new Set();
  for (const [x, y, z] of smoothed) smoothOcc.add(key(x, y, z));

  const result = [];
  for (const [x, y, z, c] of smoothed) {
    const neighbors = 0
      + (smoothOcc.has(key(x - 1, y, z)) ? 1 : 0)
      + (smoothOcc.has(key(x + 1, y, z)) ? 1 : 0)
      + (smoothOcc.has(key(x, y - 1, z)) ? 1 : 0)
      + (smoothOcc.has(key(x, y + 1, z)) ? 1 : 0)
      + (smoothOcc.has(key(x, y, z - 1)) ? 1 : 0)
      + (smoothOcc.has(key(x, y, z + 1)) ? 1 : 0);

    // Surface voxels (< 6 neighbors) get color variation
    if (neighbors < 6) {
      const r = ((c >> 16) & 0xFF);
      const g = ((c >> 8) & 0xFF);
      const b = (c & 0xFF);
      // Subtle random shift ±8 per channel, biased by position for coherence
      const seed = (x * 73 + y * 137 + z * 211) & 0xFF;
      const shift = ((seed / 255) - 0.5) * 16;
      const nr = Math.max(0, Math.min(255, Math.round(r + shift)));
      const ng = Math.max(0, Math.min(255, Math.round(g + shift * 0.8)));
      const nb = Math.max(0, Math.min(255, Math.round(b + shift * 0.6)));
      result.push([x, y, z, (nr << 16) | (ng << 8) | nb]);
    } else {
      result.push([x, y, z, c]);
    }
  }

  return result;
}
