// TODO: substitute the logic below with non-dummy AI

self.importScripts('util.js');

var timer;

self.onmessage = function (evt) {
  var data = JSON.parse(evt.data);
  console.log(data);

  switch (data.action) {
  case 'stop_ponder':
    clearTimeout(timer);
    break;
  case 'ponder':
    data = data.data;

    var index = -1;

    // 随机寻找任一未下棋的位置
    do {
      index = random(0, data.length - 1);
    } while (data[index]);

    timer = setTimeout(function () {
      self.postMessage(index);
    }, 300);
    break;
  }
};
