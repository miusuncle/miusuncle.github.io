var DELAY = 300;
var MAX_VIEW_SIZE = 5;

var $bullets = $('#bullets');
var $txtBullet = $('#txtBullet');
var $cmdSend = $('#cmdSend');

$txtBullet.keydown(function (e) {
  $cmdSend.text($txtBullet.val() ? '发送' : '填充');

  if (e.which === 13) {
    $cmdSend.click();
  }
});

$cmdSend.click(function () {
  var text = $txtBullet.val();

  if (!text) {
    $txtBullet.val(_.sample(bullets));
    $cmdSend.text('发送');
    return;
  }

  $txtBullet.val('');
  $cmdSend.text('填充');

  sendBullet(text);
});

function bulletsInView() {
  return $bullets.children().size();
}

function sendBullet(item) {
  item || (item = '');

  if (typeof item === 'string') {
    item = { 'text': item };
  }

  livingToDie.push({
    text: item.text,
    stay: item.stay || _.random(1000, 4000)
  });
}

function buildBullet() {
  if (livingToDie.waitingSize()) {
    return;
  }

  if (bulletsInView() >= MAX_VIEW_SIZE) {
    return;
  }

  livingToDie.pull().done(showBullet);
}

function showBullet(item) {
  var tmpl = (
    '<div class="bullet scale-up" data-stay="${stay}" style="display:none;">' +
        '<span>${text}</span>' +
    '</div>'
  );

  var bullet = vsub(tmpl, item);
  var $bullet = $(bullet).prependTo($bullets);

  $bullet.slideDown(DELAY, function () {
    wait(DELAY * 2).done(buildBullet);
  });

  waitingToDie.push($bullet);
}

function destroyBullet() {
  return waitingToDie.pull().done(function ($item) {
    var stay = $item.data('stay');

    $item.delay(stay).fadeOut(800, function () {
      $item.remove();
      $.when().done([buildBullet, destroyBullet]);
    });
  });
}

function pollSendBullet() {
  setInterval(function () {
    _.sample(bullets, 3 - bulletsInView()).forEach(sendBullet);
  }, 1000);
}

var livingToDie = new DeferredQueue;
var waitingToDie = new DeferredQueue;

wait(200).then(function () {
  _.sample(bullets, 3).forEach(sendBullet);
  $.when().done([buildBullet, destroyBullet, pollSendBullet]);
});
