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
            if (type == "endpoint") {
                console.log("endpoint");
            }
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
    self.draw = function () {
        self.update();
        ctx = node._context;
        ctx.beginPath();
        if (self._bubble) {
            radius = 2;
        }
        var arc_start = Math.PI/2 * (self._type == 'i' ? 1 : -1);
        ctx.arc(self.x + (self._type == 'i' ? -1 : 1) * self._bubble, self.y,
                radius, arc_start, -arc_start, false);
        ctx.closePath();
        if (self._bubble) {
            ctx.save();
            ctx.lineWidth += 2;
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fill();
        }
    }
    self.update = function () {
        self.x = node.x + (self._type == 'i' ? 0 : node.w);
        self.y = node.y + node.corner_radius
                    + (node.h - node.corner_radius * 2) * self._number/(self._list.length + 1);

        self.zone.move(self.x + (self._type == 'i' ? -radius : radius), self.y);
        self.zone.resize(2 * radius, (node.h - node.corner_radius * 2)
                                / self._list.length);
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
    self.corner_radius = 3;
    self.zone = Zone(x, y, w, h, 'node', self);
    self.get_zones = function () {
        var ret_arr = new Array();
        ret_arr = ret_arr.concat(self.inputs.map(function(x){return x.zone}),
                                 self.outputs.map(function(x){return x.zone}));
        ret_arr.push(self.zone);
        return ret_arr;
    }
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
    self.scene = scene;
    self._context = scene.context;
    self.draw = function () {
        var ctx = self._context;
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
        self.zone.move(x + 10, y);
        self.inputs.map(function(x) {x.update()});
        self.outputs.map(function(x) {x.update()});
    }
    return self;
}
function Scene (canvas) {
    var self = new Object();
    self.canvas = canvas;
    self.context = canvas.getContext("2d");
    self.nodes = new Array();
    self.zones = new Array();
    self.add_node = function () {
        var node = Node.apply(null, Array.prototype.slice.call(arguments).concat(self));
        self.nodes.push(node);
        self.zones = self.zones.concat(node.get_zones());
        return node;
    }
    self.redraw = function () {
        self.context.clearRect(0,0,self.canvas.width, self.canvas.height);
        for (var n in self.nodes) {
            self.nodes[n].draw();
        }
    }
    function find_zone (x, y) {
        for (var i in self.zones) {
            if (self.zones[i].check_collides(x, y)) {
                return self.zones[i];
            }
        }
    }

    var mode = 'NONE';
    var selected = null;
    var offset = Point(0,0);
    canvas.addEventListener('mousedown', function (ev) {
        var node;
        var cursor = get_mouse_cursor(ev);
        if (zone = find_zone(cursor.x, cursor.y)) {
            switch (zone.type) {
            case 'node':
                mode = 'DRAG';
                selected = zone.parent;
                offset = Point(cursor.x - zone.parent.x,
                               cursor.y - zone.parent.y);
                break;
            case 'endpoint':
                mode = 'CONNECT';
                break;
            }
        }
    }, false);
    canvas.addEventListener('mouseup', function (ev) {
        mode = 'NONE';
        selected = null;
    }, false);
    canvas.addEventListener('mousemove', function (ev) {
        var cursor = get_mouse_cursor(ev);
        switch (mode) {
        case 'DRAG':
            selected.move(cursor.x-offset.x, cursor.y-offset.y);
            self.redraw();
            break;
        case 'CONNECT':
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
    return {'x':x, 'y':y};
}

// vim: ts=4 sw=4 et sts=0
