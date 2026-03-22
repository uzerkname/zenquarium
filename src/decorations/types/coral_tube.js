export default {
  key: 'coral_tube',
  name: 'Tube Coral',
  emoji: '🪸',
  footprint: { w: 3, d: 2 },
  voxels: [
    // Tube 1 — tall orange (left)
    [0,0,0,0x7a3a0f],[0,1,0,0x9a4a1a],[0,2,0,0xbb5522],
    [0,3,0,0xcc6633],[0,4,0,0xdd7744],[0,5,0,0xee8855],
    [0,6,0,0xff9966],[0,7,0,0xffaa77],
    // Tube 1 hollow center
    [0,7,0,0x000000],
    // Tube 1 rim glow
    [0,8,0,0xffaa44],[1,8,0,0xffcc66],

    // Tube 2 — taller purple (middle-left)
    [1,0,0,0x441166],[1,1,0,0x552277],[1,2,0,0x663388],
    [1,3,0,0x7744aa],[1,4,0,0x8855bb],[1,5,0,0x9966cc],
    [1,6,0,0xaa77dd],[1,7,0,0xbb88ee],[1,8,0,0xcc99ff],
    [1,9,0,0xddaaff],[1,10,0,0xeeccff],
    // Rim
    [1,11,0,0xffffff],[0,11,0,0xffeecc],

    // Tube 3 — shorter cyan (middle-right)
    [2,0,0,0x1a4444],[2,1,0,0x225555],[2,2,0,0x336666],
    [2,3,0,0x449999],[2,4,0,0x55aaaa],[2,5,0,0x66bbbb],
    [2,6,0,0x77cccc],
    // Rim
    [2,7,0,0x88dddd],[2,7,1,0xaaffff],

    // Tube 4 — short pink (right)
    [0,0,1,0x882244],[0,1,1,0xaa3355],[0,2,1,0xcc4466],
    [0,3,1,0xdd5577],[0,4,1,0xee6688],
    [0,5,1,0xff88aa],
    // Rim
    [0,6,1,0xffaacc],[1,6,1,0xffccee],

    // Polyp tips — white flower shapes
    [1,11,0,0xffffff],[1,12,0,0xffffee],
    [0,8,0,0xffcc88],
    [2,8,0,0xaaffee],[2,8,1,0xaaffee],
    [0,6,1,0xffddee],
  ],
};
