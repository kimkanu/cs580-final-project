const fs = require("fs");

function toArrayBuffer(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
}

const arr = new Float32Array([42]);
const dataView = new DataView(arr.buffer);
dataView.setFloat32(0, arr[0], true);
const buf = new Uint8Array(arr.buffer);

fs.open("test.bin", "w", (err, fd) => {
  fs.writeSync(fd, buf);
});

fs.readFile("test.bin", function (err, data) {
  if (err) throw err;
  console.log(new Float32Array(toArrayBuffer(data)));
});
