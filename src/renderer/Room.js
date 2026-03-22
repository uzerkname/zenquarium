import * as THREE from 'three';
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, FLOOR_Y } from '../constants.js';
import { buildVoxelGroup } from '../utils/VoxelGeometry.js';

// ── Room dimensions (large living room) ──────────────────
const ROOM_W = 500;       // total width (x)
const ROOM_D = 300;       // total depth (z)
const WALL_H = 120;       // wall height
const BACK_Z = -ROOM_D / 2;            // center room on origin (z=0)
const HALF_W = ROOM_W / 2;
const HALF_D = ROOM_D / 2;

export class Room {
  constructor(scene, camera, renderer, lighting) {
    this.scene = scene;
    this._camera = camera;
    this._renderer = renderer;
    this._lighting = lighting;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();

    // Cat easter egg state
    this._doorknobClicks = 0;
    this._doorknob = null;
    this._catGroup = null;
    this._catState = 'hidden';
    this._catTimer = 0;
    this._catStartX = 0;
    this._catTargetX = 0;

    // Lightswitch state
    this._lightswitch = null;
    this._switchToggle = null;

    this._buildRoom();
    this._buildCabinet();
    this._buildSofa();
    this._buildCoffeeTable();
    this._buildRug();
    this._buildFloorPlants();
    this._buildFloorLamp();
    this._buildSideTable();
    this._buildBookshelf();
    this._buildDoor();
    this._buildCat();
    this._buildLightswitch();

    // Click handler for doorknob + lightswitch
    renderer.domElement.addEventListener('pointerup', (e) => this._onClick(e));
  }

  // ── Walls + Floor + Baseboards + Ceiling ────────────────

  _buildRoom() {
    const wallColor = 0xe8e0d0;
    const wallMat = new THREE.MeshLambertMaterial({ color: wallColor, side: THREE.DoubleSide });

    // Back wall
    const backGeo = new THREE.PlaneGeometry(ROOM_W, WALL_H);
    const backWall = new THREE.Mesh(backGeo, wallMat);
    backWall.position.set(0, FLOOR_Y + WALL_H / 2, BACK_Z);
    this.scene.add(backWall);

    // Floor with wood grain vertex variation
    const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D, 60, 40);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xc4a574, vertexColors: true });
    this._addWoodGrain(floorGeo);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, BACK_Z + ROOM_D / 2);
    this.scene.add(floor);

    // Left wall
    const sideGeo = new THREE.PlaneGeometry(ROOM_D, WALL_H);
    const leftWall = new THREE.Mesh(sideGeo, wallMat.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-HALF_W, FLOOR_Y + WALL_H / 2, BACK_Z + ROOM_D / 2);
    this.scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideGeo, wallMat.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(HALF_W, FLOOR_Y + WALL_H / 2, BACK_Z + ROOM_D / 2);
    this.scene.add(rightWall);

    // Front wall
    const frontWallZ = BACK_Z + ROOM_D;
    const frontWall = new THREE.Mesh(backGeo.clone(), wallMat.clone());
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, FLOOR_Y + WALL_H / 2, frontWallZ);
    this.scene.add(frontWall);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D);
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, FLOOR_Y + WALL_H, BACK_Z + ROOM_D / 2);
    this.scene.add(ceiling);

    // Baseboards
    const bbMat = new THREE.MeshLambertMaterial({ color: 0xf0ebe0 });
    const bbH = 2.5;

    // Back baseboard
    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, bbH, 0.8), bbMat);
    bbBack.position.set(0, FLOOR_Y + bbH / 2, BACK_Z + 0.4);
    this.scene.add(bbBack);

    // Front baseboard
    const bbFront = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, bbH, 0.8), bbMat.clone());
    bbFront.position.set(0, FLOOR_Y + bbH / 2, frontWallZ - 0.4);
    this.scene.add(bbFront);

    // Left baseboard
    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, bbH, ROOM_D), bbMat.clone());
    bbLeft.position.set(-HALF_W + 0.4, FLOOR_Y + bbH / 2, BACK_Z + ROOM_D / 2);
    this.scene.add(bbLeft);

    // Right baseboard
    const bbRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, bbH, ROOM_D), bbMat.clone());
    bbRight.position.set(HALF_W - 0.4, FLOOR_Y + bbH / 2, BACK_Z + ROOM_D / 2);
    this.scene.add(bbRight);
  }

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

  // ── Cabinet/Stand ───────────────────────────────────────

  _buildCabinet() {
    const cabinetMat = new THREE.MeshLambertMaterial({ color: 0x2a2520 });

    // Cabinet body
    const bodyGeo = new THREE.BoxGeometry(56, 7, TANK_DEPTH + 4);
    const body = new THREE.Mesh(bodyGeo, cabinetMat);
    body.position.set(0, FLOOR_Y + 3.5 + 1.5, 0);
    this.scene.add(body);

    // Cabinet top surface
    const topGeo = new THREE.BoxGeometry(58, 0.4, TANK_DEPTH + 6);
    const topMat = new THREE.MeshLambertMaterial({ color: 0x332e28 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, -TANK_HEIGHT / 2, 0);
    this.scene.add(top);

    // Cabinet front doors
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x352f29 });
    const doorGeo = new THREE.BoxGeometry(26, 5.5, 0.3);
    const frontZ = (TANK_DEPTH + 4) / 2 + 0.15;
    const doorY = FLOOR_Y + 3.5 + 1.5;

    const leftDoor = new THREE.Mesh(doorGeo, doorMat);
    leftDoor.position.set(-14, doorY, frontZ);
    this.scene.add(leftDoor);

    const rightDoor = new THREE.Mesh(doorGeo, doorMat);
    rightDoor.position.set(14, doorY, frontZ);
    this.scene.add(rightDoor);

    // Cabinet door knobs
    const knobMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const knobGeo = new THREE.SphereGeometry(0.3, 6, 6);
    const lKnob = new THREE.Mesh(knobGeo, knobMat);
    lKnob.position.set(-1.5, doorY, frontZ + 0.2);
    this.scene.add(lKnob);
    const rKnob = new THREE.Mesh(knobGeo, knobMat);
    rKnob.position.set(1.5, doorY, frontZ + 0.2);
    this.scene.add(rKnob);

    // Cabinet legs
    const legMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const legGeo = new THREE.BoxGeometry(1.0, 1.5, 1.0);
    const legOffsets = [[-27, -13.5], [27, -13.5], [-27, 13.5], [27, 13.5]];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, FLOOR_Y + 0.75, lz);
      this.scene.add(leg);
    }
  }

  // ── Sofa (large sectional) ──────────────────────────────

  _buildSofa() {
    const sofaX = -100;
    const sofaZ = 20;
    const legH = 2.5;
    const seatY = FLOOR_Y + legH + 3;

    // Sofa legs (6 for long sofa)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const legGeo = new THREE.BoxGeometry(1.2, legH, 1.2);
    const legPos = [
      [-18, -7], [0, -7], [18, -7],
      [-18, 7], [0, 7], [18, 7],
    ];
    for (const [dx, dz] of legPos) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(sofaX + dx, FLOOR_Y + legH / 2, sofaZ + dz);
      this.scene.add(leg);
    }

    // Seat cushion (wide 3-seater)
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const seatGeo = new THREE.BoxGeometry(40, 6, 16);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(sofaX, seatY, sofaZ);
    this.scene.add(seat);

    // Back cushion
    const backMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const backGeo = new THREE.BoxGeometry(40, 14, 4);
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(sofaX, seatY + 10, sofaZ - 6);
    this.scene.add(back);

    // Armrests
    const armMat = new THREE.MeshLambertMaterial({ color: 0x363636 });
    const armGeo = new THREE.BoxGeometry(4, 8, 16);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(sofaX - 22, seatY + 1, sofaZ);
    this.scene.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(sofaX + 22, seatY + 1, sofaZ);
    this.scene.add(rightArm);

    // Seat cushion divider lines (subtle)
    const divMat = new THREE.MeshLambertMaterial({ color: 0x2e2e2e });
    const divGeo = new THREE.BoxGeometry(0.3, 5.5, 15);
    for (const dx of [-12, 12]) {
      const div = new THREE.Mesh(divGeo, divMat);
      div.position.set(sofaX + dx, seatY + 0.3, sofaZ);
      this.scene.add(div);
    }

    // Throw pillows
    const pillowColors = [0x556677, 0x667766, 0x886655];
    const pillowGeo = new THREE.BoxGeometry(5, 5, 3.5);
    const pillowPositions = [
      [-14, 0.15], [0, -0.1], [14, 0.12],
    ];
    for (let i = 0; i < pillowPositions.length; i++) {
      const [dx, rz] = pillowPositions[i];
      const pMat = new THREE.MeshLambertMaterial({ color: pillowColors[i] });
      const p = new THREE.Mesh(pillowGeo, pMat);
      p.position.set(sofaX + dx, seatY + 5.5, sofaZ - 2);
      p.rotation.z = rz;
      this.scene.add(p);
    }
  }

  // ── Coffee Table ────────────────────────────────────────

  _buildCoffeeTable() {
    const ctX = -100;
    const ctZ = 50;
    const legH = 4;

    // Table top (wood)
    const topMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
    const topGeo = new THREE.BoxGeometry(30, 1.2, 14);
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(ctX, FLOOR_Y + legH + 0.6, ctZ);
    this.scene.add(top);

    // Legs (metal)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const legGeo = new THREE.BoxGeometry(1, legH, 1);
    const legOffsets = [[-13, -5.5], [13, -5.5], [-13, 5.5], [13, 5.5]];
    for (const [dx, dz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(ctX + dx, FLOOR_Y + legH / 2, ctZ + dz);
      this.scene.add(leg);
    }

    // Books stack on table
    const bookColors = [0x8b2500, 0x2d4a6f, 0x4a6b3d];
    for (let i = 0; i < 3; i++) {
      const bMat = new THREE.MeshLambertMaterial({ color: bookColors[i] });
      const bGeo = new THREE.BoxGeometry(4 - i * 0.3, 0.6, 6 - i * 0.2);
      const book = new THREE.Mesh(bGeo, bMat);
      book.position.set(ctX + 8, FLOOR_Y + legH + 1.2 + i * 0.6 + 0.3, ctZ);
      book.rotation.y = 0.1 * (i - 1);
      this.scene.add(book);
    }
  }

  // ── Area Rug (large) ────────────────────────────────────

  _buildRug() {
    // Main rug under sofa area
    const rugGeo = new THREE.PlaneGeometry(80, 50, 30, 18);
    const rugMat = new THREE.MeshLambertMaterial({
      color: 0x9c8b6e,
      vertexColors: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this._addRugPattern(rugGeo);
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-100, FLOOR_Y + 0.05, 35);
    this.scene.add(rug);

    // Secondary rug under tank
    const rug2Geo = new THREE.PlaneGeometry(70, 35, 24, 12);
    const rug2Mat = new THREE.MeshLambertMaterial({
      color: 0x7a6b5a,
      vertexColors: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this._addRugPattern2(rug2Geo);
    const rug2 = new THREE.Mesh(rug2Geo, rug2Mat);
    rug2.rotation.x = -Math.PI / 2;
    rug2.position.set(0, FLOOR_Y + 0.05, 12);
    this.scene.add(rug2);
  }

  _addRugPattern(geo) {
    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const edgeX = Math.abs(px) > 36 ? -0.08 : 0;
      const edgeY = Math.abs(py) > 21 ? -0.08 : 0;
      const pattern = (Math.floor(px / 6) + Math.floor(py / 6)) % 2 === 0 ? 0.03 : 0;
      const v = 0.58 + edgeX + edgeY + pattern + Math.random() * 0.02;
      colors[i * 3]     = v + 0.02;
      colors[i * 3 + 1] = v * 0.90;
      colors[i * 3 + 2] = v * 0.65;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  _addRugPattern2(geo) {
    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const border = (Math.abs(px) > 32 || Math.abs(py) > 15) ? -0.06 : 0;
      const v = 0.50 + border + Math.random() * 0.03;
      colors[i * 3]     = v + 0.03;
      colors[i * 3 + 1] = v * 0.88;
      colors[i * 3 + 2] = v * 0.62;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  // ── Floor Plants (multiple, spread around room) ─────────

  _buildFloorPlants() {
    // Large monstera — left of cabinet
    const leftPlantVoxels = [
      // Terracotta pot
      [-1,0,-1,0xb85c38],[0,0,-1,0xb85c38],[1,0,-1,0xb85c38],[2,0,-1,0xb85c38],
      [-1,0,0,0xb85c38],[0,0,0,0xb85c38],[1,0,0,0xb85c38],[2,0,0,0xb85c38],
      [-1,0,1,0xb85c38],[0,0,1,0xb85c38],[1,0,1,0xb85c38],[2,0,1,0xb85c38],
      [-1,1,-1,0xb85c38],[0,1,-1,0xb85c38],[1,1,-1,0xb85c38],[2,1,-1,0xb85c38],
      [-1,1,0,0xb85c38],[2,1,0,0xb85c38],
      [-1,1,1,0xb85c38],[0,1,1,0xb85c38],[1,1,1,0xb85c38],[2,1,1,0xb85c38],
      [-1,2,-1,0xb85c38],[0,2,-1,0xb85c38],[1,2,-1,0xb85c38],[2,2,-1,0xb85c38],
      [-1,2,0,0xb85c38],[2,2,0,0xb85c38],
      [-1,2,1,0xb85c38],[0,2,1,0xb85c38],[1,2,1,0xb85c38],[2,2,1,0xb85c38],
      // Dirt
      [0,2,0,0x3d2b1f],[1,2,0,0x3d2b1f],
      // Stems
      [0,3,0,0x228b22],[1,3,0,0x228b22],[0,4,0,0x228b22],[1,4,0,0x228b22],
      [0,5,0,0x228b22],[1,5,0,0x228b22],[0,6,0,0x228b22],[1,6,0,0x228b22],
      [0,7,0,0x228b22],[1,7,0,0x228b22],[0,8,0,0x228b22],
      // Leaves
      [-1,4,0,0x2d8b2d],[2,4,0,0x2d8b2d],[-1,4,-1,0x2d8b2d],[2,4,1,0x2d8b2d],
      [-2,5,0,0x1a6b1a],[3,5,0,0x1a6b1a],[-2,5,-1,0x1a6b1a],[3,5,1,0x1a6b1a],
      [-1,6,-1,0x2d8b2d],[2,6,1,0x2d8b2d],[-1,6,1,0x228b22],[2,6,-1,0x228b22],
      [-2,7,0,0x1a6b1a],[3,7,0,0x1a6b1a],[0,7,-1,0x2d8b2d],[1,7,1,0x2d8b2d],
      [-1,8,0,0x2d8b2d],[1,8,0,0x2d8b2d],[0,8,-1,0x1a6b1a],[0,8,1,0x1a6b1a],
      [-1,9,0,0x1a6b1a],[1,9,0,0x1a6b1a],[0,9,0,0x2d8b2d],[0,10,0,0x1a6b1a],
      [-3,5,0,0x1a6b1a],[4,5,0,0x1a6b1a],[-2,6,1,0x228b22],[3,6,-1,0x228b22],
    ];
    const p1 = buildVoxelGroup(leftPlantVoxels);
    p1.scale.setScalar(1.2);
    p1.position.set(-45, FLOOR_Y, 5);
    this.scene.add(p1);

    // Fiddle-leaf — right of cabinet
    const rightPlantVoxels = [
      [-1,0,-1,0xe8e0d0],[0,0,-1,0xe8e0d0],[1,0,-1,0xe8e0d0],
      [-1,0,0,0xe8e0d0],[0,0,0,0xe8e0d0],[1,0,0,0xe8e0d0],
      [-1,0,1,0xe8e0d0],[0,0,1,0xe8e0d0],[1,0,1,0xe8e0d0],
      [-1,1,-1,0xe8e0d0],[1,1,-1,0xe8e0d0],[-1,1,0,0xe8e0d0],[1,1,0,0xe8e0d0],
      [-1,1,1,0xe8e0d0],[1,1,1,0xe8e0d0],
      [-1,2,-1,0xe8e0d0],[0,2,-1,0xe8e0d0],[1,2,-1,0xe8e0d0],
      [-1,2,0,0xe8e0d0],[1,2,0,0xe8e0d0],
      [-1,2,1,0xe8e0d0],[0,2,1,0xe8e0d0],[1,2,1,0xe8e0d0],
      [0,2,0,0x3d2b1f],
      [0,3,0,0x5c4033],[0,4,0,0x5c4033],[0,5,0,0x5c4033],[0,6,0,0x5c4033],
      [0,7,0,0x5c4033],[0,8,0,0x5c4033],[0,9,0,0x5c4033],[0,10,0,0x5c4033],
      [-1,5,0,0x2d8b2d],[1,5,0,0x2d8b2d],[0,5,-1,0x2d8b2d],[0,5,1,0x2d8b2d],
      [-1,7,0,0x228b22],[1,7,0,0x228b22],[0,7,-1,0x228b22],[0,7,1,0x228b22],
      [-1,8,-1,0x1a6b1a],[1,8,1,0x1a6b1a],
      [-1,9,0,0x2d8b2d],[1,9,0,0x2d8b2d],[0,9,-1,0x2d8b2d],[0,9,1,0x2d8b2d],
      [-1,10,0,0x1a6b1a],[1,10,0,0x1a6b1a],[0,10,-1,0x1a6b1a],[0,10,1,0x1a6b1a],
      [0,11,0,0x228b22],[-1,10,-1,0x228b22],[1,10,1,0x228b22],
      [-2,9,0,0x1a6b1a],[2,9,0,0x1a6b1a],
    ];
    const p2 = buildVoxelGroup(rightPlantVoxels);
    p2.scale.setScalar(1.2);
    p2.position.set(45, FLOOR_Y, 8);
    this.scene.add(p2);

    // Tall snake plant — far left corner near sofa
    const snakePlantVoxels = [
      [-1,0,-1,0x8b4513],[0,0,-1,0x8b4513],[1,0,-1,0x8b4513],
      [-1,0,0,0x8b4513],[0,0,0,0x8b4513],[1,0,0,0x8b4513],
      [-1,0,1,0x8b4513],[0,0,1,0x8b4513],[1,0,1,0x8b4513],
      [-1,1,-1,0x8b4513],[1,1,-1,0x8b4513],[-1,1,1,0x8b4513],[1,1,1,0x8b4513],
      [0,1,0,0x3d2b1f],
      // Tall blade leaves
      [0,2,0,0x2d6b2d],[0,3,0,0x2d6b2d],[0,4,0,0x3d8b3d],[0,5,0,0x3d8b3d],
      [0,6,0,0x4d9b4d],[0,7,0,0x4d9b4d],[0,8,0,0x4d9b4d],[0,9,0,0x3d8b3d],
      [0,10,0,0x2d7b2d],[0,11,0,0x2d7b2d],[0,12,0,0x2d6b2d],
      // Second leaf (offset)
      [1,2,0,0x2d6b2d],[1,3,0,0x3d8b3d],[1,4,0,0x3d8b3d],[1,5,0,0x4d9b4d],
      [1,6,0,0x4d9b4d],[1,7,0,0x3d8b3d],[1,8,0,0x3d8b3d],[1,9,0,0x2d7b2d],
      [1,10,0,0x2d6b2d],
      // Third leaf
      [-1,2,0,0x2d6b2d],[-1,3,0,0x3d8b3d],[-1,4,0,0x4d9b4d],[-1,5,0,0x4d9b4d],
      [-1,6,0,0x3d8b3d],[-1,7,0,0x3d8b3d],[-1,8,0,0x2d7b2d],
      // Side leaves
      [0,2,1,0x2d6b2d],[0,3,1,0x3d8b3d],[0,4,1,0x3d8b3d],[0,5,1,0x2d6b2d],
      [0,2,-1,0x2d6b2d],[0,3,-1,0x3d8b3d],[0,4,-1,0x3d8b3d],[0,5,-1,0x4d9b4d],
      [0,6,-1,0x3d8b3d],[0,7,-1,0x2d7b2d],
    ];
    const p3 = buildVoxelGroup(snakePlantVoxels);
    p3.scale.setScalar(1.4);
    p3.position.set(-140, FLOOR_Y, -20);
    this.scene.add(p3);

    // Small potted plant — near bookshelf
    const smallPlantVoxels = [
      [0,0,0,0xc9a876],[1,0,0,0xc9a876],[0,0,1,0xc9a876],[1,0,1,0xc9a876],
      [0,1,0,0xc9a876],[1,1,0,0xc9a876],[0,1,1,0xc9a876],[1,1,1,0xc9a876],
      [0,2,0,0x3d2b1f],[1,2,0,0x3d2b1f],[0,2,1,0x3d2b1f],[1,2,1,0x3d2b1f],
      [0,3,0,0x228b22],[1,3,0,0x228b22],
      [0,4,0,0x2d8b2d],[-1,4,0,0x1a6b1a],[1,4,0,0x1a6b1a],[0,4,1,0x1a6b1a],
      [0,5,0,0x1a6b1a],
    ];
    const p4 = buildVoxelGroup(smallPlantVoxels);
    p4.scale.setScalar(1.0);
    p4.position.set(150, FLOOR_Y, -60);
    this.scene.add(p4);
  }

  // ── Floor Lamp (tall standing) ──────────────────────────

  _buildFloorLamp() {
    const lampVoxels = [
      // Base
      [-1,0,-1,0x2a2a2a],[0,0,-1,0x2a2a2a],[1,0,-1,0x2a2a2a],
      [-1,0,0,0x2a2a2a],[0,0,0,0x2a2a2a],[1,0,0,0x2a2a2a],
      [-1,0,1,0x2a2a2a],[0,0,1,0x2a2a2a],[1,0,1,0x2a2a2a],
      // Pole
      [0,1,0,0x333333],[0,2,0,0x333333],[0,3,0,0x333333],[0,4,0,0x333333],
      [0,5,0,0x333333],[0,6,0,0x333333],[0,7,0,0x333333],[0,8,0,0x333333],
      [0,9,0,0x333333],[0,10,0,0x333333],[0,11,0,0x333333],[0,12,0,0x333333],
      [0,13,0,0x333333],[0,14,0,0x333333],[0,15,0,0x333333],[0,16,0,0x333333],
      [0,17,0,0x333333],[0,18,0,0x333333],
      // Shade
      [-2,19,-2,0xd4c5a9],[-1,19,-2,0xd4c5a9],[0,19,-2,0xd4c5a9],[1,19,-2,0xd4c5a9],[2,19,-2,0xd4c5a9],
      [-2,19,-1,0xd4c5a9],[2,19,-1,0xd4c5a9],[-2,19,0,0xd4c5a9],[2,19,0,0xd4c5a9],
      [-2,19,1,0xd4c5a9],[2,19,1,0xd4c5a9],
      [-2,19,2,0xd4c5a9],[-1,19,2,0xd4c5a9],[0,19,2,0xd4c5a9],[1,19,2,0xd4c5a9],[2,19,2,0xd4c5a9],
      [-2,20,-2,0xd4c5a9],[-1,20,-2,0xd4c5a9],[0,20,-2,0xd4c5a9],[1,20,-2,0xd4c5a9],[2,20,-2,0xd4c5a9],
      [-2,20,-1,0xd4c5a9],[2,20,-1,0xd4c5a9],[-2,20,0,0xd4c5a9],[2,20,0,0xd4c5a9],
      [-2,20,1,0xd4c5a9],[2,20,1,0xd4c5a9],
      [-2,20,2,0xd4c5a9],[-1,20,2,0xd4c5a9],[0,20,2,0xd4c5a9],[1,20,2,0xd4c5a9],[2,20,2,0xd4c5a9],
      [-2,21,-2,0xd4c5a9],[-1,21,-2,0xd4c5a9],[0,21,-2,0xd4c5a9],[1,21,-2,0xd4c5a9],[2,21,-2,0xd4c5a9],
      [-2,21,-1,0xd4c5a9],[2,21,-1,0xd4c5a9],[-2,21,0,0xd4c5a9],[2,21,0,0xd4c5a9],
      [-2,21,1,0xd4c5a9],[2,21,1,0xd4c5a9],
      [-2,21,2,0xd4c5a9],[-1,21,2,0xd4c5a9],[0,21,2,0xd4c5a9],[1,21,2,0xd4c5a9],[2,21,2,0xd4c5a9],
      // Warm glow under shade
      [-1,19,-1,0xffe8c0],[0,19,-1,0xffe8c0],[1,19,-1,0xffe8c0],
      [-1,19,0,0xffe8c0],[0,19,0,0xffe8c0],[1,19,0,0xffe8c0],
      [-1,19,1,0xffe8c0],[0,19,1,0xffe8c0],[1,19,1,0xffe8c0],
    ];

    const lamp = buildVoxelGroup(lampVoxels);
    lamp.scale.setScalar(1.3);
    const lampX = 80;
    const lampZ = -10;
    lamp.position.set(lampX, FLOOR_Y, lampZ);
    this.scene.add(lamp);

    // Working point light
    const lampLight = new THREE.PointLight(0xffe8c0, 0.8, 60);
    lampLight.position.set(lampX, FLOOR_Y + 25, lampZ);
    this.scene.add(lampLight);
  }

  // ── Side Table (next to sofa) ───────────────────────────

  _buildSideTable() {
    const stX = -72;
    const stZ = 15;
    const legH = 6;

    // Table top (round approximated as octagonal box)
    const topMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
    const topGeo = new THREE.CylinderGeometry(5, 5, 1, 8);
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(stX, FLOOR_Y + legH + 0.5, stZ);
    this.scene.add(top);

    // Single center leg
    const legMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const legGeo = new THREE.CylinderGeometry(0.6, 0.6, legH, 6);
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(stX, FLOOR_Y + legH / 2, stZ);
    this.scene.add(leg);

    // Base plate
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const baseGeo = new THREE.CylinderGeometry(4, 4, 0.5, 8);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(stX, FLOOR_Y + 0.25, stZ);
    this.scene.add(base);

    // Small vase on side table
    const vaseMat = new THREE.MeshLambertMaterial({ color: 0x4477aa });
    const vaseGeo = new THREE.CylinderGeometry(1, 1.5, 3.5, 6);
    const vase = new THREE.Mesh(vaseGeo, vaseMat);
    vase.position.set(stX, FLOOR_Y + legH + 2.75, stZ);
    this.scene.add(vase);
  }

  // ── Bookshelf (against right wall) ──────────────────────

  _buildBookshelf() {
    const bsX = 140;
    const bsZ = -60;
    const shelfMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1a });

    // Frame — back, sides, top, bottom
    const backGeo = new THREE.BoxGeometry(25, 40, 1);
    const back = new THREE.Mesh(backGeo, shelfMat);
    back.position.set(bsX, FLOOR_Y + 20, bsZ - 5);
    this.scene.add(back);

    const sideGeo = new THREE.BoxGeometry(1, 40, 10);
    const leftSide = new THREE.Mesh(sideGeo, shelfMat);
    leftSide.position.set(bsX - 12, FLOOR_Y + 20, bsZ);
    this.scene.add(leftSide);
    const rightSide = new THREE.Mesh(sideGeo, shelfMat.clone());
    rightSide.position.set(bsX + 12, FLOOR_Y + 20, bsZ);
    this.scene.add(rightSide);

    // Shelves (4 levels)
    const shelfGeo = new THREE.BoxGeometry(24, 0.8, 10);
    for (let i = 0; i < 5; i++) {
      const shelf = new THREE.Mesh(shelfGeo, shelfMat.clone());
      shelf.position.set(bsX, FLOOR_Y + i * 10, bsZ);
      this.scene.add(shelf);
    }

    // Books on shelves
    const bookColors = [0x8b2500, 0x2d4a6f, 0x4a6b3d, 0x6b4226, 0x553366, 0x336655, 0x994433, 0x445566];
    for (let shelf = 0; shelf < 4; shelf++) {
      const shelfY = FLOOR_Y + shelf * 10 + 0.4;
      const numBooks = 4 + Math.floor(Math.random() * 4);
      let bx = bsX - 10;
      for (let b = 0; b < numBooks && bx < bsX + 10; b++) {
        const bw = 1.2 + Math.random() * 1.5;
        const bh = 5 + Math.random() * 4;
        const bMat = new THREE.MeshLambertMaterial({ color: bookColors[(shelf * 5 + b) % bookColors.length] });
        const bGeo = new THREE.BoxGeometry(bw, bh, 7);
        const book = new THREE.Mesh(bGeo, bMat);
        book.position.set(bx + bw / 2, shelfY + bh / 2, bsZ);
        this.scene.add(book);
        bx += bw + 0.3;
      }
    }
  }

  // ── Door ────────────────────────────────────────────────

  _buildDoor() {
    const doorX = 100;
    const doorCenterY = FLOOR_Y + 18;

    // Door frame
    const frameGeo = new THREE.BoxGeometry(14, 36, 1);
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1a });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(doorX, doorCenterY, BACK_Z + 0.5);
    this.scene.add(frame);

    // Door panel
    const panelGeo = new THREE.BoxGeometry(12, 34, 0.5);
    const panelMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(doorX, doorCenterY, BACK_Z + 0.8);
    this.scene.add(panel);

    // Door panel detail lines (2 inset rectangles)
    const insetMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
    const insetGeo = new THREE.BoxGeometry(8, 12, 0.15);
    const topInset = new THREE.Mesh(insetGeo, insetMat);
    topInset.position.set(doorX, doorCenterY + 7, BACK_Z + 1.1);
    this.scene.add(topInset);
    const botInset = new THREE.Mesh(insetGeo, insetMat.clone());
    botInset.position.set(doorX, doorCenterY - 7, BACK_Z + 1.1);
    this.scene.add(botInset);

    // Doorknob
    const knobGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const knobMat = new THREE.MeshLambertMaterial({ color: 0xc9a84c });
    this._doorknob = new THREE.Mesh(knobGeo, knobMat);
    this._doorknob.name = 'doorknob';
    this._doorknob.position.set(doorX + 5, doorCenterY, BACK_Z + 1.3);
    this.scene.add(this._doorknob);

    this._doorX = doorX;
    this._doorZ = BACK_Z;
    this._doorCenterY = doorCenterY;
  }

  // ── Cat Easter Egg ──────────────────────────────────────

  _buildCat() {
    const catVoxels = [
      [1,0,0,0xff8c00],[2,0,0,0xff8c00],[3,0,0,0xff8c00],[4,0,0,0xff8c00],
      [0,1,0,0xff8c00],[1,1,0,0xff8c00],[2,1,0,0xffb6c1],[3,1,0,0xffb6c1],[4,1,0,0xff8c00],[5,1,0,0xff8c00],
      [0,2,0,0xff8c00],[1,2,0,0xff8c00],[2,2,0,0xff8c00],[3,2,0,0xffb6c1],[4,2,0,0xff8c00],[5,2,0,0xff8c00],
      [0,3,0,0xff8c00],[1,3,0,0x2d2d2d],[2,3,0,0xff8c00],[3,3,0,0xff8c00],[4,3,0,0x2d2d2d],[5,3,0,0xff8c00],
      [0,4,0,0xff8c00],[1,4,0,0xff8c00],[2,4,0,0xff8c00],[3,4,0,0xff8c00],[4,4,0,0xff8c00],[5,4,0,0xff8c00],
      [0,5,0,0xff6600],[1,5,0,0xffb6c1],[4,5,0,0xffb6c1],[5,5,0,0xff6600],
      [0,6,0,0xff6600],[5,6,0,0xff6600],
      [0,1,-1,0xff8c00],[0,2,-1,0xff8c00],[0,3,-1,0xff8c00],[0,4,-1,0xff8c00],
      [5,1,-1,0xff8c00],[5,2,-1,0xff8c00],[5,3,-1,0xff8c00],[5,4,-1,0xff8c00],
      [1,1,-1,0xff8c00],[2,1,-1,0xff8c00],[3,1,-1,0xff8c00],[4,1,-1,0xff8c00],
      [1,2,-1,0xff8c00],[2,2,-1,0xff8c00],[3,2,-1,0xff8c00],[4,2,-1,0xff8c00],
      [1,3,-1,0xff8c00],[2,3,-1,0xff8c00],[3,3,-1,0xff8c00],[4,3,-1,0xff8c00],
      [1,4,-1,0xff8c00],[2,4,-1,0xff8c00],[3,4,-1,0xff8c00],[4,4,-1,0xff8c00],
    ];

    this._catGroup = buildVoxelGroup(catVoxels);
    this._catGroup.scale.setScalar(0.8);

    const peekX = this._doorX + 9;
    const hiddenX = this._doorX + 18;
    this._catPeekX = peekX;
    this._catHiddenX = hiddenX;

    this._catGroup.position.set(hiddenX, this._doorCenterY - 5, this._doorZ + 0.5);
    this._catGroup.visible = false;
    this.scene.add(this._catGroup);
  }

  _buildLightswitch() {
    const switchX = 80;
    const switchY = FLOOR_Y + 22;
    const switchZ = BACK_Z + 0.6;

    // Wall plate
    const plateMat = new THREE.MeshLambertMaterial({ color: 0xf0ebe0 });
    const plateGeo = new THREE.BoxGeometry(3.5, 5.5, 0.4);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(switchX, switchY, switchZ);
    this.scene.add(plate);

    // Plate border (subtle inset)
    const borderMat = new THREE.MeshLambertMaterial({ color: 0xddd8cc });
    const borderGeo = new THREE.BoxGeometry(3.8, 5.8, 0.3);
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(switchX, switchY, switchZ - 0.05);
    this.scene.add(border);

    // Toggle switch (clickable)
    const toggleMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
    const toggleGeo = new THREE.BoxGeometry(1.8, 2.2, 0.6);
    this._switchToggle = new THREE.Mesh(toggleGeo, toggleMat);
    this._switchToggle.position.set(switchX, switchY, switchZ + 0.3);
    this._switchToggle.name = 'lightswitch';
    this.scene.add(this._switchToggle);

    this._lightswitch = this._switchToggle;
  }

  _onClick(e) {
    this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._camera);

    // Check lightswitch
    if (this._lightswitch) {
      const switchHits = this._raycaster.intersectObject(this._lightswitch);
      if (switchHits.length > 0) {
        const isOn = this._lighting.toggleRoomLights();
        // Tilt toggle up/down to show state
        this._switchToggle.rotation.x = isOn ? 0 : 0.4;
        return;
      }
    }

    // Check doorknob
    const hits = this._raycaster.intersectObject(this._doorknob);
    if (hits.length > 0) {
      this._doorknobClicks++;
      if (this._doorknobClicks >= 3 && this._catState === 'hidden') {
        this._catState = 'peeking';
        this._catTimer = 0;
        this._catGroup.visible = true;
        this._catGroup.position.x = this._catHiddenX;
        this._doorknobClicks = 0;
      }
    }
  }

  update(delta) {
    if (this._catState === 'hidden') return;

    this._catTimer += delta;

    if (this._catState === 'peeking') {
      const t = Math.min(this._catTimer / 1.0, 1);
      const ease = t * (2 - t);
      this._catGroup.position.x = this._catHiddenX + (this._catPeekX - this._catHiddenX) * ease;
      if (t >= 1) { this._catState = 'visible'; this._catTimer = 0; }
    } else if (this._catState === 'visible') {
      this._catGroup.rotation.z = Math.sin(this._catTimer * 2) * 0.08;
      if (this._catTimer >= 3) { this._catState = 'hiding'; this._catTimer = 0; }
    } else if (this._catState === 'hiding') {
      const t = Math.min(this._catTimer / 0.8, 1);
      const ease = t * t;
      this._catGroup.position.x = this._catPeekX + (this._catHiddenX - this._catPeekX) * ease;
      this._catGroup.rotation.z *= (1 - t);
      if (t >= 1) {
        this._catState = 'hidden';
        this._catGroup.visible = false;
        this._catGroup.rotation.z = 0;
      }
    }
  }
}
