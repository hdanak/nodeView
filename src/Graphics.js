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
    init: function ()
    {
        var children = {};
    },
    methods: {
        draw: function (ctx, loc) {},
    },
});
var BoundingBox = Class({
    init: function (width, height)
    {
        this.width  = ifndef(width,  0);
        this.height = ifndef(height, 0);
    },
    methods: {
        coldet: function (origin, target)
        {
            return ( origin.x + this.width  >= target.x
                  && origin.y + this.height >= target.y
                  && origin.x <= target.x && origin.y <= target.y );
        },
    },
});
var Canvas2dScene = Class({
    mixins: [ EventListener ],
    init: function (
        /* Canvas DOM Element */ canvas,
    ) {
        this._ctx = canvas.getContext("2d");

        function DOM_mouse_pos (
            /* DOM Event */ ev,
        ) {
            if (defined(ev.layerX))     // Firefox
                return { x: ev.layerX,  y: ev.layerY  };
            if (defined(ev.offsetX))    // Opera
                return { x: ev.offsetX, y: ev.offsetY };
            return { x: undefined,  y: undefined  }
        }
        function convert_DOM_event (DOM_type, nodeView_type) {
            var self = this;
            canvas.addEventListener('mousedown', function (ev) {
                self.handle({ type: nodeView_type, loc: DOM_mouse_pos(ev) });
            });
        }
        convert_DOM_event( 'mouseup',    'cursor.up'   );
        convert_DOM_event( 'mousedown',  'cursor.down' );
        convert_DOM_event( 'mouseenter', 'cursor.over' );
        convert_DOM_event( 'mouseleave', 'cursor.out'  );
    },
    methods: {
        do:     chain(function (fx)
        {
            this._ctx.save();
            fx();
            this._ctx.restore();
        }),
        path:   chain(function (fx)
        {
            this._ctx.beginPath();
            fx();
            this._ctx.closePath();
        }),
        stroke: chain(function ()
        {
            this._ctx.stroke();
        }),
        move:   chain(function (point)
        {
            this._ctx.move(point.x, point.y);
        }),
        bezier: chain(function (start, end, reverse)
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
        }),
    }
});
