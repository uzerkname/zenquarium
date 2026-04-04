import * as THREE from 'three';

// ── Room dimensions ───────────────────────────────────
// 1 world unit ≈ 1 inch.  Tank 50 wide ≈ 4 ft aquarium.
const ROOM_FLOOR_Y = -53;
const WALL_H = 216;       // 18 ft ceiling

const ROOM_X_MIN = -120;
const ROOM_X_MAX = 600;
const ROOM_Z_MIN = -170;
const ROOM_Z_MAX = 700;

// ── Color constants ───────────────────────────────────
const WALL_BASE = 0xe8e0d0;

// ════════════════════════════════════════════════════════
export class Room {
  constructor(scene, camera, renderer, lighting) {
    this.scene = scene;
    this._buildSmoothShell();
    this._buildTankStand();
  }

  // ── Smooth room shell (walls, floor, ceiling) ────────
  _buildSmoothShell() {
    const wallMat = new THREE.MeshLambertMaterial({ color: WALL_BASE });
    const wallMatDS = new THREE.MeshLambertMaterial({ color: WALL_BASE, side: THREE.DoubleSide });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xb89a6a, side: THREE.DoubleSide });
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xf0ebe0, side: THREE.DoubleSide });

    const floorY = ROOM_FLOOR_Y;
    const ceilY = ROOM_FLOOR_Y + WALL_H;
    const midY = floorY + WALL_H / 2;
    const roomW = ROOM_X_MAX - ROOM_X_MIN;
    const roomD = ROOM_Z_MAX - ROOM_Z_MIN;
    const cx = (ROOM_X_MIN + ROOM_X_MAX) / 2;
    const cz = (ROOM_Z_MIN + ROOM_Z_MAX) / 2;

    // ── Floor + Ceiling ──
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, floorY, cz);
    floor.receiveShadow = false;
    this.scene.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, ceilY, cz);
    this.scene.add(ceil);

    // ── Back wall ──
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, WALL_H), wallMatDS);
    backWall.position.set(cx, midY, ROOM_Z_MIN);
    this.scene.add(backWall);

    // ── Front wall ──
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, WALL_H), wallMatDS);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(cx, midY, ROOM_Z_MAX);
    this.scene.add(frontWall);

    // ── Left wall ──
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, WALL_H), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(ROOM_X_MIN, midY, cz);
    this.scene.add(leftWall);

    // ── Right wall ──
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, WALL_H), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM_X_MAX, midY, cz);
    this.scene.add(rightWall);
  }

  // ── Tank stand (smooth geometry) ──────────────────────
  _buildTankStand() {
    // Tank is at (85, 0, -10), rotated 90°.
    // World footprint: X 72.5–97.5 (25 wide), Z -35–15 (50 deep).
    // Tank bottom is at world Y = FLOOR_Y_TANK (-22). Stand fills gap to room floor.
    const TX = 240, TZ = 265;
    const TANK_BOTTOM_Y = -30;  // tank walls centered at Y=0, height 60 → bottom at -30
    const standW = 56;   // slightly wider than tank
    const standD = 106;  // slightly deeper than tank
    const standH = TANK_BOTTOM_Y - ROOM_FLOOR_Y;  // -22 - (-53) = 31
    const legH = 6;
    const legInset = 2;
    const topThick = 2;

    const darkWood = new THREE.MeshLambertMaterial({ color: 0x2e2620 });
    const topWood = new THREE.MeshLambertMaterial({ color: 0x3a3028 });
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    // Legs
    const legSize = 3;
    const legGeo = new THREE.BoxGeometry(legSize, legH, legSize);
    const legOffsets = [
      [-standW / 2 + legInset + legSize / 2, -standD / 2 + legInset + legSize / 2],
      [ standW / 2 - legInset - legSize / 2, -standD / 2 + legInset + legSize / 2],
      [-standW / 2 + legInset + legSize / 2,  standD / 2 - legInset - legSize / 2],
      [ standW / 2 - legInset - legSize / 2,  standD / 2 - legInset - legSize / 2],
    ];
    for (const [dx, dz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(TX + dx, ROOM_FLOOR_Y + legH / 2, TZ + dz);
      this.scene.add(leg);
    }

    // Cabinet body (above legs, below top)
    const bodyH = standH - legH - topThick;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(standW, bodyH, standD),
      darkWood
    );
    body.position.set(TX, ROOM_FLOOR_Y + legH + bodyH / 2, TZ);
    body.receiveShadow = false;
    this.scene.add(body);

    // Top surface with slight overhang
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(standW + 3, topThick, standD + 3),
      topWood
    );
    top.position.set(TX, ROOM_FLOOR_Y + standH - topThick / 2, TZ);
    this.scene.add(top);
  }

  update(delta) {}
}
