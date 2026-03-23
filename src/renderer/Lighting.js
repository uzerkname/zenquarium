import * as THREE from 'three';
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, CAUSTIC_LIGHTS } from '../constants.js';

export class Lighting {
  constructor(scene, tankGroup) {
    this.scene = scene;
    this.causticLights = [];
    this.tankLights = [];
    this._ledStripMeshes = [];

    // Use tankGroup for tank-local lights, scene for room lights
    const tg = tankGroup || scene;

    // ── Room lights (NOT affected by tank color) ──────────────

    this.ambient = new THREE.AmbientLight(0xccccdd, 0.5);
    scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xfff5e0, 0.6);
    this.sun.position.set(10, TANK_HEIGHT * 2, 10);
    scene.add(this.sun);

    this.fill = new THREE.DirectionalLight(0x88bbdd, 0.25);
    this.fill.position.set(-5, TANK_HEIGHT * 0.5, TANK_DEPTH);
    scene.add(this.fill);

    // Room fill point lights
    this._roomFillLights = [];
    const roomFillPositions = [
      [0, 60, 0],
      [-120, 60, -40],
      [120, 60, -40],
      [0, 60, -100],
    ];
    for (const [rx, ry, rz] of roomFillPositions) {
      const roomFill = new THREE.PointLight(0xffe8c0, 0.15, 400);
      roomFill.position.set(rx, ry, rz);
      scene.add(roomFill);
      this._roomFillLights.push(roomFill);
    }

    // Track room lights for toggling (ambient stays on at low level for tank visibility)
    this._roomLightsOn = true;
    this._roomLightRefs = [this.sun, this.fill, ...this._roomFillLights];
    this._roomLightIntensities = this._roomLightRefs.map(l => l.intensity);

    // ── Caustic lights (animated shimmer inside tank) ─────────
    // Added to tankGroup so they move/rotate with the tank

    const causticColors = [0x5599cc, 0x44aadd, 0x66bbcc, 0x55aacc];
    for (let i = 0; i < CAUSTIC_LIGHTS; i++) {
      const light = new THREE.PointLight(causticColors[i], 0.9, 40);
      light.position.set(
        (i - 1.5) * (TANK_WIDTH * 0.25),
        TANK_HEIGHT * 0.35,
        (i % 2 === 0 ? 1 : -1) * TANK_DEPTH * 0.2
      );
      tg.add(light);
      this.causticLights.push({ light, phase: i * 2.1, baseX: light.position.x, baseZ: light.position.z });
    }

    // ── Bright focused tank lights (PointLights under cross-bars) ──

    const lightY = TANK_HEIGHT / 2 - 1;
    const barZPositions = [-TANK_DEPTH * 0.25, TANK_DEPTH * 0.25];

    for (const bz of barZPositions) {
      for (let i = 0; i < 4; i++) {
        const lx = (i - 1.5) * (TANK_WIDTH * 0.22);
        const pl = new THREE.PointLight(0xffffff, 1.5, TANK_HEIGHT * 2.5);
        pl.position.set(lx, lightY, bz);
        tg.add(pl);
        this.tankLights.push(pl);
      }
    }

    // ── Shadow SpotLights (2 — one per crossbar) ──
    this._shadowSpots = [];
    for (const bz of barZPositions) {
      const spot = new THREE.SpotLight(0xffffff, 10.0, TANK_HEIGHT * 2, Math.PI / 3, 0.5, 1);
      spot.position.set(0, lightY, bz);
      spot.target.position.set(0, -TANK_HEIGHT / 2, bz);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 2048;
      spot.shadow.mapSize.height = 2048;
      spot.shadow.bias = -0.001;
      spot.shadow.normalBias = 0.02;
      spot.shadow.camera.near = 1;
      spot.shadow.camera.far = TANK_HEIGHT * 2;
      tg.add(spot);
      tg.add(spot.target);
      this._shadowSpots.push(spot);
    }

    // ── Build fixture bar assemblies ──────────────────────────
    this._buildFixtures(tg);

    // ── Color interpolation state ────────────────────────────

    this._defaults = {
      fogColor: new THREE.Color(0x003050),
      bgColor: new THREE.Color(0x1a1a28),
      waterColor: new THREE.Color(0x006994),
    };

    this._targetColor = new THREE.Color(0xffffff);
    this._currentColor = new THREE.Color(0xffffff);
    this._isWhite = true;
    this._waterMat = null;
    this._sandUniforms = null;
  }

  setWaterMaterial(mat) {
    this._waterMat = mat;
  }

  setSandUniforms(uniforms) {
    this._sandUniforms = uniforms;
  }

  setTankLightColor(color) {
    this._targetColor.set(color);
    const hsl = {};
    this._targetColor.getHSL(hsl);
    this._isWhite = (hsl.s < 0.08);
  }

  /** Toggle room lights on/off. Returns new state. */
  toggleRoomLights() {
    this._roomLightsOn = !this._roomLightsOn;
    for (let i = 0; i < this._roomLightRefs.length; i++) {
      this._roomLightRefs[i].intensity = this._roomLightsOn ? this._roomLightIntensities[i] : 0;
    }
    // Dim ambient but keep it alive so tank contents are visible
    this.ambient.intensity = this._roomLightsOn ? 0.5 : 0.12;
    return this._roomLightsOn;
  }

  get roomLightsOn() {
    return this._roomLightsOn;
  }

  update(time) {
    // ── Animate caustic lights ──
    for (const c of this.causticLights) {
      c.light.position.x = c.baseX + Math.sin(time * 0.7 + c.phase) * 4;
      c.light.position.z = c.baseZ + Math.cos(time * 0.5 + c.phase) * 3;
      c.light.intensity = 0.7 + Math.sin(time * 1.3 + c.phase) * 0.35;
    }

    // ── Smooth color interpolation (tank lights ONLY) ──
    this._currentColor.lerp(this._targetColor, 0.05);
    const c = this._currentColor;
    const d = this._defaults;
    const w = this._isWhite;

    // Tank PointLights
    for (const light of this.tankLights) {
      light.color.copy(c);
      light.intensity = w ? 1.5 : 2.5;
    }

    // Shadow SpotLights
    for (const spot of this._shadowSpots) {
      spot.color.copy(c);
      spot.intensity = w ? 10.0 : 12.0;
    }

    // LED strips
    for (const mesh of this._ledStripMeshes) {
      mesh.material.emissive.copy(c);
      mesh.material.emissiveIntensity = w ? 1.5 : 2.0;
      mesh.material.color.copy(c);
    }

    // Sand caustic uniforms
    if (this._sandUniforms) {
      this._sandUniforms.uTime.value = time;
      this._sandUniforms.uCausticColor.value.set(0x88ccff).lerp(c, w ? 0 : 0.5);
    }

    // Water surface tint
    if (this._waterMat) {
      this._waterMat.color.copy(d.waterColor).lerp(c, w ? 0 : 0.3);
    }

    // Fog + background
    const fogTint = c.clone().multiplyScalar(0.15);
    this.scene.fog.color.copy(d.fogColor).lerp(fogTint, w ? 0 : 0.3);
    this.scene.background.copy(d.bgColor).lerp(fogTint, w ? 0 : 0.15);
  }

  _buildFixtures(parent) {
    this._buildCrossBar(parent, -TANK_DEPTH * 0.25);
    this._buildCrossBar(parent,  TANK_DEPTH * 0.25);
  }

  _buildCrossBar(parent, barZ) {
    const barY = TANK_HEIGHT / 2 + 3.5;
    const barLen = TANK_WIDTH + 2;

    // Housing bar
    const housingGeo = new THREE.BoxGeometry(barLen, 0.8, 2.5);
    const housingMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.set(0, barY, barZ);
    parent.add(housing);

    // LED emitter strip
    const ledGeo = new THREE.BoxGeometry(barLen - 4, 0.1, 2.0);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.0,
    });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, barY - 0.45, barZ);
    parent.add(ledMesh);
    this._ledStripMeshes.push(ledMesh);

    // Support brackets
    const bracketMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

    for (const side of [-1, 1]) {
      const endX = side * (TANK_WIDTH / 2);
      const rimY = TANK_HEIGHT / 2;

      const armH = barY - rimY + 0.4;
      const armGeo = new THREE.BoxGeometry(0.5, armH, 0.5);
      const arm = new THREE.Mesh(armGeo, bracketMat);
      arm.position.set(endX, rimY + armH / 2, barZ);
      parent.add(arm);

      const clipTopGeo = new THREE.BoxGeometry(1.5, 0.4, 3.0);
      const clipTop = new THREE.Mesh(clipTopGeo, bracketMat);
      clipTop.position.set(endX, rimY + 0.2, barZ);
      parent.add(clipTop);

      const gripGeo = new THREE.BoxGeometry(1.2, 2.0, 0.4);
      const gripOuter = new THREE.Mesh(gripGeo, bracketMat);
      gripOuter.position.set(endX + side * 0.4, rimY - 0.8, barZ);
      parent.add(gripOuter);

      const gripInner = new THREE.Mesh(gripGeo, bracketMat);
      gripInner.position.set(endX - side * 0.4, rimY - 0.8, barZ);
      parent.add(gripInner);
    }
  }
}
