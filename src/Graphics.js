/* nodeView::src/Graphics.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Graphics = {

Widget:
    function (parent)
    {
        this.x(0); this.y(0);
        this.parent = parent;
        this.children = [];
        this.offset = { x: 0, y: 0 }
        if (parent) parent.addChild(this);
    }.meta.Class.slots(
        function x(n) {
            var p = ifndef(this.parent, { x: 0 });
            return defined(n) ? this.offset.x = n - p.x
                              : this.offset.x + p.x;
        },
        function y(n) {
            var p = ifndef(this.parent, { y: 0 });
            return defined(n) ? this.offset.y = n - p.y
                              : this.offset.y + p.y;
        },
    ).methods(
        function draw (surface) {},
        function render(surface)
        {
            this.draw(surface);
            this.children.map(function (c) { c.render(surface) });
        },
        function coldet(target) {},
        function under(target)
        {
            if (this.coldet(target))
                return this;
            return this.children.first(function (c) { return c.under(target) })
        },
        function reparent(p)
        {
            if (this.parent)
                this.parent.removeChild(this);
            p.addChild(this);
        },
        function addChild(c)
        {
            this.children.push(c);
            c.parent = this;
        },
        function removeChild(c)
        {
            for (var i = 0; i < this.children.length; ++i)
                if (this.children[i] === c)
                    this.children.splice(i, 1);
        }
    ),
Rectangle:
    function (width, height, parent)
    {
        NodeView.Graphics.Widget.call(this, parent);
        this.width  = ifndef(width,  0);
        this.height = ifndef(height, 0);
    }.metaClass().bases(
        NodeView.Graphics.Widget
    ).methods(
        function coldet(target)
        {
            return ( this.x + this.width  >= target.x
                  && this.y + this.height >= target.y
                  && this.x <= target.x && this.y <= target.y );
        }
    ),
Circle:
    function (radius, parent)
    {
        this.SuperClass().call(this, parent);
        this.radius = ifndef(radius, 0);
    }.metaClass().bases(
        NodeView.Graphics.Widget
    ).methods(
        function coldet(target)
        {
            return ( Math.pow(this.x - target.x, 2)
                   + Math.pow(this.y - target.y, 2)) < Math.pow(this.radius, 2)
        }
    ),
Cursor:
    function (dom_elem, parent)
    {
        NodeView.Graphics.Widget.call(this, parent);
        this.element = dom_elem;
        for (name in [ 'mousedown', 'mouseup', 'mousemove' ])
            this.elem.addEventListener(name, this);
    }.metaClass().bases(
        NodeView.Graphics.Widget
    ).methods(
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
                    this.parent.signals.fire('down');
                    break;
                case 'mouseup':
                    this.parent.signals.fire('up');
                    break;
                case 'mousemove':
                    this.parent.signals.fire('move');
                    break;
            }
        }
    )
};
