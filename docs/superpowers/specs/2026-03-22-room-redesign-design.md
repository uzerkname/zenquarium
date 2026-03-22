# Room Redesign — Cozy Living Room

**Date:** 2026-03-22
**Status:** Draft
**Scope:** Rewrite room visuals in `src/renderer/Room.js` to match reference image of a warm, sunlit living room with the fish tank as the centerpiece.

## Goal

Transform the room from a dark-toned sparse layout to a bright, cozy living room matching a reference image: light hardwood floors, white cloth sofa, big windows with garden views, a TV console with flatscreen, and the fish tank proudly centered.

## Layout (Top-Down)

```
       BACK WALL (z = BACK_Z = -150)
┌──────────────────────────────────────────────────┐
│  ┌─────────────┐              ┌──────┐           │
│  │ TV          │              │ DOOR │           │
│  │ TV CONSOLE  │              └──────┘           │
│  └─────────────┘                                 │
│                                                  │
W                      ┌──────────┐                │
I                      │          │                │
N    ┌──────────┐      │  FISH    │     LAMP       │
D    │ COFFEE   │      │  TANK    │                │
O    │ TABLE    │      │          │     PLANTS     │
W    └──────────┘      └──────────┘                │
S                                                  │
│    ┌────────────────┐                            │
│    │ WHITE COUCH    │                            │
│    │ + pillows      │                            │
│    └────────────────┘                            │
│         ════════════════════                     │
│         WINDOWS (front wall)                     │
└──────────────────────────────────────────────────┘
       FRONT WALL (z = BACK_Z + ROOM_D = 150)
       Camera looks from front toward back.
```

**Coordinate system:** X is left-right (−250 to +250), Z is front-back (−150 to +150), Y is up-down (FLOOR_Y=−22 is ground).

## File Changes

**Only file modified:** `src/renderer/Room.js`

No new files. No changes to constants.js, Lighting.js, AquariumTank.js, or any other file. The Room class already owns all room geometry and this redesign stays within that boundary.

## Detailed Changes

### 1. Floor — Lighter Hardwood

**Method:** `_buildRoom()`, `_addWoodGrain()`

- Change floor base color from `0x8b6f47` (medium brown) to `0xc4a574` (light honey)
- Adjust `_addWoodGrain()` color math to produce lighter, warmer plank variation:
  - Base value shifts from `0.52` to `~0.72`
  - Red channel boost stays similar but higher baseline
  - Green channel multiplier stays `~0.85`
  - Blue channel multiplier increases slightly (`0.55` → `~0.62`) for warmer tone
- Plank width stays at 8 units, grain pattern preserved

### 2. Windows — Left Wall + Front Wall

**Method:** `_buildRoom()` (modifications to wall construction)

#### Wall Segmentation Strategy

Instead of a single PlaneGeometry per wall, walls with windows are built from multiple PlaneGeometry segments arranged around the window openings. This is simpler and more reliable than punching holes via Shape.holes.

#### Left Wall — Two Tall Windows

The left wall spans Z from −150 to +150 (300 units) and Y from FLOOR_Y to FLOOR_Y+WALL_H (−22 to +98). It is rotated `Math.PI/2` and positioned at `x = -HALF_W = -250`.

**Window specifications:**
- Window 1: centered at Z=−40, 20 units wide (Z: −50 to −30), 40 units tall (Y: FLOOR_Y+20 to FLOOR_Y+60, i.e. −2 to +38)
- Window 2: centered at Z=+40, 20 units wide (Z: +30 to +50), 40 units tall (same Y range)

**Wall segments needed (5 pieces):**

| Segment | Width (Z-axis) | Height (Y-axis) | Position (Z center, Y center) |
|---------|---------------|-----------------|-------------------------------|
| Bottom strip (full width) | 300 | 20 | (0, FLOOR_Y+10) |
| Top strip (full width) | 300 | 60 | (0, FLOOR_Y+90) |
| Left column (below window 1) | 100 | 40 | (−100, FLOOR_Y+40) |
| Center column (between windows) | 60 | 40 | (0, FLOOR_Y+40) |
| Right column (above window 2) | 100 | 40 | (+100, FLOOR_Y+40) |

All segments use the same wall material and rotation as the original left wall. Each is a PlaneGeometry of the appropriate dimensions.

**Window frames:** White trim (`BoxGeometry`, color `0xf0ebe0`, ~1 unit thick) around each opening — 4 pieces per window (top, bottom, left, right).

**Behind each window:** A sky backdrop plane (`PlaneGeometry(20, 40)`, color `0x87CEEB`, positioned 5 units outside the wall at `x = -255`). In front of the sky plane, one tree per window:
- Trunk: `BoxGeometry(2, 15, 2)`, color `0x5c3a1a`, centered vertically
- Canopy: `BoxGeometry(10, 10, 10)`, color `0x2d6b2d`, on top of trunk
- Ground strip: `PlaneGeometry(20, 10)`, color `0x4a8b3a`, at bottom

**Curtain panels (optional):** `PlaneGeometry(4, 38)` with `MeshLambertMaterial({ color: 0xffffff, opacity: 0.15, transparent: true })`, positioned at left and right edges of each window opening.

#### Front Wall — One Long Horizontal Window

The front wall spans X from −250 to +250 (500 units) at `z = BACK_Z + ROOM_D = 150`, rotated `Math.PI` so the normal faces inward. Each segment must also be rotated `Math.PI`.

**Note on visibility:** The camera default position looks from the front toward the back wall. The front wall is mostly behind the camera. This window serves as ambient background visible when users orbit the camera around. It is low-effort geometry (3 wall segments + sky plane) so worth including for completeness.

**Window specification:**
- Centered at X=−50 (shifted left per layout), 200 units wide (X: −150 to +50), 25 units tall (Y: FLOOR_Y+15 to FLOOR_Y+40, i.e. −7 to +18)

**Wall segments (4 pieces):**

| Segment | Width (X-axis) | Height (Y-axis) | Position (X center, Y center) |
|---------|---------------|-----------------|-------------------------------|
| Bottom strip (full width) | 500 | 15 | (0, FLOOR_Y+7.5) |
| Top strip (full width) | 500 | 80 | (0, FLOOR_Y+80) |
| Left pillar | 100 | 25 | (−200, FLOOR_Y+27.5) |
| Right pillar | 200 | 25 | (+150, FLOOR_Y+27.5) |

Window frame, sky plane, and tree behind — same treatment as left wall but scaled to the wider opening. Sky plane at `z = 155`. Multiple trees (3) spaced across the wide opening.

#### Baseboard Handling

The existing full-width baseboards on the left and front walls must be split to stop at window frame edges. For the left wall, the baseboard becomes 2 segments (one on each side of the windows, plus the gap). For the front wall, similarly split around the window opening. Baseboards on back and right walls remain unchanged.

### 3. Sofa — White Cloth, Repositioned

**Method:** `_buildSofa()`

- **Color change:** All sofa materials from dark gray (`0x3a3a3a`, `0x333333`, `0x363636`) to white/cream cloth (`0xf0ebe5` seat, `0xeae5dd` back, `0xede8e0` arms)
- **Position:** Move from `(x=-100, z=20)` to `(x=-80, z=65)` — left-front area, facing the tank. This places the sofa ~85 units from the front wall (z=150), leaving ample room and matching the layout where the sofa is in the lower-left quadrant but not pressed against the wall.
- **Throw pillows:** Change colors to:
  - Blue patterned: `0x6688aa`
  - Deep blue: `0x4477aa`
  - Warm accent: `0xc4956a`
- **Structure stays the same:** seat cushion, back cushion, armrests, legs, divider lines — just recolored and repositioned

### 4. Coffee Table — Repositioned + New Items

**Method:** `_buildCoffeeTable()`

- **Position:** Move from `(x=-100, z=50)` to `(x=-40, z=35)` — between sofa and tank
- **Existing items kept:** Wood top, metal legs, stacked books
- **New items added:**
  - **TV remote:** Small dark box (`BoxGeometry(4, 0.3, 1.5)`, color `0x222222`) placed on table surface, slightly angled
  - **Small potted plant:** Tiny pot (`BoxGeometry(2, 2, 2)`, color `0xb85c38`) + green top (`BoxGeometry(3, 2, 3)`, color `0x2d8b2d`), positioned on table corner

### 5. Rug — One Big Centered Rug

**Method:** `_buildRug()`, `_addRugPattern()`

- **Remove** the two separate rugs (sofa rug + tank rug)
- **Delete** `_addRugPattern2()` method — no longer needed
- **Create one large rug:** `PlaneGeometry(160, 100, 50, 30)` — big enough to span from sofa to tank area
- **Position:** Centered at roughly `(x=-30, z=30)` to cover the main living space
- **Oriental-style pattern** via vertex colors:
  - Warm base: earth tones (`0xb8956a`)
  - Border band: darker accent edge (`0x8b6b4a`)
  - Inner border: contrasting warm red-brown (`0x9b5540`)
  - Center field: subtle geometric pattern using modular arithmetic on vertex positions
  - Some blue accent (`0x5577aa`) in the pattern for depth
- `polygonOffset` stays for z-fighting prevention

### 6. TV Console — New Method

**New method:** `_buildTVConsole()`

- **Position:** Left side of back wall, `(x=-80, z=BACK_Z+8)` → `(x=-80, z=-142)`
- **Legs:** 3 units tall, 4 corners, color `0x333333`
- **Body:** `BoxGeometry(60, 8, 16)`, medium wood color `0x7a5a3a`, center Y = `FLOOR_Y + 3 + 4 = FLOOR_Y + 7` (legs + half body height)
- **Top surface:** `BoxGeometry(62, 0.5, 17)`, slightly darker `0x6b4a2a`, Y = `FLOOR_Y + 11.25`
- **Cabinet doors:** Two front panels with subtle divider line
- **Decor on top (Y = FLOOR_Y + 11.5):**
  - Small photo frame: `BoxGeometry(4, 5, 0.5)`, dark frame `0x333333`, standing upright at `(x=-95, z=-142)`
  - Small plant: 2-3 green boxes in tiny pot at `(x=-65, z=-142)`

### 7. Flatscreen TV — New Method

**New method:** `_buildTV()`

- **Screen:** `BoxGeometry(45, 25, 0.8)`, color `0x111111` (dark bezel)
- **Position:** `(x=-80, z=BACK_Z+10, y=FLOOR_Y + 11.5 + 12.5)` = `(x=-80, z=-140, y=FLOOR_Y+24)` — centered above TV console
- **Screen face:** Inset rectangle `BoxGeometry(42, 22, 0.1)`, color `0x1a1a2a` (powered-off screen look), positioned 0.5 units in front of the bezel
- **Stand/base:** Small center support `BoxGeometry(8, 2, 6)`, color `0x222222`, bridging from console top to TV bottom

### 8. Cabinet (Tank Stand) — No Change

**Method:** `_buildCabinet()` — **unchanged**

The tank cabinet/stand stays as-is. Its dark wood color (`0x2a2520`) provides contrast against the lighter room, making the tank area feel like a dedicated display piece. No modifications needed.

### 9. Bookshelf — Removed

**Method:** `_buildBookshelf()` — **deleted entirely**

The bookshelf at `(x=140, z=-60)` is removed. Its space on the right side of the room will have repositioned plants and the floor lamp instead.

Remove the call to `this._buildBookshelf()` from the constructor.

### 10. Plants — Repositioned

**Method:** `_buildFloorPlants()`

Keep the same 4 voxel plant designs (monstera, fiddle-leaf, snake plant, small plant) but reposition:

| Plant | Old Position | New Position | Rationale |
|-------|-------------|-------------|-----------|
| Monstera | (-45, FLOOR_Y, 5) | (-45, FLOOR_Y, 5) | Keep — flanks tank nicely |
| Fiddle-leaf | (45, FLOOR_Y, 8) | (45, FLOOR_Y, 8) | Keep — flanks tank on right |
| Snake plant | (-140, FLOOR_Y, -20) | (120, FLOOR_Y, -20) | Move to right side of room |
| Small plant | (150, FLOOR_Y, -60) | (100, FLOOR_Y, 60) | Move to front-right area |

### 11. Floor Lamp — Repositioned

**Method:** `_buildFloorLamp()`

- Move from `(x=80, z=-10)` to `(x=110, z=20)` — right side of room, between tank and right wall
- Point light stays attached, just moves with it

### 12. Side Table — Repositioned

**Method:** `_buildSideTable()`

- Move from `(x=-72, z=15)` to `(x=-55, z=65)` — next to the sofa's right armrest
- Vase stays on top

### 13. Door — Repositioned

**Method:** `_buildDoor()`

- Move from `(x=100)` to `(x=60)` on the back wall — right of center, not conflicting with TV console
- Door frame is 14 units wide (spans x=53 to x=67)
- Cat easter egg, doorknob interaction all preserved, just shifted
- Cat peek positions update automatically since they're computed relative to `this._doorX`

### 14. Lightswitch — Repositioned

**Method:** `_buildLightswitch()`

- Move from `(x=80)` to `(x=85)` — near the door on the back wall but with clearance
- The cat's hidden position at `doorX + 18 = 78` and lightswitch at `x=85` gives 7 units of separation — no visual overlap

## What Does NOT Change

- `src/constants.js` — all tank/room dimensions stay the same
- `src/renderer/AquariumTank.js` — tank geometry untouched
- `src/renderer/Lighting.js` — lighting system untouched
- `src/renderer/WaterEffects.js` — bubbles/fog untouched
- `src/fish/` — all fish systems untouched
- `src/decorations/` — all decoration systems untouched
- `src/ui/` — all UI panels untouched
- `_buildCabinet()` — tank stand stays as-is (dark wood provides contrast)
- Room dimensions (`ROOM_W=500`, `ROOM_D=300`, `WALL_H=120`) stay the same
- Cat easter egg behavior and animation logic preserved
- Lightswitch toggle behavior preserved

## Performance Note

The redesign adds window frame geometry (several BoxGeometry pieces), sky planes with trees behind windows, a TV console, and a TV. It removes the bookshelf (which had many individual book meshes — potentially 20+ draw calls). Net geometry count is roughly neutral. No performance concerns.

## Testing

- Visual verification via dev server (`npm run dev`)
- Orbit camera around room to check all furniture is visible and properly positioned
- Verify fish tank still renders correctly in center
- Click doorknob 3x to verify cat easter egg still works
- Click lightswitch to verify room light toggle still works
- Verify cat peek animation does not visually overlap lightswitch
- Check no z-fighting on rug/floor
- Check window outdoor scenes look reasonable from all camera angles
- Check baseboards stop cleanly at window edges
