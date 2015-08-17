var DELAY = 300;
var MAX_BULLET = 8;

var $bullets = $('#bullets');
var $txtBullet = $('#txtBullet');
var $cmdSend = $('#cmdSend');

$txtBullet.keyup(function (e) {
  $cmdSend.text($txtBullet.val() ? '发送' : '填充');

  if (e.which === 13) {
    $cmdSend.click();
  }
});

$cmdSend.click(function () {
  var text = $txtBullet.val();

  if (!text) {
    $txtBullet.val(_.sample(bullets).text);
    $cmdSend.text('发送');
    return;
  }

  $txtBullet.val('').focus();
  $cmdSend.text('填充');

  sendBullet(text);
});

function sendBullet(item) {
  item || (item = '');

  if (typeof item === 'string') {
    item = { 'text': item };
  }

  livingToDie.push({
    text: _.escape(item.text),
    stay: item.stay || random(300, 3000)
  });
}

function buildBullet() {
  current += 1;
  return livingToDie.pull().done(showBullet);
}

function showBullet(item) {
  var tmpl = (
    '<div class="bullet scale-up" data-stay="${stay}" style="display:none;">' +
        '<span>${text}</span>' +
    '</div>'
  );

  var bullet = vsub(tmpl, item);

  var $bullet = $(bullet).prependTo($bullets).slideDown(DELAY, function () {
    if (current < MAX_BULLET) {
      wait(DELAY).done(buildBullet);
    }
  });

  waitingToDie.push($bullet);
}

function destroyBullet() {
  return waitingToDie.pull().done(function ($item) {
    var stay = $item.data('stay');

    $item.delay(stay).fadeOut(800, function () {
      if (--current < MAX_BULLET) {
        wait(DELAY).done(buildBullet);
      }

      destroyBullet();
    });
  });
}

var livingToDie = new DeferredQueue;
var waitingToDie = new DeferredQueue;
var current = 0;

wait(200).then(function () {
  $.when(bullets.forEach(sendBullet))
    .then(buildBullet).then(destroyBullet);
});
