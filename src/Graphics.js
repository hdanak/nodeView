/* nodeView::src/Graphics.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

var Graphic = Class({
    mixins: [ Signals ],
    requires: [ "coldet" ],
    init: function (offset, parent)
    {
        this.children = [];
        this.parent = ifndef(parent, { x: 0, y: 0 });
        this.offset = ifndef(offset, { x: 0, y: 0 });

        function delegate_under(type) {
            function (cursor) {
                this.children
                    .filter(function (x) { x.coldet(cursor) })
                    .map(function (x) { x.fire('cursor.down', cursor) });
            }
        }
        this.signals.connect('cursor.down', delegate_under('cursor.down'));
        this.signals.connect('cursor.up',   delegate_under('cursor.up'));
        this.signals.connect('cursor.move', delegate_under('cursor.move'));
        this.signals.connect('cursor.over', function () { });
        this.signals.connect('cursor.out',  function () { });
    },
    methods: {
        get x () {
            return this.bound ? this.bound.target.x + this.bound.offset.x
                              : this.parent.x + this.offset.x ;
        },
        get y () {
            return this.bound ? this.bound.target.y + this.bound.offset.y
                              : this.parent.y + this.offset.y
        },
        bind: function (target, offset) {
            this.bound = { target: target,
                           offset: ifndef(offset, { x: 0, y: 0 }) };
        },
        unbind: function () {
            this.bound = undefined;
        },
        draw: function (screen) {},
    },
});
var BoundingBox = Class({
    requires: [ "x", "y" ],
    init: function (width, height)
    {
        this.width  = ifndef(width,  0);
        this.height = ifndef(height, 0);
    },
    methods: {
        coldet: function (target)
        {
            return ( this.x + this.width  >= target.x
                  && this.y + this.height >= target.y
                  && this.x <= target.x && this.y <= target.y );
        },
    },
    tests: {
        coldet_01: function () {
            var bounds = BoundingBox(100, 200);
            bounds.x = 0;
            bounds.y = 0;
            this.ok(bounds.coldet(0, 0));
            this.ok(bounds.coldet(100, 0));
            this.ok(bounds.coldet(0, 200));
            this.ok(bounds.coldet(100, 200));
            this.ok(bounds.coldet(50, 100));
        }
    }
});
var Cursor2d = Class({
    init: function (screen) {
        this.parent = screen
        this.x = 0;
        this.y = 0;
    },
    methods: {
        function handleEvent(ev)
        {
            if (defined(ev.layerX)) {   // Firefox
                this.x = ev.layerX;
                this.y = ev.layerY;
            }
            if (defined(ev.offsetX)) {  // Opera
                this.x = ev.offsetX;
                this.y = ev.offsetY;
            }
            switch (ev.type) {
                case 'mousedown':
                    this.parent.signals.fire('cursor.down', this);
                    break;
                case 'mouseup':
                    this.parent.signals.fire('cursor.down', this);
                    break;
                case 'mouseenter':
                    break;
                case 'mouseleave':
                    break;
            }
        }
    }
});
var Canvas2dScreen = Class({
    init: function (canvas)
    {
        this._pen_down = 0;
        this._ctx = canvas.getContext("2d");

        this.cursor = new Cursor(this);
        for (ev_type in [ 'mousedown', 'mouseup', 'mouseenter', 'mouseleave' ])
            canvas.addEventListener(ev_type, this.cursor);
    },
    methods: {
        push:   function ()
        {
        },
        pop:    function ()
        {
        },
        repeat: function ()
        {
        },
        do:     function (fx)
        {
            this._ctx.save();
            fx();
            this._ctx.restore();
        },

        path:   function (p)
        {
            var path;
            if (p instanceof Function) {
                path = p.call(new Plotter.Path());
            } else if (p instanceof Plotter.Path) {
                path = p;
            }
            path.render(this);
        },
        spline: function (spline)
        {
        },

        relative:   function ()
        {
        },
        absolute:   function ()
        {
        },
        move:   function ()
        {
            this._ctx.move(point.x, point.y);
        },
        arc:    function ()
        {
        },
        bezier: function (start, end, reverse)
        {

            if (!reverse && start.x > end.x) {
                var tmp = start; start = end; end = tmp;
            }
            var cp1x = start.x, cp1y = start.y,
                cp2x = end.x,   cp2y = end.y;
            if (reverse) {
                var height = Math.abs(end.y - start.y)/3;
                var dir = end.y > start.y ? 1 : -1;
                cp1y += height * dir;
                cp2y -= height * dir;
            } else {
                var width = Math.abs(end.x - start.x)/3;
                cp1x += width;
                cp2x -= width;
            }
            this.move(start)
                ._ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y);
        }

        down:   function ()
        {
            this._pen_down = 0;
        },
        up:     function ()
        {
            this._pen_down = 0;
        },
        draw:   function ()
        {
            this._ctx.stroke();
        },
    }.map(chain)
});
