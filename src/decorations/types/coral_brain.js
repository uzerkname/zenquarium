export default {
  key: 'coral_brain',
  name: 'Brain Coral',
  emoji: '🪸',
  footprint: { w: 3, d: 3 },
  voxels: [
    // Base — dark maroon
    [0,0,0,0x661122],[1,0,0,0x661122],[2,0,0,0x661122],
    [0,0,1,0x661122],[1,0,1,0x661122],[2,0,1,0x661122],
    [0,0,2,0x661122],[1,0,2,0x661122],[2,0,2,0x661122],
    // Layer 1 — coral red
    [0,1,0,0xcc3355],[1,1,0,0xcc3355],[2,1,0,0xcc3355],
    [0,1,1,0xcc3355],[1,1,1,0xcc3355],[2,1,1,0xcc3355],
    [0,1,2,0xcc3355],[1,1,2,0xcc3355],[2,1,2,0xcc3355],
    // Layer 2 — bulging dome
    [0,2,0,0xdd4466],[1,2,0,0xdd4466],[2,2,0,0xdd4466],
    [0,2,1,0xee5577],[1,2,1,0xee5577],[2,2,1,0xee5577],
    [0,2,2,0xdd4466],[1,2,2,0xdd4466],[2,2,2,0xdd4466],
    // Layer 3 — ridge peaks
    [0,3,0,0xee6688],[1,3,0,0xff7799],[2,3,0,0xee6688],
    [0,3,1,0xff7799],[1,3,1,0xff88aa],[2,3,1,0xff7799],
    [0,3,2,0xee6688],[1,3,2,0xff7799],[2,3,2,0xee6688],
    // Ridge grooves — darker recesses
    [0,4,0,0xdd5577],[2,4,0,0xdd5577],
    [0,4,2,0xdd5577],[2,4,2,0xdd5577],
    // Peak bumps
    [1,4,0,0xff99bb],[1,4,2,0xff99bb],
    [0,4,1,0xff99bb],[2,4,1,0xff99bb],
    [1,5,1,0xffaacc],
    // Fine ridge texture detail
    [0,3,0,0xcc4466],[0,3,2,0xcc4466],
    [2,3,0,0xcc4466],[2,3,2,0xcc4466],
    [1,4,1,0xffbbcc],
  ],
};
