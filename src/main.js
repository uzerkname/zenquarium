import { Renderer }            from './renderer/Renderer.js';
import { AquariumTank }        from './renderer/AquariumTank.js';
import { WaterEffects }        from './renderer/WaterEffects.js';
import { Lighting }            from './renderer/Lighting.js';
import { GameState }           from './core/GameState.js';
import { FishSystem }          from './fish/FishSystem.js';
import { DecorationSystem }    from './decorations/DecorationSystem.js';
import { PlacementController } from './decorations/PlacementController.js';
import { HUD }                 from './ui/HUD.js';
import { FishPanel }           from './ui/FishPanel.js';
import { DecorationPanel }     from './ui/DecorationPanel.js';
import { ModePanel }           from './ui/ModePanel.js';
import { Room }                from './renderer/Room.js';

// --- Bootstrap ---
const canvas     = document.getElementById('canvas');
const renderer   = new Renderer(canvas);
const lighting   = new Lighting(renderer.scene);
const tank       = new AquariumTank(renderer.scene);
const water      = new WaterEffects(renderer.scene);
const gameState  = new GameState();
const fishSystem = new FishSystem(renderer.scene);
const decoSystem = new DecorationSystem(renderer.scene);
const placement  = new PlacementController(renderer, tank.sandMesh, decoSystem, gameState);
const room       = new Room(renderer.scene, renderer.camera, renderer.webgl, lighting);

// Wire water material to lighting for color tinting
lighting.setWaterMaterial(tank.waterMat);
// Wire sand uniforms for caustic animation
lighting.setSandUniforms(tank._sandUniforms);

// UI
new HUD(gameState);
new FishPanel(gameState,   document.getElementById('sidebar-left'));
new DecorationPanel(placement, document.getElementById('sidebar-right'));
new ModePanel(gameState,   document.getElementById('mode-bar'));

// --- Light color controls ---
const lightControl = document.getElementById('light-control');
if (lightControl) {
  lightControl.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      lightControl.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      lighting.setTankLightColor(btn.dataset.color);
    });
  });

  const customColor = document.getElementById('custom-color');
  if (customColor) {
    customColor.addEventListener('input', (e) => {
      lightControl.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
      lighting.setTankLightColor(e.target.value);
    });
  }
}

// --- Room light toggle ---
const roomToggle = document.getElementById('room-light-toggle');
if (roomToggle) {
  roomToggle.addEventListener('click', () => {
    const isOn = lighting.toggleRoomLights();
    roomToggle.textContent = isOn ? 'Room: On' : 'Room: Off';
    roomToggle.classList.toggle('off', !isOn);
  });
}

// --- Game Loop ---
renderer.setAnimationLoop((delta, time) => {
  water.update(delta);
  lighting.update(time);
  tank.updateWater(time);
  fishSystem.update(delta, time);
  decoSystem.update(delta, time);
  placement.update();
  room.update(delta);
});
