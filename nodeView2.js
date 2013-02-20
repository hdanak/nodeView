/*
 * nodeView2.js
 *
 * Copyright 2013, Hike Danakian
 * Licensed under the LGPL v.3
 *
 */

var NodeView = {};
var EventListener = Class({
    constructor: function ()
    {
        this.children = ifndef(this.children, [])
        this.event.handlers = ifndef(this.event.handlers, {});
        this.event.default = this.event.delegate;
    },
    proto: {
        event: {
            handle:   function (ev)
            {
                ifndef(this.event.handlers[ev.type], [this.event.default]).map(
                           function (fx) { fx.call(this, ev) }, this);
            },
            handler:  function (type, fx)
            {
                this.event.handlers[type] = ifndef(this.event.handlers[type], []);
                this.event.handlers[type].push(fx);
            },
            delegate: function (ev)
            {
                this.children.map(function (c) { c.handle(ev); }, this);
            },
        },
    },
});
var Graphic = Class({
    mixins: [ EventListener ],
    proto: {
        draw:   function (ctx, loc) {},
    },
});
var Node = Class({
    mixins: [ Graphic ],
    constructor: function ()
    {
        this.corner_radius = 5;
        this.inputs = PinTray('input', this);
        this.outputs = PinTray('output', this);
        this.children = [ this.inputs, this.outputs ];
    },
    proto: {
        draw:   function (ctx, loc)
        {
            var width  = this.width,
                height = this.height,
                radius = this.corner_radius;
            ctx.path(function () {
                this.move(loc.x + radius, loc.y)
                    .line(loc.x + width - radius, loc.y)
                    .quadratic(loc.x + width, loc.y,
                               loc.x + width, loc.y + radius)
                    .line(loc.x + width, loc.y + height - radius)
                    .quadratic(loc.x + width, loc.y + height,
                               loc.x + width - radius, loc.y + height)
                    .line(loc.x + radius, loc.y + height)
                    .quadratic(loc.x, loc.y + height,
                               loc.x, loc.y + height - radius)
                    .line(loc.x, loc.y + radius)
                    .quadratic(loc.x, loc.y, loc.x + radius, loc.y)
            }).stroke();
        },
    },
});
/* I/O Pin Tray */
var PinTray = Class({
    constructor: function (type)
    {
        this.type = type;
    },
    proto: {
        add:  chain(function ()
        {
            this.children.push(Pin(this.type))
        }),
        get:  function (i) { return this.children[i] },
    }
});
/* Directional Wire */
var Wire = Class({
    mixins: [ Graphic ],
    constructor: function (start, end)
    {
        Gfx();
        this.start = null;
        this.end   = null;
    },
    proto: {
        draw:   function (ctx, loc)
        {
            if (!this.start || !this.end) {
                return;
            } else if (this.start.x < this.end.x) {
                ctx .push()
                    .bezier(this.start, this.end, start.dir).stroke()
                    .pop();
            } else {
                ctx .push()
                    .bezier(this.start, this.end, !start.dir).stroke()
                    .pop();
            }
        },
    },
});
/* Directional I/O Pin */
var Pin = Class({
    mixins: [ Graphic ],
    constructor: function (type, node) {
        this.radius = 3;
        this.dir = type ? 1 : 0;
        this.wire = null;
    },
    proto: {
        draw:    function (ctx, loc)
        {
            var self = this;
            ctx.path(function () {
                var arc_start = Math.PI/2 * (self.dir ? 1 : -1);
                this.arc( loc.x + (self.dir ? -1 : 1) * self._bubble, loc.y,
                          self.radius - self._bubble,
                          arc_start, -arc_start, false );
            });
            if (self._bubble) {
                ctx.wrap(function () {
                    this.style('line_width', 3)
                        .stroke()
                });
            } else {
                ctx.wrap(function () {
                    this.style('line_width', 1)
                        .style('fill_color', '#eee')
                        .fill()
                        .stroke()
                });
            }
        },
    },
});
// TODO: Convert all of the following into Pin and PinTray methods
    self._list = self._type == 'i' ? node.inputs : node.outputs;
    self.zone = Zone(node.zone.x, node.zone.y,
                     0, 0,
                     'endpoint', self);
    self._edge = null;
    self._node = node;
    self._bubble = false;
    self.bubble = function (state) {
        if (state || state == undefined) {
            self._bubble = true;
        } else {
            self._bubble = false;
        }
        node.scene.redraw();
    }
    self.connect = function (target) {
        if (self._type == 'i') {
            self._edge = Edge(target, self);
        } else {
            self._edge = Edge(self, target);
        }
        self._node.scene.add_edge(self._edge);
    }
    self.update = function () {
        var dot_width = radius + 2 * node._context.lineWidth;
        self.x = node.x + (self._type == 'i' ? 0 : node.w);
        self.y = node.y + node.corner_radius + (node.h - node.corner_radius * 2);

        self.zone.move(self.x + (self._type == "i" ? -radius/2 - 5 : radius/2 - 3),
                       self.y - radius - 1);
        self.zone.resize(dot_width + 4,
                         radius * 2 + 2);
    }
    return self;
}
function Scene () {
    var self = new Object();
    self.canvas = canvas;
    self.context = canvas.getContext("2d");
    self.context.translate(0.5, 0.5)
    self.nodes = new Array();
    self.edges = new Array();
    // privates
    var mode = 'NONE';
    var selected = null;
    var target = null;
    var offset = Point(0,0);
    var cursor = {x: 0, y: 0};

    self.add_edge = function (edge) {
        self.edges.push(edge);
    }
    self.remove_edge = function (edge) {
        var pos = self.edges.indexOf(edge);
        if (pos < 0) {
            return;
        }
        self.edges.splice(pos, 1);
    }
    self.add_node = function (node) {
        node.set_scene(self);
        self.nodes.push(node);
        return self;
    }
    self.add_node_interactive = function (node) {
        if (mode != 'NONE') {
            setTimeout(
                function () {
                    node.set_scene(self);
                    self.insert_node(node.move(cursor.x, cursor.y))
                }, 400);
            return;
        }
        self.add_node(node);
        selected = node;
        mode = 'DRAG';
        node.draw();
    }
    self.remove_node = function (node) {
        var pos = self.nodes.indexOf(node);
        if (pos < 0) {
            return;
        }
        for (var i in node.inputs) {
            if (node.inputs[i]._edge != null) {
                node.inputs[i]._edge.disconnect();
            }
        }
        for (var o in node.outputs) {
            if (node.outputs[o]._edge != null) {
                node.outputs[o]._edge.disconnect();
            }
        }
        self.nodes.splice(pos, 1);
    }
    self.remove_node_interactive = function () {
        mode = 'DELETE';
        self.canvas.style.cursor = "crosshair";
    }
    self.draw =
    self.redraw = function () {
        self.context.clearRect(0,0,self.canvas.width, self.canvas.height);
        for (var n in self.nodes) {
            self.nodes[n].draw();
        }
        for (var e in self.edges) {
            self.edges[e].draw();
        }
    }
    function find_zone (x, y) {
        for (var n in self.nodes) {
            if (zone = self.nodes[n].find_zone(x, y)) {
                return zone;
            }
        }
        return null;
    }

    canvas.addEventListener('mousedown', function (ev) {
        switch (mode) {
        case 'DRAG':
            mode = 'NONE';
            selected = 'NONE';
            break;
        case 'DELETE':
            var zone = find_zone(cursor.x, cursor.y);
            if (zone != null && zone.type == "node") {
                self.remove_node(zone.parent);
                self.redraw();
            }
            self.canvas.style.cursor = "auto";
            mode = 'NONE';
            break;
        case 'CONNECT':
            break;
        case 'BUBBLE':
            mode = 'CONNECT';
            var zone = find_zone(cursor.x, cursor.y);
            if (zone.parent._edge != null) {
                selected = zone.parent._type == 'i' ? zone.parent._edge.start
                                                    : zone.parent._edge.end;
                zone.parent._edge.disconnect();
                target = null;
            }
            break;
        default:
            var zone = find_zone(cursor.x, cursor.y);
            if (zone) {
                switch (zone.type) {
                case 'node':
                    mode = 'DRAG';
                    selected = zone.parent;
                    offset = Point(cursor.x - zone.parent.x,
                                   cursor.y - zone.parent.y);
                    break;
                }
            }
        }
    }, false);
    canvas.addEventListener('mouseup', function (ev) {
        switch (mode) {
        case 'CONNECT':
            if (target != null) {
                selected.connect(target);

                target.bubble(false);
                target = null;
            }
            selected.bubble(false);
            selected = null;
            mode = 'NONE';
            break;
        case 'BUBBLE':
            break;
        default:
            mode = 'NONE';
            selected = null;
        }
    }, false);
    canvas.addEventListener('mousemove', function (ev) {
        cursor = get_mouse_cursor(ev);
        switch (mode) {
        case 'DRAG':
            selected.move(cursor.x-offset.x, cursor.y-offset.y);
            self.redraw();
            break;
        case 'CONNECT':
            if (zone = find_zone(cursor.x, cursor.y)) {
                if (zone.type == 'endpoint'
                        && zone.parent._type != selected._type) {
                    if (target != null && target != zone.parent) {
                        target.bubble(false);
                    }
                    zone.parent.bubble();
                    target = zone.parent;
                }
            } else if (target != null) {
                    target.bubble(false);
                    target = null;
            }

            self.redraw();
            if (selected.x < cursor.x) {
                draw_nice_bezier(selected, cursor, self.context, selected._type == 'i');
            } else {
                draw_nice_bezier(selected, cursor, self.context, selected._type == 'o');
            }

            break;
        case 'BUBBLE':
            if (selected.zone != find_zone(cursor.x, cursor.y)) {
                selected.bubble(false);
                selected = null;
                mode = 'NONE';
            }
            break;
        default:
            if (zone = find_zone(cursor.x, cursor.y)) {
                if (zone.type == 'endpoint') {
                    zone.parent.bubble();
                    selected = zone.parent;
                    mode = 'BUBBLE';
                }
            }
        }
    }, false);

    return self;
}
var BoundingBox = Class({
    constructor: function (width, height)
    {
        this.width  = ifndef(width,  0);
        this.height = ifndef(height, 0);
    },
    proto: {
        coldet: function (origin, target)
        {
            return ( origin.x + this.width  >= target.x
                  && origin.y + this.height >= target.y
                  && origin.x <= target.x && origin.y <= target.y );
        },
    },
});
var Canvas2dDisplay = Class({
    mixins: [ EventListener ],
    constructor: function (
        /* Canvas DOM Element */ canvas,
    ) {
        this._ctx = canvas.getContext("2d");
        this._saved_states = [];

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
    proto: {
        push:   chain(function (fx)
        {
            this._saved_states.push(fx);
            this._ctx.save();
        }),
        pop:    chain(function ()
        {
            fx = this._saved_states.pop();
            this._ctx.restore();
            if (fx) fx();
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

// Utility functions
function defined (x)
{
    return q != undefined
}
function ifndef (q, t, f)
{
    return !defined(q) ? t : defined(f) ? f : q;
}
function chain (fx, self)
{
    self = ifndef(self, this);
    return function () {
        fx.apply(self, arguments);
        return self;
    };
}
function Class (def)
{
    var cons = def.constructor || function () {};
// TODO: deduplicate mixins from ancestors
    if (def.mixins) {
        cons = function () {
            def.mixins.map(function (fx) { fx.call(this) }, this);
            cons.apply(this, arguments);
        };
    }
    var protos = [].concat(
        def.mixins ? def.mixins.map(function (x) { return x.prototype }) : [],
        def.proto || [],
    ).reverse();
    var proto = cons;
    protos.forEach(function (elem) {
        proto.prototype = Object.create(elem);
        proto = proto.prototype;
    });
    cons.prototype.constructor = cons;
    if (def.post_proto) {
        def.post_proto.call(cons.prototype);
    }
    return cons;
};

// vim: ts=4 sw=4 et sts=0
