var DELAY = 300;

var $bullets = $('#bullets');
var $txtBullet = $('#txtBullet');
var $cmdSend = $('#cmdSend');

function sendBullet(text, delay) {
	var tmpl = '<div class="bullet scale-up"><span>${0}</span></div>';
	var bullet = vsub(tmpl, [text]);

	schedule.join(function () {
		$(bullet).prependTo($bullets).hide().show(0&&DELAY, function () {
			$(this).delay(3000).fadeOut(800).promise().done(function () {
				$(this).remove();
			});
		});
	}, { 'delay': delay || 0 });
}

$txtBullet.keyup(function (e) {
	if (e.which === 13) {
		$cmdSend.click();
	}
});

$cmdSend.click(function () {
	var text = $txtBullet.val();
	// if (!text) return;
	$txtBullet.val('');
	sendBullet(text, DELAY);
});

var bullets = ['Almost Lover', '偶阵雨', '以后的以后', '流年啊 你奈我何'];

bullets.forEach(function (bullet, index) {
	sendBullet(bullet, index === 0 ? 0 : DELAY + random(500, 1000));
});
