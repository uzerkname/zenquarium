export default {
  key: 'diver_helmet',
  name: 'Diver Helmet',
  emoji: '\u{1F93F}',
  footprint: { w: 3, d: 3 },
  voxels: [
    // Brass: 0xB8860B dark, 0xDAA520 mid, 0xCD853F light
    // Porthole glass: 0x223344 dark, 0x4488AA tint
    // Bolts/metal: 0x666666

    // ── Neck ring / base (y=0) ──
    [0,0,0,0x666666],[1,0,0,0xDAA520],[2,0,0,0x666666],
    [0,0,1,0xDAA520],[1,0,1,0xCD853F],[2,0,1,0xDAA520],
    [0,0,2,0x666666],[1,0,2,0xDAA520],[2,0,2,0x666666],

    // ── Lower dome (y=1) ──
    [0,1,0,0xDAA520],[1,1,0,0xCD853F],[2,1,0,0xDAA520],
    [0,1,1,0xCD853F],[1,1,1,0xDAA520],[2,1,1,0xCD853F],
    [0,1,2,0xDAA520],[1,1,2,0xCD853F],[2,1,2,0xDAA520],

    // ── Porthole level (y=2) ──
    [0,2,0,0xDAA520],[1,2,0,0x4488AA],[2,2,0,0xDAA520],
    [0,2,1,0x223344],[1,2,1,0xDAA520],[2,2,1,0x223344],
    [0,2,2,0xDAA520],[1,2,2,0xCD853F],[2,2,2,0xDAA520],
    // Porthole rims
    [1,2,0,0x666666],[0,2,1,0x666666],[2,2,1,0x666666],

    // ── Upper dome (y=3) ──
    [0,3,0,0xCD853F],[1,3,0,0xDAA520],[2,3,0,0xCD853F],
    [0,3,1,0xDAA520],[1,3,1,0xCD853F],[2,3,1,0xDAA520],
    [0,3,2,0xCD853F],[1,3,2,0xDAA520],[2,3,2,0xCD853F],

    // ── Top dome (y=4) — smaller rounded ──
    [1,4,0,0xDAA520],[0,4,1,0xDAA520],[1,4,1,0xCD853F],[2,4,1,0xDAA520],[1,4,2,0xDAA520],

    // ── Valve on top (y=5) ──
    [1,5,1,0x666666],

    // ── Shoulder bolts ──
    [0,1,0,0x666666],[2,1,0,0x666666],[0,1,2,0x666666],[2,1,2,0x666666],
  ],
};
