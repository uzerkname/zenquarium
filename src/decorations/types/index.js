import coral_brain    from './coral_brain.js';
import coral_tube     from './coral_tube.js';
import rock_small     from './rock_small.js';
import rock_large     from './rock_large.js';
import seaweed        from './seaweed.js';
import kelp           from './kelp.js';
import grass          from './grass.js';
import ludwigia       from './ludwigia.js';
import fern           from './fern.js';
import anemone        from './anemone.js';
import treasure_chest from './treasure_chest.js';
import castle         from './castle.js';
import anchor         from './anchor.js';
import barrel         from './barrel.js';
import diver_helmet   from './diver_helmet.js';

export const DECO_TYPES = [coral_brain, coral_tube, rock_small, rock_large, seaweed, kelp, grass, ludwigia, fern, anemone, treasure_chest, castle, anchor, barrel, diver_helmet];
export const DECO_MAP   = Object.fromEntries(DECO_TYPES.map(d => [d.key, d]));
