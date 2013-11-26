/*
 * nodeView.js
 *
 * Copyright 2012, Hike Danakian
 * Licensed under the LGPL v.3
 *
 */

function Point(x, y) {
  Point.prototype.move.call(this, x, y)
}
mixin(Point.prototype, {
  move: function(x, y) {
    this.x = x
    this.y = y
  }
})

function Rect(x, y, w, h) {
  Point.call(this, x, y)
  this.resize(w, h)
}
inherits(Rect, Point, {
  resize: function(w, h) {
    this.w = w
    this.h = h
  }
})

function Circle(x, y, r) {
  Point.call(this, x, y)
  this.r = r
}
inherits(Circle, Point)

function Zone(x, y, w, h, par) {
  Rect.call(this, x, y, w, h)
  this.parent = par
}
inherits(Zone, Rect, {
  coldet: function (x, y) {
    return (this.x + this.w >= x && this.x <= x
         && this.y + this.h >= y && this.y <= y)
  }
})

function Edge(start, end) {
  this.start = start
  this.end = end
}
mixin(Edge.prototype, {
  draw: function () {
    if (!start || !end)
      return
    draw_nice_bezier(start, end, start.scene.context,
                     start.type == (start.x < end.x ? 'i' : 'o'))
  },
  disconnect: function () {
    this.start.scene.remove_edge(this)
    this.start.edge = this.end.edge = this.start = this.end = null
  }
})

function Connector(type, node) {
  Point.call(this, node.zone.x, node.zone.y)
  mixin(this, {
    type: type.toLowerCase().charAt(0),
    node: node,
    edge: null,
    _bubble: false,
    zone: new Zone(node.zone.x, node.zone.y, 0, 0, this)
  })
  this._list = this.type == 'i' ? node.inputs : node.outputs
  this._number = this._list.length + 1
}
inherits(Connector, Circle, {
  get bubble() { return this._bubble },
  set bubble(state) {
    var old = this._bubble
    this._bubble = state
    if (old != state)
      this.scene.draw()
  },
  get scene() { return this.node.scene },
  connect: function(target) {
    this.edge = (this.type == 'i') ? new Edge(target, this) : new Edge(this, target)
    this.scene.add_edge(this.edge)
  },
  draw: function() {
    this.update()
    var ctx = this.scene.context
      , arc_start = Math.PI/2 * (this.type == 'i' ? 1 : -1)

    ctx.beginPath()
    ctx.arc(this.x + (this.type == 'i' ? -1 : 1) * this._bubble, this.y,
            this.r - this._bubble, arc_start, -arc_start, false)
    ctx.closePath()

    ctx.save()
    if (this._bubble) {
      ctx.lineWidth = 3
    } else {
      ctx.lineWidth = 1
      ctx.fillStyle = "#eee"
      ctx.fill()
    }
    ctx.stroke()
    ctx.restore()
  },
  update: function() {
    var dot_width = this._radius + 2 * this.scene.context.lineWidth
    this.x = this.node.x + (this.type == 'i' ? 0 : this.node.w)
    this.y = this.node.y + this.node.corner_radius
              + (this.node.h - this.node.corner_radius * 2) * this._number/(this._list.length + 1)

    this.zone.move(this.x + (this.type == "i" ? -this.r/2 - 5 : this.r/2 - 3),
                   this.y - this.r - 1)
    this.zone.resize(dot_width + 4, 2 * this.r + 2)
  }
})

function Input(node) {
  Connector.call(this, 'input', node)
}
inherits(Input, Connector)

function Output(node) {
  Connector.call(this, 'output', node)
}
inherits(Output, Connector)

function Node(x, y, w, h, scene) {
  Rect.call(this, x, y, w, h)
  mixin(this, {
    corner_radius: 5,
    zone: new Zone(x, y, w, h, this),
    inputs: [], outputs: [],
    scene: scene
  })
}
inherits(Node, Rect, {
  add_input: chain(function() {
    this.inputs.push(new Input(this))
  }),
  add_output: chain(function() {
    this.outputs.push(new Output(this))
  }),
  find_zone: function(x, y) {
    var res = null
    this.inputs.concat(this.outputs).some(function(elem) {
      if (elem.zone.coldet(x, y)) {
        res = elem.zone
        return true
      }
    })
    if (!res && this.zone.coldet(x, y)) {
      res = this.zone
    }
    return res
  },
  draw: function() {
    var ctx = this.scene.context
      , x = this.x, y = this.y
      , w = this.w, h = this.h
      , corner_radius = this.corner_radius

    ctx.beginPath()
    ctx.moveTo(x + corner_radius, y)
    ctx.lineTo(x + w - corner_radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + corner_radius)
    ctx.lineTo(x + w, y + h - corner_radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - corner_radius, y + h)
    ctx.lineTo(x + corner_radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - corner_radius)
    ctx.lineTo(x, y + corner_radius)
    ctx.quadraticCurveTo(x, y, x + corner_radius, y)
    ctx.closePath()
    ctx.stroke()

    this.inputs.map(function(x){x.draw()})
    this.outputs.map(function(x){x.draw()})
  },
  move: chain(function(x, y) {
    Point.prototype.move.call(this, x, y)
    this.zone.move(x, y)
    this.inputs.map(function(x) {x.update()})
    this.outputs.map(function(x) {x.update()})
  })
})

function Scene(canvas) {
  mixin(this, {
    nodes: [],
    edges: [],

    _mode: 'NONE',
    _selected: null,
    _target: null,
    _offset: new Point(0,0),

    canvas: canvas,
    context: canvas.getContext("2d"),
  })
  this.context.translate(0.5, 0.5)

  var _cursor = {x: 0, y: 0}

  this.canvas.addEventListener('mousedown', function(ev) {
    switch (this._mode) {
    case 'DRAG':
      this._mode = 'NONE'
      this._selected = null
      break
    case 'DELETE':
      var zone = this.find_zone(_cursor.x, _cursor.y)
      if (zone != null && zone.parent instanceof Node) {
        this.remove_node(zone.parent)
        this.draw()
      }
      this.canvas.style.cursor = "auto"
      this._mode = 'NONE'
      break
    case 'BUBBLE':
      this._mode = 'CONNECT'
      var zone = this.find_zone(_cursor.x, _cursor.y)
      if (zone && zone.parent.edge != null) {
        this._selected = zone.parent.type == 'i' ? zone.parent.edge.start
                                                 : zone.parent.edge.end
        zone.parent.edge.disconnect()
        this._target = null
      }
      break
    case 'CONNECT':
      break
    default:
      var zone = this.find_zone(_cursor.x, _cursor.y)
      if (zone && zone.parent instanceof Node) {
        this._mode = 'DRAG'
        this._selected = zone.parent
        this._offset = new Point(_cursor.x - zone.parent.x,
                                 _cursor.y - zone.parent.y)
        break
      }
    }
  }.bind(this), false)
  this.canvas.addEventListener('mouseup', function (ev) {
      switch (this._mode) {
      case 'CONNECT':
          if (this._target != null) {
              this._selected.connect(this._target)

              this._target.bubble(false)
              this._target = null
          }
          this._selected.bubble(false)
          this._selected = null
          this._mode = 'NONE'
          break
      case 'BUBBLE':
          break
      default:
          this._mode = 'NONE'
          this._selected = null
      }
  }.bind(this), false)
  this.canvas.addEventListener('mousemove', function (ev) {
    _cursor = get_mouse_cursor(ev)
    switch (this._mode) {
    case 'DRAG':
      this._selected.move(_cursor.x-this._offset.x,
                          _cursor.y-this._offset.y)
      this.draw()
      break
    case 'CONNECT':
      var zone = this.find_zone(_cursor.x, _cursor.y)
      if (zone && zone.parent instanceof Connector && zone.parent.type != this._selected.type) {
        if (this._target != null && this._target != zone.parent) {
          this._target.bubble(false)
        }
        zone.parent.bubble()
        this._target = zone.parent
      } else if (this._target != null) {
        this._target.bubble(false)
        this._target = null
      }

      this.draw()
      draw_nice_bezier(this._selected, _cursor, this.context,
          this._selected.type == (this._selected.x < _cursor.x ? 'i' : 'o'))
      break
    case 'BUBBLE':
      if (this._selected.zone != this.find_zone(_cursor.x, _cursor.y)) {
        this._selected.bubble(false)
        this._selected = null
        this._mode = 'NONE'
      }
      break
    default:
      var zone = this.find_zone(_cursor.x, _cursor.y)
      if (zone && zone.parent instanceof Connector) {
        zone.parent.bubble()
        this._selected = zone.parent
        this._mode = 'BUBBLE'
      }
    }
  }.bind(this), false)
}
mixin(Scene.prototype, {
  add_edge: chain(function(edge) {
    edges.push(edge)
  }),
  remove_edge: chain(function(edge) {
    var pos = this.edges.indexOf(edge)
    if (pos >= 0)
      this.edges.splice(pos, 1)
  }),
  add_node: chain(function(node, interactive) {
    node.scene = this
    this.nodes.push(node)

    if (interactive) {
      this._selected = node
      this._mode = 'DRAG'
      node.draw()
    }
  }),
  remove_node: chain(function(node, interactive) {
    var pos = this.nodes.indexOf(node)
    if (pos >= 0) {
      node.inputs.concat(node.outputs).forEach(function(elem) {
        if (elem.edge != null)
          elem.edge.disconnect()
      })
      this.nodes.splice(pos, 1)
    }

    if (interactive) {
      this._mode = 'DELETE'
      this.canvas.style.cursor = "crosshair"
    }
  }),
  draw: function() {
    this.context.clearRect(0,0, this.canvas.width, this.canvas.height)
    this.nodes.concat(this.edges).forEach(function(elem) {elem.draw()})
  },
  find_zone: function(x, y) {
    var res = null
      , zone = null
    this.nodes.some(function(elem) {
      if (zone = elem.find_zone(x, y)) {
        res = zone
        return true
      }
    })
    return res
  }
})

// Utility functions

function inherits(a, b, p) {
  a.prototype = Object.create(b.prototype)
  a.prototype.constructor = a
  if (p)
    mixin(a.prototype, p)
}
function mixin(a, b) {
  Object.keys(b).forEach(function(k) {
    Object.defineProperty(a, k, Object.getOwnPropertyDescriptor(b, k))
  })
}
function chain(fx) {
  return function() {
    fx.apply(this, arguments)
    return this
  }
}

function get_mouse_cursor(ev) {
  if (ev.layerX || ev.layerX == 0) { // Firefox
    return { x: ev.layerX, y: ev.layerY }
  } else if (ev.offsetX || ev.offsetX == 0) { // Opera
    return { x: ev.offsetX, y: ev.offsetY }
  }
}

function draw_nice_bezier(start, end, ctx, reverse) {
  ctx.save()
  var dist = {
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y)
  }
  if (reverse) {
    ctx.moveTo(start.x, start.y)
    ctx.bezierCurveTo(start.x, start.y + dist.h/3 * (end.y > start.y ? 1 : -1),
                      end.x, end.y - dist.h/3 * (end.y > start.y ? 1 : -1),
                      end.x, end.y)
  } else {
    if (start.x > end.x) {
      var tmp = start
      start = end
      end = tmp
    }
    ctx.moveTo(start.x, start.y)
    ctx.bezierCurveTo(start.x + dist.w/3, start.y,
                      end.x - dist.w/3, end.y,
                      end.x, end.y)
  }
  ctx.stroke()
  ctx.restore()
}

// vim: ts=2 sw=2 et sts=0
