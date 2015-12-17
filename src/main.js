import * as view from './scene';
import OrbitControls from '../lib/OrbitControls';
import THREE from 'three';
import TWEEN from 'tween.js';

const {scene, camera, renderer} = view.init();

// ---- setup controls
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enableZoom = true;

//controls.enabled = false;
//camera.position.set(0, 22, 0);
camera.position.set(300,350,320);
controls.target.set(0, 0, 0);

function tweenCamera(position, target, duration) {
  new TWEEN.Tween(camera.position).to({
      x: position.x,
      y: position.y,
      z: position.z
    }, duration)
    .easing(TWEEN.Easing.Exponential.InOut).start();
  new TWEEN.Tween(controls.target).to({
      x: target.x,
      y: target.y,
      z: target.z
    }, duration)
    .easing(TWEEN.Easing.Exponential.InOut).start();
}


// ---- animation-loop
var t0 = -1;
/**
 * @param {DOMHighResTimeStamp} timestamp
 */
function animationLoop(timestamp) {
  requestAnimationFrame(animationLoop);

  //if (t0 < 0) {
  //  t0 = timestamp;
  //  console.log('jip!');
  //  setTimeout(() => {
  //    tweenCamera(
  //      new THREE.Vector3(275, 342, 319),
  //      new THREE.Vector3(0, 0, 0),
  //      26000
  //    );
  //  }, 2000);
  //}

  TWEEN.update();
  view.update(timestamp);
  controls.update();
  view.render();
}
// ---- resize canvas and rerender on window-resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});


document.body.appendChild(renderer.domElement);


// --- and GO!
requestAnimationFrame(animationLoop);
