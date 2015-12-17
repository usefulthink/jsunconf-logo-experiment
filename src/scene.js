import THREE from 'three';

import * as cubes from './cubes';

let scene, renderer, camera;

export function init() {
  scene = new THREE.Scene();
  renderer = createRenderer();
  camera = createCamera(scene);

  initScene();
  cubes.init(scene);
  initLights(scene);

  renderer.setClearColor(scene.fog.color);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000, 1),
    new THREE.MeshPhongMaterial({color: 0xcac4c4, side: THREE.DoubleSide}));

  //plane.material.color = 0xcacaca;
  plane.receiveShadow = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1.5;
  scene.add(plane);

  return {scene, camera, renderer};
}


export function update(timestamp) {
  cubes.update(timestamp);
}


export function render() {
  renderer.render(scene, camera);
}


function initScene() {
  scene.fog = new THREE.FogExp2(0xcac4c4, 0.00045);
  //scene.add(new THREE.AxisHelper(50));

  let grid = new THREE.GridHelper(10000, 80);
  grid.material.transparent = true;
  grid.material.opacity = .2;
  grid.material.fog = true;
  scene.add(grid);
}


function createCamera(scene) {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

  camera.position.set(310, 255, 325);
  camera.lookAt(new THREE.Vector3(160, 0, 0));

  scene.add(camera);

  return camera;
}


function createRenderer() {
  const renderer = new THREE.WebGLRenderer({antialias: true});

  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
}


function initLights(scene) {
  const directionalLight = new THREE.DirectionalLight(0xEFECD7, .4);
  const hemisphereLight = new THREE.HemisphereLight(0xEFECD7, 0x080820, .5);
  const ambientLight = new THREE.AmbientLight(0x303030);
  const backLight = new THREE.SpotLight(0xffffff, .3);

  backLight.position.set(0, 600, -300);
  backLight.target = cubes.getGroup();

  backLight.castShadow = true;

  backLight.shadowMapWidth = 2048;
  backLight.shadowMapHeight = 2048;

  backLight.shadowCameraNear = 550;
  backLight.shadowCameraFar = 850;
  backLight.shadowCameraFov = 35;
  //scene.add(new THREE.CameraHelper(backLight.shadow.camera));


  scene.add(backLight);
  directionalLight.position.set(0, .5, 1);
  scene.add(directionalLight);

  scene.add(hemisphereLight);
  scene.add(ambientLight);
  //scene.add(new THREE.SpotLightHelper(backLight));
  //scene.add(new THREE.DirectionalLightHelper(directionalLight, 50))
  //scene.add(new THREE.HemisphereLightHelper(hemisphereLight, 50));
}
