var schedule = (function (self) {
  var paused = false, // 标记状态
      queue  = [];     // 队列

  // 入队
  self.join = function (fn, params) {
    params = params || {};
    var args = [].concat(params.args);

    queue.push(function (_) {
      _.pause();
      setTimeout(function () {
        fn.apply(params.context || null, args);
        _.resume();
      }, params.delay || 1);
    });

    return exec();
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

var DeferredQueue = function () {
  function DeferredQueue() {
    var waiting = [];
    var queue = [];

    $.extend(this, {
      push: function (item) {
        if (waiting.length) {
          waiting.shift().resolve(item);
        } else {
          queue.push(item);
        }
      },

      pull: function () {
        var dfd = $.Deferred();

        if (queue.length) {
          dfd.resolve(queue.shift());
        } else {
          waiting.push(dfd);
        }

        return dfd.promise();
      }
    });
  }

  return DeferredQueue;
}();

function wait(ms) {
  return $.Deferred(function () {
    setTimeout(this.resolve, ms);
  }).promise();
}

function vsub(tmpl, vector) {
  return ('' + tmpl).replace(/\$\{([^\{\}]+)\}/g, function (_, p) {
    return (vector || {})[p] || '';
  });
}

function random(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
}
