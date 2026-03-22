export default {
  key: 'seaweed',
  name: 'Seaweed',
  emoji: '🌿',
  footprint: { w: 2, d: 1 },
  voxels: [
    // Stalk 1 — tall, wavy, dark green
    [0,0,0,0x1a5c1a],[0,1,0,0x1e6a1e],[0,2,0,0x226622],
    [0,3,0,0x227722],[0,4,0,0x2d8a2d],
    // Blade right at mid
    [1,3,0,0x33aa33],[1,4,0,0x33bb33],[1,5,0,0x44cc44],
    [0,5,0,0x2d9a2d],[0,6,0,0x339933],
    // Blade left upper
    [-1,5,0,0x44aa44],[-1,6,0,0x44bb44],
    [0,7,0,0x3daa3d],[0,8,0,0x44bb44],
    // Blade right upper
    [1,7,0,0x44cc44],[1,8,0,0x55dd55],
    [0,9,0,0x50cc50],[0,10,0,0x55dd55],
    [-1,9,0,0x44cc44],
    // Tip
    [0,11,0,0x66ee66],[1,11,0,0x77ff77],

    // Stalk 2 — shorter, different phase
    [1,0,0,0x1a5c1a],[1,1,0,0x226622],[1,2,0,0x2d7a2d],
    [1,3,0,0x339933],
    [2,2,0,0x44aa44],[2,3,0,0x44bb44],[2,4,0,0x55cc55],
    [1,4,0,0x339933],[1,5,0,0x3daa3d],
    [-0,4,0,0x44aa44],
    [1,6,0,0x44bb44],[1,7,0,0x55cc55],
    [2,6,0,0x55cc55],
    // Tip
    [1,8,0,0x66dd66],
  ],
};
