void function () {
	var _SimpleMDE = window.SimpleMDE;

	// Toggle-TOC feature BEGIN
	function toggleTOC(editor) {
		var $target = $(editor.toolbarElements['generate-toc']);
		editor.includeTOC = !editor.includeTOC;

		if (editor.includeTOC) {
			$target.addClass('active');
		} else {
			$target.removeClass('active');
		}

		$target.blur();
		editor.updatePreview();
	}

	_SimpleMDE.prototype.toggleTOC = function () {
		toggleTOC(this);
	};

	_SimpleMDE.toggleTOC = toggleTOC;
	// Toggle-TOC feature END

	var DEFAULT_TOOLBAR = [
		{
			name: 'heading-1',
			action: _SimpleMDE.toggleHeading1,
			className: 'fa fa-header fa-header-x fa-header-1',
			title: '一级标题 (Alt+1)'
		},
		{
			name: 'heading-2',
			action: _SimpleMDE.toggleHeading2,
			className: 'fa fa-header fa-header-x fa-header-2',
			title: '二级标题 (Alt+2)'
		},
		{
			name: 'heading-3',
			action: _SimpleMDE.toggleHeading3,
			className: 'fa fa-header fa-header-x fa-header-3',
			title: '三级标题 (Alt+3)'
		},
		{
			name: 'heading-4',
			action: _SimpleMDE.toggleHeading4,
			className: 'fa fa-header fa-header-x fa-header-4',
			title: '四级标题 (Alt+4)'
		},
		'|',
		{
			name: 'bold',
			action: _SimpleMDE.toggleBold,
			className: 'fa fa-bold',
			title: '加粗 (Ctrl+B)'
		},
		{
			name: 'italic',
			action: _SimpleMDE.toggleItalic,
			className: 'fa fa-italic',
			title: '斜体 (Ctrl+I)'
		},
		{
			name: 'strikethrough',
			action: _SimpleMDE.toggleStrikethrough,
			className: 'fa fa-strikethrough',
			title: '删除线'
		},
		{
			name: 'inlinecode',
			action: _SimpleMDE.toggleInlineCodeBlock,
			className: 'fa fa-code fa-code-inline',
			title: '内联代码 (Alt+C)'
		},
		'|',
		{
			name: 'code',
			action: _SimpleMDE.toggleCodeBlock,
			className: 'fa fa-code',
			title: '代码片段 (Ctrl+Alt+C)'
		},
		{
			name: 'quote',
			action: _SimpleMDE.toggleBlockquote,
			className: 'fa fa-quote-left',
			title: '引用 (Ctrl+\')'
		},
		{
			name: 'unordered-list',
			action: _SimpleMDE.toggleUnorderedList,
			className: 'fa fa-list-ul',
			title: '无序列表 (Ctrl+L)'
		},
		{
			name: 'ordered-list',
			action: _SimpleMDE.toggleOrderedList,
			className: 'fa fa-list-ol',
			title: '有序列表 (Ctrl+Shift+L)'
		},
		'|',
		{
			name: 'link',
			action: _SimpleMDE.drawLink,
			className: 'fa fa-link',
			title: '链接 (Ctrl+K)'
		},
		{
			name: 'image',
			action: _SimpleMDE.drawImage,
			className: 'fa fa-picture-o',
			title: '图片 (Ctrl+Alt+I)'
		},
		{
			name: 'table',
			action: _SimpleMDE.drawTable,
			className: 'fa fa-table',
			title: '表格'
		},
		{
			name: 'horizontal-rule',
			action: _SimpleMDE.drawHorizontalRule,
			className: 'fa fa-minus',
			title: '水平线'
		},
		'|',
		{
			name: 'undo',
			action: _SimpleMDE.undo,
			className: 'fa fa-undo',
			title: '撤销 (Ctrl+Z)'
		},
		{
			name: 'redo',
			action: _SimpleMDE.redo,
			className: 'fa fa-repeat',
			title: '恢复 (Ctrl+Y)'
		},
		'|',
		{
			name: 'generate-toc',
			action: _SimpleMDE.toggleTOC,
			className: 'fa fa-toc no-disable',
			title: '生成TOC (Alt+`)'
		},
		{
			name: 'preview',
			action: _SimpleMDE.togglePreview,
			className: 'fa fa-eye no-disable',
			title: '预览 (Ctrl+P)'
		},
		{
			name: 'side-by-side',
			action: _SimpleMDE.toggleSideBySide,
			className: 'fa fa-columns no-disable no-mobile',
			title: '实时预览 (F9)'
		},
		{
			name: 'fullscreen',
			action: _SimpleMDE.toggleFullScreen,
			className: 'fa fa-arrows-alt no-disable no-mobile',
			title: '切换全屏 (F10)'
		},
		{
			name: 'markdown-guide',
			action: function () {
				window.open('http://tapd.oa.com/Cloud_Monitor_Platform/markdown_wikis/#1010114711005059551');
			},
			className: 'fa fa-question-circle no-disable no-mobile',
			title: 'Markdown参考指南'
		}
	];

	$.extend(_SimpleMDE.prototype, {
		html: function (markdown) {
			// return pure html
			if (markdown === true) {
				return this.markdown(this.value());
			}

			var output = this.markdown(markdown || this.value());

			if (this.includeTOC) {
				output = this.toc(output) + output;
			}

			return output;
		},

		toc: function (htmlContents) {
			htmlContents || (htmlContents = this.markdown(this.value()));

			var docFragment = document.createDocumentFragment();
			var rootElement = docFragment.appendChild(document.createElement('div'));
			rootElement.innerHTML = htmlContents;

			var $headings = Array.apply(null, rootElement.querySelectorAll(this.tocHeadings));

			if (!$headings.length) {
				return '';
			}

			var headings = $headings.map(function (heading) {
				return {
					id: heading.id || '',
					title: heading.innerHTML,
					depth: +heading.tagName.charAt(1)
				};
			});

			var depths = headings.map(function (item) {
				return item.depth;
			});

			var minDepth = Math.min.apply(Math, depths);

			if (minDepth !== headings[0].depth) {
				return '';
			}

			// 去除非连续性标题
			for (var i = 1; i < headings.length; i += 1) {
				var diff = headings[i].depth - headings[i - 1].depth;
				if (diff > 1) {
					headings.splice(i--, 1);
				}
			}

			var result = {
				output: '',
				depth: 0,
				advance: function (prev, curr, diff) {
					return (
						diff = prev - curr,
						diff === 0 ? '</li>' :
						diff < 0 ? '<ul>' :
						Array.apply(null, Array(diff + 1)).map(function () {
							return '</li>';
						}).join('</ul>')
					);
				}
			};

			result = headings.reduce(function (ret, item, index) {
				if (ret.depth) {
					ret.output += ret.advance(ret.depth, item.depth);
				}

				ret.output += '<li><a href="#' + item.id + '" title="' + item.title + '">' + item.title + '</a>';

				if (index === headings.length - 1) {
					ret.output += ret.advance(item.depth, minDepth);
					ret.depth = 0;
				} else {
					ret.depth = item.depth;
				}

				return ret;
			}, result);

			return ['<div class="toc-box"><ul class="toc-list">', result.output, '</ul></div>'].join('');
		},

		updatePreview: function () {
			var cm = this.codemirror;
			var wrapper = cm.getWrapperElement();
			var preview = this.isPreviewActive() ? wrapper.lastChild : wrapper.nextSibling;

			preview.innerHTML = this.html();
		}
	});

	function SimpleMDE(options) {
		var mdeInstance = null;
		var toolbar = DEFAULT_TOOLBAR.slice(0);
		var uploadImageCgi = options.uploadImageCgi;
		var includeTOC = options.includeTOC;
		var tocHeadings = options.tocHeadings || 'h2,h3';

		delete options.uploadImageCgi;
		delete options.includeTOC;
		delete options.tocHeadings;

		if (uploadImageCgi) {
			var $uploadImageBox = $('<div>');
			var targetIndex = -1;

			toolbar.forEach(function (item, index) {
				if (item.name === 'image') {
					targetIndex = index + 1;
				}
			});

			toolbar.splice(targetIndex, 0, {
				name: 'upload_image',
				action: function () {
					$uploadImageBox
						.dialog({
							title: '上传图片',
							width: 200,
							height: 96,
							draggable: true,
							resizable: false,
							closeOnEscape: true,
							modal: true,
							position: ['center', 200]
						});
				},
				className: 'fa fa-upload',
				title: '上传图片'
			});

			$uploadImageBox.html(
				'<div style="position:relative; width:177px; height:45px; display:inline-block;">' +
					'<button style="width:100%; height:100%; font-size:18px; font-family:inherit;">选择图片</button>' +
					'<input class="J-uploadImage" type="file" name="file" style="position:absolute; width:100%; height:100%; left:0; top:0; opacity:0; padding:0;">' +
				'</div>'
			).appendTo(document.body).hide();

			$uploadImageBox.find('.J-uploadImage').fileupload({
				dropZone: $(options.element).parent(),
				url: uploadImageCgi,
				dataType: 'json',
				done: function (e, data) {
					var resp = data.result;

					if (resp.code !== 0) {
						alert(resp.msg || '上传失败');
						return;
					}

					// 弹框已初始化
					if ($uploadImageBox.hasClass('ui-dialog-content')) {
						$uploadImageBox.dialog('close');
					}

					// focus editor
					mdeInstance.codemirror.display.input.focus();

					// insert image url to editor
					var imgUrl = resp.data.replace(/^https?:/, '');
					_SimpleMDE.drawExoticImage(mdeInstance, ['![', '](' + imgUrl + ')']);
				}
			});
		}

		// wrap `textarea` with `markdown-body`
		$(options.element).wrap('<div class="markdown-body">');

		var keyMaps = {};
		keyMaps['Alt-`'] = function () {
			toggleTOC(mdeInstance);
		};

		mdeInstance = new _SimpleMDE($.extend({
			keyMaps: keyMaps,
			autoDownloadFontAwesome: false,
			autofocus: true,
			autosave: {
				'enabled': false
			},
			blockStyles: {
				'bold': '**',
				'italic': '*'
			},
			toolbar: toolbar,
			toolbarTips: true,
			indentWithTabs: true,
			initialValue: '',
			insertTexts: {
				link: ['[', '](http://)'],
				image: ['![](http://', ')'],
				table: ['', '| 标题1 | 标题2 | 标题3 |\n|---------|---------|---------|\n| 文本1 | 文本2 | 文本3 |\n'],
				horizontalRule: ['-----', '']
			},
			lineWrapping: true,
			parsingConfig: {
				'allowAtxHeaderWithoutSpace': false,
				'strikethrough': true,
				'underscoresBreakWords': false,
			},
			renderingConfig: {
				'singleLineBreaks': true,
				'codeSyntaxHighlighting': true,
			},
			spellChecker: false,
			status: false,
			tabSize: 2,
			previewRender: function (plainText, preview) {
				var editor = this.parent;

				clearTimeout(this._previewTimer);
				this._previewTimer = setTimeout(function () {
					if (editor.isPreviewActive() || editor.isSideBySideActive()) {
						preview.innerHTML = editor.html(plainText);
					}
				}, 80);
			}
		}, options));

		mdeInstance.includeTOC = (includeTOC !== false);
		mdeInstance.tocHeadings = tocHeadings;

		if (mdeInstance.includeTOC) {
			$(mdeInstance.toolbarElements['generate-toc']).addClass('active');
		}

		return mdeInstance;
	}

	window.SimpleMDE = SimpleMDE;
}();