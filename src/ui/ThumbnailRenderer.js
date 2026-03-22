import * as THREE from 'three';
import { buildVoxelGroup } from '../utils/VoxelGeometry.js';

const SIZE = 64;

/**
 * Renders a side-profile view of a species voxel model into a canvas element.
 * Returns a persistent <canvas> (the renderer is disposed after rendering).
 */
export function renderSpeciesThumbnail(species) {
  // Offscreen renderer
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  // Lighting for thumbnail
  const ambient = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 2, 3);
  scene.add(dir);

  // Build the fish mesh (unscaled — we'll compute fit ourselves)
  const group = buildVoxelGroup(species.voxels, species.voxelSize);
  scene.add(group);

  // Compute bounding box to fit the camera
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());

  // Center the group at origin
  group.position.sub(center);

  // Camera: side profile view — look from +Z toward origin
  // Shows the fish's XY plane (body length and height)
  const maxDim = Math.max(size.x, size.y, size.z);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
  // Slight elevation angle for a better-looking thumbnail
  camera.position.set(maxDim * 0.15, maxDim * 0.2, maxDim * 1.9);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);

  // Copy rendered pixels into a persistent canvas
  const out = document.createElement('canvas');
  out.width  = SIZE;
  out.height = SIZE;
  out.getContext('2d').drawImage(renderer.domElement, 0, 0);

  // Clean up
  renderer.dispose();
  group.traverse(obj => {
    if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); }
  });

  return out;
}
