/*
 * jquery.smartbox.js v1.0.3
 * Require:jquery 1.5.1+
 * Lincence:MIT
 * Git Repo:https://github.com/huangshuwei/jquery.smartbox/
 * Author:https://github.com/huangshuwei/
 * Examples:http://smartbox.huangsw.com/cn/examples
 */
;(function ($, window, document, undefined) {

    var defaultOpt = {
            type: 'option', // 'inline':title、content、footer 内容来自html标签；'option':title、content、footer 内容来自配置； |type string
            width: 360, // 弹窗宽度，默认360 |type int
            height: 360, // 弹窗高度 |type int
            titleHeight: 50, // header 的高度 |type int
            footerHeight: 50, // footer 的高度 |type int
            title: null, // 弹层标题 |type:html
            footer: null, // 底部内容 |type:html
            titleBgColor: '#eee', // 标题背景颜色，默认
            footerBgColor: '#fff', // 底部的背景颜色

            // border
            borderColor:'#adabab', // 弹窗的 border 颜色 |type:string
            borderRadius:0, // 弹窗 border 圆角 |type:int
            borderWidth:1, // 弹窗 border-width |type:int

            isShowTitle: true, // 是否显示title（建议当不显示title时，closeType设置为‘out’） |type:bool
            isShowFooter: true, // |type:bool
            isAutoShow: true, // 是否初始化自动显示弹层 |type:bool
            zIndex: 9999, //  |type:int

            // content
            content: null, // 显示的内容 |type:html
            ajaxSetting: { // 异步获取弹窗内容 |type:object
                url: null, // 异步请求地址 |type:url
                contentType: 'html', // 'html':异步加载html；'img':异步加载图片；'iframe':异步加载iframe（可以解决跨域问题） |type:string
                isShowLoading: true, // 是否显示加载效果 |type:bool
                loadingType: 'img', // 'img':加载中以图片的效果展示；'text':加载中以文字的形式展示 |type:string
                loadingText: '正在加载...', // 显示加载的内容提示 |type html
                errorContent: '' // 请求错误时显示的内容 |type:html
            },

            // Drag
            isDrag: true, // 是否允许拖动 |type:bool
            dragType: 'replace', // 'relpace':拖拽一个替代的弹窗；'self':拖拽自身

            // overlay
            isShowOverlay: true, // 是否显示遮罩层 |type:bool
            isCloseOnOverlayClick: true, // 是否点击遮罩层，关闭弹层 |type:bool
            overlayOpacity: 0.3, // 遮罩层的透明度，范围 0.1~1  |type:float

            // close
            isShowClose: true, // 是否显示关闭图标。 |type:bool
            closeType: 'in', // 'in':关闭图标在弹层内部右上角； 'out':关闭图标在弹层外部右上角 |type:string

            // callbacks
            beforeShow: $.noop, // 弹窗显示之前的事件，返回 false 将不会打开弹层 |type:function
            afterShow: $.noop, // 弹窗显示之后的事件 |type:function

            beforeRequest:$.noop, // 数据请求前的事件 |type:function
            afterRequest:$.noop, // 数据请求结束的事件 |type:function

            beforeClose: $.noop, // 关闭前调用的事件，返回 false 将不会将不会关闭窗口 |type:function
            afterClose: $.noop // 关闭后调用的事件 |type:function
        },
        IE = navigator.userAgent.match(/msie/i),
        showTimer,
        closeTimer;

    function SmartBox(ele, opt) {
        var that = this;

        that.element = ele;
        that.$element = $(ele);
        that.defaults = defaultOpt;
        that.options = $.extend({}, this.defaults, opt);
        that.ajaxOption = opt ? $.extend({}, this.defaults.ajaxSetting, opt.ajaxSetting) : this.defaults.ajaxSetting;

        // Overlay
        that.overlayZIndex = that.options.zIndex - 1;
        that.$smartBoxOverlay = $('<div class="smartBoxOverlay ' + that.overlayZIndex + '"></div>');

        that.setValue();

        // version
        that.version = 'v1.0.0';
    }

    SmartBox.prototype = {
        tpl: {
            smartBox: [
                '<div>',
                '<div class="smartBox_header">',
                '<div class="smartBox_title"></div>',
                '</div>',
                '<div class="smartBox_body">',
                '</div>',
                '<div class="smartBox_footer">',
                '</div>',
                '</div>'
            ].join(''),
            loading: '<div class="smartBoxLoadingText"></div>',
            closeNormal: '<a class="smartBox_header_close_normal"></a>',
            closeCircle: '<a class="smartBox_header_close_circle"></a>',
            iframe: '<iframe class="smartBox_iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + ' width="100%" height="100%"></iframe>'
        },

        init: function () {
            console.log('smartbox init');
            var that = this;

            that.createContainer();

            that.setValue();

            that.adjustBox();

            if (that.options.isAutoShow) {
                that.open();
            }

            return that.$element;
        },

        createContainer: function () {
            var that = this,
                type = that.options.type.toLowerCase(),
                $smartBoxTpl = $(that.tpl.smartBox),
                $header = $smartBoxTpl.find('.smartBox_header'),
                $title = $smartBoxTpl.find('.smartBox_title'),
                $close = that.options.closeType.toLowerCase() === 'in' ? $(that.tpl.closeNormal) : $(that.tpl.closeCircle),
                $body = $smartBoxTpl.find('.smartBox_body'),
                $footer = $smartBoxTpl.find('.smartBox_footer'),
                titleHtml, bodyHtml, footerHtml,
                innerBorderRadius =that.options.borderRadius - that.options.borderWidth-1; // 去除虚线

            if (that.options.isShowTitle) {
                if (type === 'option') {
                    titleHtml = that.options.title ? that.options.title : '';
                } else if (type === 'inline') {
                    titleHtml = (that.$title && that.$title.html()) ? that.$title.html() : ''
                }
                $title.html(titleHtml);
                $header.css({
                    "background-color": that.options.titleBgColor,
                    "height": that.options.titleHeight + 'px',
                    "line-height": that.options.titleHeight + 'px'
                }).addClass('smartBox_header_border');

                if (innerBorderRadius >0){
                    $header.css({
                        'border-radius':''+innerBorderRadius+'px '+innerBorderRadius+'px 0 0',
                        '-moz-border-radius':''+innerBorderRadius+'px '+innerBorderRadius+'px 0 0',
                        '-webkit-border-radius':''+innerBorderRadius+'px '+innerBorderRadius+'px 0 0'
                    })
                }

            } else {
                $title.remove();
            }

            if (that.options.isShowClose) {
                $header.append($close);
            }

            if (type === 'option') {
                bodyHtml = that.options.content ? that.options.content : '';
            } else if (type === 'inline') {
                bodyHtml = (that.$body && that.$body.html()) ? that.$body.html() : ''
            }
            $body.html(bodyHtml);

            if (that.options.isShowFooter) {
                footerHtml = (type === 'option') ? that.options.footer : (that.$footer && that.$footer.html()) ? that.$footer.html() : '';
                $footer.html(footerHtml).css({
                    "height": that.options.footerHeight + 'px',
                    "line-height": that.options.footerHeight + 'px',
                    "background-color": that.options.footerBgColor
                });
                if (innerBorderRadius >0){
                    $footer.css({
                        'border-radius':'0 0 '+innerBorderRadius+'px '+innerBorderRadius+'px',
                        '-moz-border-radius':'0 0 '+innerBorderRadius+'px '+innerBorderRadius+'px',
                        '-webkit-border-radius':'0 0 '+innerBorderRadius+'px '+innerBorderRadius+'px'
                    })
                }

            } else {
                $footer.remove();
            }

            if (that.options.isShowOverlay) {
                that.$smartBoxOverlay.css({
                    'z-index': that.overlayZIndex,
                    'opacity': that.options.overlayOpacity,
                    'filter': 'alpha(opacity=' + that.options.overlayOpacity * 100 + ')'
                });
                $('body').append(that.$smartBoxOverlay);
            }
            that.$element.html($smartBoxTpl.html()).css({
                'display': 'none',
                'border-color':that.options.borderColor,
                'border-width':that.options.borderWidth+'px',
                'border-radius':that.options.borderRadius,
                '-moz-border-radius':that.options.borderRadius,
                '-webkit-border-radius':that.options.borderRadius
            }).addClass('smartBox');
        },

        setValue: function () {
            var that = this;
            that.$header = that.$element.find(".smartBox_header");
            that.$title = that.$element.find(".smartBox_title");
            that.$close = that.options.closeType === 'in' ? that.$element.find('.smartBox_header_close_normal') : that.$element.find('.smartBox_header_close_circle');
            that.$body = that.$element.find(".smartBox_body");
            that.$footer = that.$element.find(".smartBox_footer");
        },

        adjustBox: function () {
            var that = this, contentHeight;

            that.$element.css({
                "width": that.options.width,
                "height": that.options.height,
                "z-index": that.options.zIndex
            });

            contentHeight = that.options.height - that.$header.outerHeight();

            if (that.options.isShowFooter) {
                contentHeight -= that.$footer.outerHeight()
            }

            that.$body.css({"height": contentHeight});

            if (that.options.isDrag) {
                that.$element.css({
                    "top": Math.max(0, (($(window).height() - that.$element.outerHeight()) / 2)) + "px",
                    "left": Math.max(0, (($(window).width() - that.$element.outerWidth()) / 2)) + "px"
                });
            } else { // 会随着窗口改变居中
                that.$element.css({
                    "margin-top": -(that.$element.outerHeight() / 2),
                    "margin-left": -(that.$element.outerWidth() / 2)
                });
            }
        },

        loadContent: function () {
            var that = this,
                contentType = that.ajaxOption.contentType.toLowerCase();

            that.$body.html('');

            if (contentType === 'html') {
                that.asyncLoadHtml();
            }
            else if (contentType === 'img') {
                that.asyncLoadImage();
            }
            else if (contentType === 'iframe') {
                that.asyncLoadByIframe();
            }
        },

        asyncLoadHtml: function () {
            var that = this;
            $.ajax({
                url: that.ajaxOption.url,
                dataType: 'html',
                beforeSend: function () {
                    that.beforeLoad();
                },
                success: function (html) {
                    that.$body.html(html);
                    that.loadSuccess();
                },
                error: function () {
                    that.loadError();
                },
                complete: function () {
                    that.afterLoad();
                }
            })
        },

        asyncLoadImage: function () {
            var that = this, img = new Image();

            img.onload = function () {
                $(img).addClass('smartBox_body_img_center');
                that.$body.html(img).addClass('smartBox_img_center');
                that.loadSuccess();
                that.afterLoad();
            }

            img.onerror = function () {
                that.loadError();
                that.afterLoad();
            };

            img.src = that.ajaxOption.url;

            if (img.complete !== true) {
                that.beforeLoad();
            }
        },

        asyncLoadByIframe: function () {
            var that = this, $iframe = $(that.tpl.iframe);

            that.beforeLoad();

            $iframe.attr('src', that.ajaxOption.url);

            $iframe.one('load', function () {
                $iframe.css('display', '');

                that.loadSuccess();
                that.afterLoad();
            });

            that.$body.append($iframe.css('display', 'none'));
        },

        beforeLoad: function () {
            var that = this;

            console.log('beforeRequest');
            that.options.beforeRequest();
            if (that.ajaxOption.isShowLoading) {
                if (that.ajaxOption.loadingType === 'img') {
                    that.$body.addClass('smartBoxLoadingImg');
                } else {
                    var loadingText = $(that.tpl.loading).html(that.ajaxOption.loadingText);
                    that.$body.html(loadingText);
                }
            }
        },

        loadError: function () {
            var that = this, errorContent;

            if (that.ajaxOption.errorContent) {
                errorContent = $(that.tpl.loading).html(that.ajaxOption.errorContent);
                that.$body.html(errorContent);
            }
            that.$body.removeClass('smartBoxLoadSuccess');
        },

        loadSuccess: function () {
            this.$body.addClass('smartBoxLoadSuccess');
        },

        afterLoad: function () {
            var that = this;
            console.log('afterRequest');
            that.options.afterRequest();
            if (that.ajaxOption.isShowLoading) {
                if (that.ajaxOption.loadingType === 'img') {
                    that.$body.removeClass('smartBoxLoadingImg');
                } else if (that.ajaxOption.loadingType === 'text' && that.ajaxOption.contentType.toLowerCase() === 'iframe') {
                    that.$body.find('.smartBoxLoadingText').remove();
                }
            }
        },

        isLoadSuccess: function () {
            return this.$body.hasClass('smartBoxLoadSuccess');
        },

        isOpened: function () {
            var that = this;
            return that.$element.is(":visible");
        },

        isClosed: function () {
            return !this.$element.is(":visible");
        },

        dragBox: function () {
            var that = this;

            that.$title.bind('mousedown', function (M) {
                M.preventDefault();

                that.allowDrag = true;

                var xx = that.$element.offset().left - $(document).scrollLeft(),// 解决IE9 下的bug
                    yy = that.$element.offset().top - $(document).scrollTop(),
                    ww, hh;
                if (that.options.dragType.toLowerCase() === 'replace') {
                    ww = that.$element.outerWidth() - 1, hh = that.$element.outerHeight() - 1;

                    that.$drag = $('<div class="smartbox_drag" style="left:' + xx + 'px; top:' + yy + 'px; width:' + ww + 'px; height:' + hh + 'px; z-index:2147483647"></div>');
                    that.$drag.css({
                        'border-radius':that.options.borderRadius,
                        '-moz-border-radius':that.options.borderRadius,
                        '-webkit-border-radius':that.options.borderRadius
                    });
                    $('body').append(that.$drag);
                }

                that.moveX = M.pageX - xx;
                that.moveY = M.pageY - yy;

                xx = yy = ww = hh = null;
            });

            var prevDate = 0;
            $(document).bind('mousemove', function (M) {
                M.preventDefault();

                if (that.allowDrag) {
                    var lastDate = Date.now();
                    if (lastDate - prevDate > 15) {
                        prevDate = lastDate;

                        var offsetX = M.pageX - that.moveX, offsetY = M.pageY - that.moveY;

                        if (that.options.dragType.toLowerCase() === "replace") {
                            that.$drag.css({left: offsetX, top: offsetY});
                        } else {
                            that.$element.css({left: offsetX, top: offsetY});
                        }

                        offsetX = offsetY = null;
                    }
                }
            }).bind('mouseup', function () {
                if (that.allowDrag && that.options.dragType.toLowerCase() === "replace") {

                    var positionLeft = that.$drag.position().left, positionTop = that.$drag.position().top;

                    that.$element.css({left: positionLeft, top: positionTop});

                    that.$drag.remove();
                }

                that.allowDrag = false;
            });
        },

        open: function () {
            var that = this;

            if (that.isOpened()) {
                return;
            }

            that.bindEvent();

            if (false === that.options.beforeShow()){
                return;
            }

            if (that.options.ajaxSetting.url && !that.isLoadSuccess()) {
                that.loadContent();
            }

            if (that.options.isShowOverlay) {
                that.$smartBoxOverlay.show();
            }

            that.$element.show();

            that.afterShow();
        },

        close: function () {
            var that = this;

            if (that.isClosed()) {
                return;
            }

            if (false === that.options.beforeClose()) {
                return;
            }

            if (that.options.isShowOverlay) {
                that.$smartBoxOverlay.hide();
            }
            that.$element.hide();

            that.unbindEvent();

            that.afterClose();
        },

        afterShow: function () {
            var that = this;
            window.clearTimeout(showTimer);
            showTimer = window.setTimeout(that.options.afterShow, 10);
        },

        afterClose: function () {
            var that = this;
            window.clearTimeout(closeTimer);
            closeTimer = window.setTimeout(that.options.afterClose, 10);
        },

        bindEvent: function () {
            var that = this;

            if (that.options.isShowClose) {
                that.$close.bind('click', function () {
                    that.close();
                })
            }

            if (that.options.isCloseOnOverlayClick && that.options.isShowOverlay) {
                that.$smartBoxOverlay.bind('click', function (e) {
                    that.close();
                });
            }

            if (!that.options.isShowOverlay) { // 多个弹层时，使当前点击的弹层在最上
                that.$element.bind('mousedown', function () {
                    if ($(".smartBox:visible").length > 1) {
                        that.$element.css("z-index", getMaxZIndex() + 1);
                    }
                });
            }

            if (that.options.isDrag) {
                that.$title.addClass('smartBox_title_move');
                that.dragBox();
            }
        },

        unbindEvent: function () {
            var that = this;

            that.$close.unbind('click');

            that.$smartBoxOverlay.unbind('click');

            if (that.options.isDrag) {
                that.$title.unbind('mousedown');
            }

            if (!that.options.isShowOverlay) {
                that.$element.unbind('mousedown');
            }

            if (!$(".smartBox").is(":visible")) {
                $(document).unbind('mousemove');
                $(document).unbind('mouseup');
            }
        }
    }

    function getMaxZIndex() {
        var maxZIndex = 0;
        $(".smartBox").each(function () {
            var currentZIndex = parseInt($(this).css("zIndex"), 10);
            if (currentZIndex > maxZIndex) {
                maxZIndex = currentZIndex;
            }
        });
        return maxZIndex;
    }

    $.fn.smartbox = function (options, args) {
        var dataKey = 'smartboxKey';

        return this.each(function () {

            var smartboxElement = $(this),
                instance = smartboxElement.data(dataKey);

            if (typeof options === 'string') {
                if (instance && typeof instance[options] === 'function') {
                    if (options === 'close' || options === 'open') {
                        instance[options](args);
                    }
                } else if (!instance) {
                    console.error('you should instance jquery.smartbox before use it!');
                } else {
                    console.error('method ' + options + ' does not exist on jquery.smartbox!');
                }
            } else {
                // If instance already exists, destroy it:
                /* if (instance && instance.dispose) {
                 instance.dispose();
                 }*/
                instance = new SmartBox(this, options);
                instance.init();

                smartboxElement.data(dataKey, instance);
            }
        });
    }
})(jQuery, window, document)