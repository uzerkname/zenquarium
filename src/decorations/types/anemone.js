export default {
  key: 'anemone',
  name: 'Anemone',
  emoji: '🌸',
  footprint: { w: 4, d: 4 },
  voxels: [
    // Base disc — dark purple
    [0,0,0,0x330844],[1,0,0,0x330844],[2,0,0,0x330844],[3,0,0,0x330844],
    [0,0,1,0x330844],[1,0,1,0x330844],[2,0,1,0x330844],[3,0,1,0x330844],
    [0,0,2,0x330844],[1,0,2,0x330844],[2,0,2,0x330844],[3,0,2,0x330844],
    [0,0,3,0x330844],[1,0,3,0x330844],[2,0,3,0x330844],[3,0,3,0x330844],
    // Body column — purple
    [0,1,0,0x5511aa],[1,1,0,0x5511aa],[2,1,0,0x5511aa],[3,1,0,0x5511aa],
    [0,1,1,0x5511aa],[1,1,1,0x6622bb],[2,1,1,0x6622bb],[3,1,1,0x5511aa],
    [0,1,2,0x5511aa],[1,1,2,0x6622bb],[2,1,2,0x6622bb],[3,1,2,0x5511aa],
    [0,1,3,0x5511aa],[1,1,3,0x5511aa],[2,1,3,0x5511aa],[3,1,3,0x5511aa],
    // Tentacle stems — magenta
    [0,2,0,0xee22cc],[1,2,0,0xee22cc],[2,2,0,0xee22cc],[3,2,0,0xee22cc],
    [0,2,1,0xee22cc],[1,2,1,0xff33dd],[2,2,1,0xff33dd],[3,2,1,0xee22cc],
    [0,2,2,0xee22cc],[1,2,2,0xff33dd],[2,2,2,0xff33dd],[3,2,2,0xee22cc],
    [0,2,3,0xee22cc],[1,2,3,0xee22cc],[2,2,3,0xee22cc],[3,2,3,0xee22cc],
    // Outer tentacle ring (overhanging)
    [-1,3,0,0xff44dd],[-1,3,1,0xff44dd],[-1,3,2,0xff44dd],[-1,3,3,0xff44dd],
    [4,3,0,0xff44dd],[4,3,1,0xff44dd],[4,3,2,0xff44dd],[4,3,3,0xff44dd],
    [0,3,-1,0xff44dd],[1,3,-1,0xff44dd],[2,3,-1,0xff44dd],[3,3,-1,0xff44dd],
    [0,3,4,0xff44dd],[1,3,4,0xff44dd],[2,3,4,0xff44dd],[3,3,4,0xff44dd],
    // Inner tentacle tops — pink
    [0,3,0,0xff66ee],[1,3,0,0xff77ee],[2,3,0,0xff77ee],[3,3,0,0xff66ee],
    [0,3,1,0xff77ee],[1,3,1,0xff99ff],[2,3,1,0xff99ff],[3,3,1,0xff77ee],
    [0,3,2,0xff77ee],[1,3,2,0xff99ff],[2,3,2,0xff99ff],[3,3,2,0xff77ee],
    [0,3,3,0xff66ee],[1,3,3,0xff77ee],[2,3,3,0xff77ee],[3,3,3,0xff66ee],
    // Tips — white
    [-1,4,0,0xffeeff],[-1,4,1,0xffeeff],[-1,4,2,0xffeeff],[-1,4,3,0xffeeff],
    [4,4,0,0xffeeff],[4,4,1,0xffeeff],[4,4,2,0xffeeff],[4,4,3,0xffeeff],
    [0,4,-1,0xffeeff],[1,4,-1,0xffeeff],[2,4,-1,0xffeeff],[3,4,-1,0xffeeff],
    [0,4,4,0xffeeff],[1,4,4,0xffeeff],[2,4,4,0xffeeff],[3,4,4,0xffeeff],
    [1,4,0,0xffeeff],[2,4,0,0xffeeff],
    [1,4,3,0xffeeff],[2,4,3,0xffeeff],
  ],
};
