import THREE from 'three';
import Color from '../lib/Color';

let boxesGroup;

export function init(scene) {
  boxesGroup = new THREE.Object3D();

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      boxesGroup.add(createBox(x, y, getBoxColor(x, y)));
    }
  }

  boxesGroup.position.set(80, 5, 80);
  boxesGroup.rotation.set(-Math.PI / 2, 0, 0);

  scene.add(boxesGroup);
}

export function getGroup() {
  return boxesGroup;
}

export function update(timestamp) {
  for (let i = 0; i < boxesGroup.children.length; i++) {
    const box = boxesGroup.children[i];
    const {offset, phase, freq} = box.userData;

    box.position.z = Math.sin(timestamp / freq + phase) * offset;
  }
}


function createBox(x, y, color) {
  const offset = (Math.random() - .5) * 5;
  var box = new THREE.Mesh(
    new THREE.BoxGeometry(9, 9, 6),
    new THREE.MeshLambertMaterial());

  box.userData.x = x;
  box.userData.y = y;
  box.userData.offset = offset;
  box.userData.freq = 2000 + 2000 * Math.random();
  box.userData.phase = 2 * Math.PI * Math.random();

  box.castShadow = true;
  //box.receiveShadow = true;

  box.material.color.setHex(color);
  box.position.set(-155 + x * 10, 165 - y * 10, -offset / 2);

  return box;
}


//const LOGO = [
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000111000011111100000,
//  0b00000000000000111000111111110000,
//  0b00000000000000111000111001110000,
//  0b00000000000000111000111000000000,
//  0b00000000000000111000111000000000,
//  0b00000000000000111000111100000000,
//  0b00000000000000111000111111100000,
//  0b00000000000000111000001111110000,
//  0b00000000000000111000000011111000,
//  0b00000000000000111000000000111000,
//  0b00000000000000111000000000111000,
//  0b00000000011000111001110000111000,
//  0b00000000111111111001111111111000,
//  0b00000000011111110000111111110000,
//  0b00000000000111000000001111000000,
//  0b00000000000000000000000000000000,
//  0b00000000101011101101110111011100,
//  0b00000000101010101001010101011000,
//  0b00000000111010101101110101010000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000,
//  0b00000000000000000000000000000000
//];

// hex-notation of the above, skipped leading and trailing lines.
const LOGO = [
  0x387e0, 0x38ff0, 0x38e70, 0x38e00, 0x38e00, 0x38f00, 0x38fe0, 0x383f0, 0x380f8,
  0x38038, 0x38038, 0x639c38, 0xff9ff8, 0x7f0ff0, 0x1c03c0, 0x0, 0xaedddc, 0xaa9558,
  0xeadd50];

const BLUE = new Color('#1362A5');
const MAGENTA = new Color('#AF60B1');

function getBoxColor(x, y) {
  if ((y > 9 && y < 29) && LOGO[y - 10] & (1 << (32 - x))) {
    return 0xffffff;
  }

  const diag = Math.sqrt(x * x + y * y) / 100;
  return Color.mix(BLUE, MAGENTA, diag + 0.2 * Math.random()).toUint32();
}

