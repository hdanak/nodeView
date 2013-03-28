/* nodeView :: src/Diagram.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Diagram = {
    Node:   NodeView.Class({
        mixins: [ NodeView.Graphics.Rectangle ],
        init: function (parent)
        {
            NodeView.Graphics.Rectangle.call(this, 100, 50, parent);
            this.inputs = PinTray('input', this);
            this.outputs = PinTray('output', this);
        },
        methods: {
            draw:   function (surface)
            {
            }
        }
    }),
    PinTray: NodeView.Class({
        mixins: [ NodeView.Graphics.Widget ],
        init: function (type, parent)
        {
            NodeView.Graphics.Widget.call(this, parent);
            this.type = type;
        },
        methods: {
            create: function () { return Pin(this.type, this); },
            get:    function (i) { return this.children[i]; },
            remove: function (i) { this.children.splice(i, 1); },
        }
    });
    Pin:    NodeView.Class({
        mixins: [ NodeView.Graphics.Circle ],
        init: function (type, parent) {
            NodeView.Graphics.Circle.call(this, 3, parent);
            this.dir = (type == 'input');
            this.bubbled = false;
        },
        methods: {
            draw:   function (surface)
            {
            },
        },
    });
    Wire:   NodeView.Class({
        mixins: [ NodeView.Graphics.Widget ],
        init: function (start, end, parent)
        {
            NodeView.Graphics.Widget.call(this, parent);
            this.start = start;
            this.end   = end;
        },
        methods: {
            draw:   function (surface)
            {
            },
        },
    }),
    Scene:  NodeView.Class({
        mixins: [ NodeView.Graphics.Widget ],
        init: function ()
        {
            NodeView.Graphics.Widget.call(this);
        },
        methods: {
        }
    }),
};
