import THREE from 'three';

let scene, renderer, camera;

export function init() {
  scene = new THREE.Scene();
  renderer = createRenderer();
  camera = createCamera(scene);

  initScene();
  initLights(scene);

  var box = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshPhongMaterial());

  box.material.color.setHex(0xffffff);
  box.position.set(0, 0, 0);

  scene.add(box);

  return {scene, camera, renderer};
}


export function update(timestamp) {
}


export function render() {
  renderer.render(scene, camera);
}


function initScene() {
  scene.fog = new THREE.FogExp2(0x000000, 0.00045);

  scene.add(new THREE.AxisHelper(50));

  let grid = new THREE.GridHelper(10000, 100);
  grid.material.opacity = .5;
  scene.add(grid);
}


function createCamera(scene) {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

  camera.position.fromArray([0, 100, 500]);
  camera.lookAt(new THREE.Vector3(0, 160, 0));

  scene.add(camera);

  return camera;
}


function createRenderer() {
  const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});

  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  return renderer;
}


function initLights(scene) {
  const directionalLight = new THREE.DirectionalLight(0xffffff, .3);
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);

  directionalLight.position.set(0, 1, -.5);

  scene.add(directionalLight);
  scene.add(hemisphereLight);
  //scene.add(new THREE.DirectionalLightHelper(directionalLight, 50))
  //scene.add(new THREE.HemisphereLightHelper(hemisphereLight, 50));
}
