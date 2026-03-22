import clownfish  from './clownfish.js';
import angelfish  from './angelfish.js';
import betta      from './betta.js';
import pufferfish from './pufferfish.js';
import tang       from './tang.js';

export const SPECIES = [clownfish, angelfish, betta, pufferfish, tang];
export const SPECIES_MAP = Object.fromEntries(SPECIES.map(s => [s.key, s]));
