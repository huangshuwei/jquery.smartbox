/*
 * jquery.smartbox.js v1.0.0
 * require jquery 1.5.1+
 * MIT Lincence
 * */
;(function ($, window, document, undefined) {

    var defaultOpt = {
        type: 'option', // 'option':title、content、footer 内容来自html；'option':title、content、footer 内容来自配置 |type string
        width: 360, // 最小宽度 |type int
        height: 360, // 最小高度 |type int
        headerHeight: 50, // header 的高度 |type int
        footerHeight: 50, // footer 的高度 |type int
        title: null, // 弹层标题 |type:html
        footer: null, // 底部内容 |type:html

        isShowTitle: true, // |type:bool
        isShowFooter: true, // |type:bool
        isAutoShow: true, // 是否初始化自动显示弹层 |type:bool
        zIndex: 9999, // |type:int

        // content
        content: null, // 显示的内容 |type:html
        ajaxSetting: { // 通过jquery.ajax 获取（content 未设置才会生效） |type:object
            url: null, // ajax 请求地址 |type:url
            contentType: 'html', // 'html':异步加载的内容为html;'img':异步加载的内容为图片 |type:string
            type: 'GET', // 'GET':发送get请求； 'POST':发送post请求 |type:string
            isShowLoading: true, // 是否显示加载效果 |type:bool
            loadingType: 'img', // 'img':加载中以图片的效果展示；'text':加载中以文字的形式展示 |type:string
            loadingText: '正在加载...', // 显示加载的内容提示 |type html
            errorContent: '' // 请求错误时显示的内容 |type:html
        },

        // overlay
        isShowOverlay: true, // 是否显示遮罩层 |type:bool
        isCloseOnOverlayClick: true, // |type:bool
        overlayOpacity: 0.3, // 遮罩层的透明度 0.1~1  |type:float

        // callbacks
        beforeClose: $.noop, // 关闭前调用的事件 |type:function

        // close
        isShowClose: true, // 是否显示关闭图标 |type:bool
        closeType: 'out' // 'in':关闭图标在弹层内部右上角； 'out':关闭图标在弹层外部右上角 |type:string
    }

    function SmartBox(ele, opt) {
        console.log('初始化')
        var that = this;

        that.element = ele;
        that.$element = $(ele);
        that.defaults = defaultOpt;
        that.options = $.extend({}, this.defaults, opt);//that.$header = that.$element.find(".smartBox_header");
        that.ajaxOption = opt ? $.extend({}, this.defaults.ajaxSetting, opt.ajaxSetting) : this.defaults.ajaxSetting;

        that.$header = that.$element.find(".smartBox_header");
        that.$title = that.$element.find(".smartBox_header_title");
        that.$body = that.$element.find(".smartBox_body");
        that.$footer = that.$element.find(".smartBox_footer");
        // Overlay
        that.overlayZIndex = that.options.zIndex - 1;
        that.$smartBoxOverlay = $('<div class="smartBoxOverlay ' + that.overlayZIndex + '"></div>');

        // version
        that.version = 'v1.0.0';
    }

    SmartBox.prototype = {
        template: [
            '<div>',
            '<div class="smartBox_header">',
            '<span class="smartBox_header_title" />',
            '</div>',
            '<div class="smartBox_body">',
            '</div>',
            '<div class="smartBox_footer">',
            '</div>',
            '</div>'
        ].join(''),
        $loadingTpl:$('<div class="smartBoxLoadingText"></div>'),
        init: function () {
            console.log('init');
            var that = this;

            that.createContainer();

            that.resetValue();

            that.adjustBox();

            if (that.options.isAutoShow) {
                that.open();
            }

            return that.$element;
        },

        createContainer: function () {
            var that = this,
                $template = $(that.template),
                type = that.options.type.toLowerCase(),
                closeType = that.options.closeType.toLowerCase(),
                titleHtml,
                contentHtml;

            if (that.options.isShowTitle) {
                if (type === 'option') {
                    titleHtml = that.options.title ? that.options.title : '';
                } else if (type === 'html') {
                    titleHtml = (that.$header && that.$header.html()) ? that.$header.html() : ''
                }
                $template.find('.smartBox_header_title').html(titleHtml);

                $template.find('.smartBox_header').addClass('smartBox_header_border');
            } else {
                $template.find('.smartBox_header_title').remove();
            }

            $template.find('.smartBox_header').css({
                "height": that.options.headerHeight + 'px',
                "line-height": that.options.headerHeight + 'px'
            });

            if (that.options.isShowClose) {
                var $closeA = closeType === 'in' ? $('<a />').addClass('smartBox_header_close_normal') : $('<a />').addClass('smartBox_header_close_circle');
                $template.find('.smartBox_header').append($closeA);
            }

            if (type === 'option') {
                contentHtml = that.options.content ? that.options.content : '';
            } else if (type === 'html') {
                contentHtml = (that.$body && that.$body.html()) ? that.$body.html() : ''
            }
            $template.find('.smartBox_body').html(contentHtml);

            if (that.options.isShowFooter) {
                var footerHtml = (type === 'option') ? that.options.footer : (that.$footer && that.$footer.html()) ? that.$footer.html() : '';
                $template.find('.smartBox_footer').html(footerHtml).css({
                    "height": that.options.footerHeight + 'px',
                    "padding": "8px 15px 0 15px"
                });
            } else {
                $template.find('.smartBox_footer').remove();
            }

            if (that.options.isShowOverlay) {
                that.$smartBoxOverlay.css({'z-index': that.overlayZIndex,'z-index': that.overlayZIndex,'opacity':that.options.overlayOpacity,'filter':'alpha(opacity='+that.options.overlayOpacity*100+')'});
                $('body').append(that.$smartBoxOverlay);
            }
            that.$element.html($template.html()).css({'display': 'none'}).addClass('smartBox');
        },

        resetValue: function () {
            var that = this;
            that.$header = that.$element.find(".smartBox_header");
            that.$close = that.options.closeType === 'in' ? that.$element.find('.smartBox_header_close_normal') : that.$element.find('.smartBox_header_close_circle');
            that.$body = that.$element.find(".smartBox_body");
            that.$footer = that.$element.find(".smartBox_footer");
        },

        adjustBox: function () {
            var that = this,
                contentHeight;

            that.$element.css({
                "width": that.options.width,
                "height": that.options.height,
                "z-index": that.options.zIndex
            });

            contentHeight = that.options.height - that.$header.height();
            console.log(that.$header.height());
            console.log(that.$footer.height());
            if (that.options.isShowFooter) {
                contentHeight -= that.$footer.height()
            }

            that.$element.find('.smartBox_body').css({
                "height": contentHeight
            });

            that.$element.css({
                "margin-top": -(that.$element.outerHeight() / 2),
                "margin-left": -(that.$element.outerWidth() / 2)
            });
        },

        loadConetnt: function () {
            var that = this,
                boxBody = that.$element.find('.smartBox_body'),
                contentType = that.ajaxOption.contentType.toLowerCase();

            boxBody.html('');
            if (contentType === 'html') {
                $.ajax({
                    url: that.ajaxOption.url,
                    type: that.ajaxOption.type.toUpperCase(),
                    dataType: 'html',
                    beforeSend: function () {
                        that.beforeLoad();
                    },
                    success: function (html) {
                        boxBody.html(html);
                        that.loadSuccess();
                    },
                    error: function () {
                        that.loadError();
                    },
                    complete: function () {
                        that.afterLoad();
                    }
                })
            } else if (contentType === 'img') {
                var img = new Image();

                img.onload = function () {
                    $(img).addClass('smartBox_body_img_center');
                    boxBody.html(img).addClass('smartBox_img_center');
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
            }
        },

        beforeLoad: function () {
            var that = this,
                boxBody = that.$element.find('.smartBox_body');

            if (that.ajaxOption.isShowLoading) {
                if (that.ajaxOption.loadingType === 'img') {
                    boxBody.addClass('smartBoxLoadingImg');
                } else {
                    var loadingText = that.$loadingTpl.html(that.ajaxOption.loadingText);
                    boxBody.html(loadingText);
                }
            }
        },

        loadError: function () {
            var that = this,
                boxBody = that.$element.find('.smartBox_body'),
                errorContent;

            if (that.ajaxOption.errorContent) {
                errorContent = that.$loadingTpl.html(that.ajaxOption.errorContent);
                boxBody.html(errorContent);
            }
            boxBody.removeClass('smartBoxLoadSuccess');
            that.afterLoad();
        },

        loadSuccess: function () {
            var that = this,
                boxBody = that.$element.find('.smartBox_body');

            boxBody.addClass('smartBoxLoadSuccess');
            that.afterLoad();
        },

        afterLoad: function () {
            var that = this,
                boxBody = that.$element.find('.smartBox_body');

            if (that.ajaxOption.isShowLoading) {
                if (that.ajaxOption.loadingType === 'img') {
                    boxBody.removeClass('smartBoxLoadingImg');
                }
            }
        },

        isLoadSuccess: function () {
            var that = this,
                boxBody = that.$element.find('.smartBox_body');

            return boxBody.hasClass('smartBoxLoadSuccess');
        },

        isOpened: function () {
            var that = this;
            return that.$element.is(":visible");
        },

        isClosed: function () {
            var that = this;
            return !that.$element.is(":visible");
        },

        open: function () {
            var that = this;

            if (that.isOpened()) {
                return;
            }

            if (that.options.type === 'option' && that.options.ajaxSetting.url && !that.isLoadSuccess()) {
                console.log('异步请求');
                that.loadConetnt();
            }

            that.bindEvent();

            if (that.options.isShowOverlay) {
                that.$smartBoxOverlay.show();
            }

            that.$element.show();
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
        },

        unbindEvent: function () {
            var that = this;

            that.$close.unbind('click');

            that.$smartBoxOverlay.unbind('click');
        }
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