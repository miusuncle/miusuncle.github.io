var schedule = (function (self) {
  var timer;
  var paused = false, // 标记状态
      queue  = [];     // 队列

  // 入队
  self.join = function (fn, params) {
    params = params || {};
    var args = [].concat(params.args);

    queue.push(function (_) {
      _.pause();
      timer = setTimeout(function () {
        fn.apply(params.context || null, args);
        _.resume();
      }, params.delay || 1);
    });

    return exec();
  };

  self.clear = function () {
    clearTimeout(timer);
    paused = false;
    queue.length = 0;
  };

  self.pause = function () {
    paused = true;  // 忙碌
    return this;
  };

  // ready and call next
  self.resume = function () {
    paused = false; // 空闲
    setTimeout(exec, 1);
    return this;
  };

  function exec() {
    if (!paused && queue.length) {
      queue.shift()(self);  // 出队
      if (!paused) self.resume();
    }
    return self;
  }

  return self;
}(schedule || {}));
