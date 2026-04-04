export default {
  key: 'anchor',
  name: 'Anchor',
  emoji: '⚓',
  footprint: { w: 10, d: 3 },
  voxels: (() => {
    const D = 0x1e3250; // dark iron
    const M = 0x2b4570; // mid iron
    const L = 0x345580; // light iron
    const v = [];
    const OY = -2; // push anchor down so crown is buried in sand
    const add = (x, y, z, c) => v.push([x, y + OY, z, c]);
    // 3-deep column: dark edges, colored center
    const col = (x, y, c) => { add(x,y,0,D); add(x,y,1,c); add(x,y,2,D); };
    const shank = (y, c) => { col(4,y,c); col(5,y,c); };

    // ── Crown bottom — buried under sand (y=-3 to y=-1) ──
    col(4,-3,M); col(5,-3,M);
    col(3,-2,D); col(4,-2,M); col(5,-2,M); col(6,-2,D);
    col(2,-1,D); col(3,-1,M); col(4,-1,M); col(5,-1,M); col(6,-1,M); col(7,-1,D);

    // ── Crown emerging — thick arms (y=0-1) ──
    col(1,0,M); col(2,0,M); shank(0, L); col(7,0,M); col(8,0,M);
    col(0,1,M); col(1,1,L); shank(1, M); col(8,1,L); col(9,1,M);

    // ── Flukes — wide tips (y=2-3) ──
    col(0,2,L); col(1,2,L);
    shank(2, M);
    col(8,2,L); col(9,2,L);

    col(0,3,L); col(1,3,M);
    shank(3, M);
    col(8,3,M); col(9,3,L);

    // ── Shank (y=4-10) ──
    for (let y = 4; y <= 10; y++) shank(y, y % 2 ? L : M);

    // ── Crossbar (y=11-12) ──
    for (const y of [11, 12]) {
      col(1,y,M); col(2,y,M); col(3,y,M);
      col(4,y,L); col(5,y,L);
      col(6,y,M); col(7,y,M); col(8,y,M);
    }

    // ── Shank above crossbar (y=13) ──
    shank(13, M);

    // ── Ring (y=14-17) ──
    col(3,14,M); col(6,14,M);
    col(3,15,L); col(6,15,L);
    col(3,16,M); col(4,16,L); col(5,16,L); col(6,16,M);
    col(4,17,M); col(5,17,M);

    return v;
  })(),
};
