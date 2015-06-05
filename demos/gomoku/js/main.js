// ================================================
var PLAYERS = Object.create({ 'YOU': 0, 'NPC': 1 });
var FLAGS = Object.create({ 'YOU': 'x', 'NPC': 'o'});

var MESSAGES = Object.create({
  'YOUR_FIRST_TURN': '你持黑棋先下',
  'YOUR_TURN': '轮到你下了',
  'YOU_WIN': '你赢了!',
  'NPC_TURN': 'NPC is working out her next step...',
  'NPC_WIN': 'NPC wins!',
  'DRAW': '平局'
});

var CLASSES = Object.create({
  'CELL': 'cell',
  'YOU': 'you',
  'NPC': 'npc',
  'YOUR_TURN': 'your-turn',
  'DISABLED': 'disabled',
  'FALL': 'fall-cell',
  'FLY': 'fly-cell',
  'KILLER': 'killer-cell',
  'BLINK': 'blink-cell'
});

// ================================================

function Gomoku(width, height) {
  this.width = width;
  this.height = height;

  // 5颗棋及以上成线则赢
  this.winThreshold = 5;

  // 计算NPC下棋位置的苦力
  this.worker = new Worker('js/dummy_worker.js');
}

extend(Gomoku.prototype, {
  init: function () {
    this.renderView();
    this.bindEvents();
    this.doRestart();
    return this;
  },

  resetFields: function () {
    var board = array(this.height);
    board.forEach(function (_, index) {
      board[index] = array(this.width);
    }, this);

    // 二维数组的棋盘
    this.board = board;

    // 游戏是否结束
    this.isGameOver = false;

    // 当前已下棋子个数
    this.pieceCount = 0;

    // 记录已下棋子位置
    this.donePieces = [];

    // 当前轮到谁下
    // always you (Sophie Zelmani)
    this.turn = PLAYERS.YOU;
  },

  renderView: function () {
    var main = document.querySelector('#main');

    var total_width = 60 * this.width;
    main.style.width = total_width + 'px';

    var container = elt('div', {
      'class': 'container clearfix',
      'style': 'width: ' + total_width + 'px'
    });

    var actions = elt('div', { 'class': 'actions' });

    this.main = main;
    this.container = main.appendChild(container);
    this.actions = main.appendChild(actions);

    this.renderActions();
  },

  drawBoard: function () {
    var docfrag = document.createDocumentFragment();

    this.board.forEach(function (line, y, rows) {
      var height = rows.length;

      line.forEach(function (_, x, columns) {
        var width = columns.length;
        var index = y * width + x;
        var klass = 'cell ';

        if (y === 0) {
          switch (x % width) {
          case 0: klass += 'cell-top-left'; break;
          case width - 1: klass += 'cell-top-right'; break;
          default: klass += 'cell-top';
          }
        } else if (y === height - 1) {
          switch (x % width) {
          case 0: klass += 'cell-bottom-left'; break;
          case width - 1: klass += 'cell-bottom-right'; break;
          default: klass += 'cell-bottom';
          }
        } else if (x % width === 0) {
          klass += 'cell-left';
        } else if (x % width === width - 1) {
          klass += 'cell-right';
        } else {
          klass += 'cell-middle';
        }

        var cell = elt('div', {
          'class': klass,
          'data-index': index,
          'data-y': y,
          'data-x': x
        });

        // UI enhancement for `15 X 15` board
        if (width === 15 && height === 15) {
          if (
            (x === 3 || x === width - (3 + 1)) &&
            (y === 3 || y === height - (3 + 1)) ||
            (x === (width - 1) / 2 && y === (height - 1) / 2)
          ) {
            cell.appendChild(elt('div', { 'class': 'dot' }));
          }
        }

        docfrag.appendChild(cell);
      });
    });

    this.container.innerHTML = '';
    this.container.appendChild(docfrag);
  },

  renderActions: function () {
    var docfrag = document.createDocumentFragment();

    this.cmdRestart = docfrag.appendChild(elt('a', {
      'href': 'javascript:;',
      'class': 'btn btn-primary'
    }, '重新开始'));

    this.cmdReact = docfrag.appendChild(elt('a', {
      'href': 'javascript:;',
      'class': 'btn btn-secondary'
    }, '悔棋'));

    this.messageArea = docfrag.appendChild(elt('div', {
      'class': 'message'
    }));

    this.actions.innerHTML = '';
    this.actions.appendChild(docfrag);
  },

  bindEvents: function () {
    this.container.addEventListener('click', function (evt) {
      evt.preventDefault();
      var target = evt.target;
      this.canPutChess(target) && this.putChess(target);
    }.bind(this), false);

    this.cmdRestart.addEventListener('click', function (evt) {
      evt.preventDefault();
      evt.target.hasClass(CLASSES.DISABLED) || this.doRestart();
    }.bind(this), false);

    this.cmdReact.addEventListener('click', function (evt) {
      evt.preventDefault();
      evt.target.hasClass(CLASSES.DISABLED) || this.doReact();
    }.bind(this), false);

    this.worker.onmessage = function (evt) {
      var piece = this.pieceFromIndex(evt.data);
      this.putChess(piece);
    }.bind(this);
  },

  doRestart: function () {
    this.resetFields();
    this.drawBoard();
    this.turn2You();

    this.toggleButton(this.cmdRestart, false);
    this.toggleButton(this.cmdReact, false);
  },

  doReact: function () {
    var undo = this.donePieces.splice(this.pieceCount -= 2, 2);

    if (!this.pieceCount) {
      this.toggleButton(this.cmdRestart, false);
      this.toggleButton(this.cmdReact, false);
    }

    undo.reverse().forEach(function (piece, index) {
      this.put(this.pointFromPiece(piece), undefined);

      setTimeout(function () {
        piece.addClass(CLASSES.FLY);
        setTimeout(function () {
          piece.removeClass([CLASSES.YOU, CLASSES.NPC, CLASSES.FALL, CLASSES.FLY]);
        }, 200);
      }, index * 200);
    }, this);

    this.turn2You();
  },

  doGameOver: function (result) {
    this.isGameOver = true;
    this.main.removeClass(CLASSES.YOUR_TURN);

    if (result === true) {
      this.logMessage(MESSAGES.DRAW);
      return;
    }

    result.forEach(function (piece, index) {
      if (index === 0) {
        piece.addClass(CLASSES.KILLER);
      }
      piece.addClass(CLASSES.BLINK);
    });

    switch (this.turn) {
    case PLAYERS.YOU:
      this.logMessage(MESSAGES.YOU_WIN);
      break;
    case PLAYERS.NPC:
      this.logMessage(MESSAGES.NPC_WIN);
      break;
    }
  },

  checkGameOver: function () {
    var point = this.lastPoint();
    var px = point.x, py = point.y;

    var result = [point];
    var value = this.get(point);
    var x, y, p;

    // 1. 检测水平方向(——)
    var horizResult = [], isHorizOK = false;

    // 1.1 水平向左
    x = px;
    while (x > 0 && this.get(p = this.createPoint(py, --x)) === value) {
      horizResult.unshift(p);
    }

    // 1.2 水平向右
    x = px;
    while (x < this.width - 1 && this.get(p = this.createPoint(py, ++x)) === value) {
      horizResult.push(p);
    }

    if (horizResult.length >= this.winThreshold - 1) isHorizOK = true;
    else horizResult = [];

    // 2. 检测垂直方向(|)
    var vertResult = [], isVertOK = false;

    // 2.1 垂直向上
    y = py;
    while (y > 0 && this.get(p = this.createPoint(--y, px)) === value) {
      vertResult.unshift(p);
    }

    // 2.2 垂直向下
    y = py;
    while (y < this.height - 1 && this.get(p = this.createPoint(++y, px)) === value) {
      vertResult.push(p);
    }

    if (vertResult.length >= this.winThreshold - 1) isVertOK = true;
    else vertResult = [];

    // 3. 检测斜对角方向(/)
    var diagonalResult = [], isDiagonalOK = false;

    // 3.1 向左下角
    x = px; y = py;
    while (x > 0 && y < this.height - 1 && this.get(p = this.createPoint(++y, --x)) === value) {
      diagonalResult.unshift(p);
    }

    // 3.2 向右上角
    x = px; y = py;
    while (x < this.width - 1 && y > 0 && this.get(p = this.createPoint(--y, ++x)) === value) {
      diagonalResult.push(p);
    }

    if (diagonalResult.length >= this.winThreshold - 1) isDiagonalOK = true;
    else diagonalResult = [];

    // 4. 检测反斜对角方向(\)
    var backDiagonalResult = [], isBackDiagonalOK = false;

    // 4.1 向左上角
    x = px; y = py;
    while (x > 0 && y > 0 && this.get(p = this.createPoint(--y, --x)) === value) {
      backDiagonalResult.unshift(p);
    }

    // 4.2 向右下角
    x = px; y = py;
    while (x < this.width - 1 && y < this.height - 1 && this.get(p = this.createPoint(++y, ++x)) === value) {
      backDiagonalResult.push(p);
    }

    if (backDiagonalResult.length >= this.winThreshold - 1) isBackDiagonalOK = true;
    else backDiagonalResult = [];

    if (isHorizOK || isVertOK || isDiagonalOK || isBackDiagonalOK) {
      result = result.concat(horizResult, vertResult, diagonalResult, backDiagonalResult);
      return result.map(this.pieceFromPoint.bind(this));
    }

    // 平局
    if (this.pieceCount >= this.width * this.height) {
      return true;
    }

    return false;
  },

  lastPoint: function () {
    var piece = this.donePieces[this.pieceCount - 1];
    return this.pointFromPiece(piece);
  },

  get: function (point) {
    return this.board[point.y][point.x];
  },

  put: function (point, value) {
    this.board[point.y][point.x] = value;
  },

  canPutChess: function (target) {
    if (this.isGameOver) return false;
    if (this.turn !== PLAYERS.YOU) return false;
    if (!target.hasClass(CLASSES.CELL)) return false;
    return !target.hasAnyClass([CLASSES.YOU, CLASSES.NPC]);
  },

  putChess: function (piece) {
    this.setPiece(piece);
    this.toggleButton(this.cmdRestart, true);
  },

  setPiece: function (piece) {
    // console.log('y', piece.dataset.y, ' x', piece.dataset.x);
    piece.removeClass([CLASSES.YOU, CLASSES.NPC]);

    switch (this.turn) {
    case PLAYERS.YOU:
      this.put(this.pointFromPiece(piece), FLAGS.YOU);
      piece.addClass(CLASSES.YOU);
      piece.addClass(CLASSES.FALL);
      break;
    case PLAYERS.NPC:
      this.put(this.pointFromPiece(piece), FLAGS.NPC);
      piece.addClass([CLASSES.NPC, CLASSES.FALL]);
      break;
    }

    this.donePieces.push(piece);
    this.pieceCount += 1;

    var result = this.checkGameOver();

    if (result) {
      this.doGameOver(result);
    } else {
      this.swapTurn();
    }

    this.toggleButton(this.cmdReact, !this.isGameOver && this.pieceCount % 2 === 0);
  },

  swapTurn: function () {
    switch (this.turn) {
    case PLAYERS.YOU: return this.turn2NPC();
    case PLAYERS.NPC: return this.turn2You();
    }
  },

  turn2You: function () {
    this.turn = PLAYERS.YOU;
    this.main.addClass(CLASSES.YOUR_TURN);
    this.logMessage(!this.pieceCount ? MESSAGES.YOUR_FIRST_TURN : MESSAGES.YOUR_TURN);

    var message = JSON.stringify({ 'action': 'stop_ponder' });
    this.worker.postMessage(message);
  },

  turn2NPC: function () {
    this.turn = PLAYERS.NPC;
    this.main.removeClass(CLASSES.YOUR_TURN);
    this.logMessage(MESSAGES.NPC_TURN);
    this.worker.postMessage(this.serializedBoard());
  },

  serializedBoard: function () {
    var data = Array.prototype.concat.apply([], this.board);
    return JSON.stringify({
      'action': 'ponder',
      'data': data
    });
  },

  pieceFromPoint: function (point) {
    var index = point.y * this.width + point.x;
    return this.pieceFromIndex(index);
  },

  pieceFromIndex: function (index) {
    return this.container.querySelector('[data-index="' + index + '"]');
  },

  pointFromPiece: function (piece) {
    return piece && this.createPoint(piece.dataset.y, piece.dataset.x);
  },

  createPoint: function (y, x) {
    return { 'y': +y, 'x': +x };
  },

  toggleButton: function (btn, enabled) {
    btn[enabled ? 'removeClass' : 'addClass'](CLASSES.DISABLED);
  },

  logMessage: function (contents) {
    this.messageArea.title = contents;
    this.messageArea.innerHTML = contents;
  }
});

// ================================================
// START FROM HERE
var gomoku = new Gomoku(15, 15).init();
