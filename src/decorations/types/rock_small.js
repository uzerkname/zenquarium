export default {
  key: 'rock_small',
  name: 'Small Rock',
  emoji: '🪨',
  footprint: { w: 3, d: 3 },
  voxels: [
    // Base layer — dark grey
    [0,0,0,0x4a4a4a],[1,0,0,0x555555],[2,0,0,0x4a4a4a],
    [0,0,1,0x444444],[1,0,1,0x555555],[2,0,1,0x505050],
    [0,0,2,0x444444],[1,0,2,0x4a4a4a],[2,0,2,0x444444],
    // Layer 1 — medium grey
    [0,1,0,0x636363],[1,1,0,0x727272],[2,1,0,0x686868],
    [0,1,1,0x686868],[1,1,1,0x7f7f7f],[2,1,1,0x717171],
    [0,1,2,0x606060],[1,1,2,0x6a6a6a],[2,1,2,0x606060],
    // Layer 2 — lighter, irregular top
    [0,2,0,0x7a7a7a],[1,2,0,0x888888],
    [1,2,1,0x8a8a8a],[2,2,1,0x828282],
    [0,2,2,0x707070],[1,2,2,0x787878],
    // Peak — lightest highlight
    [1,3,1,0x999999],
    [0,3,0,0x888888],[2,3,1,0x878787],
    // Crevice detail — dark lines
    [0,2,1,0x505050],
    [2,2,0,0x555555],
    [1,1,0,0x606060],
    // Algae hint — slight green tinge on lower left
    [0,0,0,0x4a5040],[0,1,0,0x5a6050],
  ],
};
