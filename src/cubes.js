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
  for (let i=0; i<boxesGroup.children.length; i++) {
    const box = boxesGroup.children[i];
    const {offset, phase, freq} = box.userData;

    box.position.z = Math.sin(timestamp/freq + phase) * offset;
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


const LOGO = [
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "              ###    ######     ",
  "              ###   ########    ",
  "              ###   ###  ###    ",
  "              ###   ###         ",
  "              ###   ###         ",
  "              ###   ####        ",
  "              ###   #######     ",
  "              ###     ######    ",
  "              ###       #####   ",
  "              ###         ###   ",
  "              ###         ###   ",
  "         ##   ###  ###    ###   ",
  "        #########  ##########   ",
  "         #######    ########    ",
  "           ###        ####      ",
  "                                ",
  "        # # ### ## ### ### ###  ",
  "        # # # # #  # # # # ##   ",
  "        ### # # ## ### # # #    ",
  "                                ",
  "                                ",
  "                                "
];


const BLUE = new Color('#1362A5');
const MAGENTA = new Color('#AF60B1');

function getBoxColor(x, y) {
  if (LOGO[y].charAt(x) === '#') {
    return 0xffffff;
  }

  const diag = Math.sqrt(x * x + y * y) / 100;
  return Color.mix(BLUE, MAGENTA, diag + 0.2 * Math.random()).toUint32();
}

