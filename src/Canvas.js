/* nodeView::src/Canvas.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Graphics.CanvasSurface = NodeView.Class({
    init: function (canvas)
    {
        this._pen_down = 0;
        this._ctx = canvas.getContext("2d");
        this.cursor = new Cursor(this);
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
            this.move(start);
            this._ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y);
        },

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
