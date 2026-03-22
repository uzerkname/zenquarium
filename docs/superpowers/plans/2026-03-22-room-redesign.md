# Room Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the 3D room in Zenquarium to match a cozy living room reference: light hardwood floors, white sofa, big windows with garden views, TV console with flatscreen, fish tank centered.

**Architecture:** All changes are in `src/renderer/Room.js`. The Room class owns all room geometry via separate `_build*()` methods. We modify existing methods (recolor, reposition) and add two new ones (`_buildTVConsole`, `_buildTV`). Remove `_buildBookshelf`.

**Tech Stack:** Three.js (BoxGeometry, PlaneGeometry, MeshLambertMaterial), Vite dev server for visual verification.

**Spec:** `docs/superpowers/specs/2026-03-22-room-redesign-design.md`

---

### Task 1: Floor + Wood Grain — Lighter Hardwood

**Files:**
- Modify: `src/renderer/Room.js` — `_buildRoom()` line 66, `_addWoodGrain()` lines 126-142

- [ ] **Step 1: Change floor base color**

In `_buildRoom()`, change the floor material color:

```js
// OLD:
const floorMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47, vertexColors: true });
// NEW:
const floorMat = new THREE.MeshLambertMaterial({ color: 0xc4a574, vertexColors: true });
```

- [ ] **Step 2: Update wood grain to lighter tones**

Replace the `_addWoodGrain()` method body:

```js
_addWoodGrain(geo) {
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    const plank = Math.floor((px + HALF_W) / 8);
    const plankShade = (plank % 2 === 0) ? 0.0 : 0.04;
    const grain = Math.sin(pz * 1.5 + plank * 3.7) * 0.02;
    const v = 0.72 + plankShade + grain + Math.random() * 0.03;
    colors[i * 3]     = v + 0.05;
    colors[i * 3 + 1] = v * 0.85;
    colors[i * 3 + 2] = v * 0.62;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Expected: Floor appears as light honey-colored hardwood with visible plank variation. Much lighter than before.

- [ ] **Step 4: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): lighten hardwood floor to honey tone"
```

---

### Task 2: Left Wall Windows

**Files:**
- Modify: `src/renderer/Room.js` — `_buildRoom()` lines 73-78 (left wall), lines 115-118 (left baseboard)

- [ ] **Step 1: Replace single left wall with segmented wall + windows**

Replace the left wall construction (lines 73-78) with the following. The old code creates a single PlaneGeometry; the new code creates 5 wall segments with two window openings, window frames, sky backdrops, trees, and curtains:

```js
// Left wall — segmented with two windows
// Window 1: Z=-50 to -30, Window 2: Z=+30 to +50
// Both: Y=FLOOR_Y+20 to FLOOR_Y+60
const leftWallMat = wallMat.clone();
const leftWallX = -HALF_W;
const leftWallCenterZ = BACK_Z + ROOM_D / 2;
const lwRot = Math.PI / 2;

// Bottom strip (full width, below windows)
const lwBottom = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_D, 20),
  leftWallMat
);
lwBottom.rotation.y = lwRot;
lwBottom.position.set(leftWallX, FLOOR_Y + 10, leftWallCenterZ);
this.scene.add(lwBottom);

// Top strip (full width, above windows)
const lwTop = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_D, 60),
  leftWallMat.clone()
);
lwTop.rotation.y = lwRot;
lwTop.position.set(leftWallX, FLOOR_Y + 90, leftWallCenterZ);
this.scene.add(lwTop);

// Left column (Z: -150 to -50, between back wall and window 1)
const lwLeftCol = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 40),
  leftWallMat.clone()
);
lwLeftCol.rotation.y = lwRot;
lwLeftCol.position.set(leftWallX, FLOOR_Y + 40, BACK_Z + 50);
this.scene.add(lwLeftCol);

// Center column (Z: -30 to +30, between the two windows)
const lwCenterCol = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 40),
  leftWallMat.clone()
);
lwCenterCol.rotation.y = lwRot;
lwCenterCol.position.set(leftWallX, FLOOR_Y + 40, leftWallCenterZ);
this.scene.add(lwCenterCol);

// Right column (Z: +50 to +150, between window 2 and front wall)
const lwRightCol = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 40),
  leftWallMat.clone()
);
lwRightCol.rotation.y = lwRot;
lwRightCol.position.set(leftWallX, FLOOR_Y + 40, BACK_Z + ROOM_D - 50);
this.scene.add(lwRightCol);

// Window frames + sky + trees for each window
const windowFrameMat = new THREE.MeshLambertMaterial({ color: 0xf0ebe0 });
const skyMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB, side: THREE.DoubleSide });
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1a });
const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2d6b2d });
const groundMat = new THREE.MeshLambertMaterial({ color: 0x4a8b3a });
const curtainMat = new THREE.MeshLambertMaterial({
  color: 0xffffff, opacity: 0.15, transparent: true, side: THREE.DoubleSide
});

const windowCentersZ = [-40, 40]; // Z centers for the two windows
for (const wz of windowCentersZ) {
  const winY = FLOOR_Y + 40; // vertical center of window
  const winX = leftWallX;

  // Frame — 4 bars around the opening (20 wide x 40 tall)
  // Top bar
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 22), windowFrameMat);
  fTop.position.set(winX + 0.3, FLOOR_Y + 60.5, wz);
  this.scene.add(fTop);
  // Bottom bar
  const fBot = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 22), windowFrameMat.clone());
  fBot.position.set(winX + 0.3, FLOOR_Y + 19.5, wz);
  this.scene.add(fBot);
  // Left bar
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 42, 1), windowFrameMat.clone());
  fLeft.position.set(winX + 0.3, winY, wz - 10.5);
  this.scene.add(fLeft);
  // Right bar
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(1, 42, 1), windowFrameMat.clone());
  fRight.position.set(winX + 0.3, winY, wz + 10.5);
  this.scene.add(fRight);

  // Sky backdrop
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), skyMat.clone());
  sky.rotation.y = lwRot;
  sky.position.set(winX - 5, winY, wz);
  this.scene.add(sky);

  // Tree: trunk + canopy
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 2), trunkMat.clone());
  trunk.position.set(winX - 4, winY - 5, wz);
  this.scene.add(trunk);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), canopyMat.clone());
  canopy.position.set(winX - 4, winY + 7, wz);
  this.scene.add(canopy);
  // Second smaller canopy cluster
  const canopy2 = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), new THREE.MeshLambertMaterial({ color: 0x3d8b3d }));
  canopy2.position.set(winX - 4, winY + 12, wz + 3);
  this.scene.add(canopy2);

  // Ground strip
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), groundMat.clone());
  ground.rotation.y = lwRot;
  ground.position.set(winX - 5, FLOOR_Y + 20, wz);
  this.scene.add(ground);

  // Curtain panels
  const curtainL = new THREE.Mesh(new THREE.PlaneGeometry(4, 38), curtainMat.clone());
  curtainL.rotation.y = lwRot;
  curtainL.position.set(winX + 0.5, winY, wz - 9);
  this.scene.add(curtainL);
  const curtainR = new THREE.Mesh(new THREE.PlaneGeometry(4, 38), curtainMat.clone());
  curtainR.rotation.y = lwRot;
  curtainR.position.set(winX + 0.5, winY, wz + 9);
  this.scene.add(curtainR);
}
```

- [ ] **Step 2: Split left baseboard around windows**

Replace the left baseboard (lines 115-118) with two segments that stop at the window area:

```js
// Left baseboard — split around windows (windows span Z=-50 to +50 with gap)
// Segment 1: Z from BACK_Z to -50 (length 100)
const bbLeftBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, bbH, 100), bbMat.clone());
bbLeftBack.position.set(-HALF_W + 0.4, FLOOR_Y + bbH / 2, BACK_Z + 50);
this.scene.add(bbLeftBack);
// Segment 2: Z from +50 to front wall (length 100)
const bbLeftFront = new THREE.Mesh(new THREE.BoxGeometry(0.8, bbH, 100), bbMat.clone());
bbLeftFront.position.set(-HALF_W + 0.4, FLOOR_Y + bbH / 2, BACK_Z + ROOM_D - 50);
this.scene.add(bbLeftFront);
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Expected: Left wall has two tall windows with white frames, blue sky behind them, green trees visible, and white curtain panels on each side. Baseboards stop cleanly at window edges.

- [ ] **Step 4: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): add two windows to left wall with garden views"
```

---

### Task 3: Front Wall Window

**Files:**
- Modify: `src/renderer/Room.js` — `_buildRoom()` (find the `// Front wall` comment and `// Front baseboard` sections — line numbers will have shifted after Task 2)

**Note:** Task 2 added ~120 lines to `_buildRoom()`. Use string anchors (comments) not line numbers to find the code to replace.

- [ ] **Step 1: Replace single front wall with segmented wall + window**

Replace the front wall construction (lines 86-91) with:

```js
// Front wall — segmented with one long horizontal window
// Window: X=-150 to +50, Y=FLOOR_Y+15 to FLOOR_Y+40
const frontWallZ = BACK_Z + ROOM_D;
const fwMat = wallMat.clone();
const fwRot = Math.PI;

// Bottom strip (full width)
const fwBottom = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W, 15),
  fwMat
);
fwBottom.rotation.y = fwRot;
fwBottom.position.set(0, FLOOR_Y + 7.5, frontWallZ);
this.scene.add(fwBottom);

// Top strip (full width)
const fwTop = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W, 80),
  fwMat.clone()
);
fwTop.rotation.y = fwRot;
fwTop.position.set(0, FLOOR_Y + 80, frontWallZ);
this.scene.add(fwTop);

// Left pillar (X: -250 to -150)
const fwLeftPillar = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 25),
  fwMat.clone()
);
fwLeftPillar.rotation.y = fwRot;
fwLeftPillar.position.set(-200, FLOOR_Y + 27.5, frontWallZ);
this.scene.add(fwLeftPillar);

// Right pillar (X: +50 to +250)
const fwRightPillar = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 25),
  fwMat.clone()
);
fwRightPillar.rotation.y = fwRot;
fwRightPillar.position.set(150, FLOOR_Y + 27.5, frontWallZ);
this.scene.add(fwRightPillar);

// Front window frame
const fwFrameMat = new THREE.MeshLambertMaterial({ color: 0xf0ebe0 });
const fwWinCenterX = -50;
const fwWinCenterY = FLOOR_Y + 27.5;
// Top bar
this.scene.add(Object.assign(
  new THREE.Mesh(new THREE.BoxGeometry(202, 1, 1), fwFrameMat),
  { position: new THREE.Vector3(fwWinCenterX, FLOOR_Y + 40.5, frontWallZ - 0.3) }
));
// Bottom bar
this.scene.add(Object.assign(
  new THREE.Mesh(new THREE.BoxGeometry(202, 1, 1), fwFrameMat.clone()),
  { position: new THREE.Vector3(fwWinCenterX, FLOOR_Y + 14.5, frontWallZ - 0.3) }
));
// Left bar
this.scene.add(Object.assign(
  new THREE.Mesh(new THREE.BoxGeometry(1, 27, 1), fwFrameMat.clone()),
  { position: new THREE.Vector3(-151, fwWinCenterY, frontWallZ - 0.3) }
));
// Right bar
this.scene.add(Object.assign(
  new THREE.Mesh(new THREE.BoxGeometry(1, 27, 1), fwFrameMat.clone()),
  { position: new THREE.Vector3(51, fwWinCenterY, frontWallZ - 0.3) }
));

// Sky backdrop behind front window
const fwSky = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 25),
  new THREE.MeshLambertMaterial({ color: 0x87CEEB, side: THREE.DoubleSide })
);
fwSky.rotation.y = fwRot;
fwSky.position.set(fwWinCenterX, fwWinCenterY, frontWallZ + 5);
this.scene.add(fwSky);

// Three trees behind front window
const fwTreeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1a });
const fwTreeCanopyMat = new THREE.MeshLambertMaterial({ color: 0x2d6b2d });
const fwTreeCanopy2Mat = new THREE.MeshLambertMaterial({ color: 0x3d8b3d });
for (const tx of [-100, -50, 0]) {
  const t = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2), fwTreeTrunkMat.clone());
  t.position.set(tx, fwWinCenterY - 2, frontWallZ + 4);
  this.scene.add(t);
  const c = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), fwTreeCanopyMat.clone());
  c.position.set(tx, fwWinCenterY + 7, frontWallZ + 4);
  this.scene.add(c);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), fwTreeCanopy2Mat.clone());
  c2.position.set(tx + 4, fwWinCenterY + 10, frontWallZ + 4);
  this.scene.add(c2);
}
// Ground strip behind front window
const fwGround = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 8),
  new THREE.MeshLambertMaterial({ color: 0x4a8b3a })
);
fwGround.rotation.y = fwRot;
fwGround.position.set(fwWinCenterX, FLOOR_Y + 15, frontWallZ + 5);
this.scene.add(fwGround);
```

- [ ] **Step 2: Split front baseboard around window**

Replace the front baseboard (lines 110-113) with segments:

```js
// Front baseboard — split around window (window spans X=-150 to +50)
// Segment 1: X from -250 to -150 (length 100)
const bbFrontLeft = new THREE.Mesh(new THREE.BoxGeometry(100, bbH, 0.8), bbMat.clone());
bbFrontLeft.position.set(-200, FLOOR_Y + bbH / 2, frontWallZ - 0.4);
this.scene.add(bbFrontLeft);
// Segment 2: X from +50 to +250 (length 200)
const bbFrontRight = new THREE.Mesh(new THREE.BoxGeometry(200, bbH, 0.8), bbMat.clone());
bbFrontRight.position.set(150, FLOOR_Y + bbH / 2, frontWallZ - 0.4);
this.scene.add(bbFrontRight);
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Orbit camera to view front wall. Expected: long horizontal window with sky, trees, and white frame. Baseboards stop at window edges.

- [ ] **Step 4: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): add horizontal window to front wall"
```

---

### Task 4: Sofa — White Cloth + Reposition

**Files:**
- Modify: `src/renderer/Room.js` — `_buildSofa()` lines 199-265

- [ ] **Step 1: Update sofa position and colors**

Make these exact replacements in `_buildSofa()`. Only colors and the two position constants change — all geometry and relative offsets stay identical:

| Find | Replace With | What |
|------|-------------|------|
| `const sofaX = -100;` | `const sofaX = -80;` | Reposition X |
| `const sofaZ = 20;` | `const sofaZ = 65;` | Reposition Z |
| `{ color: 0x1a1a1a }` | `{ color: 0x8b7355 }` | Leg color (dark → wood) |
| `{ color: 0x3a3a3a }` | `{ color: 0xf0ebe5 }` | Seat color (gray → white) |
| `{ color: 0x333333 }` | `{ color: 0xeae5dd }` | Back color |
| `{ color: 0x363636 }` | `{ color: 0xede8e0 }` | Arm color |
| `{ color: 0x2e2e2e }` | `{ color: 0xe0dbd3 }` | Divider color |
| `[0x556677, 0x667766, 0x886655]` | `[0x6688aa, 0x4477aa, 0xc4956a]` | Pillow colors |

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Expected: White/cream sofa in the left-front area of the room with blue and warm-toned throw pillows.

- [ ] **Step 3: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): white cloth sofa with blue/warm pillows, repositioned"
```

---

### Task 5: Coffee Table — Reposition + New Items

**Files:**
- Modify: `src/renderer/Room.js` — `_buildCoffeeTable()` lines 269-301

- [ ] **Step 1: Update position and add items**

Change position constants and add TV remote + small plant after the books:

```js
_buildCoffeeTable() {
  const ctX = -40;
  const ctZ = 35;
```

Then after the books loop (end of method), add:

```js
  // TV remote on table
  const remoteMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const remoteGeo = new THREE.BoxGeometry(4, 0.3, 1.5);
  const remote = new THREE.Mesh(remoteGeo, remoteMat);
  remote.position.set(ctX - 5, FLOOR_Y + legH + 1.35, ctZ + 3);
  remote.rotation.y = 0.3;
  this.scene.add(remote);

  // Small potted plant on table corner
  const potMat = new THREE.MeshLambertMaterial({ color: 0xb85c38 });
  const pot = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), potMat);
  pot.position.set(ctX - 10, FLOOR_Y + legH + 2.2, ctZ - 3);
  this.scene.add(pot);
  const plantTop = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 3),
    new THREE.MeshLambertMaterial({ color: 0x2d8b2d })
  );
  plantTop.position.set(ctX - 10, FLOOR_Y + legH + 3.7, ctZ - 3);
  this.scene.add(plantTop);
```

- [ ] **Step 2: Verify visually**

Expected: Coffee table between sofa and tank with books, remote, and small plant.

- [ ] **Step 3: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): reposition coffee table, add remote and plant"
```

---

### Task 6: Rug — One Big Oriental Rug

**Files:**
- Modify: `src/renderer/Room.js` — `_buildRug()` lines 305-333, `_addRugPattern()` lines 335-350, delete `_addRugPattern2()` lines 353-367

- [ ] **Step 1: Replace rug methods**

Replace `_buildRug()`, `_addRugPattern()`, and delete `_addRugPattern2()`:

```js
_buildRug() {
  const rugGeo = new THREE.PlaneGeometry(160, 100, 50, 30);
  const rugMat = new THREE.MeshLambertMaterial({
    color: 0xb8956a,
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  this._addRugPattern(rugGeo);
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-30, FLOOR_Y + 0.05, 30);
  this.scene.add(rug);
}

_addRugPattern(geo) {
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const halfW = 80, halfH = 50;
  for (let i = 0; i < count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);

    // Distance from edges for border bands
    const dx = halfW - Math.abs(px);
    const dy = halfH - Math.abs(py);
    const edgeDist = Math.min(dx, dy);

    let r, g, b;
    if (edgeDist < 5) {
      // Outer border — dark accent
      r = 0.55; g = 0.42; b = 0.29;
    } else if (edgeDist < 10) {
      // Inner border — warm red-brown
      r = 0.61; g = 0.33; b = 0.25;
    } else {
      // Center field — geometric pattern
      const pat = (Math.floor(px / 8) + Math.floor(py / 8)) % 3;
      if (pat === 0) {
        r = 0.72; g = 0.58; b = 0.42; // warm base
      } else if (pat === 1) {
        r = 0.65; g = 0.52; b = 0.38; // slightly darker
      } else {
        r = 0.34; g = 0.47; b = 0.67; // blue accent
      }
    }
    // Add subtle noise
    const noise = Math.random() * 0.03;
    colors[i * 3]     = r + noise;
    colors[i * 3 + 1] = g + noise;
    colors[i * 3 + 2] = b + noise;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
```

- [ ] **Step 2: Verify visually**

Expected: One large oriental-style rug centered under the living area with visible border bands and geometric center pattern.

- [ ] **Step 3: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): replace two rugs with one large oriental rug"
```

---

### Task 7: TV Console + Flatscreen TV

**Files:**
- Modify: `src/renderer/Room.js` — add `_buildTVConsole()` and `_buildTV()` methods, update constructor

- [ ] **Step 1: Add constructor calls**

In the constructor, after `this._buildRug();` add:

```js
this._buildTVConsole();
this._buildTV();
```

- [ ] **Step 2: Add `_buildTVConsole()` method**

Add after `_buildRug()` / `_addRugPattern()`:

```js
// ── TV Console (low wooden cabinet) ────────────────────

_buildTVConsole() {
  const tcX = -80;
  const tcZ = BACK_Z + 8; // -142
  const legH = 3;
  const bodyH = 8;

  // Legs
  const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const legGeo = new THREE.BoxGeometry(1.2, legH, 1.2);
  const legOffsets = [[-28, -7], [28, -7], [-28, 7], [28, 7]];
  for (const [dx, dz] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(tcX + dx, FLOOR_Y + legH / 2, tcZ + dz);
    this.scene.add(leg);
  }

  // Body
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(60, bodyH, 16), bodyMat);
  body.position.set(tcX, FLOOR_Y + legH + bodyH / 2, tcZ);
  this.scene.add(body);

  // Top surface
  const topMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  const top = new THREE.Mesh(new THREE.BoxGeometry(62, 0.5, 17), topMat);
  top.position.set(tcX, FLOOR_Y + legH + bodyH + 0.25, tcZ);
  this.scene.add(top);

  // Cabinet door divider line
  const divMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
  const div = new THREE.Mesh(new THREE.BoxGeometry(0.3, bodyH - 1, 0.3), divMat);
  div.position.set(tcX, FLOOR_Y + legH + bodyH / 2, tcZ + 8.1);
  this.scene.add(div);

  // Decor: small photo frame
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.5), frameMat);
  frame.position.set(tcX - 15, FLOOR_Y + legH + bodyH + 3, tcZ);
  this.scene.add(frame);
  // Frame inner (lighter)
  const frameInner = new THREE.Mesh(
    new THREE.BoxGeometry(3, 4, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xddc9a5 })
  );
  frameInner.position.set(tcX - 15, FLOOR_Y + legH + bodyH + 3, tcZ + 0.3);
  this.scene.add(frameInner);

  // Decor: small plant
  const dPot = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshLambertMaterial({ color: 0xe8e0d0 })
  );
  dPot.position.set(tcX + 15, FLOOR_Y + legH + bodyH + 1.25, tcZ);
  this.scene.add(dPot);
  const dPlant = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshLambertMaterial({ color: 0x2d8b2d })
  );
  dPlant.position.set(tcX + 15, FLOOR_Y + legH + bodyH + 3, tcZ);
  this.scene.add(dPlant);
}
```

- [ ] **Step 3: Add `_buildTV()` method**

Add after `_buildTVConsole()`:

```js
// ── Flatscreen TV ──────────────────────────────────────

_buildTV() {
  const tvX = -80;
  const tvZ = BACK_Z + 10; // -140
  const consoleTopY = FLOOR_Y + 3 + 8; // legs + body = 11

  // TV stand/base connecting to console
  const standMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 6), standMat);
  stand.position.set(tvX, consoleTopY + 1.25, tvZ);
  this.scene.add(stand);

  // TV bezel (outer frame)
  const bezelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(45, 25, 0.8), bezelMat);
  bezel.position.set(tvX, consoleTopY + 2 + 12.5, tvZ);
  this.scene.add(bezel);

  // Screen face (inset, slightly lighter)
  const screenMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(42, 22, 0.1), screenMat);
  screen.position.set(tvX, consoleTopY + 2 + 12.5, tvZ + 0.45);
  this.scene.add(screen);
}
```

- [ ] **Step 4: Verify visually**

Expected: Low wooden TV console against the left side of the back wall with photo frame and plant on top. Flatscreen TV centered above it on a small stand.

- [ ] **Step 5: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): add TV console and flatscreen TV"
```

---

### Task 8: Remove Bookshelf + Reposition Remaining Furniture

**Note:** `_buildCabinet()` is intentionally NOT modified — the tank stand stays as-is (dark wood provides contrast).

**Files:**
- Modify: `src/renderer/Room.js` — constructor (remove bookshelf call), delete `_buildBookshelf()`, update positions in `_buildFloorPlants()`, `_buildFloorLamp()`, `_buildSideTable()`, `_buildDoor()`, `_buildLightswitch()`

- [ ] **Step 1: Remove bookshelf**

In constructor, delete the line:
```js
this._buildBookshelf();
```

Delete the entire `_buildBookshelf()` method (lines 557-601).

- [ ] **Step 2: Reposition plants**

In `_buildFloorPlants()`, find the `p3.position.set` and `p4.position.set` calls (near the end of the method) and change:

```js
// Snake plant: find "p3.position.set(-140, FLOOR_Y, -20)" → replace with:
p3.position.set(120, FLOOR_Y, -20);

// Small plant: find "p4.position.set(150, FLOOR_Y, -60)" → replace with:
p4.position.set(100, FLOOR_Y, 60);
```

- [ ] **Step 3: Reposition floor lamp**

In `_buildFloorLamp()`, change only the two variable definitions (the lamp group and point light already reference these variables, so they update automatically):

```js
// Find "const lampX = 80;" → replace with:
const lampX = 110;
// Find "const lampZ = -10;" → replace with:
const lampZ = 20;
```

- [ ] **Step 4: Reposition side table**

In `_buildSideTable()`, change:

```js
const stX = -55;
const stZ = 65;
```

- [ ] **Step 5: Reposition door**

In `_buildDoor()`, change:

```js
const doorX = 60;
```

- [ ] **Step 6: Reposition lightswitch**

In `_buildLightswitch()`, change:

```js
const switchX = 85;
```

- [ ] **Step 7: Verify everything**

Run: `npm run dev`
Expected:
- No bookshelf visible
- Plants scattered around room (monstera and fiddle-leaf flanking tank, snake plant on right, small plant front-right)
- Floor lamp on right side of room
- Side table next to sofa
- Door on right side of back wall
- Lightswitch near door with clearance from cat animation
- Click doorknob 3x → cat peeks out
- Click lightswitch → room lights toggle

- [ ] **Step 8: Commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): remove bookshelf, reposition furniture for new layout"
```

---

### Task 9: Final Visual Polish + Verification

**Files:**
- Modify: `src/renderer/Room.js` (if needed for adjustments)

- [ ] **Step 1: Full visual walkthrough**

Run: `npm run dev`
Orbit camera 360 degrees around the room. Check:
- Light hardwood floor looks warm and natural
- Big rug is centered and visible with oriental pattern
- White sofa with colored pillows in left-front area
- Coffee table between sofa and tank with books, remote, plant
- Left wall: two windows with garden views
- Front wall: long horizontal window with garden view
- TV console on left of back wall with decor
- Flatscreen TV above console
- Fish tank centered and beautiful
- Door and lightswitch on right side of back wall
- Plants scattered naturally
- Floor lamp on right side
- No z-fighting or visual artifacts
- No floating geometry or gaps

- [ ] **Step 2: Test interactions**

- Click doorknob 3 times → cat should peek out from behind door
- Verify cat animation doesn't overlap lightswitch
- Click lightswitch → room lights toggle on/off
- Add fish and decorations to tank → everything works normally

- [ ] **Step 3: Adjust if needed**

Fix any visual issues discovered during walkthrough. Common issues:
- Window frame alignment
- Furniture clipping through walls or each other
- Rug z-fighting with floor
- Color adjustments for better contrast

- [ ] **Step 4: Final commit**

```
git add src/renderer/Room.js
git commit -m "feat(room): final polish for cozy living room redesign"
```
