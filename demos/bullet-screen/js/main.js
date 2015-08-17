var DELAY = 300;

var bulletQueue = (function () {
	var waiting = [];
	var queue = [];

	return {
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
	};
})();

var $bullets = $('#bullets');
var $txtBullet = $('#txtBullet');
var $cmdSend = $('#cmdSend');

$txtBullet.keyup(function (e) {
	if (e.which === 13) {
		$cmdSend.click();
	}
});

$cmdSend.click(function () {
	var text = $txtBullet.val();
	if (!text) return;
	$txtBullet.val('').focus();

	bulletQueue.push({
		text: text,
		stay: random(500, 3000)
	});
});

var bullets = [
	{ text: 'Almost Lover', stay: 2000 },
	{ text: '以后的以后', stay: 1000 },
	{ text: '流年啊 你奈我何', stay: 500 },
	{ text: '人类吧，爱我吧，不要将我们屠杀', stay: 3000 },
];

bullets.forEach(bulletQueue.push);

function pullBullet() {
	return bulletQueue.pull().done(showBullet);
}

function showBullet(item) {
	var tmpl = (
		'<div class="bullet scale-up" data-stay="${stay}" style="display:none;">' +
		    '<span>${text}</span>' +
		'</div>'
	);

	var bullet = vsub(tmpl, item);
	var $bullet = $(bullet).prependTo($bullets).slideDown(DELAY, function () {
		ret.then(function () {
			return delay(DELAY).then(pullBullet);
		});
	});
}

var ret = pullBullet();
