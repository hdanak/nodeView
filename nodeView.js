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
  },
  coldet: function (x, y) {
    return (this.x + this.w >= x && this.x <= x
         && this.y + this.h >= y && this.y <= y)
  }
})

function Circle(x, y, r) {
  Point.call(this, x, y)
  this.r = r
}
inherits(Circle, Point, {
  resize: function(r) {
    this.r = r
  },
  coldet: function (x, y) {
    var r_squared = Math.pow(this.r, 2)
    return Math.pow(x - this.x, 2) <= r_squared
        && Math.pow(y - this.y, 2) <= r_squared
  }
})

function Edge(start, end, reverse) {
  this.start = reverse ? end : start
  this.end   = reverse ? start : end
}
mixin(Edge.prototype, {
  draw: function () {
    var start = this.start
      , end   = this.end
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
  Circle.call(this, node.x, node.y, 3)
  mixin(this, {
    type: type.toLowerCase().charAt(0),
    node: node,
    edge: null,
    _bubble: false,
  })
  this.port = this.type == 'i' ? node.inputs : node.outputs
}
inherits(Connector, Circle, {
  get scene() { return this.node.scene },
  get bubble() { return this._bubble },
  set bubble(state) {
    var old = this._bubble
    this._bubble = state
    if (old != state)
      this.scene.draw()
  },
  get number() {
    return this.port.indexOf(this) + 1
  },
  connect: function(target) {
    this.edge = new Edge(target, this, this.type != 'i')
    this.scene.add_edge(this.edge)
  },
  draw: function() {
    var ctx = this.scene.context
      , arc_start = Math.PI/2 * (this.type == 'i' ? 1 : -1)

    ctx.beginPath()
    ctx.arc(this.x + (this.type == 'i' ? -1 : 1) * this.bubble, this.y,
            this.r - this.bubble, arc_start, -arc_start, false)
    ctx.closePath()

    ctx.save()
    if (this.bubble) {
      ctx.lineWidth = 3
    } else {
      ctx.lineWidth = 1
      ctx.fillStyle = "#eee"
      ctx.fill()
    }
    ctx.stroke()
    ctx.restore()
  },
  get x() { return this.node.x + (this.type == 'i' ? 0 : this.node.w) },
  get y() { return this.node.y + this.node.corner_radius
                    + (this.node.h - this.node.corner_radius * 2)
                        * this.number/(this.port.length + 1) }
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
      if (elem.coldet(x, y)) {
        res = elem
        return true
      }
    })
    res = res || this.coldet(x, y) && this
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
  }
})

function Scene(canvas) {
  mixin(this, {
    nodes: [],
    edges: [],

    _selected: null,

    canvas: canvas, $canvas: $(canvas),
    context: canvas.getContext("2d"),
  })
  this.context.translate(0.5, 0.5)

  var _cursor = {x: 0, y: 0}
    , _offset = new Point(0,0)
    , _target = null

  this.$canvas.on('mousedown', function(ev) {
      switch (this.mode) {
      case 'DRAG':
        this.mode = 'NONE'
        this._selected = null
        break
      case 'DELETE':
        var elem = this.find_zone(_cursor.x, _cursor.y)
        if (elem instanceof Node) {
          this.remove_node(elem)
          this.draw()
        }
        this.mode = 'NONE'
        this.$canvas.removeClass('delete-mode')
        break
      case 'BUBBLE':
        this.mode = 'CONNECT'
        var elem = this.find_zone(_cursor.x, _cursor.y)
        if (elem instanceof Connector && elem.edge != null) {
          this._selected = elem.type == 'i' ? elem.edge.start : elem.edge.end
          elem.edge.disconnect()
          _target = null
        }
        break
      case 'CONNECT':
        break
      default:
        var elem = this.find_zone(_cursor.x, _cursor.y)
        if (elem instanceof Node) {
          this.mode = 'DRAG'
          this._selected = elem
          _offset = new Point(_cursor.x - elem.x, _cursor.y - elem.y)
          break
        }
      }
      return false
    }.bind(this)).on('mouseup', function (ev) {
      switch (this.mode) {
      case 'CONNECT':
        if (_target != null) {
          this._selected.connect(_target)

          _target.bubble = false
          _target = null
        }
        this._selected.bubble = false
        this._selected = null
        this.mode = 'NONE'
        break
      case 'BUBBLE':
        break
      default:
        this.mode = 'NONE'
        this._selected = null
      }
      return false
    }.bind(this)).on('mousemove', function (ev) {
      _cursor = get_mouse_cursor(ev)
      switch (this.mode) {
      case 'DRAG':
        this._selected.move(_cursor.x - _offset.x, _cursor.y - _offset.y)
        this.draw()
        break
      case 'CONNECT':
        var elem = this.find_zone(_cursor.x, _cursor.y)
        if (elem instanceof Connector && elem.type != this._selected.type) {
          if (_target != null && _target != elem) {
            _target.bubble = false
          }
          elem.bubble = true
          _target = elem
        } else if (_target != null) {
          _target.bubble = false
          _target = null
        }

        this.draw()
        draw_nice_bezier(this._selected, _cursor, this.context,
            this._selected.type == (this._selected.x < _cursor.x ? 'i' : 'o'))
        break
      case 'BUBBLE':
        if (this._selected != this.find_zone(_cursor.x, _cursor.y)) {
          this._selected.bubble = false
          this._selected = null
          this.mode = 'NONE'
        }
        break
      default:
        var elem = this.find_zone(_cursor.x, _cursor.y)
        if (elem instanceof Connector) {
          elem.bubble = true
          this._selected = elem
          this.mode = 'BUBBLE'
        }
      }
      return false
    }.bind(this))
}
Scene.modes = Enum('NONE', 'DRAG', 'CONNECT', 'BUBBLE', 'DELETE')
mixin(Scene.prototype, {
  get mode(m) { return this._mode || 'NONE' },
  set mode(m) {
    if (m in Scene.modes) {
      this._mode = m
    } else {
      throw('Invalid Scene mode: ' + m)
    }
  },
  add_edge: chain(function(edge) {
    this.edges.push(edge)
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
      this.mode = 'DRAG'
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
      this.mode = 'DELETE'
      this.$canvas.addClass('delete-mode')
    }
  }),
  draw: function() {
    this.context.clearRect(0,0, this.canvas.width, this.canvas.height)
    this.nodes.concat(this.edges).forEach(function(elem) {elem.draw()})
  },
  find_zone: function(x, y) {
    var res = null
    this.nodes.some(function(elem) {
      if (res = elem.find_zone(x, y)) {
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
function Enum() {
  var o = {}
  Array.prototype.forEach.call(arguments, function(l, i) { o[l] = i })
  return o
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
