/*
 * nodeView2.js
 *
 * Copyright 2013, Hike Danakian
 * Licensed under the LGPL v.3
 *
 */

var NodeView = {};
var Node = Class({
    mixins: [ Graphic ],
    init: function ()
    {
        this.corner_radius = 5;
        this.inputs = PinTray('input', this);
        this.outputs = PinTray('output', this);
        this.children = [ this.inputs, this.outputs ];
    },
    methods: {
        draw:   function (scene, loc)
        {
            var width  = this.width,
                height = this.height,
                radius = this.corner_radius;
            scene.path(function () {
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
    init: function (type)
    {
        this.type = type;
    },
    methods: {
        add:  chain(function ()
        {
            this.children.push(Pin(this.type))
        }),
        get:  function (i) { return this.children[i] },
    }
});
/* Directional Wire */
var Wire = Class({
    mixins: [ Graphic, Signals ],
    init: function (start, end)
    {
        Gfx();
        this.start = null;
        this.end   = null;
    },
    methods: {
        draw:   function (scene, loc)
        {
            if (!this.start || !this.end)
                return;
            if (this.start.x < this.end.x) {
                scene.do(function () {
                    this.bezier(this.start, this.end, start.dir).stroke()
                });
            } else {
                scene.do(function () {
                    this.bezier(this.start, this.end, !start.dir).stroke()
                });
            }
        },
    },
});
/* Directional I/O Pin */
var Pin = Class({
    mixins: [ Graphic ],
    init: function (type, node) {
        this.radius = 3;
        this.dir = type ? 1 : 0;
        this.wire = null;
        this._bubble = false;
        this.extend({
            get bubble () {
                return this._bubble;
            },
            set bubble (val) {
                old_val = this._bubble;
                this._bubble = value;
                if (old_val != val)
                    this.signal.fire('bubble', val);
            }
        });
    },
    methods: {
        draw:   function (scene, loc)
        {
            var self = this;
            scene.path(function () {
                var arc_start = Math.PI/2 * (self.dir ? 1 : -1);
                this.arc( loc.x + (self.dir ? -1 : 1) * self._bubble, loc.y,
                          self.radius - self._bubble,
                          arc_start, -arc_start, false );
            });
            if (self._bubble) {
                scene.do(function () {
                    this.style('line_width', 3)
                        .stroke()
                });
            } else {
                scene.do(function () {
                    this.style('line_width', 1)
                        .style('fill_color', '#eee')
                        .fill()
                        .stroke()
                });
            }
        },
    },
});
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
