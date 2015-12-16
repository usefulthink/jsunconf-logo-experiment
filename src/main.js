import * as view from './scene';
import OrbitControls from '../lib/OrbitControls';


const {scene, camera, renderer} = view.init();

// ---- setup controls
const controls = new OrbitControls( camera, renderer.domElement );

controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = false;



// ---- animation-loop
/**
 * @param {DOMHighResTimeStamp} timestamp
 */
function animationLoop(timestamp) {
  requestAnimationFrame(animationLoop);
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
