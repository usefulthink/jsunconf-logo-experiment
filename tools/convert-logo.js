import fs from 'fs';
import Canvas from 'canvas';

const Image = Canvas.Image;

var source = fs.readFileSync(__dirname + '/../assets/pixels.png');

const canvas = new Canvas(32, 32);
const ctx = canvas.getContext('2d');

const img = new Image();
img.src = source;
ctx.drawImage(img, 0, 0);

let ret = [];
const {data} = ctx.getImageData(0, 0, 32, 32);
for (let y = 0; y < 32; y++) {
  let line = '';
  for (let x = 0; x < 32; x++) {
    line += data[(4 * (x + 32 * y))] ? ' ' : '#';
  }

  ret.push(line);
}

console.log(JSON.stringify(ret));

