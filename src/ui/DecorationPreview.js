import * as THREE from 'three';
import { buildVoxelGroup } from '../utils/VoxelGeometry.js';
import { DECO_TYPES } from '../decorations/types/index.js';

const PREVIEW_SIZE = 80;

/**
 * Render each decoration type into a small offscreen canvas and return
 * a map of typeKey → data-URL PNG strings.
 */
export function generatePreviews() {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(PREVIEW_SIZE, PREVIEW_SIZE);
  renderer.setPixelRatio(2);          // crisp on HiDPI
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  // Isometric-ish orthographic camera
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.set(1, 0.8, 1).normalize().multiplyScalar(50);
  camera.lookAt(0, 0, 0);

  // Lighting — soft ambient + directional key
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  const previews = {};

  for (const type of DECO_TYPES) {
    const group = buildVoxelGroup(type.voxels);

    // Center the model and auto-fit the camera
    const box   = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    group.position.sub(center);

    const padding = Math.max(size.x, size.y, size.z) * 0.65;
    camera.left   = -padding;
    camera.right  =  padding;
    camera.top    =  padding;
    camera.bottom = -padding;
    camera.updateProjectionMatrix();

    scene.add(group);
    renderer.render(scene, camera);
    previews[type.key] = renderer.domElement.toDataURL('image/png');

    // Cleanup meshes
    group.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });
    scene.remove(group);
  }

  renderer.dispose();
  return previews;
}
