/* nodeView::src/Graphics.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Graphics = {
    Widget: NodeView.Class({
        init: function (parent)
        {
            this.children = [];
            this.offset = { x: 0, y: 0 }
            this.parent = parent;
            if (parent) parent.addChild(this);
        },
        methods: {
            coldet: function (target) {},
            under:  function (target) {
                if (this.coldet(target))
                    return this;
                return this.children.first(function (c) {
                    return c.under(target)
                })
            },
            draw:   function (surface) {},
            render: function (surface) {
                this.draw(surface);
                this.children.map(function (c) { c.render(surface) });
            },

            reparent: function (p) {
                if (this.parent)
                    this.parent.removeChild(this);
                p.addChild(this);
            },
            addChild: function (c) {
                this.children.push(c);
                c.parent = this;
            },
            removeChild: function (c) {
                for (var i = 0; i < this.children.length; ++i)
                    if (this.children[i] === c)
                        this.children.splice(i, 1);
            },

            x: function (n) {
                var p = ifndef(this.parent, { x: 0 });
                if (defined(n)) {
                    this.offset.x = n - p.x;
                    return this;
                }
                return p.x + this.offset.x;
            },
            y: function (n) {
                var p = ifndef(this.parent, { y: 0 });
                if (defined(n)) {
                    this.offset.y = n - p.y;
                    return this;
                }
            }
        }
    }),
    Rectangle:   NodeView.Class({
        mixins: [ NodeView.Graphics.Widget ],
        init: function (width, height, parent)
        {
            NodeView.Graphics.Widget.call(this, parent);
            this.width  = ifndef(width,  0);
            this.height = ifndef(height, 0);
        },
        methods: {
            coldet: function (target)
            {
                return ( this.x + this.width  >= target.x
                      && this.y + this.height >= target.y
                      && this.x <= target.x && this.y <= target.y );
            }
        }
    }),
    Circle:   NodeView.Class({
        mixins: [ NodeView.Graphics.Widget ],
        init: function (radius, parent)
        {
            NodeView.Graphics.Widget.call(this, parent);
            this.radius = ifndef(radius, 0);
        },
        methods: {
            coldet: function (target)
            {
                return ( Math.pow(this.x - target.x, 2)
                       + Math.pow(this.y - target.y, 2)) < Math.pow(this.radius, 2)
            }
        }
    }),
    Cursor: NodeView.Class({
        mixins: [ NodeView.Graphics.Widget ],
        init: function (dom_elem, parent) {
            NodeView.Graphics.Widget.call(this, parent);
            this.element = dom_elem;
            for (name in [ 'mousedown', 'mouseup', 'mousemove' ])
                this.elem.addEventListener(name, this);
        },
        methods: {
            handleEvent: function(ev)
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
        }
    })
};
