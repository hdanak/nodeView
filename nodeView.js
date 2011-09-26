/*
 * nodeView.js
 * 
 * Copyright 2011, Hike Danakian
 * Licensed under the LGPL v.3
 *
 */

function Point (x, y) {
    var self = new Object();
    self.x = x;
    self.y = y;
    self.move = function (x, y) {
        self.x = x;
        self.y = y;
    }
    return self;
}
function Rect (x, y, w, h) {
    var self = Point(x, y);
    self.w = w;
    self.h = h;
    self.move = function (x, y) {
        self.x = x;
        self.y = y;
    }
    self.resize = function (w, h) {
        self.w = w;
        self.h = h;
    }
    return self;
}
function Zone (x, y, w, h, type, par) {
    var self = Rect(x, y, w, h);
    self.type = type;
    self.parent = par;
    self.check_collides = function (x, y) {
        if (self.x + self.w >= x
         && self.x <= x
         && self.y + self.h >= y
         && self.y <= y) {
            return true;
        } else {
            return false;
        }
    }
    return self;
}
function Edge (start, end) {
    var self = new Object();
    self.start = start;
    self.end = end;
    self.draw = function () {
        if (!start || !end) {
            return;
        }
        if (start.x < end.x) {
            draw_nice_bezier(start, end, start._node._context, start._type == 'i');
        } else {
            draw_nice_bezier(start, end, start._node._context, start._type == 'o');
        }
    }
    self.disconnect = function () {
        self.start._node.scene.remove_edge(self);
        self.start._edge = null;
        self.end._edge = null;
        self.start = null;
        self.end = null;
    }
    return self;
}
function Connector (type, node) {
    var self = Point(node.zone.x, node.zone.y);
    var radius = 3;
    self._type = type.toLowerCase().charAt(0);
    self._list = self._type == 'i' ? node.inputs : node.outputs;
    self._number = self._list.length + 1;
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
    self.draw = function () {
        self.update();
        ctx = node._context;
        //ctx.fillRect(self.zone.x, self.zone.y, self.zone.w, self.zone.h);
        ctx.beginPath();
        var arc_start = Math.PI/2 * (self._type == 'i' ? 1 : -1);
        ctx.arc(self.x + (self._type == 'i' ? -1 : 1) * self._bubble, self.y,
                radius - self._bubble, arc_start, -arc_start, false);
        ctx.closePath();
        if (self._bubble) {
            ctx.save();
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fill();
        }
    }
    self.update = function () {
        var dot_width = radius + 2 * node._context.lineWidth;
        self.x = node.x + (self._type == 'i' ? 0 : node.w);
        self.y = node.y + node.corner_radius
                    + (node.h - node.corner_radius * 2) * self._number/(self._list.length + 1);

        self.zone.move(self.x + (self._type == "i" ? -radius/2 - 5 : radius/2 - 3),
                       self.y - radius - 1);
        self.zone.resize(dot_width + 4,
                         radius * 2 + 2);
//        self.zone.resize(radius + dot_width,
//                         (node.h - node.corner_radius * 2)/self._list.length);
    }
    return self;
}
function Input (node) {
    var self = Connector('input', node);
    return self;
}
function Output (node) {
    var self = Connector('output', node);
    return self;
}
function Node (x, y, w, h, scene) {
    var self = new Rect(x, y, w, h);
    self.corner_radius = 5;
    self.zone = Zone(x, y, w, h, 'node', self);
    self.inputs = [];
    self.outputs = [];
    self.add_input = function () {
        self.inputs.push(Input(self));
        return self;
    }
    self.add_output = function () {
        self.outputs.push(Output(self));
        return self;
    }
    self.find_zone = function (x, y) {
        for (var i in self.inputs) {
            if (self.inputs[i].zone.check_collides(x, y)) {
                return self.inputs[i].zone;
            }
        }
        for (var o in self.outputs) {
            if (self.outputs[o].zone.check_collides(x, y)) {
                return self.outputs[o].zone;
            }
        }
        if (self.zone.check_collides(x, y)) {
            return self.zone;
        }
        return null;
    }
    self.get_zones = function () {
        var ret_arr = new Array();
        ret_arr = ret_arr.concat(self.inputs.map(function(x){return x.zone}),
                                 self.outputs.map(function(x){return x.zone}));
        ret_arr.push(self.zone);
        return ret_arr;
    }
    self.scene = scene;
    self._context = scene ? scene.context : null;
    self.set_scene = function (scene) {
        self.scene = scene;
        self._context = scene.context;
    }
    self.draw = function () {
        var ctx = self._context;
        //ctx.fillRect(self.zone.x, self.zone.y, self.zone.w, self.zone.h);
        ctx.beginPath();
        ctx.moveTo(self.x + self.corner_radius, self.y);
        ctx.lineTo(self.x + self.w - self.corner_radius, self.y);
        ctx.quadraticCurveTo(self.x + self.w, self.y,
                             self.x + self.w, self.y + self.corner_radius);
        ctx.lineTo(self.x + self.w, self.y + self.h - self.corner_radius);
        ctx.quadraticCurveTo(self.x + self.w, self.y + self.h,
                             self.x + self.w - self.corner_radius, self.y + self.h);
        ctx.lineTo(self.x + self.corner_radius, self.y + self.h);
        ctx.quadraticCurveTo(self.x, self.y + self.h,
                             self.x, self.y + self.h - self.corner_radius);
        ctx.lineTo(self.x, self.y + self.corner_radius);
        ctx.quadraticCurveTo(self.x, self.y, self.x + self.corner_radius, self.y)
        ctx.closePath();
        ctx.stroke();

        self.inputs.map(function(x){x.draw()});
        self.outputs.map(function(x){x.draw()});
    };
    self.move = function (x, y) {
        self.x = x;
        self.y = y;
        self.zone.move(x, y);
        self.inputs.map(function(x) {x.update()});
        self.outputs.map(function(x) {x.update()});
        return self;
    }
    return self;
}
function Scene (canvas) {
    var self = new Object();
    self.canvas = canvas;
    self.context = canvas.getContext("2d");
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
            console.log(zone);
            if (zone != null && zone.type == "node") {
                self.remove_node(zone.parent);
                self.redraw();
            }
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

// Utility functions

function get_mouse_cursor (ev) {
    var x, y;
    if (ev.layerX || ev.layerX == 0) { // Firefox
        x = ev.layerX;
        y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
    }
    return {
        'x': x,
        'y': y
    };
}

function draw_nice_bezier (start, end, ctx, reverse) {
    ctx.save();
    var dist = {
        w: Math.abs(end.x - start.x),
        h: Math.abs(end.y - start.y)
    };
    if (reverse) {
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(start.x, start.y + dist.h/3 * (end.y > start.y ? 1 : -1),
                          end.x, end.y - dist.h/3 * (end.y > start.y ? 1 : -1),
                          end.x, end.y);
    } else {
        if (start.x > end.x) {
            var tmp = start;
            start = end;
            end = tmp;
        }
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(start.x + dist.w/3, start.y,
                          end.x - dist.w/3, end.y,
                          end.x, end.y);
    }
    ctx.stroke();
    ctx.restore();
}

// vim: ts=4 sw=4 et sts=0
