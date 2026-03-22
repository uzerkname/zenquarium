import * as THREE from 'three';
import { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, WALL_THICKNESS, SAND_HEIGHT } from '../constants.js';

export class AquariumTank {
  constructor(scene) {
    this.scene = scene;
    this.sandMesh = null;
    this.waterMesh = null;
    this.waterMat = null;
    this._waterBaseY = null;
    this._build();
  }

  _build() {
    const glassMat = new THREE.MeshLambertMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });

    const W = TANK_WIDTH;
    const H = TANK_HEIGHT;
    const D = TANK_DEPTH;
    const T = WALL_THICKNESS;

    // Back wall
    this._addBox(W, H, T, 0, 0, -D / 2, glassMat);
    // Left wall
    this._addBox(T, H, D, -W / 2, 0, 0, glassMat);
    // Right wall
    this._addBox(T, H, D,  W / 2, 0, 0, glassMat);
    // Top
    this._addBox(W, T, D, 0,  H / 2, 0, glassMat);
    // Front (more transparent so camera sees in)
    const frontMat = glassMat.clone();
    frontMat.opacity = 0.05;
    this._addBox(W, H, T, 0, 0, D / 2, frontMat);

    // Sand floor — thick visible bed with natural color variation
    const sandGeo = new THREE.BoxGeometry(W - T * 2, SAND_HEIGHT, D - T * 2, 30, 4, 15);
    this._varySandColors(sandGeo);
    const sandMat = new THREE.MeshLambertMaterial({ color: 0xc9a876, vertexColors: true });

    // Inject procedural caustic pattern into the sand shader
    this._sandUniforms = {
      uTime: { value: 0.0 },
      uCausticColor: { value: new THREE.Color(0x88ccff) },
      uCausticIntensity: { value: 0.18 },
    };
    const sandUniforms = this._sandUniforms;
    sandMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = sandUniforms.uTime;
      shader.uniforms.uCausticColor = sandUniforms.uCausticColor;
      shader.uniforms.uCausticIntensity = sandUniforms.uCausticIntensity;

      // Add varying for world position
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        'varying vec3 vWorldPos;\nvoid main() {'
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;'
      );

      // Add caustic function to fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `uniform float uTime;
uniform vec3 uCausticColor;
uniform float uCausticIntensity;
varying vec3 vWorldPos;

float causticPattern(vec2 uv, float t) {
  float c = 0.0;
  float scale = 1.0;
  for (int i = 0; i < 3; i++) {
    vec2 p = uv * scale;
    p += vec2(sin(t * 0.3 + p.y * 0.7), cos(t * 0.4 + p.x * 0.6));
    float v = sin(p.x * 2.5 + t * 0.5) * sin(p.y * 2.5 - t * 0.3);
    c += abs(v) / scale;
    scale *= 2.0;
  }
  // sqrt softens contrast — gentle bright ripples instead of harsh dark veins
  return sqrt(c * 0.3);
}

void main() {`
      );

      // Add caustic contribution after diffuse color is computed
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `float caustic = causticPattern(vWorldPos.xz * 0.15, uTime);
gl_FragColor.rgb += uCausticColor * caustic * uCausticIntensity;
#include <dithering_fragment>`
      );
    };
    this.sandMesh = new THREE.Mesh(sandGeo, sandMat);
    this.sandMesh.position.set(0, -H / 2 + SAND_HEIGHT / 2, 0);
    this.sandMesh.name = 'sand';
    this.sandMesh.receiveShadow = true;
    this.scene.add(this.sandMesh);

    // Bottom glass under sand
    this._addBox(W, T, D, 0, -H / 2, 0, glassMat);

    // --- Black plastic trim around top perimeter ---
    const trimH = 0.35;   // slim height
    const trimD = 0.5;    // slim depth/width
    const trimY = H / 2 + trimH / 2; // sits on top edge
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Front trim
    this._addBox(W + trimD * 2, trimH, trimD, 0, trimY, D / 2, trimMat);
    // Back trim
    this._addBox(W + trimD * 2, trimH, trimD, 0, trimY, -D / 2, trimMat);
    // Left trim
    this._addBox(trimD, trimH, D, -W / 2, trimY, 0, trimMat);
    // Right trim
    this._addBox(trimD, trimH, D,  W / 2, trimY, 0, trimMat);

    // --- Animated water surface ---
    const waterGeo = new THREE.PlaneGeometry(W - T * 2, D - T * 2, 32, 16);
    waterGeo.rotateX(-Math.PI / 2);

    this.waterMat = new THREE.MeshLambertMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.position.set(0, H / 2 - 0.1, 0);
    this.scene.add(this.waterMesh);

    // Store initial vertex Y positions for displacement offset
    const posAttr = waterGeo.attributes.position;
    this._waterBaseY = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      this._waterBaseY[i] = posAttr.getY(i);
    }
  }

  updateWater(time) {
    const posAttr = this.waterMesh.geometry.attributes.position;
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const baseY = this._waterBaseY[i];

      // Layer 1: Broad slow swell
      const wave1 = Math.sin(x * 0.15 + time * 0.8) * 0.25;
      // Layer 2: Diagonal cross-wave
      const wave2 = Math.sin((x * 0.1 + z * 0.2) + time * 1.2) * 0.15;
      // Layer 3: Fine fast ripple
      const wave3 = Math.sin(x * 0.4 + time * 2.5) * 0.06;
      // Layer 4: Depth-axis motion
      const wave4 = Math.cos(z * 0.35 + time * 1.8) * 0.08;

      posAttr.setY(i, baseY + wave1 + wave2 + wave3 + wave4);
    }

    posAttr.needsUpdate = true;
    this.waterMesh.geometry.computeVertexNormals();
  }

  _addBox(w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    return mesh;
  }

  _varySandColors(geo) {
    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      // Position-based noise for natural ripple bands
      const noise = Math.sin(px * 0.5) * 0.03 + Math.cos(pz * 0.7) * 0.03;
      const v = 0.80 + Math.random() * 0.15 + noise;
      colors[i * 3]     = v;
      colors[i * 3 + 1] = v * 0.82;
      colors[i * 3 + 2] = v * 0.6;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
}
