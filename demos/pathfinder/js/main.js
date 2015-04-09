var WIDTH = 25;
var HEIGHT = 25;

var SLOT_TYPES = Object.create({
  BEGIN: 'begin',
  END: 'end',
  ROAD: 'road',
  OBSTACLE: 'obstacle'
});

// ================================================

function Point(y, x) {
  this.y = y;
  this.x = x;
}

extend(Point.prototype, {
  isEqual: function (point) {
    return this.y === point.y && this.x === point.x;
  },

  diff: function (point) {
    return new Point(this.y - point.y, this.x - point.x);
  }
});

// ================================================

function Node(point) {
 this.point = point;
 this.index = point.y * WIDTH + point.x;
 this.links = [];
}

extend(Node.prototype, {
  linkTo: function (target) {
    this.links.push(target);
  }
});

// ================================================

function Grid() {
  this.height = HEIGHT;
  this.width = WIDTH;
  this.slotTypes = [];
  this.gaps = [];

  var container = document.querySelector('.container');
  container.style.width = this.width * 30 + 'px';
  container.style.height = this.height * 30 + 'px';
  this.container = container;
}

extend(Grid.prototype, {
  init: function () {
    this.layout();
    this.render();
    return this;
  },

  layout: function () {
    this.slotTypes.length = 0;
    this.gaps.length = 0;

    var sum = this.height * this.width;
    var mid = Math.floor(sum / 2);

    this.begin = this.pointFromIndex(random(0, mid));
    this.end = this.pointFromIndex(random(mid + 1, sum - 1));

    var magicNumber = .371;
    // var magicNumber = Math.random();

    array(this.height * this.width).forEach(function (_, index) {
      var point = this.pointFromIndex(index);
      var slotType;

      switch (true) {
      case point.isEqual(this.begin):
        slotType = SLOT_TYPES.BEGIN;
        break;
      case point.isEqual(this.end):
        slotType = SLOT_TYPES.END;
        break;
      case Math.random() > magicNumber:
        slotType = SLOT_TYPES.ROAD;
        break;
      default:
        slotType = SLOT_TYPES.OBSTACLE;
        break;
      }

      if (slotType !== SLOT_TYPES.OBSTACLE) {
        this.gaps.push(point);
      }

      this.slotTypes.push(slotType);
    }, this);
  },

  render: function () {
    var docfrag = document.createDocumentFragment();

    this.slotTypes.forEach(function (slotType, index) {
      var point = this.pointFromIndex(index);
      var element = this.elementFromPoint(point, true).addClass(slotType);

      if (slotType !== SLOT_TYPES.ROAD) {
        setTimeout(function () {
          element.addClass('blow-up');
        }, function () {
          if (slotType === SLOT_TYPES.BEGIN) return 1000;
          else if (slotType === SLOT_TYPES.END) return 1200;
          return random(0, 800);
        }());
      }

      docfrag.appendChild(element);
    }, this);

    this.container.innerHTML = '';
    this.container.appendChild(docfrag);
  },

  connectGaps: function () {
    var mapping = {};
    var nodes = this.gaps.map(function (point) {
      return (mapping[this.indexFromPoint(point)] = new Node(point));
    }, this);

    nodes.forEach(function (node) {
      var points = this.getBorderGap(node.point);

      points.forEach(function (point) {
        node.linkTo(mapping[this.indexFromPoint(point)]);
      }, this);
    }, this);

    return {
      'beginNode': mapping[this.indexFromPoint(this.begin)],
      'endNode': mapping[this.indexFromPoint(this.end)]
    };
  },

  getBorderGap: function (point) {
    var up = new Point(point.y - 1, point.x);
    var right = new Point(point.y, point.x + 1);
    var down = new Point(point.y + 1, point.x);
    var left = new Point(point.y, point.x - 1);
    return [up, right, down, left].filter(this.isGap.bind(this));
  },

  isGap: function (point) {
    return (
      this.inRange(point) &&
      this.slotTypes[this.indexFromPoint(point)] !== SLOT_TYPES.OBSTACLE
    );
  },

  inRange: function (point) {
    return (
      point.x >= 0 && point.x < this.width &&
      point.y >= 0 && point.y < this.height
    );
  },

  elementFromPoint: function (point, construct) {
    var index = this.indexFromPoint(point);

    return construct ? elt('div', {
      'class': 'cell',
      'data-y': point.y,
      'data-x': point.x,
      'data-index': index
    }) : this.container.querySelector('[data-index="' + index + '"]');
  },

  pointFromIndex: function (index) {
    return new Point(Math.floor(index / this.width), index % this.width);
  },

  indexFromPoint: function (point) {
    return point.y * this.width + point.x;
  },

  findPath: function () {
    var nodes = this.connectGaps();
    var begin = nodes.beginNode;
    var end = nodes.endNode;

    var seen = Object.create(null);
    var searchList = [{ 'node': begin, 'previous': null }];

    for (var i = 0; i < searchList.length; i += 1) {
      var item = searchList[i];
      var curr = item.node;

      if (curr === end) {
        return this.pluckNodes(item);
      }

      curr.links.forEach(function (next) {
        if (!seen[next.index]) {
          seen[next.index] = true;
          searchList.push({ 'node': next, 'previous': item });
        }
      });
    }

    return false;
  },

  pluckNodes: function (target) {
    var result = [];

    do result.unshift(target.node);
    while (target = target.previous);

    return result;
  },

  visualizePath: function () {
    var nodes = this.findPath();
    if (!nodes) return false;

    nodes.forEach(function (node, index) {
      var isEdge = (index === 0 || index === nodes.length - 1);

      schedule.join(function () {
        var point = node.point;
        var element = this.elementFromPoint(point, false);

        if (isEdge) {
          element.addClass('ko work-out');
          return;
        }

        var prevPoint = nodes[index - 1].point;
        var unitPoint = point.diff(prevPoint);

        var wipeClass = this.getWipeClassByUnitPoint(unitPoint);
        element.addClass(wipeClass);
      }, { context: this, delay: index === 1 ? 400 : 200 });
    }, this);

    return true;
  },

  getWipeClassByUnitPoint: function (point) {
    if (point.x === -1) return 'wipe-left';
    if (point.x === 1) return 'wipe-right';
    if (point.y === -1) return 'wipe-up';
    if (point.y === 1) return 'wipe-down';
  }
});

// ================================================

var PathFinder = Object.create({
  grid: new Grid(),

  init: function () {
    this.initControls();
    this.cmdRefresh.click();
  },

  initControls: function () {
    var main = document.getElementById('main');
    var left = window.getComputedStyle(this.grid.container).width;
    var top = window.getComputedStyle(this.grid.container).height;
    var findPathTimer = null;

    var cmdRefresh = elt('div', {
      'class': 'btn refresh',
      'style': 'left: ' + left
    }, '刷新');

    var cmdFindPath = elt('div', {
      'class': 'btn find-path',
      'style': 'left: ' + left
    }, '寻路');

    var messageArea = elt('div', {
      'class': 'message',
      'style': 'top: ' + top
    });

    cmdRefresh.addEventListener('click', function (evt) {
      evt.preventDefault();
      this.findPathEnabled = false;
      cmdFindPath.addClass('disabled');

      clearTimeout(findPathTimer);
      findPathTimer = setTimeout(function () {
        this.findPathEnabled = true;
        cmdFindPath.removeClass('disabled');
      }.bind(this), 1200);

      schedule.clear();
      this.grid.init();
      this.logMessage('&nbsp;');
    }.bind(this), false);

    cmdFindPath.addEventListener('click', function (evt) {
      evt.preventDefault();
      if (!this.findPathEnabled) return;

      this.findPathEnabled = false;
      cmdFindPath.addClass('disabled');

      this.visualizePath();
    }.bind(this), false);

    this.cmdRefresh = main.appendChild(cmdRefresh);
    this.cmdFindPath = main.appendChild(cmdFindPath);
    this.messageArea = main.appendChild(messageArea);
  },

  visualizePath: function () {
    var ret = this.grid.visualizePath();

    if (!ret) {
      this.logMessage('No viable path exists!');
    }
  },

  logMessage: function (contents) {
    this.messageArea.innerHTML = contents;
  }
});

// ================================================
// START FROM HERE
PathFinder.init();
